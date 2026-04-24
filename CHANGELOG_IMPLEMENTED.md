# NeuroCine — внедрённый пакет правок

## 1. Валюта проекта
- Убраны «Кристаллы» / «Синемы».
- Внедрена валюта проекта в формате `⭐`.
- UI теперь показывает `⭐ 1`, `⭐ 10`, баланс через `formatStars()`.
- Стартовый дневной баланс поднят до 10.
- Админка обновлена под ⭐.

## 2. Экономика списаний
Списания расставлены по AI-действиям:
- Reference prompts: `⭐ 1`
- Casting / Advanced Character Editor: `⭐ 1`
- Усиление сценария: `⭐ 1`
- TTS Studio: `⭐ 1`
- Step 1 / Раскадровка: `⭐ 1`
- Step 2 / Pro prompts: `⭐ 1`

Списание происходит после успешной генерации, не за простые UI-действия.

## 3. Reference prompts до загрузки
Добавлен блок `REFERENCE PROMPTS ДО ЗАГРУЗКИ` до Reference Studio.
- Генерирует character reference sheet prompts.
- Добавлены кнопки копирования под каждым prompt.
- Добавлена кнопка «Все» для копирования всего пакета.
- Character prompt теперь просит multi-angle reference sheet: front, side, 3/4, full body, neutral pose.

## 4. Multi Character References
Добавлен отдельный блок `MULTI CHARACTER REFERENCES`.
- Можно загрузить 2–6 фото персонажей.
- Каждый становится отдельным `CHAR_X` DNA-lock.
- Можно удалить отдельный ref.
- Pipeline получает `MULTI CHARACTER DNA LOCKS` и правило: не вставлять всех персонажей в каждый кадр.

## 5. Reference Studio разделена по смыслу
- Персонаж убран из Reference Studio.
- Reference Studio теперь отвечает за окружение:
  - Location reference
  - Style reference
- Персонажи теперь находятся только в Multi Character References.

## 6. Visual Engine усилен
Добавлены новые движки:
- Viral Shock
- Military Archive
- Found Footage
- Netflix Recon

Каждый имеет реальный style lock, который прокидывается в storyboard / prompt pipeline.
Для Netflix Recon добавлено правило: не делать black-and-white/noir, если пользователь явно не просит.

## 7. Timing Engine
- Длительность теперь превращается в timing plan.
- Количество кадров считается от выбранной длительности.
- В Step 1 передаются ограничения: общее время, количество кадров, длительность кадра, диапазон слов для VO.

## 8. Autosave / восстановление
В localStorage теперь сохраняются:
- жанр
- длительность
- формат
- visual engine
- язык
- seed
- кадры
- generated characters
- reference prompts
- multi-character refs
- текущий шаг

## 9. Навигация
Если Step 1 уже есть, на форме остаётся кнопка `➔ ВЕРНУТЬСЯ К РЕЗУЛЬТАТУ`, чтобы не возвращаться только через архив.

## 10. X-Ray / стиль
Старый sanitizer сохранён: X-Ray не должен протекать в другие режимы. AUTO_XRAY применяется только при выбранном X_RAY.
