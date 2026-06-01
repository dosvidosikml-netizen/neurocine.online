// app/api/music-suno/route.js
// NeuroCine Music Director V2 — production-ready Suno prompt by scenario, mode and storyboard mood.

import { callOpenRouter, TASK_TYPES } from "../../../lib/modelRouter";
import { requireOpenRouterAccess, guardErrorJson } from "../../../lib/apiAccess";
import { logUsageFromGuard, usageMeta } from "../../../lib/usageLogger";
import { buildScenarioContext } from "../../../lib/scenarioContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODE_MAP = {
  cinematic_thriller: "cinematic orchestral thriller, documentary tension, slow dread",
  dark_documentary: "dark documentary score, investigative mystery, restrained tension",
  alien_mystery: "alien mystery, cosmic dread, classified-file atmosphere, eerie pulses",
  historical_horror: "historical horror, primitive drums, low strings, cold ritual atmosphere",
  epic_disaster: "epic disaster score, huge scale, low brass, slow impact build",
};

const SYS = `You are NeuroCine Music Director V2 for Suno AI.
Output ONLY valid JSON. No markdown.

Goal: create a usable instrumental prompt for short documentary / Shorts / Reels production.
The result must NOT feel like generic text. It must include exact mood, instruments, tempo, arc, and usage notes.

Rules:
- English Suno prompt only in music_EN.
- No vocals, no lyrics, no singing unless explicitly requested. Default: instrumental.
- Avoid generic words alone. Use cinematic, physical sound language.
- Fit the script: extract scale, threat, mystery, emotional curve.
- For Suno free style field, include a compact 200-character version.

JSON:
{
  "music_EN": "[Genre: ...], [Mood: ...], [Instruments: ...], [Tempo: ... BPM], [Rhythm: ...], [Arc: ...], [Vibe: instrumental, documentary-like, no vocals]",
  "style_200_EN": "max 200 characters, compact Suno style prompt",
  "negative_EN": "no lyrics, no singing, no bright melodies...",
  "duration_hint": "60s / 90s / 2min / 3min",
  "best_for": "intro / full short / background bed / climax",
  "usage_ru": "коротко: куда вставлять в ролике и как громко держать",
  "notes_ru": "почему этот звук подходит к сценарию"
}`;

export async function POST(req) {
  try {
    const body = await req.json();
    const accessGuard = await requireOpenRouterAccess(req);
    if (!accessGuard.ok) return guardErrorJson(accessGuard);
    const topic = String(body.topic || "").trim();
    const genre = String(body.genre || "").trim();
    const script = String(body.script || "").trim();
    const musicMode = String(body.musicMode || "cinematic_thriller").trim();
    const storyboard = body.storyboard || null;
    const styleProfile = body.styleProfile || body.style_profile || null;
    const scenarioCtx = buildScenarioContext({ topic, script, genre, storyboard, styleProfile });

    const moodHints = storyboard?.scenes?.slice(0, 10).map(s =>
      `${s.beat_type || ""}: ${s.description_ru || s.visual || ""} (sfx: ${s.sfx || ""})`
    ).join("\n") || "";
    const totalDur = storyboard?.total_duration || storyboard?.scenes?.reduce?.((a, s) => a + Number(s.duration || 0), 0) || 60;
    const modeDesc = MODE_MAP[musicMode] || MODE_MAP.cinematic_thriller;

    const userMsg = `Тема: ${topic || "(не задана)"}\nЖанр: ${genre}\nВизуальный стиль: ${[scenarioCtx.styleLabel, scenarioCtx.styleEssence].filter(Boolean).join(" — ") || "(не задан)"}\nДлительность ролика: ${totalDur}с\nМузыкальный режим: ${musicMode} — ${modeDesc}\n\nСценарий:\n${script.slice(0, 5000) || "(не задан)"}\n\nАтмосфера storyboard:\n${moodHints || "(нет storyboard)"}\n\nСобери production-ready Suno instrumental prompt.`;

    const r = await callOpenRouter({
      taskType: TASK_TYPES.LIGHT_TASK,
      systemPrompt: SYS,
      userMessage: userMsg,
      maxTokensOverride: 2200,
      responseFormat: { type: "json_object" },
      apiKeyOverride: accessGuard.apiKey,
      appTitle: "NeuroCine Music Director V2",
    });
    if (!r.ok) {
      await logUsageFromGuard(accessGuard, { req, endpoint: "/api/music-suno", success: false, modelUsed: r.model_used, error: r.error, metadata: usageMeta(body, { musicMode }) });
      return Response.json({ error: r.error }, { status: 500 });
    }

    let parsed;
    try {
      const c = String(r.content || "").trim().replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/```\s*$/i,"").trim();
      parsed = JSON.parse(c);
    } catch (e) { return Response.json({ error: "Невалидный JSON: " + e.message, raw: r.content?.slice(0,500) }, { status: 500 }); }

    await logUsageFromGuard(accessGuard, { req, endpoint: "/api/music-suno", success: true, modelUsed: r.model_used, metadata: usageMeta(body, { musicMode }) });
    return Response.json({ music: parsed, model_used: r.model_used });
  } catch (e) { return Response.json({ error: e.message }, { status: 500 }); }
}
