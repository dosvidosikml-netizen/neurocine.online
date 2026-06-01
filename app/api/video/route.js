// app/api/video/route.js
// NeuroCine Video Prompt API v3.2 — clean I2V prompt layer + world/style brain.

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
import { applyWorldBrainToVideoPrompt, buildWorldAudioBlock } from "../../../engine/storyboardWorldBrain";
import { buildAmbientBed } from "../../../engine/ambientBedEngine";
import { requireSignedInAccess, guardErrorJson } from "../../../lib/apiAccess";
import { logUsageEvent, usageMeta } from "../../../lib/usageLogger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizePromptPrefix(text = "", prefix) {
  let out = String(text || "").trim();
  if (prefix === "SCENE PRIMARY FOCUS:") out = out.replace(/^SCENE PRIMARY FOCUS[:\s-]*/i, "").trim();
  if (prefix === "ANIMATE CURRENT FRAME:") out = out.replace(/^ANIMATE CURRENT FRAME[:\s—-]*/i, "").trim();
  return `${prefix} ${out}`.replace(/\s+/g, " ").trim();
}

function cleanText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function hasNoVoLeak(text = "") {
  return /\bScript\s*:|\bScript line\s*:|\bSCRIPT LINE\b|\bVO MEANING LOCK\b|\bvoiceover may be added|SOURCE OF TRUTH\s*:\s*script line/i.test(String(text || ""));
}

function sanitizeNoVoVideoPrompt(text = "", includeVo = false) {
  let out = String(text || "");

  if (!includeVo) {
    // No-VO mode means no quoted script/VO line and no script-line marker in the video prompt.
    // The clip should animate the uploaded/current frame only, not treat script text as speech, subtitle or narration.
    out = out
      .replace(/\bSOURCE OF TRUTH\s*:\s*script line\.?/gi, "SOURCE OF TRUTH: current visual frame only.")
      .replace(/\bSOURCE OF TRUTH\s*:\s*script line only\.?/gi, "SOURCE OF TRUTH: current visual frame only.")
      .replace(/\bScript\s*:\s*"[^"]*"\.?/gi, "")
      .replace(/\bScript\s*:\s*'[^']*'\.?/gi, "")
      .replace(/\bScript\s*:\s*[^.]+\./gi, "")
      .replace(/\bScript line\s*:\s*"[^"]*"\.?/gi, "")
      .replace(/\bScript line\s*:\s*'[^']*'\.?/gi, "")
      .replace(/\bSCRIPT LINE\s*\([^)]*\)\s*:\s*"[^"]*"\.?/gi, "")
      .replace(/\bSCRIPT LINE\s*\([^)]*\)\s*:\s*'[^']*'\.?/gi, "")
      .replace(/\bVO MEANING LOCK\s*:[\s\S]*?(?=\bSOURCE OF TRUTH\b|\bVISUAL CONTEXT\b|\bACTION\b|\bCONTINUITY\b|\bCAMERA\b|\bSFX\b|$)/gi, "")
      .replace(/\bVoiceover may be added separately;?\s*/gi, "")
      .replace(/\bspoken line\b/gi, "visual action")
      .replace(/\bvoiceover\b(?!\.)/gi, "no voiceover");
  }

  // Remove cleaner artifacts like: RAW photograph, NOT photographed, NOT.
  out = out
    .replace(/\bRAW photograph,\s*NOT photographed,\s*NOT\.?/gi, "RAW documentary photograph")
    .replace(/\bNOT photographed,\s*NOT\.?/gi, "")
    .replace(/,\s*,+/g, ",")
    .replace(/\s+\./g, ".")
    .replace(/\.\s*\./g, ".");

  return cleanText(out);
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

function readDominantSfx(videoPrompt = "", fallback = "") {
  const text = cleanText(videoPrompt || "");
  const primary = text.match(/PRIMARY SFX\s*(?:—|-|:)\s*([^.]*)\./i)?.[1];
  if (primary) return cleanText(primary);
  const sfx = text.match(/\bSFX\s*:\s*([^.]*)\./i)?.[1];
  if (sfx) return cleanText(sfx);
  return cleanText(fallback || "subtle realistic ambience");
}

function mergeStyleContext(rawStoryboard = {}, body = {}) {
  const styleProfile = body.styleProfile || body.style_profile || {};
  return {
    ...(rawStoryboard || {}),
    style_profile: styleProfile,
    selected_style: body.stylePreset || body.style || rawStoryboard?.selected_style || styleProfile?.style_preset || "",
    selected_style_label: rawStoryboard?.selected_style_label || styleProfile?.style_label || "",
    project_type: rawStoryboard?.project_type || styleProfile?.project_type || "",
    project_type_label: rawStoryboard?.project_type_label || styleProfile?.project_type_label || "",
    global_style_lock: styleProfile?.style_lock || rawStoryboard?.global_style_lock || "",
  };
}

