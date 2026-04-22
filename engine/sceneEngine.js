// ===============================
// 🎬 Scene Engine (Генерация сцен)
// ===============================
// Этот файл отвечает за:
// - создание сцен из сценария
// - управление таймингами сцен
// - передачу задачи модели (режиссура)
// ===============================

export const SYS_SCENE_ENGINE = `
// Это системный prompt для модели
// Он заставляет модель работать как режиссёр сцен

You are a professional film director and scene planner.
Return ONLY valid JSON. No explanations.

Create cinematic scenes from the script.

Each scene must include:
id, start, duration, end,
scene_goal (HOOK, BUILD, ACTION, DIALOGUE, ATMOSPHERE, PAYOFF),
voice, visual, camera, motion, lighting, environment,
characters (array),
sfx, audio ("clean, no noise"),
generation_mode ("T2V" or "I2V").

Timing:
SHORTS default:
HOOK 2-3s, ACTION 2-4s, BUILD 3-5s, ATMOSPHERE 4-6s, DIALOGUE 4-6s.
Allow up to 10s if needed.

Scenes must be continuous: next start = previous end.

Output:
{ "scenes": [ ... ] }
`;

// ===============================
// 🧠 Сборка user prompt
// ===============================
// Эта функция:
// - берёт сценарий
// - добавляет режим проекта
// - добавляет персонажей
// - формирует текст для отправки в модель
// ===============================

export function buildSceneUserPrompt({
  script,
  mode = "shorts",
  total = 60,
  characters = []
}) {
  const chars = characters?.length
    ? characters.map(c => `${c.id || c.name}: ${c.desc || ""}`).join("\\n")
    : "none";

  return `
Script:
${script}

Project mode: ${mode}
Total duration: ${total}

Characters:
${chars}
`;
}
