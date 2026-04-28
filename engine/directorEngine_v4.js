const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export const DIRECTOR_SYSTEM_RULES = `
You are NeuroCine Director Core v4.
You are a cinematic director, storyboard supervisor, continuity supervisor, prompt engineer and post-production planner.

PRIMARY LANGUAGE:
- UI and explanations must be Russian.
- Image prompts and video prompts must be English.
- Voiceover must preserve the language of the user's script, usually Russian.

CORE LAW: SCENARIO LOCK
The user's scenario is law. You are not allowed to rewrite the story, change events, invent new plot turns, reorder the timeline, replace characters, change locations, change time of day, change emotional meaning, add subtitles, add UI elements, or add watermarks.

ALLOWED CHANGES:
Only cinematic execution may vary: camera angle, framing, lens feel, composition, distance, depth of field, handheld behavior, atmosphere, micro-movement, texture detail, lighting nuance within the same scene.

GLOBAL VISUAL RULES:
- cinematic documentary realism unless another style is explicitly selected
- historical accuracy when the topic is historical
- grounded physical realism
- realistic weight, inertia, friction and material response
- no floaty motion
- no fantasy drift unless selected as project style
- no subtitles, no UI, no watermark
- preserve character identity and wardrobe across frames
- keep continuity notes specific and useful

JSON OUTPUT RULES:
Return valid JSON only. No markdown. No commentary.
`;

export const STYLE_PRESETS = {
  film: {
    label: "Фильм / Realistic",
    styles: {
      cinematic_realism: "cinematic documentary realism, natural light, grounded physical realism, 35mm anamorphic, Kodak Vision3 grain",
      historical_doc: "historical documentary reconstruction, realistic textures, handheld camera, overcast natural light, non-exploitative framing",
      dark_thriller: "dark cinematic thriller realism, tense shadows, restrained contrast, handheld anxiety, realistic textures",
      true_crime: "true crime documentary realism, cold atmosphere, investigative framing, natural imperfections",
      war_doc: "gritty war documentary realism, handheld urgency, mud, smoke, physical exhaustion, natural light"
    }
  },
  animation: {
    label: "Мультфильм / Animation",
    styles: {
      two_d: "2D cinematic animation, hand-drawn textures, expressive silhouettes, layered light and shadow",
      two_point_five_d: "2.5D animation, layered parallax backgrounds, hand-painted textures, cinematic depth, controlled character consistency",
      three_d_cartoon: "3D cartoon animation, stylized shapes, cinematic lighting, expressive character performance",
      dark_adult_animation: "dark adult animation, mature cinematic tone, graphic novel lighting, restrained stylization",
      stop_motion: "stop motion animation, handmade textures, tactile materials, miniature set lighting, imperfect motion charm"
    }
  },
  anime: {
    label: "Аниме",
    styles: {
      cinematic_anime: "cinematic anime, dramatic composition, detailed backgrounds, expressive eyes, controlled lighting",
      dark_anime: "dark anime drama, muted palette, atmospheric haze, emotional close-ups, cinematic tension"
    }
  },
  comic: {
    label: "Комикс",
    styles: {
      graphic_novel: "graphic novel cinematic style, inked shadows, panel-like composition, strong silhouettes",
      european_comic: "European historical comic style, textured linework, painterly backgrounds, restrained color palette"
    }
  }
};

function safeJsonParse(text) {
  try { return JSON.parse(text); } catch (_) {}
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) return JSON.parse(text.slice(start, end + 1));
  throw new Error("Model did not return valid JSON");
}

function getApiKey() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is missing");
  return key;
}

export async function callOpenRouter({ messages, model, temperature = 0.35, max_tokens = 8000 }) {
  const apiKey = getApiKey();
  const selectedModel = model || process.env.OPENROUTER_MODEL || "openai/gpt-5.4";
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://neurocine.online",
      "X-Title": "NeuroCine Director Studio"
    },
    body: JSON.stringify({ model: selectedModel, messages, temperature, max_tokens })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `OpenRouter error ${res.status}`);
  return data?.choices?.[0]?.message?.content || "";
}

