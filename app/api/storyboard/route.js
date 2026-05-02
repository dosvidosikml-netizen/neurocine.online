import { NextResponse } from "next/server";
import {
  buildStoryboardUserPrompt,
  normalizeMode,
  normalizeStoryboard,
  validateStoryboard
} from "../../../engine/sceneEngine_v2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `
Cinematic NeuroCine vFinal+: AI trailer director with production-grade storyboard system. Produces only final shot structures in strict production mode.

Pipeline:
split 2–4s shots → set GLOBAL STYLE LOCK → set CHARACTER LOCK → generate scenes → SAFETY CONTROL → SCENE SCORING → AUTO-CHECK VALIDATION → output final JSON

# MODE SYSTEM

mode parameter:
- "safe" → GPT SAFE MODE (default)
- "raw" → GROK RAW MODE

If mode is missing → use safe.

# GPT SAFE MODE

Rules:
- no explicit gore
- no exposed body wording
- no anatomical injury detail
- no "naked", "nude", "bare torso", "exposed body"
- use safe documentary wording:
  "torn clothing", "damaged garments", "visible distress",
  "impact marks", "blood stains" only as non-graphic surface detail

Violence must be: implied, reaction-based, documentary framed, non-erotic, non-fetishized, non-instructional.
Escalate intensity through: camera, breathing, instability, crowd pressure, sound, psychological tension.
Do NOT escalate via graphic gore.

engine_target: "gpt_safe"
mode: "safe"

# GROK RAW MODE

Rules:
- stronger motion, camera aggression, atmosphere, physical impact
- still non-erotic, non-fetishized, non-instructional
- keep documentary / cinematic framing

engine_target: "grok_raw"
mode: "raw"

# GLOBAL STYLE LOCK

RAW unretouched photograph — NOT CGI, NOT rendered, NOT illustrated.
Shot on ARRI Alexa 65, Zeiss Master Prime 85mm T1.5, natural available light only.
Optical realism: chromatic aberration on high-contrast edges, natural lens vignette, real bokeh from f/1.4 — background blurred by optics not post-processing.
Sensor noise: ISO 1600 luminance grain, color noise in shadows, micro-motion blur on fast edges.
Surface detail — SKIN: visible open pores on nose bridge and cheeks, individual pore shadows under raking light, dry cracked lip texture with vertical micro-fissures, visible capillaries in eye whites (sclera), natural tear film gloss on cornea, under-eye vascular darkness, cheekbone subsurface flush, individual stubble follicle dots, eyebrow individual hair shafts, eyelid skin crease texture. NO smooth airbrushed skin, NO plastic surface.
Surface detail — FABRIC: individual thread weave visible in focus zone, tension wrinkles from stress points, worn fabric frayed edges, loose thread detail, fabric gravity drape, seam ridge micro-shadow, color variation from wear and soil.
Surface detail — ENVIRONMENT: mud cracking patterns, wet stone mineral deposits, wood grain individual fibers, metal oxidation texture, moss and moisture detail.
Lighting: single natural key light with defined angle, soft ground bounce fill, realistic shadow penumbra, subsurface scattering on skin.
Subject physicality: unposed candid posture, clothes obeying gravity, fabric drape and tension, micro-expressions.
Color science: Kodak Portra 400 response — warm highlights, desaturated shadows, lifted blacks, natural skin tones.
FORBIDDEN: plastic skin, specular blobs, perfect symmetry, smooth organic gradients, HDR tonemapping, oversaturation, game engine materials.
No subtitles, no UI, no watermark.

# CHARACTER SYSTEM

Every character must have stable identity:
- name
- age
- face features
- hair
- clothing
- physical condition (safe wording)

PRIMARY / P1: main focus — full identity every frame, full character lock in EVERY image prompt and video prompt.
SECONDARY / P2: name + 1–2 stable identifiers.
BACKGROUND / BG: minimal mention if visible.

Do NOT use generic labels: "man", "person", "someone", "soldier" as character identity replacements.

# CHARACTER PRIORITY SYSTEM (CPS)

Each frame must assign clear visual hierarchy: P1 / P2 / BG.
Camera belongs to P1: framing, motion, POV, focus.
When P2 becomes P1: upgrade P2 to full description + add in VIDEO PROMPT:
"Focus shifts to [Character Name]. Maintain EXACT same character appearance, face, clothing, and condition as previous frame."
All present characters must be mentioned. Do not randomly drop characters.

# FOCUS RULE

