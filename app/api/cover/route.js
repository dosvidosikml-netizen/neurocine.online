// app/api/cover/route.js
// NeuroCine Cover Director API v3.0
// LOCAL engine: theme detection + visual prompt.
// AI layer: generates varied title / side_facts / bottom_hook on every call.
// Falls back to local engine if no API key or AI fails.

import { buildCoverDirectorPack, detectCoverTheme } from "../../../engine/coverEngine_v28";
import { sanitizeCoverDirectorPack } from "../../../engine/coverDirectorSanitizer";
import { requireSignedInAccess, requireOpenRouterAccess, guardErrorJson } from "../../../lib/apiAccess";
import { callOpenRouter, TASK_TYPES } from "../../../lib/modelRouter";
import { logUsageEvent, usageMeta } from "../../../lib/usageLogger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── Theme descriptions for AI context ────────────────────────────────────────
const THEME_CONTEXT = {
  leper_exile:            "medieval leprosy exile — lepers forced to ring bells, social death while alive, funeral held for the living",
  mourning_ritual:        "professional paid mourning ritual — hired weepers, grief as a business, theatrical sorrow for status",
  cold_war_alert:         "Cold War false nuclear alarm — one Soviet officer refused to launch, minutes from catastrophe",
  permafrost:             "Siberian permafrost — ancient creatures thawing from ice, biological danger returning",
  crime:                  "true crime mystery — hidden evidence, unexpected twist, investigation",
  conspiracy:             "classified conspiracy — redacted documents, hidden truth, government secrets",
  prison:                 "historical prison horror — escape, survival, brutal conditions",
  plague:                 "epidemic / plague — city dying, quarantine, unstoppable disease",
  war:                    "war documentary — battle, sacrifice, impossible decision",
  history:                "historical shock — forgotten truth, brutal past, survival",
  horror:                 "paranormal horror — creature, unexplained fear, darkness",
  science:                "science thriller — experiment gone wrong, forbidden discovery",
  disaster:               "catastrophe — seconds before destruction, ignored warning",
  space_cosmos:           "space / cosmos — isolation, scale of universe, unknown",
  money_power:            "wealth and power — rigged system, hidden elite, financial secrets",
  royalty_empire:         "royalty and empire — betrayal, dynasty collapse, throne",
  cult_ritual:            "cult / ritual — secret society, sacrifice, forbidden ceremony",
  psychology_mind:        "psychology / manipulation — decisions made without awareness, invisible control",
  nature_wild:            "nature / predator — apex hunter, survival, cold calculation",
  social_modern:          "social media manipulation — algorithm control, manufactured trends",
  food_dark:              "dark food secrets — hidden ingredients, manufactured addiction",
  mourning_ritual:        "professional mourning as business — paid weepers, grief performance",
  dream_control_dystopia: "dystopian dream control — forbidden sleep, stolen humanity",
  nazi_alt_history:       "alternate history warning — silent dictatorship, ordinary horror",
  general:                "viral documentary mystery — hidden truth, shocking revelation",
};

const SYSTEM_PROMPT = `You are a viral thumbnail copywriter for Russian YouTube Shorts / Reels / TikTok.
Your job: generate a fresh, varied thumbnail text package based on the script and theme.
Output ONLY valid JSON. No markdown, no preamble, no comments.`;

function buildAIUserPrompt({ topic, script, theme, mode, style }) {
  const themeDesc = THEME_CONTEXT[theme] || "viral documentary";
  const scriptExcerpt = script ? script.slice(0, 600).replace(/\n+/g, " ").trim() : "";
  const modeHint = mode === "extreme" ? "maximum CTR, forbidden-version energy, aggressive"
    : mode === "safe" ? "credible documentary, high curiosity but restrained"
    : "viral curiosity gap, fear/mystery hook, bold but believable";

  return `TOPIC: ${topic || "(none)"}
SCRIPT EXCERPT: ${scriptExcerpt || "(none)"}
THEME: ${theme} — ${themeDesc}
CTR MODE: ${mode} (${modeHint})
STYLE: ${style}

Generate a FRESH viral Russian thumbnail text package. Be creative — do NOT use generic preset phrases.
Extract real specific details from the script to make facts concrete and surprising.

Output ONLY this JSON:
{
  "main_title": "2-4 word Russian title split with \\n (max 2 lines, each line max 20 chars, ALL CAPS)",
  "side_facts": ["FACT 1", "FACT 2", "FACT 3", "FACT 4"],
  "bottom_hook": "SHORT QUESTION OR STATEMENT IN CAPS (3-7 words, ends with ? or !)"
}

RULES:
- main_title: uppercase Russian, split into 2 lines with literal \\n, each line ≤20 chars, dramatic and specific to THIS script
- side_facts: exactly 4 items, uppercase Russian, each ≤42 chars, concrete facts from script NOT generic filler, no scene action descriptions
- bottom_hook: uppercase Russian, 3-7 words, must create curiosity or fear, ends with ? or !
- Every run MUST produce different wording — vary perspective, word choice, emphasis
- Extract SPECIFIC details (numbers, names, actions) from the script when available`;
}

