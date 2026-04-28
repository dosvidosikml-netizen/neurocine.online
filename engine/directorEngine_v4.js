export const STYLE_PRESETS = {
  film: ['Cinematic realism', 'Netflix documentary', 'Historical reconstruction', 'Dark thriller', 'Gritty handheld realism', 'True crime', 'War documentary', 'Epic fantasy realism'],
  animation: ['2D animation', '2.5D animation', '3D cartoon', 'Dark adult animation', 'Stop motion', 'Watercolor animation', 'Paper cutout', 'Retro cartoon'],
  anime: ['Cinematic anime', 'Dark anime realism', 'Historical anime', 'Painterly anime', 'Manga noir'],
  comic: ['Graphic novel', 'Dark comic book', 'European bande dessinée', 'Ink wash comic'],
  commercial: ['Premium ad', 'Music video', 'Fashion film', 'Product cinematic']
};

export const DIRECTOR_SYSTEM = `
You are NeuroCine Director Core v4: a production-grade AI film director, storyboard supervisor, continuity editor, and prompt engineer.

PRIMARY RULE:
The user's scenario is law. Never rewrite the meaning of the story. Never add events that are not implied by the scenario. You may only transform the scenario into controlled visual production units.

SCENARIO LOCK:
- Do not change plot events.
- Do not change chronology.
- Do not add new major characters.
- Do not change character identity, costume, age, role, condition, or emotional meaning.
- Do not change location unless the original scenario clearly moves location.
- Do not change time of day unless the scenario requires it.
- Do not replace the scene action with a more dramatic unrelated action.
- Do not add subtitles, UI, watermarks, labels, logos, or text inside images.

ALLOWED CHANGES:
- camera angle
- lens feel
- framing
- composition
- camera distance
- depth of field
- micro motion
- environmental particles
- light behavior within the locked style

GLOBAL VISUAL RULES:
- no subtitles, no UI, no watermark
- coherent cinematic continuity frame to frame
- physical realism: weight, inertia, friction, breath, cloth, particles, grounded camera
- cinematic clarity: one primary focus per frame
- preserve character continuity in every prompt

OBSERVER FRAMING FOR IMAGE PROMPTS:
Describe what the camera sees, not graphic impact. Use non-exploitative documentary framing, foreground/midground/background, partial occlusion, implied action where needed, and safe cinematic language.

VIDEO PROMPT RULES:
Every video prompt must animate the selected locked frame only. It must not introduce new story beats. It must include camera motion, subject micro-movement, environmental interaction, physics, and SFX inside the video prompt.

OUTPUT RULE:
Return valid JSON only. No markdown. No explanations outside JSON.
`;

export function buildStoryboardPrompt({ script, projectType, stylePreset, duration = 60, aspectRatio = '9:16' }) {
  return `
Create a strict Director Storyboard JSON from this scenario.

Project type: ${projectType || 'film'}
Style preset: ${stylePreset || 'cinematic realism'}
Aspect ratio: ${aspectRatio}
Target duration: ${duration} seconds
Timing: split into 2-4 second frames, preferably about 3 seconds per frame.

Return JSON with this exact structure:
{
  "project_name": "short title",
  "language": "ru",
  "format": "shorts_reels_tiktok",
  "aspect_ratio": "${aspectRatio}",
  "total_duration": ${Number(duration) || 60},
  "project_type": "${projectType || 'film'}",
  "style_preset": "${stylePreset || 'cinematic realism'}",
  "style_lock": "full style lock in English",
  "scenario_lock": {
    "locked": true,
    "rules": ["story", "characters", "locations", "timeline", "emotion", "style"]
  },
  "character_lock": [
    {"name":"...", "age":"...", "face_features":"...", "hair":"...", "clothing":"...", "physical_condition":"..."}
  ],
  "scenes": [
    {
      "id":"frame_01",
      "start":0,
      "duration":3,
      "beat_type":"hook|detail|escalation|pause|climax|finale",
      "description_ru":"short Russian description",
      "locked_story_action":"exact story action; no invention",
      "image_prompt_en":"SCENE PRIMARY FOCUS: ...",
      "video_prompt_en":"ANIMATE CURRENT FRAME: ... SFX: ...",
      "vo_ru":"Russian narrator VO",
      "sfx":"comma separated SFX",
      "camera":"camera language",
      "transition":"cut type",
      "continuity_note":"what must be preserved",
      "forbidden_changes":["do not change character", "do not change location", "do not change action", "do not change timeline", "do not add new story beat"]
    }
  ]
}

Scenario:
${script}
`;
}

export function buildExplorePrompt(frame, project = {}) {
  const style = project.style_lock || project.stylePreset || 'cinematic documentary realism';
  return `ULTRA CINEMATIC VARIATION GRID — PRODUCTION SPEC

TASK:
Create a 2x2 grid of four shot variations of the EXACT SAME FRAME.

LOCKED FRAME ID:
${frame?.id || 'frame_01'}

BASE SCENE:
${frame?.image_prompt_en || frame?.description_ru || frame?.locked_story_action || ''}

LOCKED STORY ACTION:
${frame?.locked_story_action || frame?.description_ru || ''}

CONTINUITY LOCK — NON-NEGOTIABLE:
- keep the same character identity, face, hair, clothing, condition
- keep the same location and time of day
- keep the same story action and emotion
- keep the same scenario logic and timeline
- no new characters, no new props, no changed event

ALLOWED VARIATION AXES ONLY:
- camera angle and height
- lens feeling
- framing and composition
- camera distance and perspective
- depth of field

SHOT SET — MANDATORY:
A — EXTREME CLOSE-UP: face/emotion focus, shallow depth, intimate tension
B — LOW GROUND ANGLE: foreground texture dominant, heavy perspective, tactile detail
C — WIDE ENVIRONMENTAL: full body/spatial story, isolation, readable location
D — OVER-SHOULDER / OBSTRUCTED: foreground obstruction, layered depth, observer feeling

STYLE LOCK:
${style}

REALISM RULES:
- grounded physics
- natural imperfections
- no stylization drift outside selected style
- no text, no subtitles, no UI, no watermark

OUTPUT:
Single image, 2x2 grid, four clearly different compositions, strict continuity preserved.`;
}