export async function generateStoryboard({ script, projectType = "film", stylePreset = "cinematic_realism", duration = 60 }) {
  const style = STYLE_PRESETS?.[projectType]?.styles?.[stylePreset] || STYLE_PRESETS.film.styles.cinematic_realism;
  const prompt = `
Create a strict Director Storyboard JSON from the user's scenario.

PROJECT STYLE LOCK:
${style}

DURATION:
${duration} seconds. Use 3 second rhythm for Shorts/Reels/TikTok unless the scenario requires a slight adjustment.

REQUIRED JSON SHAPE:
{
  "project_name": "short title",
  "language": "ru",
  "project_type": "${projectType}",
  "style_preset": "${stylePreset}",
  "style_lock": "${style}",
  "aspect_ratio": "9:16",
  "total_duration": ${duration},
  "scenario_lock": {
    "locked": true,
    "rules": ["do not change story", "do not change characters", "do not change timeline", "do not change locations", "only camera/framing variations allowed"]
  },
  "character_lock": [],
  "scenes": [
    {
      "id": "frame_01",
      "start": 0,
      "duration": 3,
      "beat_type": "hook",
      "description_ru": "what happens in this frame",
      "image_prompt_en": "SCENE PRIMARY FOCUS: ...",
      "video_prompt_en": "ANIMATE CURRENT FRAME: ... SFX: ...",
      "vo_ru": "voiceover line",
      "sfx": "comma separated SFX",
      "camera": "camera language",
      "transition": "cut type",
      "cut_energy": "low|medium|high",
      "continuity_note": "what must be preserved",
      "locked_story_action": "non-negotiable event of this frame",
      "allowed_variation_axes": ["camera angle", "framing", "lens", "composition", "camera distance"]
    }
  ]
}

The storyboard must be practical for image generation and later animation.
Each image prompt must be English, detailed, cinematic, 9:16 friendly, no subtitles, no UI, no watermark.
Each video prompt must be English and include physical realism, camera movement, character micro-motion, environmental motion, SFX.
Do not include graphic gore. Use non-exploitative framing.

USER SCENARIO:
${script}
`;
  const content = await callOpenRouter({
    messages: [
      { role: "system", content: DIRECTOR_SYSTEM_RULES },
      { role: "user", content: prompt }
    ],
    temperature: 0.35,
    max_tokens: 12000
  });
  return safeJsonParse(content);
}

export async function generateExplorePrompt({ frame, projectType = "film", stylePreset = "cinematic_realism" }) {
  const style = STYLE_PRESETS?.[projectType]?.styles?.[stylePreset] || STYLE_PRESETS.film.styles.cinematic_realism;
  const prompt = `
Return JSON only:
{
  "prompt": "full English prompt for image model"
}

Create a 2x2 cinematic variation grid prompt for the EXACT SAME FRAME.

FRAME LOCK:
${JSON.stringify(frame, null, 2)}

STYLE LOCK:
${style}

Rules:
- 4 variations of the same moment only
- do not change story event, character, clothing, location, time, emotion
- change only camera angle, lens, framing, composition, camera distance, depth of field
- Variation A: extreme close-up emotional lock
- Variation B: low ground angle texture and weight
- Variation C: wide environmental spatial story
- Variation D: over-shoulder or obstructed layered depth
- output single image, 2x2 grid, no text, no UI, no subtitles, no watermark
`;
  const content = await callOpenRouter({
    messages: [
      { role: "system", content: DIRECTOR_SYSTEM_RULES },
      { role: "user", content: prompt }
    ],
    temperature: 0.25,
    max_tokens: 4000
  });
  return safeJsonParse(content);
}

