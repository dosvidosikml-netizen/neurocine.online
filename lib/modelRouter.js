// lib/modelRouter.js
// NeuroCine Model Router v1
// Автоматически выбирает оптимальную модель для каждого типа задачи.
// Цель: не платить за Opus там где Haiku справится, но не урезать качество
// на креативных задачах.
//
// Цены OpenRouter (на момент апреля-мая 2026, $ за 1M токенов input/output):
//   anthropic/claude-haiku-4.5      — $1   / $5
//   openai/gpt-5.4-mini             — ~$0.50 / $2 (если доступен в твоём regional pricing)
//   openai/gpt-5.4                  — $2.50 / $15
//   anthropic/claude-sonnet-4.6     — $3   / $15
//   anthropic/claude-sonnet-4.5     — $3   / $15
//   anthropic/claude-opus-4.7       — $15  / $75 (НЕ используем по умолчанию)
//
// Расход на 1 ролик 60с при гибридной схеме: ~$0.10-0.18

// ────────────────────────────────────────────────────────────────────────────
// TASK TYPES — какие у нас бывают задачи в pipeline
// ────────────────────────────────────────────────────────────────────────────
export const TASK_TYPES = {
  // Креатив + русский язык, средний объём — нужен сильный writer
  SCRIPT_WRITING: "script_writing",

  // Большой структурированный JSON, строгая schema, до 16k tokens output
  STORYBOARD_GENERATION: "storyboard_generation",

  // Короткий вход + короткий выход, дошлифовка готового промта
  VIDEO_PROMPT_REFINEMENT: "video_prompt_refinement",

  // Vision: анализ изображения (camera, lighting, emotion, continuity)
  IMAGE_ANALYSIS: "image_analysis",

  // Простая классификация / быстрая проверка
  LIGHT_TASK: "light_task",
};

// ────────────────────────────────────────────────────────────────────────────
// MODEL ALIASES — короткие имена для конфигурации
// ────────────────────────────────────────────────────────────────────────────
const MODEL_ALIASES = {
  // Топ для креатива на русском, баланс цена/качество
  gpt54: "openai/gpt-5.4",
  sonnet46: "anthropic/claude-sonnet-4.6",
  sonnet45: "anthropic/claude-sonnet-4.5",
  // Дешёвый и быстрый для лёгких задач
  haiku45: "anthropic/claude-haiku-4.5",
  // Премиум для сложных задач (по умолчанию НЕ используем)
  opus47: "anthropic/claude-opus-4.7",
};

// ────────────────────────────────────────────────────────────────────────────
// DEFAULT ROUTING — какая модель для какой задачи по умолчанию
// Приоритет: env переменная > task default > глобальный fallback
// ────────────────────────────────────────────────────────────────────────────
const DEFAULT_ROUTING = {
  [TASK_TYPES.SCRIPT_WRITING]: {
    primary: MODEL_ALIASES.gpt54,
    fallback: MODEL_ALIASES.sonnet46,
    temperature: 0.45,
    max_tokens: 2000,
  },
  [TASK_TYPES.STORYBOARD_GENERATION]: {
    primary: MODEL_ALIASES.gpt54,
    fallback: MODEL_ALIASES.sonnet46,
    temperature: 0.3, // safe mode; raw mode переопределяет на 0.55
    max_tokens: 16000, // снижено с 32k — реально storyboard на 60с использует 8-12k
  },
  [TASK_TYPES.VIDEO_PROMPT_REFINEMENT]: {
    primary: MODEL_ALIASES.haiku45, // дешёвая модель — большая часть работы делает videoPromptAgent локально
    fallback: MODEL_ALIASES.gpt54,
    temperature: 0.18,
    max_tokens: 3500,
  },
  [TASK_TYPES.IMAGE_ANALYSIS]: {
    primary: MODEL_ALIASES.sonnet46, // sonnet чуть сильнее на vision деталях лица/одежды
    fallback: MODEL_ALIASES.gpt54,
    temperature: 0.2,
    max_tokens: 2000,
  },
  [TASK_TYPES.LIGHT_TASK]: {
    primary: MODEL_ALIASES.haiku45,
    fallback: MODEL_ALIASES.gpt54,
    temperature: 0.3,
    max_tokens: 1500,
  },
};