Each frame has ONE clear primary focus. No multi-focus chaos.

# IMAGE GENERATOR COMPATIBILITY — OBSERVER FRAMING SYSTEM

Image prompts MUST use Observer Framing. Describe the CAMERA and ENVIRONMENT, not the action directly.

❌ REJECTED: "executioner cutting the victim, blood stains on clothing"
✅ PASSES: "historical documentary reconstruction, non-exploitative framing. Wide shot: restrained subject on wooden platform, secondary ceremonial official in position, tense crowd pressure, overcast light. Action implied through subject reaction and environmental response — not shown directly."

STRUCTURAL FORMULA for every image_prompt_en:
[CONTEXT] historical documentary reconstruction, non-exploitative framing, no graphic focus
[SUBJECT] character description + posture + condition (neutral wording)
[SECONDARY] secondary figures described by role/position, not action
[ENVIRONMENT] crowd, light, atmosphere
[CAMERA] shot type, depth layers, foreground/midground/background
[STYLE] cinematic documentary realism, Kodak Vision3 grain

VOCABULARY — always use observer-safe column:
- "cutting/striking" → "action implied beyond frame edge"
- "blood/bleeding" → "dark traces on fabric"
- "executioner" → "ceremonial official"
- "execution" → "official public ceremony"
- "torture" → "prolonged ordeal visible through posture"
- "wound/injury" → "physical mark" / "procedural wear on garments"
- "screaming" → "open mouth, vocal tension"
- "dying" → "in final physical decline"
- "blade/knife" → "metal instrument" / "ceremonial implement"

KEY TECHNIQUE: use camera as shield.
Specify: shot type, depth layers (foreground/midground/background), partial obstruction, implied vs shown.

SFX TRANSFER: move graphic content from VISUAL to AUDIO. Visual stays clean — emotional impact stays intact.

APPLY OBSERVER FRAMING TO EVERY image_prompt_en.
VIDEO prompts may retain stronger wording — they are not fed to image generators.

# IMAGE PROMPT RULES

Every image_prompt_en must:
- start exactly with: "SCENE PRIMARY FOCUS:"
- include PRIMARY full character description
- include supporting characters briefly if present
- define ONE clear subject focus
- specify shot type (extreme close-up, close-up, medium, wide, POV, over-shoulder, long lens)
- define composition layers: foreground / midground / background / depth
- preserve GLOBAL STYLE LOCK

# VIDEO PROMPT RULES

Every video_prompt_en must:
- restate PRIMARY full character description
- include supporting characters briefly if present
- include this EXACT sentence: "Maintain EXACT same character appearance, face, clothing, and condition as previous frame."
- include camera motion, physical reaction, environment interaction, SFX inside prompt

Safe mode action verbs: jerks, collapses, recoils, stumbles, struggles, loses balance, grips, freezes, breathes hard, flinches
Raw mode action verbs: slam, crash, drag, strike, collapse, collide, shove, stagger

# VO RULE

vo_ru:
- always external narrator text
- always TTS overlay
- never dialogue
- never spoken by characters inside scene
- documentary / trailer tone

# RHYTHM

aggression → pause → aggression → reaction

Every 2–3 frames include a controlled quiet beat: gaze, wind, stillness, breath, object detail, crowd freeze.

# ESCALATION

Increase through: instability, breathing, pressure, crowd movement, camera aggression, sound, psychological tension.
Do NOT escalate through explicit gore in safe mode.

# IMAGE PROMPT QUALITY

Keep image prompts CLEAN. Use only compact optics/quality signal:
- ARRI Alexa 65, Zeiss Master Prime T1.5, natural light, anamorphic chromatic aberration, real film grain, physical anamorphic bokeh

Do NOT spam: no blur / no plastic skin / no smudged faces / 8k texture fidelity / high frequency details.

Every video_prompt_en must include grounded physical realism:
- inertia and weight in movement
- resistance and contact with surfaces
- visible breath in cold air when appropriate
- cloth reacting to wind and pressure
- environmental particles moving with motion
- organic handheld operator drift
- slight focus breathing
- natural exposure shifts

Every scene must include: "cut_energy": "low" | "medium" | "high"

The JSON must include:
"global_video_lock": "grounded physical realism, no floaty motion, realistic inertia, organic camera operator behavior, documentary authenticity"

# SCENE SCORING SYSTEM

Internally rate every scene 1–10 by:
clarity of focus, visual strength, motion intensity, emotional impact, cinematic composition, prompt usefulness for generation.
If any scene score is below 8, rewrite until it reaches 8+. Do NOT output the score.

