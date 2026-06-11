import { callOpenRouter, TASK_TYPES } from "../../../../lib/modelRouter";
import { requireOpenRouterAccess, guardErrorJson } from "../../../../lib/apiAccess";
import { logUsageFromGuard, usageMeta } from "../../../../lib/usageLogger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are NeuroCine Production Bible Extractor for trailer / short-film storyboards.
Return ONLY valid JSON. No markdown. No explanation.

Your job:
- scan the full current script, not cached projects;
- extract every recurring human, animal/creature, and essential location needed for visual continuity;
- animals are character refs too;
- do not collapse named people or animals into "main character";
- output generator-ready English locks and reference prompts;
- Russian is allowed only for proper names and exact dialogue/source snippets.`;

function cleanText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function safeJsonParse(raw = "") {
  const text = String(raw || "").trim();
  if (!text) throw new Error("empty JSON");
  try { return JSON.parse(text); } catch {}
  const fenced = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try { return JSON.parse(fenced); } catch {}
  const first = fenced.indexOf("{");
  const last = fenced.lastIndexOf("}");
  if (first >= 0 && last > first) return JSON.parse(fenced.slice(first, last + 1));
  throw new Error("invalid JSON");
}

function isAnimalItem(item = {}) {
  const value = cleanText([item.kind, item.name, item.role, item.identity, item.sourceContext].join(" ")).toLowerCase();
  return /animal|dog|puppy|wolf|cub|moose|calf|deer|bear|horse|п[её]с|собак|щен|волч|лос|лос[её]нок|лосиха|животн/.test(value);
}

function characterReferencePrompt(item = {}, styleLock = "") {
  const name = cleanText(item.name || item.id || "character");
  const role = cleanText(item.role || "recurring scripted character");
  const identity = cleanText(item.identity || "stable identity inferred only from the script");
  const wardrobe = cleanText(item.wardrobe || (isAnimalItem(item) ? "no clothing unless scripted" : "script-supported wardrobe only"));
  const source = cleanText(item.sourceContext || "current script");
  if (isAnimalItem(item)) {
    return cleanText(`Create one wide 16:9 photoreal production character bible sheet for the same trailer, not a story frame. Use one single animal only, repeated across controlled reference panels with the same species, age impression, body size, fur/skin pattern, muzzle shape, eye color, ear shape, limb/body condition and silhouette in every panel. Required visual sections arranged like a professional reference board, but without readable labels: top row turnarounds: front view, 3/4 view, side profile, back view; middle row emotion/state heads: panic, exhaustion, alert eye contact, recovery or fear only if scripted; lower row scenario poses from this script; bottom detail strip: fur/skin pattern, eyes, ears, paws/limbs, body condition, color/material swatches from the animal and environment. Character: ${name}. Role: ${role}. Source context: ${source}. Identity lock: ${identity}. Physical condition must stay unchanged across all panels. Style: ${styleLock || "photoreal cinematic documentary"}. No labels, no readable text, no UI, no watermark, no different animals, no fantasy redesign, no extra characters, no new location.`);
  }
  return cleanText(`Create one wide 16:9 photoreal production character bible sheet for the same trailer, not a story frame. Use one single actor only, repeated across controlled reference panels with the same face, skull shape, hair, age impression, body type, skin texture, hands, wardrobe, shoes, silhouette and color palette in every panel. Required visual sections arranged like a professional reference board, but without readable labels: top row turnarounds: front view, 3/4 view, side profile, back view; middle row emotion heads from this script; lower row scenario poses from this script; bottom detail strip: face, eyes, hands, wardrobe fabric, shoes, silhouette, small wardrobe/color swatches from first appearance. Character: ${name}. Role: ${role}. Source context: ${source}. Identity lock: ${identity}. Wardrobe lock: ${wardrobe}. Style: ${styleLock || "photoreal cinematic documentary"}. No labels, no readable text, no UI, no watermark, no different people, no costume drift, no extra props beyond script.`);
}

function locationReferencePrompt(item = {}, styleLock = "") {
  const name = cleanText(item.name || item.id || "scripted location");
  const description = cleanText(item.description || "script-supported location design only");
  const materials = cleanText(item.materials || "only materials named or implied by the script");
  const lighting = cleanText(item.lighting || "practical lighting physically supported by the script");
  const source = cleanText(item.sourceContext || "current script");
  return cleanText(`Create one wide 16:9 photoreal production design bible board for the same film location, not a story frame. Use controlled panels without readable labels: establishing wide view, threshold/entry view, primary action lane, material close-ups, practical light state, key scripted props only if they belong to this location, and a small color/material swatch strip. No actors and no animals unless the location itself requires scale and the script explicitly implies it. Location: ${name}. Source context: ${source}. Geography/design: ${description}. Materials: ${materials}. Lighting: ${lighting}. Style: ${styleLock || "photoreal cinematic documentary"}. No readable labels, no captions, no UI, no watermark, no unrelated rooms, no cars, no extra props beyond script.`);
}

function normalizeBible(parsed = {}, { styleLock = "", styleLabel = "" } = {}) {
  const source = parsed.bible || parsed.production_bible || parsed;
  const rawCharacters = Array.isArray(source.characters) ? source.characters : Array.isArray(source.cast) ? source.cast : [];
  const rawLocations = Array.isArray(source.locations) ? source.locations : [];

  const characters = rawCharacters
    .filter((item) => item && typeof item === "object" && cleanText(item.name || item.role || item.identity || item.sourceContext))
    .slice(0, 5)
    .map((item, index) => {
      const next = {
        id: item.id || `CHAR_${String(index + 1).padStart(2, "0")}`,
        kind: item.kind || (isAnimalItem(item) ? "animal" : "human"),
        name: cleanText(item.name || `Character ${index + 1}`),
        role: cleanText(item.role || "recurring scripted character"),
        identity: cleanText(item.identity || item.visual_identity || "stable face/body/physical identity extracted from the current script only"),
        wardrobe: cleanText(item.wardrobe || (isAnimalItem(item) ? "no clothing; preserve natural body/fur/physical condition exactly as scripted" : "script-supported wardrobe only; no costume drift")),
        negative: cleanText(item.negative || item.forbidden || "no different identity, no age drift, no face/body redesign, no wardrobe drift, no unscripted costume, no extra characters"),
        sourceContext: cleanText(item.sourceContext || item.source_context || item.script_evidence || ""),
        referencePrompt: cleanText(item.referencePrompt || item.reference_prompt_en || ""),
        reference: "",
        referenceName: "",
      };
      if (!next.referencePrompt) next.referencePrompt = characterReferencePrompt(next, styleLock);
      return next;
    });

  const locations = rawLocations
    .filter((item) => item && typeof item === "object" && cleanText(item.name || item.description || item.sourceContext))
    .slice(0, 3)
    .map((item, index) => {
      const next = {
        id: item.id || `LOC_${String(index + 1).padStart(2, "0")}`,
        name: cleanText(item.name || `Location ${index + 1}`),
        description: cleanText(item.description || "script-supported geography only"),
        materials: cleanText(item.materials || "script-supported materials and practical props only"),
        lighting: cleanText(item.lighting || "practical lighting physically supported by the script"),
        negative: cleanText(item.negative || item.forbidden || "no unrelated location, no new room, no era drift, no extra props beyond script"),
        sourceContext: cleanText(item.sourceContext || item.source_context || item.script_evidence || ""),
        referencePrompt: cleanText(item.referencePrompt || item.reference_prompt_en || ""),
        reference: "",
        referenceName: "",
      };
      if (!next.referencePrompt) next.referencePrompt = locationReferencePrompt(next, styleLock);
      return next;
    });

  return {
    enabled: true,
    autoGenerated: true,
    extractionMode: "ai",
    characters,
    locations,
    style: {
      lock: cleanText(source.style?.lock || styleLock),
      label: cleanText(styleLabel || source.style?.label || ""),
      negative: cleanText(source.style?.negative || "no style drift, no palette drift, no glamour lighting, no CGI, no illustration, no unrelated props from style text"),
      referencePrompt: cleanText(source.style?.referencePrompt || source.style?.reference_prompt_en || ""),
      reference: "",
      referenceName: "",
    },
    analysis_notes: Array.isArray(source.analysis_notes) ? source.analysis_notes.map(cleanText).filter(Boolean).slice(0, 8) : [],
  };
}

function buildPrompt({ topic, script, styleLabel, styleLock, target, frameCount, duration }) {
  return JSON.stringify({
    task: "Extract production bible for a trailer storyboard and local reference generation.",
    project_topic: topic,
    target_video_model: target || "grok",
    duration_seconds: duration || null,
    target_frame_count: frameCount || null,
    selected_style: {
      label: styleLabel || "",
      lock: styleLock || "",
    },
    hard_rules: [
      "Analyze the CURRENT script only. Ignore previous projects and cached names.",
      "Extract all recurring named humans, named animals, central animals, victims if visually important, and antagonists.",
      "Animals must be returned in characters with kind='animal'.",
      "Do not collapse multiple entities into one generic main character.",
      "If the script has two rescuers and an animal, return all of them as separate refs.",
      "If the script has a parent animal/mother animal that appears as a recurring visual force, return it too.",
      "Locations may be grouped only when they are one continuous geography with subzones; otherwise split them.",
      "All identity, wardrobe, location, negative and referencePrompt fields must be in English. Proper names may stay Russian.",
      "Reference prompts are not scene prompts. They are identity/location anchor sheets for later IPAdapter/ComfyUI usage.",
      "Never invent extra characters, doctors, police, cars, rooms, weapons or supernatural rules not in the script.",
    ],
    output_schema: {
      characters: [
        {
          id: "CHAR_01",
          kind: "human | animal",
          name: "proper/current-script name",
          role: "short role",
          identity: "English visual identity lock",
          wardrobe: "English wardrobe/body lock; for animals preserve fur/body/physical condition",
          negative: "English forbidden changes",
          sourceContext: "short exact evidence from current script",
          referencePrompt: "English wide 16:9 production character/animal bible sheet prompt with turnarounds, emotions, scenario poses, detail strip and swatches; no readable labels",
        },
      ],
      locations: [
        {
          id: "LOC_01",
          name: "location name",
          description: "English geography/design lock",
          materials: "English material/prop lock",
          lighting: "English lighting lock",
          negative: "English forbidden changes",
          sourceContext: "short evidence from current script",
          referencePrompt: "English wide 16:9 production design bible board prompt with establishing, threshold, action lane, material/light/prop panels and swatches; no readable labels",
        },
      ],
      style: {
        lock: "English style continuity lock compatible with selected style and script",
        negative: "English style forbidden list",
        referencePrompt: "optional English style reference prompt",
      },
      analysis_notes: ["short notes on what was extracted and why"],
    },
    script,
  }, null, 2);
}

export async function POST(req) {
  const started = Date.now();
  let body = {};
  try {
    body = await req.json().catch(() => ({}));
    const guard = await requireOpenRouterAccess(req);
    if (!guard.ok) return guardErrorJson(guard);

    const script = cleanText(body.script || "");
    const topic = cleanText(body.topic || body.project_name || "");
    if (script.length < 20 && topic.length < 3) {
      return Response.json({ ok: false, error: "Нужен сценарий или тема для AI-разбора библии." }, { status: 400 });
    }

    const userMessage = buildPrompt({
      topic,
      script: script || topic,
      styleLabel: body.style_label || body.style || "",
      styleLock: body.style_lock || "",
      target: body.target,
      frameCount: body.frame_count,
      duration: body.duration,
    });

    const result = await callOpenRouter({
      taskType: TASK_TYPES.STORYBOARD_GENERATION,
      systemPrompt: SYSTEM_PROMPT,
      userMessage,
      temperatureOverride: 0.16,
      maxTokensOverride: 6500,
      responseFormat: { type: "json_object" },
      appTitle: "NeuroCine Trailer Bible Extractor",
      apiKeyOverride: guard.apiKey,
    });

    if (!result.ok) {
      await logUsageFromGuard(guard, {
        req,
        endpoint: "/api/trailer/bible",
        success: false,
        modelUsed: result.model_used,
        error: result.error,
        durationMs: Date.now() - started,
        metadata: usageMeta(body),
      });
      return Response.json({ ok: false, error: result.error || "AI-разбор библии не удался", model_used: result.model_used }, { status: 500 });
    }

    let parsed;
    try {
      parsed = safeJsonParse(result.content);
    } catch (e) {
      await logUsageFromGuard(guard, {
        req,
        endpoint: "/api/trailer/bible",
        success: false,
        modelUsed: result.model_used,
        error: "Invalid JSON: " + e.message,
        durationMs: Date.now() - started,
        metadata: usageMeta(body),
      });
      return Response.json({ ok: false, error: "AI вернул невалидный JSON библии: " + e.message, raw: result.content?.slice(0, 1000), model_used: result.model_used }, { status: 500 });
    }

    const bible = normalizeBible(parsed, {
      styleLock: body.style_lock || "",
      styleLabel: body.style_label || body.style || "",
    });

    await logUsageFromGuard(guard, {
      req,
      endpoint: "/api/trailer/bible",
      success: true,
      modelUsed: result.model_used,
      durationMs: Date.now() - started,
      metadata: usageMeta(body, { characters: bible.characters.length, locations: bible.locations.length }),
    });

    return Response.json({
      ok: true,
      mode: "ai",
      model_used: result.model_used,
      bible,
      counts: {
        characters: bible.characters.length,
        locations: bible.locations.length,
      },
      analysis_notes: bible.analysis_notes,
    });
  } catch (e) {
    return Response.json({ ok: false, error: e.message || "Trailer bible extraction error" }, { status: 500 });
  }
}
