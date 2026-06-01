// Shared prompt-language guards for image/video generators.
// Generator-facing technical instructions should be English; Russian is kept
// only when it is exact dialogue or exact visible on-screen text.

function cleanText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function hasCyrillic(value = "") {
  return /[А-Яа-яЁёІіЇїЄєҐґ]/.test(String(value || ""));
}

const PHRASE_REPLACEMENTS = [
  [/В каждом здании есть этаж, которого не должно существовать\.?/gi, "Every building has a floor that should not exist."],
  [/Ночью, когда офис пустеет\.{0,3}/gi, "At night, when the office empties."],
  [/и последний лифт почему-то стоит открытым\.{0,3}/gi, "and the last elevator is somehow standing open."],
  [/лучше не заходить внутрь\.?/gi, "it is better not to go inside."],
  [/Трое сотрудников задержались после работы\.?/gi, "Three employees stayed late after work."],
  [/Они просто хотели спуститься вниз\.?/gi, "They only wanted to go downstairs."],
  [/На панели лифта появилась кнопка:?\s*-1\.?/gi, "A strange -1 button appeared on the elevator panel."],
  [/Минус первый этаж\.?/gi, "minus first floor."],
  [/Лифт начал ехать вниз слишком долго\.?/gi, "The elevator began descending for too long."],
  [/Кнопка «?Стоп»? не сработала\.?/gi, "The Stop button did not work."],
  [/Свет внутри кабины стал красным\.?/gi, "The light inside the cabin turned red."],
  [/На дисплее появилась надпись:?\s*Не смотрите в угол\.?/gi, "The elevator display shows the warning text."],
  [/Не смотрите в угол\.?/gi, "Do not look into the corner."],
  [/Но они посмотрели\.?/gi, "But they looked."],
  [/В углу лифта стоял человек\.?/gi, "A man stood in the elevator corner."],
  [/Он был там всё это время\.?/gi, "He had been there the entire time."],
  [/Когда двери открылись, перед ними оказался тот же офис\.?/gi, "When the doors opened, the same office was in front of them."],
  [/Но что-то было неправильно\.?/gi, "But something was wrong."],
  [/Столы стояли не на своих местах\.?/gi, "The desks were in the wrong places."],
  [/Часы шли назад\.?/gi, "The clocks moved backward."],
  [/Люди за стеклом не двигались\.?/gi, "The people behind the glass did not move."],
  [/Это был не их этаж\.?/gi, "This was not their floor."],
  [/Они попытались вернуться\.?/gi, "They tried to return."],
  [/Но лифт уже уехал\.?/gi, "But the elevator had already left."],
  [/Коридоры становились длиннее\.?/gi, "The corridors became longer."],
  [/Свет гас один за другим\.?/gi, "The lights went out one by one."],
  [/На старой фотографии были они сами\.?/gi, "An old photograph showed them."],
  [/Подпись гласила:?\s*Пропали без вести\.?\s*Две тысячи шестой год\.?/gi, "The caption reads: Missing. 2006."],
  [/Подпись гласила:?\s*Пропали без вести\.?\s*2006 год\.?/gi, "The caption reads: Missing. 2006."],
  [/Пропали без вести\.?\s*2006 год\.?/gi, "Missing. 2006."],
  [/Но они родились позже\.?/gi, "But they were born later."],
  [/Вдалеке снова появился тот человек\.?/gi, "The same man appeared again in the distance."],
  [/Он стоял неподвижно\.?/gi, "He stood motionless."],
  [/Потом исчез\.?/gi, "Then he vanished."],
  [/И через секунду оказался ближе\.?/gi, "A second later he was closer."],
  [/Лифт забирает только тех,? кто уже должен был исчезнуть\.?/gi, "The elevator only takes those who were already supposed to disappear."],
  [/Они бежали обратно\.?/gi, "They ran back."],
  [/Били по кнопкам\.?/gi, "They hit the buttons."],
  [/Кричали\.?/gi, "They screamed."],
  [/Пытались найти выход\.?/gi, "They tried to find an exit."],
  [/офис больше не подчинялся законам реальности\.?/gi, "the office no longer obeyed the laws of reality."],
  [/Кровь поднималась вверх по стенам\.?/gi, "Dark red liquid rose upward along the walls."],
  [/Лампы взрывались одна за другой\.?/gi, "The lamps burst one after another."],
  [/Люди стояли лицом к стене\.?/gi, "People stood facing the wall."],
  [/за стеклом один из них увидел самого себя\.?/gi, "behind the glass, one of them saw himself."],
  [/Когда двери лифта наконец открылись\.{0,3}/gi, "When the elevator doors finally opened."],
  [/внутри не было кабины\.?/gi, "there was no cabin inside."],
  [/Только ч[её]рная пустота\.?/gi, "Only black void."],
  [/Один за другим они исчезли\.?/gi, "One by one they disappeared."],
  [/Остался только он\.?/gi, "Only he remained."],
  [/Двери открылись снова\.?/gi, "The doors opened again."],
  [/Внутри стояла его копия\.?/gi, "His duplicate stood inside."],
  [/Она улыбнулась и сказала:?\s*Ты уже нажимал эту кнопку\.?/gi, "The duplicate smiled and said the exact dialogue."],
  [/Ты уже нажимал эту кнопку\.?/gi, "You already pressed this button."],
  [/И тогда он понял\.{0,3}/gi, "Then he understood."],
  [/этот этаж не вед[её]т вниз\.?/gi, "this floor does not lead downward."],
  [/Он вед[её]т туда,?\s*где тебя уже ждут\.?/gi, "It leads to the place where they are already waiting for you."],
  [/Лифт на минус первый\.?/gi, "Elevator to the minus first floor."],
  [/Следующий этаж\.{0,3}\s*твой\.?/gi, "The next floor is yours."],
];