// ────────────────────────────────────────────────────────────────────────────
// ENV OVERRIDES — позволяют менять модели без правки кода
// ────────────────────────────────────────────────────────────────────────────
function envOverride(taskType) {
  const map = {
    [TASK_TYPES.SCRIPT_WRITING]: process.env.OPENROUTER_SCRIPT_MODEL,
    [TASK_TYPES.STORYBOARD_GENERATION]: process.env.OPENROUTER_STORYBOARD_MODEL,
    [TASK_TYPES.VIDEO_PROMPT_REFINEMENT]: process.env.OPENROUTER_FAST_MODEL,
    [TASK_TYPES.IMAGE_ANALYSIS]: process.env.OPENROUTER_VISION_MODEL,
    [TASK_TYPES.LIGHT_TASK]: process.env.OPENROUTER_FAST_MODEL,
  };
  return map[taskType] || null;
}

function envFallbackOverride() {
  return process.env.OPENROUTER_FALLBACK_MODEL || null;
}

function envGlobalOverride() {
  // Backward compat: если задана старая OPENROUTER_MODEL — она перебивает все task primary
  return process.env.OPENROUTER_MODEL || null;
}

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC API: getModelConfig(taskType) — возвращает {primary, fallback, temperature, max_tokens}
// ────────────────────────────────────────────────────────────────────────────
export function getModelConfig(taskType) {
  const defaults = DEFAULT_ROUTING[taskType] || DEFAULT_ROUTING[TASK_TYPES.LIGHT_TASK];

  // Per-task env override > global env override > task default
  const primary = envOverride(taskType) || envGlobalOverride() || defaults.primary;
  const fallback = envFallbackOverride() || defaults.fallback;

  return {
    primary,
    fallback: fallback !== primary ? fallback : null, // не дублируем
    temperature: defaults.temperature,
    max_tokens: defaults.max_tokens,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// callOpenRouter — единая обёртка для всех API routes с fallback логикой
// ────────────────────────────────────────────────────────────────────────────
export async function callOpenRouter({
  taskType,
  systemPrompt,
  userMessage,
  temperatureOverride = null,
  maxTokensOverride = null,
  responseFormat = null, // { type: "json_object" } для structured output
  topP = 0.9,
  appTitle = "NeuroCine",
}) {
  const config = getModelConfig(taskType);
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return { ok: false, error: "OPENROUTER_API_KEY not set", model_used: null, payload: null };
  }

  const baseBody = {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    temperature: temperatureOverride ?? config.temperature,
    max_tokens: maxTokensOverride ?? config.max_tokens,
    top_p: topP,
  };
  if (responseFormat) baseBody.response_format = responseFormat;

  async function tryModel(modelId) {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://neurocine.online",
        "X-Title": appTitle,
      },
      body: JSON.stringify({ ...baseBody, model: modelId }),
    });
    const payload = await res.json().catch(() => ({}));
    return { res, payload };
  }

  // Primary attempt
  let { res, payload } = await tryModel(config.primary);
  let modelUsed = config.primary;

  // Fallback on failure
  if (!res.ok && config.fallback) {
    const fb = await tryModel(config.fallback);
    if (fb.res.ok) {
      res = fb.res;
      payload = fb.payload;
      modelUsed = config.fallback;
    } else {
      // Обе упали — отдаём ошибку primary с подсказкой
      return {
        ok: false,
        error: hintError(res.status, payload),
        model_used: config.primary,
        attempted: [config.primary, config.fallback],
        payload,
      };
    }
  } else if (!res.ok) {
    return {
      ok: false,
      error: hintError(res.status, payload),
      model_used: config.primary,
      attempted: [config.primary],
      payload,
    };
  }

  const content = payload?.choices?.[0]?.message?.content || "";
  return { ok: true, content, model_used: modelUsed, payload };
}

function hintError(status, payload) {
  const orError = payload?.error?.message || payload?.message || `HTTP ${status}`;
  let hint = "";
  if (status === 401) hint = " (Неверный OPENROUTER_API_KEY)";
  else if (status === 402) hint = " (Недостаточно средств на OpenRouter)";
  else if (status === 429) hint = " (Rate limit — подождите минуту)";
  else if (status === 503 || status === 502) hint = " (Модель временно недоступна)";
  else if (status === 404) hint = " (Модель не найдена)";
  return `${orError}${hint}`;
}

// ────────────────────────────────────────────────────────────────────────────
// listAvailableModels() — для UI debug-панели если понадобится
// ────────────────────────────────────────────────────────────────────────────
export function listAvailableModels() {
  return Object.entries(DEFAULT_ROUTING).map(([task, cfg]) => ({
    task,
    primary: envOverride(task) || envGlobalOverride() || cfg.primary,
    fallback: envFallbackOverride() || cfg.fallback,
  }));
}
