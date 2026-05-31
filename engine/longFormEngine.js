// engine/longFormEngine.js
// NeuroCine Long-Form Engine v1
// Генерит storyboard для роликов длиннее 3 минут разбивкой на chunks по ~90с.
// Между chunks передаётся:
//   - character_lock (verbatim)
//   - voice_lock (verbatim, short_film only)
//   - last_scene_context (для continuity)
//   - global_style_lock (для consistency)
//   - act_position (hook / build / climax / outro для нарратива)
//
// Зачем нужно:
//   Один LLM-запрос физически не выдаёт 200+ сцен в JSON.
//   Output token limits: GPT-5.4 = 16k, Sonnet 4.6 = 64k, Opus = 32k.
//   200 кадров × ~750 токенов = 150k — не влезает никуда.
//
// Архитектура:
//   1. split duration → chunks по 90с
//   2. для каждого chunk генерим mini-storyboard через тот же LLM
//   3. character_lock берём из ПЕРВОГО chunk и передаём дальше verbatim
//   4. voice_lock берём из ПЕРВОГО chunk и передаём дальше verbatim
//   5. last-scene context передаётся между chunks для continuity первого кадра
//   6. склеиваем сцены, переиндексируем frame_01..frame_NN

import { getDurationPreset, detectObserverMode } from "./sceneEngine_v2";

/**
 * splitScriptForChunks — нарезает длинный сценарий на куски пропорционально
 * длительностям chunks. Старается резать на границах предложений.
 *
 * Edge cases:
 *  - sentences == 0  → все чанки пустые (фолбэк генерации в API).
 *  - chunks.length == 1 → весь скрипт целиком.
 *  - sentences <= chunks → распределяем равномерно с дублированием хвостовых
 *    предложений вместо пустых чанков (иначе LLM получает "" и галлюцинирует).
 *  - sentences > chunks → пропорционально длительностям; защита от перегрузки
 *    стартового бюджета когда первое предложение длиннее доли первого чанка.
 */
export function splitScriptForChunks(script, chunks) {
  const totalDuration = chunks.reduce((s, c) => s + c.duration, 0);
  const sentences = String(script || "")
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length === 0) return chunks.map(() => "");
  if (chunks.length === 1) return [script];

  // Короткий скрипт: предложений меньше или столько же сколько чанков.
  // Распределяем по пропорциональным позициям, пустые чанки заполняем
  // ближайшим (предыдущим или следующим) предложением, чтобы LLM всегда
  // получал ненулевой контекст.
  if (sentences.length <= chunks.length) {
    const buckets = chunks.map(() => []);
    sentences.forEach((s, i) => {
      const targetIdx = Math.min(
        chunks.length - 1,
        Math.floor((i * chunks.length) / sentences.length)
      );
      buckets[targetIdx].push(s);
    });
    // Forward-fill: пустые чанки берут предыдущее непустое содержимое.
    let lastNonEmpty = "";
    for (let c = 0; c < buckets.length; c++) {
      if (buckets[c].length === 0) {
        if (lastNonEmpty) buckets[c].push(lastNonEmpty);
      } else {
        lastNonEmpty = buckets[c][buckets[c].length - 1];
      }
    }
    // Backward-fill: если первый чанк остался пустой — возьмём первое предложение.
    if (buckets[0].length === 0 && sentences[0]) buckets[0].push(sentences[0]);
    return buckets.map((arr) => arr.join(" "));
  }

  // Длинный скрипт: пропорциональное распределение по весам.
  const weights = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  const result = chunks.map(() => []);
  let chunkIdx = 0;
  // Минимальный размер бюджета чанка = вес самого длинного предложения,
  // чтобы одно непропорционально-длинное предложение не пустило весь чанк
  // вперёд и не оставило стартовый чанк пустым.
  const minBudget = Math.max(...weights);
  let chunkBudget = Math.max(minBudget, (chunks[0].duration / totalDuration) * totalWeight);
  let used = 0;

  for (let i = 0; i < sentences.length; i++) {
    if (used + weights[i] > chunkBudget && chunkIdx < chunks.length - 1 && result[chunkIdx].length > 0) {
      chunkIdx += 1;
      chunkBudget = Math.max(minBudget, (chunks[chunkIdx].duration / totalDuration) * totalWeight);
      used = 0;
    }
    result[chunkIdx].push(sentences[i]);
    used += weights[i];
  }

  // Safety net: если из-за округлений остались пустые чанки на хвосте —
  // дублируем туда последнее непустое содержимое.
  let lastNonEmpty = "";
  for (let c = 0; c < result.length; c++) {
    if (result[c].length === 0) {
      if (lastNonEmpty) result[c].push(lastNonEmpty);
    } else {
      lastNonEmpty = result[c][result[c].length - 1];
    }
  }

  return result.map((arr) => arr.join(" "));
}

/**
 * buildChunkUserPrompt — собирает user-message для конкретного chunk.
 * Передаёт контекст: позиция в нарративе, character_lock, last-scene continuity.
 */