const WORD_REPLACEMENTS = [
  [/Анна/gi, "Anna"],
  [/Илья/gi, "Ilya"],
  [/Марина/gi, "Marina"],
  [/Сергей/gi, "Sergey"],
  [/Человек в углу/gi, "Corner man"],
  [/Копия Ильи/gi, "Ilya duplicate"],
  [/одна из тр[её]х сотрудников/gi, "one of the three employees"],
  [/один из тр[её]х сотрудников/gi, "one of the three employees"],
  [/трое сотрудников/gi, "three employees"],
  [/сотрудников/gi, "employees"],
  [/сотрудник/gi, "employee"],
  [/сотрудница/gi, "female employee"],
  [/та же актриса/gi, "same actress"],
  [/тот же акт[её]р/gi, "same actor"],
  [/та же/gi, "same"],
  [/тот же/gi, "same"],
  [/бледн(ый|ого|ое|ая|ую|ым)?/gi, "pale"],
  [/овал лица/gi, "oval face"],
  [/худое лицо/gi, "thin face"],
  [/круглое лицо/gi, "round face"],
  [/квадратное лицо/gi, "square face"],
  [/серо-голубые глаза/gi, "gray-blue eyes"],
  [/серо-зел[её]ные глаза/gi, "gray-green eyes"],
  [/карие глаза/gi, "brown eyes"],
  [/т[её]мно-русые волосы/gi, "dark blond hair"],
  [/короткие ч[её]рные волосы/gi, "short black hair"],
  [/волосы до плеч/gi, "shoulder-length hair"],
  [/короткая щетина/gi, "short stubble"],
  [/низкий хвост/gi, "low ponytail"],
  [/т[её]мно-серый блейзер/gi, "dark gray blazer"],
  [/т[её]мно-синяя рубашка/gi, "dark navy shirt"],
  [/светлая рубашка/gi, "light shirt"],
  [/ч[её]рная юбка/gi, "black skirt"],
  [/ч[её]рные брюки/gi, "black trousers"],
  [/закатанными рукавами/gi, "rolled sleeves"],
  [/бейдж/gi, "ID badge"],
  [/офисный пропуск/gi, "office ID badge"],
  [/гардероб|одежда|костюм/gi, "wardrobe"],
  [/внутри лифта/gi, "inside the elevator"],
  [/у дисплея/gi, "near the display"],
  [/дисплей лифта/gi, "elevator display"],
  [/надпись/gi, "visible text"],
  [/панель лифта/gi, "elevator panel"],
  [/кнопка/gi, "button"],
  [/кнопки/gi, "buttons"],
  [/двери лифта/gi, "elevator doors"],
  [/кабина лифта/gi, "elevator cabin"],
  [/коридор/gi, "corridor"],
  [/офис/gi, "office"],
  [/лифт/gi, "elevator"],
  [/локация/gi, "location"],
  [/свет/gi, "light"],
  [/лампы/gi, "lamps"],
  [/потолочные лампы/gi, "ceiling lights"],
  [/стеклянные перегородки/gi, "glass partitions"],
  [/люди/gi, "people"],
  [/человек/gi, "man"],
  [/лица/gi, "faces"],
  [/лицо/gi, "face"],
  [/силуэт/gi, "silhouette"],
  [/рука/gi, "hand"],
  [/руки/gi, "hands"],
  [/отражение/gi, "reflection"],
  [/прохожий/gi, "passerby"],
  [/другие/gi, "other"],
  [/новые/gi, "new"],
  [/новый/gi, "new"],
  [/новая/gi, "new"],
  [/комнаты/gi, "rooms"],
  [/комната/gi, "room"],
  [/коридор/gi, "corridor"],
  [/лица/gi, "faces"],
  [/стены/gi, "walls"],
  [/стена/gi, "wall"],
  [/пол/gi, "floor"],
  [/пустой/gi, "empty"],
  [/пустая/gi, "empty"],
  [/пустое/gi, "empty"],
  [/ночной/gi, "night"],
  [/старый/gi, "old"],
  [/старого/gi, "old"],
  [/металл/gi, "metal"],
  [/грязный/gi, "dirty"],
  [/матовые/gi, "matte"],
  [/бежевые/gi, "beige"],
  [/серый/gi, "gray"],
  [/красный/gi, "red"],
  [/цифровой/gi, "digital"],
  [/сегмент/gi, "segment"],
  [/пластиковая крышка/gi, "plastic cover"],
  [/л[её]гкий/gi, "light"],
  [/тепловой тик/gi, "thermal tick"],
  [/сухой/gi, "dry"],
  [/щелчок/gi, "click"],
  [/переключающий/gi, "switching"],
  [/втянутый воздух сквозь зубы/gi, "air pulled through teeth"],
  [/короткий близкий шипящий звук/gi, "short close hissing sound"],
  [/никаких/gi, "no"],
  [/без/gi, "without"],
  [/запрещено/gi, "forbidden"],
  [/разные/gi, "different"],
  [/акт[её]р/gi, "actor"],
  [/актриса/gi, "actress"],
  [/возраст/gi, "age"],
  [/дрейф/gi, "drift"],
];