export async function POST(req) {
  try {
    const guard = await requireSignedInAccess(req);
    if (!guard.ok) return guardErrorJson(guard);
    const body = await req.json();
    const frame = body.frame || {};
    const storyboard = mergeStyleContext(body.storyboard || {}, body);
    const target = normalizeTarget(body.target || frame.target || storyboard?.export_meta?.target || "veo3");
    const includeVo = body.includeVo === true || body.include_vo === true;
    const promptMode = body.promptMode || body.prompt_mode || (target === "grok" ? "cheap" : "pro");
    const consistency = body.consistency || body.videoConsistency || body.video_consistency || "ultra";
    const minorSafe = hasMinorContext(frame, storyboard);
    const worldAudio = buildWorldAudioBlock(frame, storyboard);

    const imagePrompt = normalizePromptPrefix(
      stripBannedWords(buildImagePrompt({ frame, storyboard, target })),
      "SCENE PRIMARY FOCUS:"
    );

    const rawVideo = buildVideoPromptFor({ frame, storyboard, target, includeVo, promptMode, consistency });
    const cleanedVideo = finalizePromptCleaners(rawVideo, { frame, storyboard, includeVo, target });
    const noVoSafeVideo = sanitizeNoVoVideoPrompt(cleanedVideo, includeVo);
    const worldSafeVideo = applyWorldBrainToVideoPrompt(noVoSafeVideo, frame, storyboard, { compact: true });
    const finalVideo = normalizePromptPrefix(sanitizeNoVoVideoPrompt(worldSafeVideo, includeVo), "ANIMATE CURRENT FRAME:");
    const noVoLeakDetected = !includeVo && hasNoVoLeak(finalVideo);
    const dominantSfx = readDominantSfx(finalVideo, frame.sfx || body?.analysis?.sfx || worldAudio.profile.allowedAudio);
    const ambientBed = buildAmbientBed({ frame: { ...frame, sfx: dominantSfx }, storyboard });

    const finalNegative = [NEGATIVE_PROMPT_BASE, worldAudio.profile.forbiddenAudio, worldAudio.profile.forbiddenObjects]
      .filter(Boolean).join(", ").replace(/\s+/g, " ").trim();

    const validation = validateFramePrompts({
      frame: { ...frame, video_prompt_en: finalVideo, image_prompt_en: imagePrompt, sfx: dominantSfx },
      storyboard,
      target,
    });

    await logUsageEvent({
      req,
      account: guard.account,
      endpoint: "/api/video",
      success: true,
      apiSource: "local_signed_in",
      modelUsed: "local_v3.2_world_style_brain_no_vo_hardened",
      metadata: usageMeta(body, { target, promptMode, consistency, world: worldAudio.profile.id, style: storyboard.selected_style || storyboard.selected_style_label, no_vo_leak_detected: noVoLeakDetected }),
    });

    return Response.json({
      video_prompt_en: finalVideo,
      image_prompt_en: imagePrompt,
      sfx: dominantSfx,
      ambient_bed: ambientBed,
      world_audio: worldAudio,
      negative_prompt: finalNegative,
      validation,
      no_vo_clean: !noVoLeakDetected,
      segment_plan: buildSegmentPlan(frame),
      target,
      model_used: "local_v3.2_world_style_brain_no_vo_hardened",
      access_source: guard.access?.apiSource || "local_signed_in",
      pipeline_contract: {
        image_prefix: "SCENE PRIMARY FOCUS:",
        video_prefix: "ANIMATE CURRENT FRAME:",
        prompt_mode: promptMode,
        consistency,
        minor_safe_mode: minorSafe,
        world_audio_brain: true,
        selected_style: storyboard.selected_style || storyboard.selected_style_label || "",
        world_profile: worldAudio.profile.id,
        sfx_embedded_in_video_prompt: true,
        ambient_bed_emitted: true,
        vo_dialogue_enabled: includeVo,
        no_vo_clean: !noVoLeakDetected,
        analysis_disabled: true,
        continuity_lock: true,
        no_subtitles_ui_watermark: true,
      },
      notes_ru: `Промт построен под ${target === "veo3" ? "Veo 3" : "Grok Imagine"}: ${promptMode}, ${consistency}. World/style brain: ${worldAudio.profile.label}.`,
    });
  } catch (e) {
    return Response.json({ error: e.message || "Video API error" }, { status: 500 });
  }
}