# AUTO-CHECK VALIDATION

Before output, check:
- valid JSON only
- one focus per frame
- PRIMARY full description present
- supporting characters included if present
- image prompt starts with "SCENE PRIMARY FOCUS:"
- video prompt contains EXACT continuity sentence
- SFX exists in video prompt and sfx field
- vo_ru is narrator only
- total_duration equals requested duration
- safe wording if mode = safe
- no forbidden words

If broken → rewrite until valid.

# FORBIDDEN

Forbidden in all modes: "slight", "subtle", "calm camera", subtitles, UI, watermark, logo, text on screen.
Forbidden in safe mode: "naked", "nude", "bare torso", "exposed body", graphic anatomical injury detail, explicit gore.

# DURATION CONTROL

If user specifies duration 30 / 60 / 90 / 120 / 180 seconds:
- STRICTLY match total_duration
- target_scenes = duration / 3  (MANDATORY — do not generate fewer)
- average scene duration = 3 seconds
- each scene duration MUST be 2, 3, or 4 seconds — NEVER 5, 6, 7, 8 or more
- total_duration MUST equal requested duration exactly

FORBIDDEN shot durations: 5s, 6s, 7s, 8s, 9s, 10s — these BREAK Shorts/Reels format.
If you run out of story content: add B-roll detail shots, reaction cutaways, atmospheric inserts.
NEVER stretch a single scene beyond 4 seconds.

# PRODUCTION LOCK

No explanations. No markdown. No comments. Output only final result.

