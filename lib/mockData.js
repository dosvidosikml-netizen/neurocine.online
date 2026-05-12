export const MOCK_SCRIPT_RU = `За несколько секунд тайга легла на землю, как скошенная трава. И никто до сих пор не может честно сказать, что взорвалось над Сибирью.

Удар был такой силы, что окна выбило за сотни километров. Люди проснулись от белой вспышки, будто солнце упало прямо в печную трубу. Земля качнулась. Небо горело.

Охотники потом шли через мёртвый лес, где стволы лежали радиальными полосами, как спички после удара кулаком. А в центре их ждал странный круг: деревья стояли без веток, голые, будто их обожгло изнутри.

Но самое жуткое пришло потом. Экспедицию отправили только через 19 лет. Слишком поздно.

Ни воронки. Ни осколков. Ничего.

Если завтра такой свет вспыхнет над твоим городом, ты поверишь в официальное объяснение сразу?`;

const CONTINUITY_LINE = "CHARACTER CONTINUITY: maintain the same character identity, wardrobe, facial features, body proportions, lighting language, lens style, color grade and cinematic world across every frame.";

export function detectTheme(input = "") {
  const t = String(input || "").toLowerCase();
  if (/рим|терм|бан|вод|гряз|антич|римлян/i.test(t)) return "roman_baths";
  if (/чума|эпидем|болез|зараз|карантин|plague/i.test(t)) return "plague";
  if (/убий|маньяк|дело|улика|свидетел|преступ|true crime|crime/i.test(t)) return "crime";
  if (/сибир|тунгус|взрыв|метеор|тайг/i.test(t)) return "tunguska";
  return "generic";
}

function buildThemeCover(theme, topic = "") {
  switch (theme) {
    case "roman_baths":
      return { style: "ancient_rome_dark", main_title: "РИМСКИЕ ТЕРМЫ\nБЫЛИ ЛОВУШКОЙ?", side_facts: ["ВОДУ НЕ МЕНЯЛИ НЕДЕЛЯМИ", "ТЫСЯЧИ ЛЮДЕЙ В ОДНОМ БАССЕЙНЕ", "ГРЯЗЬ СМЫВАЛАСЬ ОБРАТНО"], bottom_hook: "ТЫ БЫ ТУДА ВОШЁЛ?", psychology: ["телесный дискомфорт", "разрушение романтизированного образа"], angle: "Ancient Rome hygiene horror" };
    case "crime":
      return { style: "truecrime", main_title: "ЧТО СКРЫЛИ\nВ ДЕЛЕ?", side_facts: ["УЛИКА ИСЧЕЗЛА", "СВИДЕТЕЛЬ МОЛЧАЛ", "ПОЛИЦИЯ ОШИБЛАСЬ?"], bottom_hook: "ЭТО БЫЛ НЕСЧАСТНЫЙ СЛУЧАЙ?", psychology: ["тайна без ответа", "запретная версия"], angle: "True crime viral Netflix framing" };
    case "tunguska":
      return { style: "conspiracy_documentary", main_title: "ЧТО ВЗОРВАЛОСЬ\nНАД СИБИРЬЮ?", side_facts: ["ОКНА ВЫБИЛО ЗА СОТНИ КМ", "ЭКСПЕДИЦИЯ ЧЕРЕЗ 19 ЛЕТ", "НИ ВОРОНКИ. НИ ОСКОЛКОВ"], bottom_hook: "ЭТО БЫЛ НЕ МЕТЕОРИТ?", psychology: ["тайна без ответа", "масштаб катастрофы"], angle: "Siberian anomaly" };
    default:
      return { style: "viral_documentary", main_title: String(topic || "НЕИЗВЕСТНАЯ ИСТОРИЯ").slice(0, 40).toUpperCase(), side_facts: ["СКРЫТЫЙ ИСТОРИЧЕСКИЙ ФАКТ", "НЕОЖИДАННАЯ ПРАВДА"], bottom_hook: "ТЫ ОБ ЭТОМ ЗНАЛ?", psychology: ["историческое удивление"], angle: "Generic viral documentary" };
  }
}

function buildVisualExplainer(theme, topic = "") {
  return { title: topic || "Исторический разбор", dna: `${theme}_explainer`, overlays: ["Timeline Overlay", "Map Breakdown", "Visual Comparison"], prompt: `Create cinematic vertical documentary explainer for ${topic}. 9:16, detailed overlays, dark UI.` };
}

export function buildMockScript(topic = "") {
  const t = String(topic || "неизвестная историческая тайна").trim();
  return `Ты бы не поверил, но ${t}. Сначала это звучит как странная деталь из учебника. Но чем глубже смотришь, тем сильнее ощущение: эта история была опаснее, чем нам рассказывали. И самый жуткий факт здесь не в легенде. Он в том, что для людей прошлого это было нормой. Каждый день. Без выбора.`;
}