export function buildChunkUserPrompt({
  chunkIndex,
  totalChunks,
  chunkDuration,
  chunkStart,
  totalDuration,
  scriptForChunk,
  globalScript,
  mode = "safe",
  target = "veo3",
  aspectRatio = "9:16",
  characterLockFromPrev = null,
  voiceLockFromPrev = null,
  lastSceneFromPrev = null,
  globalStyleLock = null,
}) {
  // Нарративная позиция chunk'а в общем ролике
  const progressPct = ((chunkStart + chunkDuration / 2) / totalDuration) * 100;
  let actPosition;
  if (progressPct < 10) actPosition = "HOOK (первые 10% — резкий вход, удержание скролла)";
  else if (progressPct < 70) actPosition = "BUILD (нарастание через детали и факты)";
  else if (progressPct < 90) actPosition = "CLIMAX (пик эмоционального напряжения)";
  else actPosition = "OUTRO + ВОПРОС (переворот + открытый вопрос для комментариев)";

  const targetScenes = Math.round(chunkDuration / 3);
  const isObserverMode = detectObserverMode(globalScript);
  const isShortFilm = String(mode || "").toLowerCase() === "short_film";

  const observerBlock = isObserverMode
    ? `

🎯 SCRIPT MODE: OBSERVER / SECOND-PERSON ("ты"-обращение)
Скрипт обращён ПРЯМО К ЗРИТЕЛЮ. Зритель = главный герой.
character_lock должен быть ПУСТЫМ [] или содержать только эпизодических людей без имён.
НЕ выдумывай фиктивных героев типа "Mikhail" / "Ivan" / "Aldric".
Используй POV / first-person framing где это уместно.
`
    : "";

  const continuityBlock = chunkIndex === 0
    ? `Это ПЕРВЫЙ chunk из ${totalChunks}. Создай детальный character_lock с описанием персонажей.${isShortFilm ? " Создай voice_lock для всех говорящих персонажей." : ""} Зафиксируй global_style_lock — он будет переиспользован во всех следующих chunks.`
    : `Это chunk ${chunkIndex + 1} из ${totalChunks}.

CHARACTER LOCK (НЕ МЕНЯЙ — сохрани verbatim из предыдущих chunks):
${JSON.stringify(characterLockFromPrev, null, 2)}
${isShortFilm ? `
VOICE LOCK (НЕ МЕНЯЙ — сохрани voice_id verbatim из предыдущих chunks):
${JSON.stringify(voiceLockFromPrev, null, 2)}
` : ""}

GLOBAL STYLE LOCK (НЕ МЕНЯЙ):
${globalStyleLock || "(не задан — используй стандартный документальный)"}

ПОСЛЕДНЯЯ СЦЕНА ИЗ ПРЕДЫДУЩЕГО CHUNK (для continuity первого кадра в этом chunk):
${JSON.stringify(lastSceneFromPrev, null, 2)}

ПРАВИЛА CONTINUITY:
- Первый кадр этого chunk должен ВИЗУАЛЬНО продолжать последнюю сцену предыдущего chunk
- Если персонаж был в локации X — продолжай в X (или явно покажи переход)
- Эмоциональный тон должен наследоваться от предыдущего chunk
- Используй character_lock из предыдущих chunks ДОСЛОВНО — не перефразируй${isShortFilm ? "\n- Используй voice_lock из предыдущих chunks ДОСЛОВНО — не меняй voice_id" : ""}`;

  const shortFilmBlock = isShortFilm ? `

SHORT FILM / DIALOGUE MODE:
- Treat this chunk as screenplay coverage, not narrator VO.
- Preserve exact character dialogue in scene.dialogue; do not invent lines.
- Create/reuse root voice_lock for speaking characters; each dialogue object must include the same voice_id for that speaker across all chunks.
- Preserve visible text/cards/signs/displays in scene.on_screen_text.
- Include scene.script_line_ru, scene.blocking and scene.shot_role for every scene.
- Use cinematic coverage: establishing, insert, OTS, shot/reverse-shot, reaction, reveal, chase, climax, final_sting.
- Do not create narrator VO from dialogue.
` : "";

  return `Generate storyboard JSON для CHUNK ${chunkIndex + 1} of ${totalChunks} большого long-form ролика.

CHUNK INFO:
- Длительность этого chunk: ${chunkDuration} секунд
- Старт chunk в общем ролике: ${chunkStart}с
- Общая длительность всего ролика: ${totalDuration}с
- Нарративная позиция: ${actPosition}

CONTENT MODE: ${mode}
VIDEO TARGET: ${target}
ASPECT RATIO: ${aspectRatio}

Target scenes для этого chunk: ${targetScenes} (MANDATORY).
Каждая сцена 2-4 секунды.
total_duration JSON для chunk = ${chunkDuration}.
${observerBlock}
${shortFilmBlock}
${continuityBlock}

ОБЩИЙ СЦЕНАРИЙ (для контекста — что было до этого chunk и что будет после):
${globalScript}

ТЕКСТ ДИКТОРА ИМЕННО ДЛЯ ЭТОГО CHUNK (используй как основу VO):
${scriptForChunk}

Return JSON only.`;
}

