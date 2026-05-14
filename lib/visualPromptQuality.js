// lib/visualPromptQuality.js
// NeuroCine Visual Prompt Quality Lock v1
// Runtime hardening for Frame Grid / Flow Compact prompts.

export const RAW_VISUAL_STYLE_LOCK = `STYLE LOCK:
RAW cinematic documentary photorealism, camera-photographed live-action film stills, unretouched human faces, high micro-contrast, deeper natural blacks, tactile documentary texture, harsh dry daylight filtered through dust or smoke, strong natural bounce from stone/walls, realistic sweat and dust, uneven skin texture, cracked lips, under-eye redness, tear residue mixed with dirt, dirt embedded in pores, rough fabric fibers, dirty fingernails, non-glamorous human fatigue, slight facial asymmetry, lived-in physical exhaustion, emotionally harsh faces, nervous hands, imperfect posture, subtle 35mm film grain. No beauty retouching, no plastic skin, no wax face, no porcelain skin, no fashion editorial smoothness. Not illustration, not painting, not concept art, not parchment, not fantasy art.`;

export const RAW_VISUAL_REALISM_LOCK = `CHARACTER / SKIN REALISM LOCK:
Characters must feel painfully alive, not model-like or AI-smooth. Preserve identity, but add documentary imperfections: uneven pores, dry skin flakes, under-eye puffiness, asymmetry, grime in nail beds, frayed cloth threads, sweat sheen, dust stuck to skin, irregular tear tracks, tired mouth tension, breath-heavy bodies. Avoid mannequin faces, beauty lighting, plastic skin, waxy faces, clean fashion posing and sterile costume-drama polish.`;

export const RAW_VISUAL_LIGHT_LOCK = `LIGHT / COLOR LOCK:
Use dusty earth tones, restrained saturation, subtle warmth in highlights, deeper shadow pockets, realistic skin sheen, stronger local contrast and readable texture in both highlights and shadows. Avoid milky lifted blacks, flat beige haze, overly soft overcast light, pastel fashion color, clean studio lighting and glamour lighting.`;

export const RAW_VISUAL_NEGATIVE_LOCK = `RAW REALISM NEGATIVE LOCK:
NO beauty retouching, NO plastic skin, NO waxy face, NO porcelain skin, NO airbrushed face, NO fashion model posing, NO sterile costume drama, NO flat milky contrast, NO lifted black fashion grade, NO glossy editorial lighting, NO mannequin expressions.`;

function looksLikeGridPrompt(text = "") {
  const t = String(text || "");
  return /STORYBOARD GRID PART|FRAME GRID PROMPT|Generate exactly \d+ live-action cinematic frames|clean \d+×\d+ grid/i.test(t);
}

function replaceStyleLock(text = "") {
  const raw = String(text || "");
  if (/RAW cinematic documentary photorealism|RAW PHOTOREALISM LOCK|CHARACTER \/ SKIN REALISM LOCK/i.test(raw)) return raw;

  let out = raw;
  out = out
    .replace(/cold overcast light/gi, "harsh dry daylight filtered through dust")
    .replace(/soft ground bounce fill/gi, "strong natural bounce from pale stone with deeper shadow pockets")
    .replace(/lifted blacks/gi, "deeper natural blacks")
    .replace(/natural skin tones/gi, "realistic uneven skin tones with visible redness and fatigue")
    .replace(/Kodak Portra 400/gi, "raw 35mm documentary film grain")
    .replace(/Kodak Vision3 500T film grain/gi, "subtle raw 35mm documentary film grain");

  const styleBlockRe = /STYLE LOCK:\n[\s\S]*?(?=\n\nCONTINUITY:|\n\nCHARACTER LOCK:|\n\nFRAMES:)/i;
  if (styleBlockRe.test(out)) {
    out = out.replace(styleBlockRe, RAW_VISUAL_STYLE_LOCK);
  } else if (/\n\nCONTINUITY:/i.test(out)) {
    out = out.replace(/\n\nCONTINUITY:/i, `\n\n${RAW_VISUAL_STYLE_LOCK}\n\nCONTINUITY:`);
  }

  if (!/CHARACTER \/ SKIN REALISM LOCK/i.test(out)) {
    if (/\n\nCHARACTER LOCK:/i.test(out)) {
      out = out.replace(/\n\nCHARACTER LOCK:/i, `\n\n${RAW_VISUAL_REALISM_LOCK}\n\nCHARACTER LOCK:`);
    } else if (/\n\nFRAMES:/i.test(out)) {
      out = out.replace(/\n\nFRAMES:/i, `\n\n${RAW_VISUAL_REALISM_LOCK}\n\nFRAMES:`);
    }
  }

  if (!/LIGHT \/ COLOR LOCK/i.test(out) && /\n\nFRAMES:/i.test(out)) {
    out = out.replace(/\n\nFRAMES:/i, `\n\n${RAW_VISUAL_LIGHT_LOCK}\n\nFRAMES:`);
  }

  if (!/RAW REALISM NEGATIVE LOCK/i.test(out) && /\n\nFINAL CHECK:/i.test(out)) {
    out = out.replace(/\n\nFINAL CHECK:/i, `\n\n${RAW_VISUAL_NEGATIVE_LOCK}\n\nFINAL CHECK:`);
  }

  return out;
}

export function hardenVisualPrompt(text = "") {
  const value = String(text || "");
  if (!looksLikeGridPrompt(value)) return value;
  return replaceStyleLock(value);
}

export function hardenClipboardText(text = "") {
  return hardenVisualPrompt(text);
}
