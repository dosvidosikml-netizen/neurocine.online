# NeuroCine Local AI Content Factory

## Audit

The current project is a Next.js application with existing trailer/storyboard tools under `app/trailer`, shared prompt engines under `engine`, and the older Node local-agent under `scripts/neurocine-local-agent.mjs`.

What already exists:
- Next.js frontend and API routes.
- Existing trailer UI with OpenRouter/Supabase-based script, bible and queue logic.
- Prompt engines for storyboard/video prompt generation.
- Legacy local-agent flow for ComfyUI queue experiments.

What was missing:
- Local-first backend process.
- SQLite project database.
- Stable project folders with intermediate artifacts.
- Modular services for Ollama, ComfyUI, TTS, Whisper and FFmpeg.
- Real progress stream from backend to frontend.
- Resume/retry model per project stage.

## Target Architecture

The site should act as a control panel. Heavy generation runs on the user's PC through a local backend.

Core modules:
- `backend/main.py` exposes REST and SSE.
- `backend/services/project_service.py` stores projects, jobs, events and JSON/text artifacts.
- `backend/services/ollama_service.py` talks to Ollama for script and JSON planning.
- Future modules: `comfyui_service`, `tts_service`, `whisper_service`, `ffmpeg_service`.
- `backend/workers/pipeline_worker.py` runs long steps and writes progress.
- `projects/{project_id}` stores every intermediate result.

Implemented MVP stages:
1. Create project.
2. Generate script through Ollama.
3. Generate `storyboard.json`, `reference_map.json`, `image_prompts.json`, `video_prompts.json`.
4. Save all outputs to disk and SQLite.
5. Stream events to the frontend.
6. Show results on `/factory`.
7. Generate still images through ComfyUI API and save them under `projects/{project_id}/images`.

## Risks

- A deployed HTTPS site may be blocked by the browser when calling `http://127.0.0.1:8788`. For reliable local testing, run the Next.js frontend locally and open `http://localhost:3000/factory`.
- Ollama must be installed and running.
- The configured Ollama model must exist locally.
- Local image/video/TTS stages are intentionally not faked in the MVP. They return explicit "not implemented" states until the real services are added.

## Local Run

Install backend dependencies once:

```powershell
python -m pip install -r backend/requirements.txt
```

Start Ollama separately, then run:

```powershell
npm run factory:backend
npm run dev
```

Open:

```text
http://localhost:3000/factory
```

Optional image generation environment variables:

```powershell
$env:COMFYUI_URL="http://127.0.0.1:8188"
$env:COMFYUI_CHECKPOINT="sd_xl_base_1.0.safetensors"
$env:COMFYUI_WORKFLOW_PATH="C:\path\to\workflow_api.json"
```

If `COMFYUI_WORKFLOW_PATH` is empty, the backend uses a basic SDXL text-to-image workflow. A custom workflow may contain placeholders:

```text
__PROMPT__
__NEGATIVE__
__WIDTH__
__HEIGHT__
__STEPS__
__CFG__
__SEED__
__CHECKPOINT__
__FILENAME_PREFIX__
```

## Next Stages

- Add reference-sheet generation before storyboard scene generation.
- Add video workflow queue.
- Add local TTS with saved WAV files.
- Add Whisper/WhisperX subtitle pass.
- Add FFmpeg final render.
- Add Android WebView client that opens the local/control URL and can send remote commands only through a safe relay/VPN layer.
