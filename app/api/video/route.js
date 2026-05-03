// app/api/video/route.js
// NeuroCine Video Prompt API v2.7
// Использует centralized modelRouter — VIDEO_PROMPT_REFINEMENT task.
// По умолчанию Haiku 4.5: дешёвая модель полирует уже собранный videoPromptAgent
// промт. Большая часть работы делается локально, LLM только дошлифовывает.

import { buildVideoPrompt as buildLegacyVideoPrompt, getStyleProfile } from "../../../engine/directorEngine_v4";
import {
  buildVideoPromptFor,
  buildImagePrompt,
  stripBannedWords,
  validateFramePrompts,
  NEGATIVE_PROMPT_BASE,
  cleanVideoPromptText,
  buildContinuityLine,
  compactVideoPrompt,
} from "../../../engine/videoPromptAgent";
import { normalizeTarget } from "../../../engine/sceneEngine_v2";
import { callOpenRouter, TASK_TYPES } from "../../../lib/modelRouter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT_BASE = `
You are NeuroCine Video Prompt Director v2.7.
Output ONLY valid JSON. No markdown.
Create one production-ready image-to-video prompt for a locked frame. Do not invent names; use descriptive roles only.

CORE RULES:
- preserve storyboard frame, character identity, location, style, action, and SFX
- do not invent new action, new characters, or new location
- inject character_lock VERBATIM (no paraphrasing of locked features)
- use realism anchors: visible skin pores, individual hair strands, fabric weave, lens vignette, 35mm film grain
- NO banned tokens: "cinematic", "epic", "stunning", "8K", "masterpiece", "perfect", "hyperrealistic", "rendered", "CGI"
- end video_prompt with the continuity line provided by the API; frame_01 must reference the uploaded final 2K frame, not a previous frame