export async function analyzeImageForVideo({ imageDataUrl, frame, selectedVariant = "A" }) {
  const text = `
Analyze the uploaded image as the selected locked frame variant ${selectedVariant}.
Preserve the user's scenario and frame lock. Extract visual DNA and convert it into production-ready video prompt options.
Return JSON only:
{
  "visual_dna": {
    "character": "exact visible identity",
    "wardrobe": "visible clothing",
    "camera": "angle, distance, lens feel",
    "composition": "framing and depth",
    "lighting": "light direction and quality",
    "environment": "location and atmosphere",
    "emotion": "performance state"
  },
  "video_options": [
    {
      "name_ru": "Вариант 1",
      "intent_ru": "what this animation emphasizes",
      "video_prompt_en": "ANIMATE CURRENT LOCKED FRAME: ... SFX: ..."
    },
    {
      "name_ru": "Вариант 2",
      "intent_ru": "what this animation emphasizes",
      "video_prompt_en": "ANIMATE CURRENT LOCKED FRAME: ... SFX: ..."
    },
    {
      "name_ru": "Вариант 3",
      "intent_ru": "what this animation emphasizes",
      "video_prompt_en": "ANIMATE CURRENT LOCKED FRAME: ... SFX: ..."
    }
  ]
}

FRAME LOCK:
${JSON.stringify(frame, null, 2)}

Never change the scenario. Animate only what is already implied by the frame and the scenario.
`;
  const content = await callOpenRouter({
    messages: [
      { role: "system", content: DIRECTOR_SYSTEM_RULES },
      { role: "user", content: [
        { type: "text", text },
        { type: "image_url", image_url: { url: imageDataUrl } }
      ] }
    ],
    temperature: 0.25,
    max_tokens: 6000
  });
  return safeJsonParse(content);
}

export async function generateVideoPrompt({ frame, visualDna, selectedVariant = "A" }) {
  const prompt = `
Return JSON only:
{
  "video_prompt_en": "ANIMATE CURRENT LOCKED FRAME: ... SFX: ...",
  "sfx": "comma separated SFX",
  "copy_block_ru": "short Russian summary for user"
}

Build one final production video prompt from this locked frame and image analysis.

FRAME LOCK:
${JSON.stringify(frame, null, 2)}

SELECTED VARIANT:
${selectedVariant}

VISUAL DNA:
${JSON.stringify(visualDna || {}, null, 2)}

Rules:
- do not change story, identity, wardrobe, location, timeline or emotion
- preserve exact frame composition unless camera movement requires subtle motion
- add realistic micro-movement, camera movement, atmosphere, material response
- include SFX inside the video prompt
- no subtitles, no UI, no watermark
`;
  const content = await callOpenRouter({
    messages: [
      { role: "system", content: DIRECTOR_SYSTEM_RULES },
      { role: "user", content: prompt }
    ],
    temperature: 0.25,
    max_tokens: 4000
  });
  return safeJsonParse(content);
}

export function build2KPrompt({ frame, selectedVariant = "A", projectType = "film", stylePreset = "cinematic_realism" }) {
  const style = STYLE_PRESETS?.[projectType]?.styles?.[stylePreset] || STYLE_PRESETS.film.styles.cinematic_realism;
  return `HIGH QUALITY 2K SINGLE FRAME REGENERATION\n\nRecreate the selected storyboard variation as one clean final frame.\n\nSELECTED VARIANT: ${selectedVariant}\n\nFRAME LOCK:\n${frame?.image_prompt_en || frame?.description_ru || "Selected frame"}\n\nSTRICT CONTINUITY:\n- preserve the exact story action\n- preserve character identity, wardrobe, location, time of day, emotional tone\n- do not add new characters or props\n- do not change the scenario\n\nSTYLE LOCK:\n${style}\n\nQUALITY:\n2K, cinematic detail, natural imperfections, realistic textures, grounded physical realism, no text, no UI, no subtitles, no watermark`;
}
