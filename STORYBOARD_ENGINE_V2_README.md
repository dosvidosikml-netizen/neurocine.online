# NeuroCine Storyboard Engine v2

Что добавлено:

- clean image prompts: убран prompt noise типа `no blur`, `no plastic skin`, `8k texture fidelity`, `high frequency details`
- компактный quality signal для image prompts: `ARRI Alexa 65`, `Zeiss Master Prime`, `T2.8`, `cinematic sharp focus`, `film-level detail`, `Kodak Vision3 500T grain`
- `global_video_lock` для всего проекта
- `cut_energy` в каждом кадре: `low`, `medium`, `high`
- физика кадра в каждом `video_prompt_en`
- усиленный `video_prompt_grok_en` с GROK RAW MASTER
- `postprocess` в JSON: x2 для рабочего upscale, x4 для финала, provider Replicate

Основной flow:

SAFE / GPT → стабильный JSON → AUTO SAFE TO GROK → video_prompt_grok_en → upscale x2/x4