/**
 * mergeChunks — склеивает массив mini-storyboards в один большой storyboard.
 * Переиндексирует frame_NN, пересчитывает start, проверяет character_lock.
 */
export function mergeChunks(chunkResults, totalDuration) {
  if (!chunkResults || chunkResults.length === 0) {
    return { scenes: [], character_lock: [], voice_lock: [], total_duration: 0, errors: ["No chunk results"] };
  }

  const errors = [];

  // character_lock из первого chunk — он самый детальный
  const characterLock = chunkResults[0]?.character_lock || [];
  const voiceLock = chunkResults[0]?.voice_lock || [];
  const voiceByCharacter = new Map(
    (Array.isArray(voiceLock) ? voiceLock : [])
      .map((item) => [String(item.character || item.name || item.speaker || "").trim().toLowerCase(), item.voice_id])
      .filter(([key, voiceId]) => key && voiceId)
  );

  // global_style_lock — из первого chunk
  const globalStyleLock = chunkResults[0]?.global_style_lock || "";
  const globalVideoLock = chunkResults[0]?.global_video_lock || "";
  const language = chunkResults[0]?.language || "ru";
  const projectName = chunkResults[0]?.project_name || "NeuroCine Long-Form";
  const aspectRatio = chunkResults[0]?.aspect_ratio || "9:16";
  const postprocess = chunkResults[0]?.postprocess || {
    upscale: "x2",
    final_upscale: "x4",
    model: "real-esrgan",
    provider: "replicate",
  };

  // Склеиваем сцены, переиндексируем
  const allScenes = [];
  let runningStart = 0;
  let frameCounter = 1;

  chunkResults.forEach((chunk, chunkIdx) => {
    const scenes = Array.isArray(chunk?.scenes) ? chunk.scenes : [];
    if (scenes.length === 0) {
      errors.push(`Chunk ${chunkIdx + 1} returned no scenes`);
      return;
    }

    scenes.forEach((s) => {
      const dur = Number(s.duration) || 3;
      const dialogue = Array.isArray(s.dialogue)
        ? s.dialogue.map((line) => {
            if (!line || typeof line !== "object") return line;
            const speaker = String(line.speaker || line.character || "").trim();
            const voiceId = voiceByCharacter.get(speaker.toLowerCase()) || line.voice_id;
            return voiceId ? { ...line, speaker: line.speaker || speaker, voice_id: voiceId } : line;
          })
        : s.dialogue;
      allScenes.push({
        ...s,
        dialogue,
        id: `frame_${String(frameCounter).padStart(2, "0")}`,
        start: runningStart,
        chunk_index: chunkIdx, // для дебага
      });
      runningStart += dur;
      frameCounter += 1;
    });
  });

  if (Math.abs(runningStart - totalDuration) > 5) {
    errors.push(
      `Total duration mismatch: requested ${totalDuration}s, got ${runningStart}s (diff ${runningStart - totalDuration}s)`
    );
  }

  return {
    project_name: projectName,
    language,
    format: "shorts_reels_tiktok",
    aspect_ratio: aspectRatio,
    total_duration: runningStart,
    global_style_lock: globalStyleLock,
    global_video_lock: globalVideoLock,
    character_lock: characterLock,
    voice_lock: voiceLock,
    postprocess,
    scenes: allScenes,
    errors,
  };
}

/**
 * extractLastSceneContext — выжимка последней сцены chunk'а для передачи следующему.
 * Не передаём весь scene — только то что нужно для continuity.
 */
export function extractLastSceneContext(chunk) {
  const scenes = chunk?.scenes;
  if (!Array.isArray(scenes) || scenes.length === 0) return null;
  const last = scenes[scenes.length - 1];
  return {
    description_ru: last.description_ru,
    location_summary: last.image_prompt_en?.slice(0, 300),
    emotional_tone: last.beat_type,
    last_action: last.video_prompt_en?.slice(0, 200),
    final_camera: last.camera,
  };
}

/**
 * estimateLongFormCost — грубая оценка стоимости и времени для long-form ролика.
 * Используется в UI для предупреждения юзера перед генерацией.
 */
export function estimateLongFormCost(duration) {
  const d = Number(duration) || 60;
  const preset = getDurationPreset(d);
  const numChunks = preset.longForm ? Math.ceil(d / (preset.chunkSize || 90)) : 1;

  // Грубо: каждый chunk = ~3000 input + ~12000 output tokens
  // GPT-5.4: $2.50/$15 per 1M
  const inputTokens = numChunks * 3000;
  const outputTokens = numChunks * 12000;
  const costUsd = (inputTokens * 2.5 / 1_000_000) + (outputTokens * 15 / 1_000_000);

  // Время: ~30-60 сек на chunk (sequential)
  const timeMinMs = numChunks * 30_000;
  const timeMaxMs = numChunks * 60_000;

  return {
    duration: d,
    numChunks,
    isLongForm: preset.longForm || false,
    estimatedCostUsd: Math.round(costUsd * 100) / 100,
    estimatedTimeMin: Math.round(timeMinMs / 1000),
    estimatedTimeMax: Math.round(timeMaxMs / 1000),
  };
}