export function build2KPrompt(frame, variant, project = {}) {
  const style = project.style_lock || project.stylePreset || 'cinematic realism';
  const variantMap = {
    A: 'extreme close-up emotional face focus, ultra shallow depth of field',
    B: 'low ground angle from straw/floor level, strong foreground texture, heavy perspective',
    C: 'wide environmental shot, full body and location readable, isolation through negative space',
    D: 'over-shoulder or obstructed frame, layered depth, voyeuristic documentary feeling'
  };
  return `CREATE FINAL LOCKED FRAME IN 2K QUALITY

FRAME ID:
${frame?.id || ''}

SELECTED VARIANT:
${variant || 'A'} — ${variantMap[variant] || 'selected composition'}

LOCKED STORY ACTION:
${frame?.locked_story_action || frame?.description_ru || ''}

BASE VISUAL:
${frame?.image_prompt_en || ''}

STRICT LOCK:
- preserve the exact scenario action
- preserve same character identity, clothing, condition
- preserve location, time, lighting logic, emotional meaning
- do not add new story events or extra characters

QUALITY TARGET:
2K high-quality production frame, clean cinematic detail, realistic textures, strong composition, generator-ready image prompt.

STYLE LOCK:
${style}

NEGATIVE:
no text, no subtitles, no UI, no watermark, no logo, no new props, no changed costume, no changed location.`;
}

export function buildVideoPromptFromAnalysis(frame, analysis, project = {}) {
  return `ANIMATE CURRENT LOCKED FRAME:

FRAME ID:
${frame?.id || ''}

LOCKED STORY ACTION:
${frame?.locked_story_action || frame?.description_ru || ''}

VISUAL ANALYSIS TO PRESERVE:
${typeof analysis === 'string' ? analysis : JSON.stringify(analysis, null, 2)}

DIRECTOR INSTRUCTION:
Animate only this exact locked frame. Do not introduce a new event. Keep the same character, location, action, time, style, and emotional meaning.

MOTION:
Add realistic micro-movement based on the frame: breathing, small posture shift, cloth response, eye movement, hand tension, environmental particles, smoke, dust, cold breath, wind, or object vibration where appropriate.

CAMERA:
Use organic handheld operator behavior based on the selected composition. Add a subtle push, drift, pull, or focus breathing only if it supports the original scenario.

PHYSICAL REALISM:
Grounded weight, inertia, friction, natural timing, no floaty motion, no artificial digital smoothness.

SFX:
${frame?.sfx || 'subtle room tone, cloth movement, breath, environmental ambience'}

STYLE LOCK:
${project.style_lock || project.stylePreset || 'cinematic realism'}

FORBIDDEN:
No story change, no new characters, no changed costume, no changed location, no changed time, no subtitles, no UI, no watermark.`;
}

export function safeJsonParse(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch (_) {}
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch (_) { return null; }
}

export function normalizeStoryboard(data, fallback = {}) {
  const out = data && typeof data === 'object' ? data : {};
  const scenes = Array.isArray(out.scenes) ? out.scenes : [];
  return {
    project_name: out.project_name || 'NeuroCine Project',
    language: out.language || 'ru',
    format: out.format || 'shorts_reels_tiktok',
    aspect_ratio: out.aspect_ratio || '9:16',
    total_duration: out.total_duration || fallback.duration || 60,
    project_type: out.project_type || fallback.projectType || 'film',
    style_preset: out.style_preset || fallback.stylePreset || 'cinematic realism',
    style_lock: out.style_lock || fallback.stylePreset || 'cinematic realism, no subtitles, no UI, no watermark',
    scenario_lock: out.scenario_lock || { locked: true, rules: ['story','characters','locations','timeline','emotion','style'] },
    character_lock: Array.isArray(out.character_lock) ? out.character_lock : [],
    scenes: scenes.map((s, idx) => ({
      id: s.id || `frame_${String(idx + 1).padStart(2, '0')}`,
      start: Number.isFinite(Number(s.start)) ? Number(s.start) : idx * 3,
      duration: Number.isFinite(Number(s.duration)) ? Number(s.duration) : 3,
      beat_type: s.beat_type || 'scene',
      description_ru: s.description_ru || s.text || '',
      locked_story_action: s.locked_story_action || s.description_ru || s.text || '',
      image_prompt_en: s.image_prompt_en || '',
      video_prompt_en: s.video_prompt_en || '',
      vo_ru: s.vo_ru || '',
      sfx: s.sfx || '',
      camera: s.camera || '',
      transition: s.transition || 'cut',
      continuity_note: s.continuity_note || '',
      forbidden_changes: s.forbidden_changes || ['do not change character','do not change location','do not change action','do not change timeline','do not add new story beat']
    }))
  };
}