OUTPUT JSON: { "video_prompt_en": "...", "image_prompt_en": "...", "sfx": "...", "negative_prompt": "...", "notes_ru": "..." }
`;

const VEO3_RULES = `
TARGET MODEL: Google Veo 3
- video_prompt_en: flowing paragraph 60-120 words
- Order: shot type → subject → action → environment → camera → lighting → color → realism → audio
- Camera movement MUST include explicit timing ("slow 2-second push-in", "static 3-second hold")
- MANDATORY Audio block: "Audio: [ambience]. SFX: [sfx]. No dialogue, no voiceover."
`;

const GROK_RULES = `
TARGET MODEL: Grok Imagine (xAI)
- video_prompt_en: compact 40-80 words
- VISUAL HOOK FIRST: first 8-12 words must be the strongest image
- Use stylistic references: "shot like a Roger Deakins documentary fragment"
- NO Audio block inside prompt
- Single action only
`;


function safeParseJsonObject(raw = "") {
  const text = String(raw || "").trim();
  if (!text) return null;
  const unfenced = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(unfenced);
  } catch {}

  const start = unfenced.indexOf("{");
  const end = unfenced.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(unfenced.slice(start, end + 1));
    } catch {}
  }
  return null;
}

function normalizePromptPrefix(text = "", prefix) {
  let out = String(text || "").trim();
  if (!out) return prefix;

  if (prefix === "SCENE PRIMARY FOCUS:") {
    out = out.replace(/^SCENE PRIMARY FOCUS[:\s-]*/i, "").trim();
  }
  if (prefix === "ANIMATE CURRENT FRAME:") {
    out = out.replace(/^ANIMATE CURRENT FRAME[:\s—-]*/i, "").trim();
  }
  return `${prefix} ${out}`.replace(/\s+/g, " ").trim();
}

function ensureSfxInsideVideoPrompt(videoPrompt = "", sfx = "") {
  const cleanSfx = String(sfx || "subtle realistic ambience").trim();
  let out = String(videoPrompt || "").trim();
  if (!/\bSFX\s*:/i.test(out)) {
    out = `${out} SFX: ${cleanSfx}.`;
  }
  return out.replace(/\s+/g, " ").trim();
}

function removeVoDialogueWhenDisabled(videoPrompt = "", includeVo = false) {
  let out = String(videoPrompt || "").trim();
  if (includeVo) return out;

  out = out
    .replace(/Voiceover[^.]*\./gi, "")
    .replace(/VO meaning[^.]*\./gi, "")
    .replace(/narrator[^.]*\./gi, "")
    .replace(/dialogue[^.]*\./gi, "")
    .replace(/spoken line[^.]*\./gi, "")
    .replace(/speech[^.]*\./gi, "");

  if (!/No dialogue, no voiceover/i.test(out)) {
    out = `${out} No dialogue, no voiceover; ambient sound and SFX only.`;
  }
  return out.replace(/\s+/g, " ").trim();
}

function ensureContinuityLine(videoPrompt = "", frame = {}, consistency = "normal") {
  const line = buildContinuityLine(frame, consistency);
  let out = String(videoPrompt || "").trim();
  out = out
    .replace(/Maintain exact character appearance, face, clothing, and condition from the uploaded final 2K frame\.?/gi, "")
    .replace(/Maintain EXACT same character appearance, face, clothing, and condition as previous frame\.?/gi, "")
    .replace(/Maintain exact same character appearance, face, clothing, and condition as previous frame\.?/gi, "")
    .replace(/Ultra consistency:[^.]*\./gi, "")
    .trim();
  return `${out} ${line}`.replace(/\s+/g, " ").trim();
}

function buildSegmentPlan(frame = {}) {
  const duration = Number(frame.duration || 3);
  if (!Number.isFinite(duration) || duration <= 8) return null;
  const parts = Math.ceil(duration / 8);
  const segmentLength = Math.ceil(duration / parts);
  return {
    required: true,
    reason_ru: "Длительность кадра больше 8 секунд, для Veo лучше резать на несколько image-to-video клипов.",
    total_duration: duration,
    parts,
    segment_length_seconds: Math.min(8, segmentLength),
  };
}

function finalizeVideoContract({ frame, storyboard, target, videoPrompt, imagePrompt, sfx, negativePrompt, includeVo = false, promptMode = "pro", consistency = "normal" }) {
  const finalSfx = String(sfx || frame.sfx || "subtle realistic ambience").trim();
  let finalVideo = stripBannedWords(videoPrompt || "");
  let finalImage = stripBannedWords(imagePrompt || "");

  finalVideo = normalizePromptPrefix(finalVideo, "ANIMATE CURRENT FRAME:");
  finalImage = normalizePromptPrefix(finalImage, "SCENE PRIMARY FOCUS:");
  finalVideo = ensureSfxInsideVideoPrompt(finalVideo, finalSfx);
  finalVideo = removeVoDialogueWhenDisabled(finalVideo, includeVo);
  finalVideo = cleanVideoPromptText(finalVideo, { storyboard, includeVo });
  finalVideo = ensureContinuityLine(finalVideo, frame, consistency);
  if (promptMode === "cheap") finalVideo = compactVideoPrompt(finalVideo, { maxWords: target === "grok" ? 80 : 95 });

  const finalNegative = [negativePrompt || NEGATIVE_PROMPT_BASE, "subtitles, captions, on-screen text, UI overlay, watermark, logo, deformed face, identity drift, clothing drift"]
    .filter(Boolean)
    .join(", ")
    .replace(/\s+/g, " ")
    .trim();

  const validation = validateFramePrompts({
    frame: { ...frame, video_prompt_en: finalVideo, image_prompt_en: finalImage },
    storyboard,
    target,
  });

  return {
    video_prompt_en: finalVideo,
    image_prompt_en: finalImage,
    sfx: finalSfx,
    negative_prompt: finalNegative,
    validation,
    segment_plan: buildSegmentPlan(frame),
  };
}

async function refineWithRouter({ frame, analysis, storyboard, target, seedPrompt, seedImage, includeVo = false, promptMode = "pro", consistency = "normal" }) {
  if (!process.env.OPENROUTER_API_KEY) return null;

  const targetRules = target === "grok" ? GROK_RULES : VEO3_RULES;
  const voiceRules = includeVo
    ? "USER ENABLED VO/DIALOGUE: voiceover/dialogue may be used only if the frame.vo_ru explicitly requires it. Keep it short."
    : "VOICE LOCK: do NOT include voiceover, narration, dialogue, spoken lines, VO meaning, or character speech. Use visual action + SFX only.";
  const systemPrompt = `${SYSTEM_PROMPT_BASE}\n${targetRules}\n${voiceRules}`;

  const characterContext = (storyboard?.character_lock || [])
    .map((c) => {
      const parts = [
        c.name,
        c.age ? `${c.age}y` : null,
        c.face_features || c.description,
        c.hair,
        c.clothing,
        c.physical_condition,
      ].filter(Boolean);
      return parts.join(", ");
    })
    .join(" | ");

  const userMessage = `Refine this frame into a final ${target.toUpperCase()} prompt. Keep all locks. Return JSON only.

