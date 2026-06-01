// app/api/tts-studio/route.js
// NeuroCine TTS Studio v1
// Auto-выбор Google AI Studio голоса + 3 формата скрипта (Google AI / ElevenLabs / Чистый).
// Не озвучивает! Готовит промт для копирования в aistudio.google.com.

import { callOpenRouter, TASK_TYPES } from "../../../lib/modelRouter";
import { requireOpenRouterAccess, guardErrorJson } from "../../../lib/apiAccess";
import { logUsageFromGuard, usageMeta } from "../../../lib/usageLogger";
import { buildScenarioContext } from "../../../lib/scenarioContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GOOGLE_VOICES = [
  { id: "Algenib",  desc: "Gravelly · Lower pitch",         best: ["ИСТОРИЯ","ВОЙНА","КРИМИНАЛ"] },
  { id: "Algieba",  desc: "Smooth · Lower pitch",            best: ["ТАЙНА","ПСИХОЛОГИЯ","ЗАГАДКИ"] },
  { id: "Alnilam",  desc: "Firm · Lower middle pitch",       best: ["НАУКА","ИСТОРИЯ"] },
  { id: "Charon",   desc: "Informative · Lower pitch",       best: ["НАУКА","ВОЙНА","ИСТОРИЯ"] },
  { id: "Iapetus",  desc: "Calm · Lower middle pitch",       best: ["ПСИХОЛОГИЯ","ТАЙНА","ПРИРОДА"] },
  { id: "Orus",     desc: "Firm · Lower middle pitch",       best: ["КРИМИНАЛ","ЗАГАДКИ"] },
  { id: "Kore",     desc: "Firm · Middle pitch",             best: ["ПСИХОЛОГИЯ","ТАЙНА"] },
  { id: "Fenrir",   desc: "Excitable · Lower middle pitch",  best: ["ЗАГАДКИ","КРИМИНАЛ"] },
  { id: "Aoede",    desc: "Breezy · Middle pitch",           best: ["ПРИРОДА"] },
  { id: "Sulafat",  desc: "Warm · Higher middle pitch",      best: ["ПРИРОДА","ПСИХОЛОГИЯ"] },
  { id: "Autonoe",  desc: "Bright · Middle pitch",           best: ["НАУКА"] },
  { id: "Achird",   desc: "Friendly · Lower middle pitch",   best: [] },
  { id: "Puck",     desc: "Upbeat · Middle pitch",           best: [] },
];

const SYS = (voiceList) => `You are a PRO TTS Director. Output ONLY valid JSON (no markdown, no text outside JSON):
{
  "scene": "Short location/atmosphere for TTS booth — 5-8 words, English. Examples: The Dark History Vault. / Underground Interrogation Room.",
  "context": "Directing note — pacing and emotional arc in English, 1-2 sentences.",
  "voice_id": "Pick the single best voice ID from: ${voiceList}. Match to the genre, visual style and the storyboard emotional arc described in SCENARIO CONTEXT.",
  "voice_reason": "1 sentence in Russian why this voice fits this specific content.",
  "script_google": "Rewrite the FULL script with Google AI Studio emotion tags. Available: [intrigue] [desire] [shock] [information] [inspiration] [confident] [sad] [whisper] [aggressive] [calm]. Tag every 1-3 sentences. Preserve EXACT original language. Do NOT cut or summarize.",
  "script_elevenlabs": "Rewrite the FULL script with ElevenLabs SSML-style tags. Use: <break time='0.5s'/>, <prosody rate='slow'>, <emphasis level='strong'>. Preserve ALL original text.",
  "script_clean": "The FULL script completely clean — no tags, no markdown, no brackets. Preserve ALL original text word for word.",
  "pacing_tips": "3 short Russian tips for recording this specific script."
}`;

export async function POST(req) {
  try {
    const body = await req.json();
    const accessGuard = await requireOpenRouterAccess(req);
    if (!accessGuard.ok) return guardErrorJson(accessGuard);
    const script = String(body.script || "").trim();
    const genre = String(body.genre || "ИСТОРИЯ").trim();
    const topic = String(body.topic || "").trim();
    const storyboard = body.storyboard || null;
    const styleProfile = body.styleProfile || body.style_profile || null;
    const scenarioCtx = buildScenarioContext({ topic, script, genre, storyboard, styleProfile });
    if (!script || script.length < 20) return Response.json({ error: "Сценарий слишком короткий" }, { status: 400 });

    const voiceList = GOOGLE_VOICES.map(v => `${v.id} (${v.desc})`).join(", ");
    const r = await callOpenRouter({
      taskType: TASK_TYPES.SCRIPT_WRITING,
      systemPrompt: SYS(voiceList),
      userMessage: `${scenarioCtx.contextBlock}\n\nСценарий:\n${script}`,
      maxTokensOverride: 4500,
      responseFormat: { type: "json_object" },
      apiKeyOverride: accessGuard.apiKey,
      appTitle: "NeuroCine TTS Studio v1",
    });
    if (!r.ok) {
      await logUsageFromGuard(accessGuard, { req, endpoint: "/api/tts-studio", success: false, modelUsed: r.model_used, error: r.error, metadata: usageMeta(body) });
      return Response.json({ error: r.error }, { status: 500 });
    }

    let parsed;
    try {
      const c = String(r.content || "").trim().replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/```\s*$/i,"").trim();
      parsed = JSON.parse(c);
    } catch (e) { return Response.json({ error: "Невалидный JSON: " + e.message, raw: r.content?.slice(0,500) }, { status: 500 }); }

    const sv = GOOGLE_VOICES.find(v => v.id === parsed.voice_id);
    if (sv) parsed.voice_desc = sv.desc;
    await logUsageFromGuard(accessGuard, { req, endpoint: "/api/tts-studio", success: true, modelUsed: r.model_used, metadata: usageMeta(body) });
    return Response.json({ ttsStudio: parsed, voices: GOOGLE_VOICES, model_used: r.model_used });
  } catch (e) { return Response.json({ error: e.message }, { status: 500 }); }
}