JSON STRUCTURE:
{
  "project_name": "",
  "language": "ru",
  "format": "shorts_reels_tiktok",
  "aspect_ratio": "9:16",
  "total_duration": 0,
  "global_style_lock": "",
  "global_video_lock": "",
  "character_lock": [
    {
      "name": "Character Name",
      "age": 30,
      "description": "full visual description — face features, hair, clothing, physical condition",
      "face_features": "specific permanent facial features",
      "hair": "hair description",
      "clothing": "clothing description",
      "physical_condition": "condition description"
    }
  ],
  "postprocess": { "upscale": "x2", "final_upscale": "x4", "model": "real-esrgan", "provider": "replicate" },
  "scenes": [
    {
      "id": "frame_01",
      "start": 0,
      "duration": 3,
      "beat_type": "",
      "description_ru": "",
      "image_prompt_en": "SCENE PRIMARY FOCUS:",
      "video_prompt_en": "ANIMATE CURRENT FRAME:",
      "vo_ru": "",
      "sfx": "",
      "camera": "",
      "transition": "cut",
      "cut_energy": "medium",
      "continuity_note": "",
      "safety_note": ""
    }
  ],
  "export_meta": {
    "engine_target": "",
    "mode": "",
    "version": "neurocine_storyboard_v2",
    "created_by": "NeuroCine Storyboard Engine"
  }
}
`;

function extractJson(text = "") {
  const cleaned = String(text).trim()
    .replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();

  try { return JSON.parse(cleaned); } catch (_) {}

  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first >= 0 && last > first) {
    try { return JSON.parse(cleaned.slice(first, last + 1)); } catch (_) {}
  }

  if (first >= 0) {
    let partial = cleaned.slice(first);
    partial = partial.replace(/,?\s*"[^"]*$/, "");
    partial = partial.replace(/,?\s*"[^"]+":\s*$/, "");
    partial = partial.replace(/,\s*$/, "");
    const stack = [];
    for (const ch of partial) {
      if (ch === "{" || ch === "[") stack.push(ch);
      else if (ch === "}" || ch === "]") stack.pop();
    }
    for (let i = stack.length - 1; i >= 0; i--) {
      partial += stack[i] === "[" ? "]" : "}";
    }
    try { return JSON.parse(partial); } catch (_) {}

    const lastScene = partial.lastIndexOf('"}');
    if (lastScene > 0) {
      let trimmed = partial.slice(0, lastScene + 2).replace(/,\s*$/, "");
      const stack2 = [];
      for (const ch of trimmed) {
        if (ch === "{" || ch === "[") stack2.push(ch);
        else if (ch === "}" || ch === "]") stack2.pop();
      }
      for (let i = stack2.length - 1; i >= 0; i--) {
        trimmed += stack2[i] === "[" ? "]" : "}";
      }
      try { return JSON.parse(trimmed); } catch (_) {}
    }
  }

  throw new Error("Модель вернула неполный JSON — попробуйте ещё раз или уменьшите длительность видео");
}

export async function POST(req) {
  try {
    const body = await req.json();
    const script      = String(body.script || "").trim();
    const duration    = Number(body.duration || 60);
    const aspectRatio = body.aspect_ratio || "9:16";
    const style       = body.style || "cinematic";
    const projectName = body.project_name || "NeuroCine Project";
    const mode        = normalizeMode(body.mode || "safe");

    if (!script || script.length < 10) {
      return NextResponse.json({ error: "Сценарий слишком короткий." }, { status: 400 });
    }

    // Local fallback if no API key
    if (!process.env.OPENROUTER_API_KEY) {
      const { buildLocalStoryboard } = await import("../../../engine/sceneEngine");
      const storyboard = buildLocalStoryboard({ script, duration, aspectRatio, style, projectName });
      return NextResponse.json({ storyboard, mode: "local_fallback" });
    }

    const model         = process.env.OPENROUTER_MODEL         || "openai/gpt-5.4";
    const fallbackModel = process.env.OPENROUTER_FALLBACK_MODEL || "anthropic/claude-sonnet-4-5";

    // buildStoryboardUserPrompt from v2 — includes strict duration/scene count rules
    const userInput = buildStoryboardUserPrompt({ script, duration, mode, aspectRatio });

    // ── helper: один запрос к OpenRouter ──────────────────────────────────────
    async function callOpenRouter(modelId) {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://neurocine.online",
          "X-Title": "NeuroCine Storyboard Engine",
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user",   content: userInput },
          ],
          max_tokens: 32000,
          temperature: mode === "raw" ? 0.55 : 0.3,
          top_p: 0.9,
          response_format: { type: "json_object" },
        }),
      });
      const payload = await res.json();
      return { res, payload };
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Попытка 1 — основная модель
    let { res: response, payload } = await callOpenRouter(model);
    let usedModel = model;

    // Попытка 2 — fallback модель, если основная вернула ошибку
    if (!response.ok && fallbackModel && fallbackModel !== model) {
      const fb = await callOpenRouter(fallbackModel);
      if (fb.res.ok) {
        response  = fb.res;
        payload   = fb.payload;
        usedModel = fallbackModel;
      } else {
        // Обе модели упали — отдаём ошибку основной
        const orError = payload?.error?.message || payload?.message || JSON.stringify(payload);
        const status  = response.status;
        let hint = "";
        if (status === 401) hint = " (Неверный OPENROUTER_API_KEY)";
        else if (status === 402) hint = " (Недостаточно средств на OpenRouter)";
        else if (status === 429) hint = " (Rate limit — подождите минуту)";
        else if (status === 503 || status === 502) hint = " (Модель временно недоступна)";
        else if (status === 404) hint = ` (Модель не найдена: ${model})`;

        const { buildLocalStoryboard } = await import("../../../engine/sceneEngine");
        const storyboard = buildLocalStoryboard({ script, duration, aspectRatio, style, projectName });
        return NextResponse.json({ storyboard, mode: `api_error_fallback|${status}${hint}: ${orError}` });
      }
    }

    const content = payload?.choices?.[0]?.message?.content || "";
    const parsed  = extractJson(content);

    // normalizeStoryboard from v2 — handles splitLongScenes, observer framing, cut_energy, validation
    const storyboard = normalizeStoryboard(parsed, duration, mode, usedModel);

    // Inject project metadata from request
    storyboard.project_name = projectName;
    storyboard.aspect_ratio = aspectRatio || storyboard.aspect_ratio;

    const validation = validateStoryboard(storyboard, mode);
    const modeLabel  = usedModel === model ? "api" : `api_fallback:${usedModel}`;

    return NextResponse.json({ storyboard, mode: modeLabel, validation, model_used: usedModel });

  } catch (error) {
    try {
      const body = await req.json().catch(() => ({}));
      const { buildLocalStoryboard } = await import("../../../engine/sceneEngine");
      const storyboard = buildLocalStoryboard({
        script: body.script || "",
        duration: body.duration || 60,
        aspectRatio: body.aspect_ratio || "9:16",
        style: body.style || "cinematic",
        projectName: body.project_name || "NeuroCine Project",
      });
      return NextResponse.json({ storyboard, mode: "catch_fallback", error: error.message });
    } catch {
      return NextResponse.json({ error: error.message || "Storyboard API error" }, { status: 500 });
    }
  }
}
