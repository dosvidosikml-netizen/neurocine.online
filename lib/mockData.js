export const MOCK_SCRIPT_RU = `За несколько секунд тайга легла на землю, как скошенная трава. И никто до сих пор не может честно сказать, что взорвалось над Сибирью.

Удар был такой силы, что окна выбило за сотни километров. Люди проснулись от белой вспышки, будто солнце упало прямо в печную трубу. Земля качнулась. Небо горело.

Охотники потом шли через мёртвый лес, где стволы лежали радиальными полосами, как спички после удара кулаком. А в центре их ждал странный круг: деревья стояли без веток, голые, будто их обожгло изнутри.

Но самое жуткое пришло потом. Экспедицию отправили только через 19 лет. Слишком поздно.

Ни воронки. Ни осколков. Ничего.

Если завтра такой свет вспыхнет над твоим городом, ты поверишь в официальное объяснение сразу?`;

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
      return {
        style: "ancient_rome_dark",
        main_title: "РИМСКИЕ ТЕРМЫ\nБЫЛИ ЛОВУШКОЙ?",
        side_facts: ["ВОДУ НЕ МЕНЯЛИ НЕДЕЛЯМИ", "ТЫСЯЧИ ЛЮДЕЙ В ОДНОМ БАССЕЙНЕ", "ГРЯЗЬ СМЫВАЛАСЬ ОБРАТНО"],
        bottom_hook: "ТЫ БЫ ТУДА ВОШЁЛ?",
        psychology: ["телесный дискомфорт", "разрушение романтизированного образа"],
        angle: "Ancient Rome hygiene horror"
      };

    case "crime":
      return {
        style: "truecrime",
        main_title: "ЧТО СКРЫЛИ\nВ ДЕЛЕ?",
        side_facts: ["УЛИКА ИСЧЕЗЛА", "СВИДЕТЕЛЬ МОЛЧАЛ", "ПОЛИЦИЯ ОШИБЛАСЬ?"],
        bottom_hook: "ЭТО БЫЛ НЕСЧАСТНЫЙ СЛУЧАЙ?",
        psychology: ["тайна без ответа", "запретная версия"],
        angle: "True crime viral Netflix framing"
      };

    case "tunguska":
      return {
        style: "conspiracy_documentary",
        main_title: "ЧТО ВЗОРВАЛОСЬ\nНАД СИБИРЬЮ?",
        side_facts: ["ОКНА ВЫБИЛО ЗА СОТНИ КМ", "ЭКСПЕДИЦИЯ ЧЕРЕЗ 19 ЛЕТ", "НИ ВОРОНКИ. НИ ОСКОЛКОВ"],
        bottom_hook: "ЭТО БЫЛ НЕ МЕТЕОРИТ?",
        psychology: ["тайна без ответа", "масштаб катастрофы"],
        angle: "Siberian anomaly"
      };

    default:
      return {
        style: "viral_documentary",
        main_title: String(topic || "НЕИЗВЕСТНАЯ ИСТОРИЯ").slice(0, 40).toUpperCase(),
        side_facts: ["СКРЫТЫЙ ИСТОРИЧЕСКИЙ ФАКТ", "НЕОЖИДАННАЯ ПРАВДА"],
        bottom_hook: "ТЫ ОБ ЭТОМ ЗНАЛ?",
        psychology: ["историческое удивление"],
        angle: "Generic viral documentary"
      };
  }
}

function buildVisualExplainer(theme, topic = "") {
  return {
    title: topic || "Исторический разбор",
    dna: `${theme}_explainer`,
    overlays: ["Timeline Overlay", "Evidence Board", "Map Breakdown", "Visual Comparison"],
    prompt: `Create cinematic vertical documentary explainer for ${topic}. 9:16, ultra detailed, realistic overlays, dark UI.`
  };
}

export function buildMockScript(topic = "") {
  return `Ты бы не поверил, но ${topic}. История намного страшнее, чем кажется.`;
}

export function buildMockCoverPack({ topic = "", script = "" } = {}) {
  const source = `${topic}\n${script}`;
  const theme = detectTheme(source);
  const cover = buildThemeCover(theme, topic);
  const explainer = buildVisualExplainer(theme, topic);

  return {
    theme,
    topic,
    style: cover.style,
    main_title: cover.main_title,
    side_facts: cover.side_facts,
    bottom_hook: cover.bottom_hook,
    psychology: cover.psychology,
    angle: cover.angle,
    visual_explainer: explainer,
  };
}

export function buildMockSocialPack(payload = {}) {
  return {
    hooks: [
      "Ты бы рискнул зайти туда?",
      "Об этом молчали десятилетиями",
      "История оказалась хуже легенды"
    ],
    captions: [
      `История: ${payload?.topic || "тайна прошлого"}`,
      "Сохрани чтобы не забыть"
    ],
    hashtags: ["#history", "#documentary", "#viral"]
  };
}

export function buildMockSeoPack(payload = {}) {
  return {
    title: payload?.topic || "NeuroCine Documentary",
    description: `Cinematic documentary about ${payload?.topic || "historical mystery"}`,
    keywords: ["history", "documentary", "viral", "cinematic"]
  };
}

export function buildMockVideoPrompt(payload = {}) {
  return {
    master_prompt: `Create cinematic 9:16 documentary video about ${payload?.topic || "historical mystery"}, atmospheric lighting, realistic textures, dramatic camera movement.`
  };
}
