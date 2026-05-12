export const MOCK_SCRIPT_RU = `За несколько секунд тайга легла на землю, как скошенная трава. И никто до сих пор не может честно сказать, что взорвалось над Сибирью.

Удар был такой силы, что окна выбило за сотни километров. Люди проснулись от белой вспышки, будто солнце упало прямо в печную трубу. Земля качнулась. Небо горело.

Охотники потом шли через мёртвый лес, где стволы лежали радиальными полосами, как спички после удара кулаком. А в центре их ждал странный круг: деревья стояли без веток, голые, будто их обожгло изнутри.

Но самое жуткое пришло потом. Экспедицию отправили только через 19 лет. Слишком поздно.

Ни воронки. Ни осколков. Ничего.

Если завтра такой свет вспыхнет над твоим городом, ты поверишь в официальное объяснение сразу?`;

function detectTheme(input = "") {
  const t = String(input || "").toLowerCase();

  if (/рим|терм|бан|вод|гряз|антич|римлян/i.test(t)) {
    return "roman_baths";
  }

  if (/убий|маньяк|дело|улика|свидетел|преступ|true crime|crime/i.test(t)) {
    return "crime";
  }

  if (/сибир|тунгус|взрыв|метеор|тайг/i.test(t)) {
    return "tunguska";
  }

  return "generic";
}

function buildThemeCover(theme, topic = "") {
  switch (theme) {
    case "roman_baths":
      return {
        style: "ancient_rome_dark",
        main_title: "РИМСКИЕ ТЕРМЫ\nБЫЛИ ЛОВУШКОЙ?",
        side_facts: [
          "ВОДУ НЕ МЕНЯЛИ НЕДЕЛЯМИ",
          "ТЫСЯЧИ ЛЮДЕЙ В ОДНОМ БАССЕЙНЕ",
          "ГРЯЗЬ СМЫВАЛАСЬ ОБРАТНО"
        ],
        bottom_hook: "ТЫ БЫ ТУДА ВОШЁЛ?",
        psychology: [
          "телесный дискомфорт",
          "разрушение романтизированного образа",
          "грязная историческая правда",
          "шок через бытовую деталь"
        ],
        angle: "Ancient Rome hygiene horror / historical realism"
      };

    case "crime":
      return {
        style: "truecrime",
        main_title: "ЧТО СКРЫЛИ\nВ ДЕЛЕ?",
        side_facts: [
          "УЛИКА ИСЧЕЗЛА",
          "СВИДЕТЕЛЬ МОЛЧАЛ",
          "ПОЛИЦИЯ ОШИБЛАСЬ?"
        ],
        bottom_hook: "ЭТО БЫЛ НЕСЧАСТНЫЙ СЛУЧАЙ?",
        psychology: [
          "тайна без ответа",
          "запретная версия",
          "масштабный шок"
        ],
        angle: "True crime viral Netflix framing"
      };

    case "tunguska":
      return {
        style: "conspiracy_documentary",
        main_title: "ЧТО ВЗОРВАЛОСЬ\nНАД СИБИРЬЮ?",
        side_facts: [
          "ОКНА ВЫБИЛО ЗА СОТНИ КМ",
          "ЭКСПЕДИЦИЯ ЧЕРЕЗ 19 ЛЕТ",
          "НИ ВОРОНКИ. НИ ОСКОЛКОВ"
        ],
        bottom_hook: "ЭТО БЫЛ НЕ МЕТЕОРИТ?",
        psychology: [
          "тайна без ответа",
          "масштаб катастрофы",
          "необъяснимое явление"
        ],
        angle: "Siberian anomaly / mystery event"
      };

    default:
      return {
        style: "viral_documentary",
        main_title: String(topic || "НЕИЗВЕСТНАЯ ИСТОРИЯ").slice(0, 40).toUpperCase(),
        side_facts: [
          "СКРЫТЫЙ ИСТОРИЧЕСКИЙ ФАКТ",
          "ТО, ЧТО НЕ ПОКАЗЫВАЛИ В ШКОЛЕ",
          "НЕОЖИДАННАЯ ПРАВДА"
        ],
        bottom_hook: "ТЫ ОБ ЭТОМ ЗНАЛ?",
        psychology: [
          "историческое удивление",
          "скрытый факт",
          "viral curiosity"
        ],
        angle: "Generic viral documentary"
      };
  }
}

export function buildMockScript(topic = "") {
  const t = String(topic || "неизвестная историческая тайна").trim();
  return `Ты бы не поверил, но ${t}.

Сначала это звучит как странная деталь из учебника. Но если всмотреться глубже, становится понятно: за этой деталью стояла целая эпоха риска, наблюдений и выживания.

Люди не имели современных приборов, спутников и точных карт. Им приходилось читать мир по солнцу, теням, ветру, воде и небу. Ошибка могла стоить маршрута, груза, корабля или жизни.

Именно поэтому такие открытия кажутся невозможными. Они были сделаны не в лабораториях, а в дороге, в холоде, среди опасности и постоянной неопределённости.

Самое сильное здесь не сам предмет и не красивая легенда. Самое сильное — то, что человек уже тогда искал способ управлять хаосом вокруг себя.

И теперь вопрос: если бы ты оказался там без телефона, GPS и карты, ты смог бы найти путь домой?`;
}

export function buildMockCoverPack({ topic = "", script = "" } = {}) {
  const source = `${topic}\n${script}`;
  const theme = detectTheme(source);
  const cover = buildThemeCover(theme, topic);

  return {
    theme: topic || theme,
    mode: "DEV MOCK",
    style: cover.style,
    format: "9:16",
    main_title: cover.main_title,
    side_facts: cover.side_facts,
    bottom_hook: cover.bottom_hook,
    psychology: cover.psychology,
    angle: cover.angle,
    variants: [
      {
        id: "poster",
        title: "Viral Poster",
        prompt_EN: `Vertical 9:16 viral thumbnail based on ${theme}, ultra readable typography, aggressive mobile readability, cinematic realism, emotional focal point, high CTR composition, Netflix/TikTok hybrid thumbnail.`
      },
      {
        id: "evidence",
        title: "Evidence Layout",
        prompt_EN: `Vertical 9:16 evidence-board documentary thumbnail for ${theme}, layered text hierarchy, visual storytelling, ultra readable mobile composition, realistic cinematic lighting.`
      }
    ],
    negative_prompt_EN: "no watermark, no logo, no UI, no unreadable text, no tiny typography, no random crime references unrelated to topic"
  };
}
