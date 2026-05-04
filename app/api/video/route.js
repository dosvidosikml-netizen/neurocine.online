// app/api/video/route.js
// NeuroCine Video Prompt API v2.8 — deterministic V2.7+ layer
// /api/video отвечает ТОЛЬКО за video prompt. analyze отключён.

import {
  buildVideoPromptFor,
  buildImagePrompt,
  stripBannedWords,
  validateFramePrompts,
  NEGATIVE_PROMPT_BASE,
  finalizePromptCleaners,
  hasMinorContext,
} from "../../../engine/videoPromptAgent";
import { normalizeTarget } from "../../../engine/sceneEngine_v2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizePromptPrefix(text = "", prefix) {
  let out = String(text || "").trim();
  if (prefix === "SCENE PRIMARY FOCUS:") out = out.replace(/^SCENE PRIMARY FOCUS[:\s-]*/i, "").trim();
  if (prefix === "ANIMATE CURRENT FRAME:") out = out.replace(/^ANIMATE CURRENT FRAME[:\s—-]*/i, "").trim();
  return `${prefix} ${out}`.replace(/\s+/g, " ").trim();
}

function ensureSfxInsideVideoPrompt(videoPrompt = "", sfx = "") {
  const cleanSfx = String(sfx || "subtle realistic ambience").trim();
  let out = String(videoPrompt || "").trim().replace(/\bNo\s+SFX\s*:/gi, "SFX:");
  if (!/\bSFX\s*:/i.test(out)) out = `${out} SFX: ${cleanSfx}.`;
  return out.replace(/\s+/g, " ").trim();
}

function ensureContinuityLine(videoPrompt = "", frame = {}) {
  const first = String(frame?.id || "").match(/0?1\b/) || String(frame?.id || "") === "frame_01";
  const prevLine = "Maintain EXACT same character appearance, face, clothing, and condition as previous frame.";
  const firstLine = "Maintain exact character appearance, clothing, lighting and condition from the uploaded frame.";
  let out = String(videoPrompt || "").trim()
    .replace(/Maintain EXACT same character appearance, face, clothing, and condition as previous frame\.?/gi, "")
    .replace(/Maintain exact character appearance, clothing, lighting and condition from the uploaded frame\.?/gi, "")
    .trim();
  return `${out} ${first ? firstLine : prevLine}`.replace(/\s+/g, " ").trim();
}

function buildSegmentPlan(frame = {}) {
  const duration = Number(frame.duration || 3);
  if (!Number.isFinite(duration) || duration <= 8) return null;
  const parts = Math.ceil(duration / 8);
  const segmentLength = Math.ceil(duration / parts);
  return {
    required: true,
    reason_ru: "Длительность кадра больше 8 секунд, для video models лучше резать на несколько I2V-клипов.",
    total_duration: duration,
    parts,
    segment_length_seconds: Math.min(8, segmentLength),
  };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const frame = body.frame || {};
    const storyboard = body.storyboard || {};
    const target = normalizeTarget(body.target || frame.target || storyboard?.export_meta?.target || "veo3");
    const includeVo = body.includeVo === true || body.include_vo === true;
    const promptMode = body.promptMode || body.prompt_mode || (target === "grok" ? "cheap" : "pro");
    const consistency = body.consistency || body.videoConsistency || body.video_consistency || "ultra";
    const minorSafe = hasMinorContext(frame, storyboard);

    let imagePrompt = stripBannedWords(buildImagePrompt({ frame, storyboard, target }));
    let videoPrompt = buildVideoPromptFor({ frame, storyboard, target, includeVo, promptMode, consistency });
    const sfx = frame.sfx || body?.analysis?.sfx || "subtle realistic ambience";

    videoPrompt = finalizePromptCleaners(videoPrompt, { frame, storyboard, includeVo, target });
    videoPrompt = ensureSfxInsideVideoPrompt(videoPrompt, sfx);
    videoPrompt = ensureContinuityLine(videoPrompt, frame);

    const finalVideo = normalizePromptPrefix(videoPrompt, "ANIMATE CURRENT FRAME:");
    const finalImage = normalizePromptPrefix(imagePrompt, "SCENE PRIMARY FOCUS:");
    const finalNegative = [
      NEGATIVE_PROMPT_BASE,
      "subtitles, captions, on-screen text, UI overlay, watermark, logo, deformed face, identity drift, clothing drift",
    ].join(", ").replace(/\s+/g, " ").trim();

    const validation = validateFramePrompts({
      frame: { ...frame, video_prompt_en: finalVideo, image_prompt_en: finalImage },
      storyboard,
      target,
    });

    return Response.json({
      video_prompt_en: finalVideo,
      image_prompt_en: finalImage,
      sfx,
      negative_prompt: finalNegative,
      validation,
      segment_plan: buildSegmentPlan(frame),
      target,
      model_used: "local_v2.8_minor_safe",
      pipeline_contract: {
        image_prefix: "SCENE PRIMARY FOCUS:",
        video_prefix: "ANIMATE CURRENT FRAME:",
        prompt_mode: promptMode,
        consistency,
        minor_safe_mode: minorSafe,
        sfx_embedded_in_video_prompt: true,
        vo_dialogue_enabled: includeVo,
        analysis_disabled: true,
        continuity_lock: true,
        no_subtitles_ui_watermark: true,
      },
      notes_ru: minorSafe
        ? "Minor-safe режим включён автоматически: промт очищен от речи/VO, human voices, явных слов казни/насилия и переведён в I2V-lock формат. Если Flow запрещает загрузку несовершеннолетних, используй prompt-only/символические кадры/взрослого актёра — сайт не обходит правила платформы."
        : `Промт построен под ${target === "veo3" ? "Veo 3" : "Grok Imagine"}: ${promptMode}, ${consistency}, VO/диалоги ${includeVo ? "включены пользователем" : "выключены"}.`,
    });
  } catch (e) {
    return Response.json({ error: e.message || "Video API error" }, { status: 500 });
  }
}