function protectLiterals(text, literals = []) {
  const tokens = [];
  let out = String(text || "");
  literals.filter(Boolean).forEach((literal, i) => {
    const token = `__RU_LITERAL_${i}__`;
    const escaped = String(literal).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(escaped, "g"), token);
    tokens.push([token, literal]);
  });
  return { out, tokens };
}

function restoreLiterals(text, tokens = []) {
  let out = String(text || "");
  tokens.forEach(([token, literal]) => {
    out = out.replaceAll(token, literal);
  });
  return out;
}

function replaceResidualCyrillic(text, fallback = "scripted detail") {
  const escapedFallback = String(fallback).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let out = String(text || "").replace(/[А-Яа-яЁёІіЇїЄєҐґ]+/g, fallback);
  out = out
    .replace(new RegExp(`(\\b${escapedFallback}\\b[\\s,;:-]*){2,}`, "gi"), `${fallback} `)
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/([,;:])\s*([,;:])+/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return out;
}

export function toPromptEnglish(value = "", options = {}) {
  const {
    fallback = "scripted detail",
    preserveRussian = [],
    residualFallback = fallback,
  } = options;
  let source = cleanText(value);
  if (!source) return fallback;

  const protectedParts = protectLiterals(source, preserveRussian);
  let out = protectedParts.out;

  for (const [re, replacement] of PHRASE_REPLACEMENTS) out = out.replace(re, replacement);
  for (const [re, replacement] of WORD_REPLACEMENTS) out = out.replace(re, replacement);

  out = replaceResidualCyrillic(out, residualFallback);
  out = restoreLiterals(out, protectedParts.tokens);
  out = cleanText(out)
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/([,;:])\s*([,;:])+/g, "$1")
    .replace(/\bscripted detail\b(\s+\bscripted detail\b)+/gi, "scripted detail")
    .trim();

  return out || fallback;
}

export function promptListEnglish(value = "", fallback = "") {
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (item && typeof item === "object") {
        return Object.entries(item)
          .map(([key, val]) => val ? `${key}: ${toPromptEnglish(val, { fallback: "scripted detail" })}` : "")
          .filter(Boolean)
          .join(", ");
      }
      return toPromptEnglish(item, { fallback: "" });
    }).filter(Boolean).join("; ");
  }
  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([key, val]) => val ? `${key}: ${toPromptEnglish(val, { fallback: "scripted detail" })}` : "")
      .filter(Boolean)
      .join("; ");
  }
  return toPromptEnglish(value || fallback, { fallback });
}

export function exactTextLine(list = [], label = "Exact visible text to render") {
  const values = (Array.isArray(list) ? list : [list])
    .map(cleanText)
    .filter(Boolean);
  return values.length ? `${label}: ${values.map((x) => `"${x}"`).join(", ")}` : "";
}
