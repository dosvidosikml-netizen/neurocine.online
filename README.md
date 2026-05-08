# NeuroCine v47 — DEMO topic-safe mock + stuck generation fix

Changed files:
- `app/storyboard/page.js`
- `lib/mockData.js`
- `README.md`

Fixes:
- DEMO script no longer always returns old Tunguska text.
- DEMO mock script is now generated from the current topic.
- DEMO storyboard follows the current topic instead of old Siberia frames.
- Switching DEMO/LIVE resets stuck generation flags.
- DEMO script/storyboard branch force-stops busy state so UI cannot hang on “Генерация…”.

No SQL changes required if v44/v45 schema was already applied.