FRAME ID: ${frame.id || "frame"}
DURATION: ${frame.duration || 3}s
ASPECT RATIO: ${storyboard?.aspect_ratio || "9:16"}

CHARACTER LOCK (verbatim — do NOT paraphrase):
${characterContext || "(none specified)"}

SCENE DESCRIPTION (Russian):
${frame.description_ru || "(none)"}

${includeVo ? `VOICEOVER / DIALOGUE ALLOWED BY USER:
${frame.vo_ru || "(none)"}
` : `VOICEOVER / DIALOGUE: DISABLED BY USER. Do not include narration, VO, dialogue, or spoken lines.
`}
CAMERA:
${frame.camera || "(infer from scene)"}

EXISTING SFX:
${frame.sfx || "(infer from scene)"}

SEED IMAGE PROMPT (starting frame):
${seedImage}

SEED VIDEO PROMPT (refine this):
${seedPrompt}

VISUAL ANALYSIS (if uploaded image present):
- Camera: ${analysis?.camera || "preserve uploaded composition"}
- Lighting: ${analysis?.lighting || "preserve uploaded lighting"}
- Emotion: ${analysis?.emotion || frame.emotion || "preserve emotional tone"}
- Continuity: ${analysis?.continuity || "same character, same location"}

Generate the FINAL ${target.toUpperCase()} prompt following all rules above. Use descriptive roles, not invented names. Output JSON only.`;

  const result = await callOpenRouter({
    taskType: TASK_TYPES.VIDEO_PROMPT_REFINEMENT,
    systemPrompt,
    userMessage,
    responseFormat: { type: "json_object" },
    appTitle: "NeuroCine Video Director v2.2",
  });

  if (!result.ok || !result.content) return null;

  const parsed = safeParseJsonObject(result.content);
  if (!parsed) return null;
  return { ...parsed, _model_used: result.model_used };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const frame = body.frame || {};
    const analysis = body.analysis || {};
    const storyboard = body.storyboard || {};
    const target = normalizeTarget(body.target || frame.target || storyboard?.export_meta?.target || "veo3");
    const includeVo = body.includeVo === true || body.include_vo === true;
    const promptMode = body.promptMode === "cheap" || body.videoPromptMode === "cheap" ? "cheap" : "pro";
    const consistency = body.consistency === "ultra" || body.videoConsistency === "ultra" ? "ultra" : "normal";
    const styleProfile = body.styleProfile || getStyleProfile(body.projectType, body.stylePreset);

    // Build seed prompts locally first (deterministic baseline)
    const seedImage = stripBannedWords(buildImagePrompt({ frame, storyboard, target }));
    const seedVideo = stripBannedWords(buildVideoPromptFor({ frame, storyboard, target, includeVo, promptMode, consistency }));

    // Refine via cheap model (Haiku 4.5 default)
    let api = null;
    try {
      api = await refineWithRouter({
        frame,
        analysis,
        storyboard,
        target,
        seedPrompt: seedVideo,
        seedImage,
        includeVo,
        promptMode,
        consistency,
      });
    } catch {}

    const finalized = finalizeVideoContract({
      frame,
      storyboard,
      target,
      videoPrompt: api?.video_prompt_en || seedVideo,
      imagePrompt: api?.image_prompt_en || seedImage,
      sfx: api?.sfx || analysis.sfx || frame.sfx || "subtle realistic ambience",
      negativePrompt: api?.negative_prompt || NEGATIVE_PROMPT_BASE,
      includeVo,
      promptMode,
      consistency,
    });

    return Response.json({
      ...finalized,
      target,
      model_used: api?._model_used || "local_only",
      pipeline_contract: {
        image_prefix: "SCENE PRIMARY FOCUS:",
        video_prefix: "ANIMATE CURRENT FRAME:",
        sfx_embedded_in_video_prompt: true,
        vo_dialogue_enabled: includeVo,
        prompt_mode: promptMode,
        consistency,
        video_engine: "v2.7",
        analysis_disabled: true,
        continuity_lock: true,
        no_subtitles_ui_watermark: true,
      },
      notes_ru:
        api?.notes_ru ||
        `Промт V2.7 построен под ${target === "veo3" ? "Veo 3" : "Grok Imagine"}: режим ${promptMode}, consistency ${consistency}, analyze отключён, VO/диалоги ${includeVo ? "включены пользователем" : "выключены"}, имена/дубли/No No очищены, SFX внутри video prompt.`,
    });
  } catch (e) {
    return Response.json({ error: e.message || "Video API error" }, { status: 500 });
  }
}