function mergeAIIntoLocalCover(localCover, aiData) {
  if (!aiData || typeof aiData !== "object") return localCover;

  const title = typeof aiData.main_title === "string" && aiData.main_title.trim()
    ? aiData.main_title.trim()
    : localCover.main_title;

  const facts = Array.isArray(aiData.side_facts) && aiData.side_facts.length >= 2
    ? aiData.side_facts.map(f => String(f || "").toUpperCase().trim()).filter(Boolean).slice(0, 4)
    : localCover.side_facts;

  const hook = typeof aiData.bottom_hook === "string" && aiData.bottom_hook.trim()
    ? aiData.bottom_hook.trim().toUpperCase()
    : localCover.bottom_hook;

  // Rebuild variants with new text injected into prompts
  const updatedVariants = (localCover.variants || []).map(v => ({
    ...v,
    prompt_EN: v.prompt_EN
      ? v.prompt_EN
          .replace(
            /ADD EXACT RUSSIAN TOP HEADLINE TEXT:\s*"[^"]*"/i,
            `ADD EXACT RUSSIAN TOP HEADLINE TEXT: "${title.replace(/\n/g, " / ")}"`
          )
          .replace(
            /ADD LEFT-SIDE FACT BLOCKS:[^.]+\./i,
            `ADD LEFT-SIDE FACT BLOCKS: ${facts.map(f => `"${f}"`).join(", ")}.`
          )
          .replace(
            /ADD BOTTOM HOOK \/ RED STAMP TEXT:\s*"[^"]*"/i,
            `ADD BOTTOM HOOK / RED STAMP TEXT: "${hook}"`
          )
          // Also update RUSSIAN TEXT TO EMBED block (v2.9 format)
          .replace(
            /RUSSIAN TEXT TO EMBED:[^.]+\./i,
            `RUSSIAN TEXT TO EMBED: TOP TITLE = "${title.replace(/\n/g, " / ")}". SIDE FACTS = ${facts.map(f => `"${f}"`).join(", ")}. BOTTOM HOOK = "${hook}".`
          )
      : v.prompt_EN,
  }));

  return {
    ...localCover,
    main_title: title,
    side_facts: facts,
    bottom_hook: hook,
    text_layout: {
      ...(localCover.text_layout || {}),
      top_title: title,
      side_facts: facts,
      bottom_hook: hook,
    },
    variants: updatedVariants,
    ai_generated: true,
  };
}

export async function POST(req) {
  try {
    const guard = await requireSignedInAccess(req);
    if (!guard.ok) return guardErrorJson(guard);

    const body = await req.json();
    const topic = String(body.topic || "").trim();
    const script = String(body.script || "").trim();
    const storyboard = body.storyboard || null;
    const mode = String(body.mode || "viral").trim();
    const style = String(body.style || "viral").trim();
    const platform = String(body.platform || "shorts").trim();

    if (!topic && !script && !storyboard?.scenes?.length) {
      return Response.json({ error: "Нужны topic, script или storyboard со сценами" }, { status: 400 });
    }

    // Step 1: Local engine — theme detection, visual prompt, structure
    const rawCover = buildCoverDirectorPack({ topic, script, storyboard, mode, style, platform });
    const localCover = sanitizeCoverDirectorPack(rawCover);

    // Step 2: Try AI for varied title / facts / hook
    let finalCover = localCover;
    let apiSource = "local_engine_v28";
    let modelUsed = "local_cover_engine_v28";

    const accessGuard = await requireOpenRouterAccess(req).catch(() => ({ ok: false }));
    if (accessGuard.ok && accessGuard.apiKey) {
      try {
        const userMessage = buildAIUserPrompt({
          topic, script, theme: localCover.theme, mode, style,
        });

        const result = await callOpenRouter({
          taskType: TASK_TYPES.LIGHT_TASK,
          systemPrompt: SYSTEM_PROMPT,
          userMessage,
          temperatureOverride: 0.85, // high temp = varied output each call
          maxTokensOverride: 400,
          responseFormat: { type: "json_object" },
          appTitle: "NeuroCine Cover Director v3.0",
          apiKeyOverride: accessGuard.apiKey,
        });

        if (result.ok && result.content) {
          const raw = String(result.content).replace(/```json|```/g, "").trim();
          const aiData = JSON.parse(raw);
          finalCover = mergeAIIntoLocalCover(localCover, aiData);
          apiSource = "ai_cover_v3";
          modelUsed = result.model_used || "ai_cover";
        }
      } catch (_) {
        // AI failed — silently use local result
      }
    }

    await logUsageEvent({
      req,
      account: guard.account,
      endpoint: "/api/cover",
      success: true,
      apiSource,
      modelUsed,
      metadata: usageMeta(body, { mode, style, platform, theme: finalCover.theme, source_hash: finalCover.source_hash }),
    });

    return Response.json({
      cover: finalCover,
      mode: apiSource === "ai_cover_v3" ? "cover-director-v3.0-ai" : "cover-director-v2.8-local",
      cache_control: "no-cache",
      access_source: apiSource,
    });
  } catch (e) {
    return Response.json({ error: e.message || "Cover Director error" }, { status: 500 });
  }
}