function splitVo(script = "", frameCount = 10) {
  const clean = String(script || MOCK_SCRIPT_RU).replace(/\s+/g, " ").trim();
  const sentences = clean.match(/[^.!?…]+[.!?…]?/g)?.map((s) => s.trim()).filter(Boolean) || [clean];
  return Array.from({ length: frameCount }, (_, i) => sentences[i % sentences.length] || clean.slice(0, 120));
}

function visualBeat(theme, frameNum) {
  if (theme === "roman_baths") {
    const beats = ["crowded Ancient Roman bathhouse entrance with humid steam and torchlight", "wide view of a Roman hot pool packed with people and marble arches", "close-up of murky bath water with oil sheen and historical texture", "Roman bath attendant with strigil and stone basin", "documentary diagram of bathhouse water channels", "claustrophobic steam room with silhouettes", "wet stone floor with footprints and sandals", "elite Roman citizens in a crowded bath hall", "torch reflection over dark pool surface", "empty bathhouse at night with dripping water"];
    return beats[(frameNum - 1) % beats.length];
  }
  if (theme === "tunguska") {
    const beats = ["Siberian forest before dawn", "white flash above endless taiga", "shockwave flattening trees", "distant village windows shaking", "burned tree trunks in a silent forest", "expedition crossing dead forest", "empty impact center with no crater", "map overlay of blast radius", "scientist field notebook close-up", "ominous sky over taiga at dusk"];
    return beats[(frameNum - 1) % beats.length];
  }
  return `cinematic documentary scene ${frameNum}`;
}

export function buildMockStoryboard({ topic = "", script = "", duration = 30, aspectRatio = "9:16", stylePreset = "cinematic", target = "veo3" } = {}) {
  const frameCount = Math.max(1, Math.round(Number(duration || 30) / 3));
  const theme = detectTheme(`${topic}\n${script}`);
  const vo = splitVo(script || topic || MOCK_SCRIPT_RU, frameCount);
  const scenes = Array.from({ length: frameCount }, (_, idx) => {
    const n = idx + 1;
    return {
      id: `frame_${String(n).padStart(2, "0")}`,
      start: idx * 3,
      end: idx * 3 + 3,
      vo_ru: vo[idx],
      image_prompt_en: `SCENE PRIMARY FOCUS: ${visualBeat(theme, n)}. Vertical ${aspectRatio}, ${stylePreset} documentary realism, coherent lighting, no text, no UI.`,
      video_prompt_en: `ANIMATE CURRENT FRAME: slow cinematic push-in, subtle handheld micro-movement, atmospheric depth, preserve exact visual composition. ${CONTINUITY_LINE} SFX: low room tone, restrained cinematic tension.`,
      sfx: "low room tone, restrained cinematic tension"
    };
  });
  return { project_name: topic || "NeuroCine Project", aspect_ratio: aspectRatio, duration_sec: Number(duration || 30), target, global_style_lock: `${stylePreset} documentary realism, consistent color grade, consistent lens language`, character_lock: [{ name: "visual_world", description: "Keep same cinematic world, era, materials, lighting and camera language across frames." }], scenes };
}

export function buildMockCoverPack({ topic = "", script = "" } = {}) {
  const theme = detectTheme(`${topic}\n${script}`);
  const cover = buildThemeCover(theme, topic);
  const explainer = buildVisualExplainer(theme, topic);
  return { theme, topic, style: cover.style, main_title: cover.main_title, side_facts: cover.side_facts, bottom_hook: cover.bottom_hook, psychology: cover.psychology, angle: cover.angle, visual_explainer: explainer };
}

export function buildMockSocialPack(payload = {}) {
  return { hooks: ["Ты бы рискнул зайти туда?", "Об этом молчали десятилетиями", "История оказалась хуже легенды"], captions: [`История: ${payload?.topic || "тайна прошлого"}`, "Сохрани чтобы не забыть"], hashtags: ["#history", "#documentary", "#viral"] };
}

export function buildMockSeoPack(payload = {}) {
  return { title: payload?.topic || "NeuroCine Documentary", description: `Cinematic documentary about ${payload?.topic || "historical mystery"}`, keywords: ["history", "documentary", "viral", "cinematic"] };
}

export function buildMockVideoPrompt(payload = {}) {
  return { master_prompt: `Create cinematic 9:16 documentary video about ${payload?.topic || "historical mystery"}, atmospheric lighting, realistic textures, dramatic camera movement. ${CONTINUITY_LINE}` };
}
