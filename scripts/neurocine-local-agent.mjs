#!/usr/bin/env node

import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const DEFAULT_NEGATIVE = "bad hands, bad anatomy, deformed hands, deformed fingers, extra fingers, missing fingers, bad face, face asymmetry, eyes asymmetry, deformed eyes, deformed mouth, ugly, deformed, low quality, lowres, overprocessed, oversmoothed skin, airbrushed skin, beauty retouching, fashion editorial, glossy glamour lighting, text, subtitles, captions, watermark, UI, logo, frame labels, numbers, random hooded robe, random cloak, cult robe, anonymous hooded figure, contact sheet, gallery cards, nested grid, comic, illustration, painting, cartoon, anime, CGI, render, plastic skin";
const DEFAULT_COMFY_PYTHON = process.platform === "win32"
  ? "C:\\Users\\Admin\\AI\\ComfyUI\\.venv\\Scripts\\python.exe"
  : "python3";
const DEFAULT_COMFY_DIR = process.platform === "win32"
  ? "C:\\Users\\Admin\\AI\\ComfyUI"
  : "";
const PC_COMMAND_PROVIDER = "pc-command";

function arg(name, fallback = "") {
  const flag = `--${name}`;
  const index = process.argv.indexOf(flag);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  const pair = process.argv.find((item) => item.startsWith(`${flag}=`));
  return pair ? pair.slice(flag.length + 1) : fallback;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanBaseUrl(value, fallback) {
  const raw = String(value || fallback).trim();
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
  return withScheme.replace(/\/+$/, "");
}

async function fetchJson(url, options = {}, timeoutMs = 600000) {
  return fetchJsonWithRetry(url, options, timeoutMs, 4);
}

function isTransientFetchError(error = {}) {
  const message = String(error?.message || error || "").toLowerCase();
  return message.includes("fetch failed")
    || message.includes("aborted")
    || message.includes("network")
    || message.includes("timeout")
    || message.includes("http 429")
    || message.includes("http 500")
    || message.includes("http 502")
    || message.includes("http 503")
    || message.includes("http 504");
}

async function fetchJsonWithRetry(url, options = {}, timeoutMs = 600000, attempts = 4) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || json.detail || `HTTP ${res.status}`);
      return json;
    } catch (e) {
      lastError = e;
      if (!isTransientFetchError(e) || attempt >= attempts) throw e;
      await sleep(Math.min(1200 * attempt, 5000));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError || new Error("fetch failed");
}

async function fetchDataUrlWithRetry(url, timeoutMs = 120000, attempts = 4) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const contentType = res.headers.get("content-type") || "image/png";
      const buffer = Buffer.from(await res.arrayBuffer());
      return `data:${contentType};base64,${buffer.toString("base64")}`;
    } catch (e) {
      lastError = e;
      if (!isTransientFetchError(e) || attempt >= attempts) throw e;
      await sleep(Math.min(1200 * attempt, 5000));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError || new Error("image fetch failed");
}

function normalizeImage(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("data:image/")) return raw;
  return `data:image/png;base64,${raw}`;
}

function dataUrlToBuffer(value) {
  const raw = String(value || "");
  const base64 = raw.includes(",") ? raw.split(",").pop() : raw;
  return Buffer.from(base64, "base64");
}

function dataUrlMime(value) {
  return String(value || "").match(/^data:([^;]+);base64,/i)?.[1] || "image/png";
}

function safeFilePart(value = "reference") {
  return String(value || "reference")
    .replace(/[^a-z0-9_-]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48) || "reference";
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

async function uploadComfyInputImage(baseUrl, imageData, prefix = "neurocine_ref") {
  const normalized = normalizeImage(imageData);
  if (!normalized) return "";
  const mime = dataUrlMime(normalized);
  const extension = mime.includes("jpeg") || mime.includes("jpg") ? "jpg" : "png";
  const fileName = `${safeFilePart(prefix)}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const form = new FormData();
  form.append("image", new Blob([dataUrlToBuffer(normalized)], { type: mime }), fileName);
  form.append("overwrite", "true");
  form.append("type", "input");
  form.append("subfolder", "neurocine_refs");
  const data = await fetchJson(`${baseUrl}/upload/image`, {
    method: "POST",
    body: form,
  }, 120000);
  const name = data.name || fileName;
  const subfolder = data.subfolder || "neurocine_refs";
  return subfolder ? `${subfolder}/${name}` : name;
}

async function prepareComfyPayload(baseUrl, payload = {}) {
  if (payload.workflow || payload.init_image) return payload;
  const anchor = payload.reference_anchor && typeof payload.reference_anchor === "object" ? payload.reference_anchor : {};
  const imageData = payload.init_image_data || anchor.image_data || "";
  if (!imageData) return payload;
  const prefix = [payload.filename_prefix, anchor.kind, anchor.id || anchor.name].filter(Boolean).join("_");
  const initImage = await uploadComfyInputImage(baseUrl, imageData, prefix || "neurocine_ref");
  if (!initImage) return payload;
  return {
    ...payload,
    init_image: initImage,
    denoise: clampNumber(payload.denoise ?? anchor.denoise, 0.35, 0.95, 0.72),
    init_anchor_kind: anchor.kind || payload.init_anchor_kind || "reference",
    init_anchor_name: anchor.name || anchor.reference_name || payload.init_anchor_name || "",
  };
}

function runProcess(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...options, windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr?.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr || stdout || `${command} exited with code ${code}`));
    });
  });
}

function runDetached(command, args = [], options = {}) {
  const child = spawn(command, args, {
    ...options,
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  child.unref();
  return child;
}

function workerPort(workerUrl, fallback = 8188) {
  try {
    const parsed = new URL(workerUrl);
    return Number(parsed.port || (parsed.protocol === "https:" ? 443 : 80)) || fallback;
  } catch {
    return fallback;
  }
}

function quotePowerShell(value = "") {
  return `'${String(value || "").replace(/'/g, "''")}'`;
}

async function stopComfyUiProcesses(config) {
  if (process.platform !== "win32") {
    throw new Error("ComfyUI restart is configured for Windows only in this agent.");
  }
  if (!config.comfyuiDir) throw new Error("Missing --comfyui-dir");
  const script = [
    `$root = ${quotePowerShell(config.comfyuiDir)}.ToLowerInvariant()`,
    "$procs = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -and $_.CommandLine.ToLowerInvariant().Contains($root) -and $_.CommandLine.ToLowerInvariant().Contains('main.py') }",
    "$procs | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }",
    "Write-Output ($procs | Measure-Object).Count",
  ].join("; ");
  const result = await runProcess("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script]);
  return String(result.stdout || "").trim() || "0";
}

async function startComfyUi(config) {
  const current = await checkWorkerStatus(config);
  if (current.ok) return "ComfyUI already responds.";
  if (config.provider !== "comfyui") throw new Error("Start ComfyUI command requires provider=comfyui.");
  if (!config.comfyuiDir || !config.comfyuiMain) throw new Error("Missing ComfyUI path. Pass --comfyui-dir if needed.");
  const port = workerPort(config.workerUrl, 8188);
  runDetached(config.python, [config.comfyuiMain, "--listen", "127.0.0.1", "--port", String(port)], { cwd: config.comfyuiDir });
  for (let i = 0; i < 20; i += 1) {
    await sleep(1500);
    const status = await checkWorkerStatus(config);
    if (status.ok) return `ComfyUI started on port ${port}.`;
  }
  throw new Error("ComfyUI start command was sent, but API did not become ready.");
}

async function composeGridWithPillow({ images, cols, rows, cellWidth, cellHeight, pythonBinary }) {
  if (!images.length) throw new Error("No frame images to compose");
  const tempRoot = await mkdir(path.join(tmpdir(), `neurocine-grid-${Date.now()}-${Math.random().toString(36).slice(2)}`), { recursive: true });
  const manifestPath = path.join(tempRoot, "manifest.json");
  const scriptPath = path.join(tempRoot, "compose_grid.py");
  const outputPath = path.join(tempRoot, "grid.png");
  try {
    const files = [];
    for (let i = 0; i < images.length; i += 1) {
      const file = path.join(tempRoot, `frame_${String(i + 1).padStart(2, "0")}.png`);
      await writeFile(file, dataUrlToBuffer(images[i]));
      files.push(file);
    }
    await writeFile(manifestPath, JSON.stringify({
      files,
      output: outputPath,
      cols,
      rows,
      cell_width: cellWidth,
      cell_height: cellHeight,
    }));
    await writeFile(scriptPath, `
import json
import sys
from PIL import Image

with open(sys.argv[1], "r", encoding="utf-8") as f:
    data = json.load(f)

cols = int(data["cols"])
rows = int(data["rows"])
cell_w = int(data["cell_width"])
cell_h = int(data["cell_height"])
canvas = Image.new("RGB", (cols * cell_w, rows * cell_h), (0, 0, 0))

for idx, file in enumerate(data["files"]):
    if idx >= cols * rows:
        break
    img = Image.open(file).convert("RGB")
    scale = max(cell_w / img.width, cell_h / img.height)
    resized = img.resize((max(1, round(img.width * scale)), max(1, round(img.height * scale))), Image.Resampling.LANCZOS)
    left = max(0, (resized.width - cell_w) // 2)
    top = max(0, (resized.height - cell_h) // 2)
    crop = resized.crop((left, top, left + cell_w, top + cell_h))
    x = (idx % cols) * cell_w
    y = (idx // cols) * cell_h
    canvas.paste(crop, (x, y))

canvas.save(data["output"], "PNG", optimize=True)
`, "utf8");
    await runProcess(pythonBinary, [scriptPath, manifestPath]);
    const buffer = await readFile(outputPath);
    return `data:image/png;base64,${buffer.toString("base64")}`;
  } catch (e) {
    throw new Error(`Grid compose failed: ${e.message}. Install/keep Pillow in ComfyUI venv or pass --python to the local agent.`);
  } finally {
    await rm(tempRoot, { recursive: true, force: true }).catch(() => {});
  }
}

function buildComfyWorkflow(payload = {}, checkpoint) {
  const width = Number(payload.width || 936);
  const height = Number(payload.height || 1664);
  const steps = Number(payload.steps || 24);
  const cfg = Number(payload.cfg_scale || payload.cfg || 6);
  const hasInitImage = Boolean(payload.init_image);
  const denoise = hasInitImage ? clampNumber(payload.denoise, 0.35, 0.95, 0.72) : 1;
  const seed = Number.isFinite(Number(payload.seed)) && Number(payload.seed) >= 0
    ? Math.floor(Number(payload.seed))
    : Math.floor(Math.random() * 999999999);
  if (String(payload.model_family || "sdxl").toLowerCase() === "flux") {
    throw new Error("FLUX requires a ComfyUI workflow template in payload.workflow. Paste a workflow JSON template in the web UI.");
  }
  const workflow = {
    "4": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: payload.checkpoint || checkpoint } },
    "5": { class_type: "EmptyLatentImage", inputs: { width, height, batch_size: 1 } },
    "6": { class_type: "CLIPTextEncode", inputs: { text: payload.prompt, clip: ["4", 1] } },
    "7": { class_type: "CLIPTextEncode", inputs: { text: payload.negative_prompt || DEFAULT_NEGATIVE, clip: ["4", 1] } },
    "3": {
      class_type: "KSampler",
      inputs: {
        seed,
        steps,
        cfg,
        sampler_name: payload.sampler_name || "dpmpp_2m",
        scheduler: payload.scheduler || "karras",
        denoise,
        model: ["4", 0],
        positive: ["6", 0],
        negative: ["7", 0],
        latent_image: ["5", 0],
      },
    },
    "8": { class_type: "VAEDecode", inputs: { samples: ["3", 0], vae: ["4", 2] } },
    "9": { class_type: "SaveImage", inputs: { filename_prefix: payload.filename_prefix || "neurocine_trailer_part", images: ["8", 0] } },
  };
  if (hasInitImage) {
    workflow["20"] = { class_type: "LoadImage", inputs: { image: payload.init_image } };
    workflow["21"] = {
      class_type: "ImageScale",
      inputs: {
        image: ["20", 0],
        upscale_method: "lanczos",
        width,
        height,
        crop: "center",
      },
    };
    workflow["22"] = { class_type: "VAEEncode", inputs: { pixels: ["21", 0], vae: ["4", 2] } };
    workflow["3"].inputs.latent_image = ["22", 0];
  }
  let modelRef = ["4", 0];
  let clipRef = ["4", 1];
  const loras = Array.isArray(payload.loras) ? payload.loras.filter((x) => x?.name) : [];
  loras.forEach((lora, index) => {
    const id = String(30 + index);
    workflow[id] = {
      class_type: "LoraLoader",
      inputs: {
        lora_name: lora.name,
        strength_model: Number.isFinite(Number(lora.strength_model)) ? Number(lora.strength_model) : 0.65,
        strength_clip: Number.isFinite(Number(lora.strength_clip)) ? Number(lora.strength_clip) : 0.65,
        model: modelRef,
        clip: clipRef,
      },
    };
    modelRef = [id, 0];
    clipRef = [id, 1];
  });
  workflow["6"].inputs.clip = clipRef;
  workflow["7"].inputs.clip = clipRef;
  workflow["3"].inputs.model = modelRef;
  return workflow;
}

function findComfyImage(history, promptId) {
  const root = history?.[promptId] || history;
  for (const output of Object.values(root?.outputs || {})) {
    const image = Array.isArray(output?.images) ? output.images[0] : null;
    if (image?.filename) return image;
  }
  return null;
}

async function renderComfy({ baseUrl, payload, checkpoint }) {
  const preparedPayload = await prepareComfyPayload(baseUrl, payload);
  const workflow = preparedPayload.workflow || buildComfyWorkflow(preparedPayload, checkpoint);
  const submitted = await fetchJson(`${baseUrl}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: workflow, client_id: randomUUID() }),
  }, 20000);
  const promptId = submitted.prompt_id;
  if (!promptId) throw new Error("ComfyUI did not return prompt_id");

  const started = Date.now();
  let image = null;
  while (Date.now() - started < 600000) {
    await sleep(1500);
    const history = await fetchJson(`${baseUrl}/history/${promptId}`, { method: "GET" }, 20000);
    image = findComfyImage(history, promptId);
    if (image) break;
  }
  if (!image) throw new Error("ComfyUI render timed out");

  const params = new URLSearchParams({
    filename: image.filename,
    subfolder: image.subfolder || "",
    type: image.type || "output",
  });
  return fetchDataUrlWithRetry(`${baseUrl}/view?${params.toString()}`, 120000, 4);
}

async function renderAutomatic1111({ baseUrl, payload }) {
  const data = await fetchJson(`${baseUrl}/sdapi/v1/txt2img`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const image = normalizeImage(data.images?.[0]);
  if (!image) throw new Error("Automatic1111 did not return image");
  return image;
}

async function renderNeurocineWorker({ baseUrl, payload, partIndex }) {
  const data = await fetchJson(`${baseUrl}/render-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, part_index: partIndex }),
  });
  const image = normalizeImage(data.image || data.data_url || data.dataUrl || data.images?.[0]);
  if (!image) throw new Error("NeuroCine worker did not return image");
  return image;
}

async function renderPayloadWithProvider({ provider, workerUrl, payload, partIndex, checkpoint }) {
  if (provider === "automatic1111") return renderAutomatic1111({ baseUrl: workerUrl, payload });
  if (provider === "neurocine-worker") return renderNeurocineWorker({ baseUrl: workerUrl, payload, partIndex });
  return renderComfy({ baseUrl: workerUrl, payload, checkpoint });
}

async function renderFrameGrid(job, config, payload) {
  const frames = Array.isArray(payload.frames) ? payload.frames.filter((frame) => frame?.prompt) : [];
  if (!frames.length) throw new Error("Frame-by-frame grid mode needs payload.frames");
  const cols = Math.max(1, Math.min(4, Number(payload.grid_cols || (frames.length <= 2 ? frames.length : 2)) || 2));
  const rows = Math.max(1, Math.ceil(frames.length / cols));
  const cellWidth = Math.max(256, Math.round(Number(payload.width || 936)));
  const cellHeight = Math.max(384, Math.round(Number(payload.height || 1664)));
  const requestedSeed = Number(payload.identity_seed ?? payload.seed);
  const baseSeed = Number.isFinite(requestedSeed) && requestedSeed >= 0
    ? Math.floor(requestedSeed)
    : Math.floor(Math.random() * 999999999);
  const rendered = [];

  for (let i = 0; i < frames.length; i += 1) {
    const frame = frames[i];
    const startProgress = Math.round(5 + (i / frames.length) * 84);
    await updateQueueJobProgress(config, job, {
      progress: startProgress,
      stage: "render_frame",
      message: `рендер кадра ${i + 1}/${frames.length}`,
    });
    const framePayload = {
      ...payload,
      prompt: frame.prompt,
      width: cellWidth,
      height: cellHeight,
      seed: baseSeed,
      filename_prefix: `neurocine_trailer_part_${String(job.part_index + 1).padStart(2, "0")}_frame_${String(i + 1).padStart(2, "0")}`,
    };
    if (frame.reference_anchor?.image_data) {
      framePayload.reference_anchor = frame.reference_anchor;
      framePayload.denoise = frame.reference_anchor.denoise || framePayload.denoise;
    }
    delete framePayload.frames;
    delete framePayload.workflow;
    rendered.push(await renderPayloadWithProvider({
      provider: config.provider,
      workerUrl: config.workerUrl,
      payload: framePayload,
      partIndex: job.part_index,
      checkpoint: config.checkpoint,
    }));
    const doneProgress = Math.round(5 + ((i + 1) / frames.length) * 84);
    await updateQueueJobProgress(config, job, {
      progress: doneProgress,
      stage: "render_frame_done",
      message: `кадр ${i + 1}/${frames.length} готов`,
    });
  }

  await updateQueueJobProgress(config, job, {
    progress: 94,
    stage: "compose_grid",
    message: "собираю PART-сетку",
  });

  return composeGridWithPillow({
    images: rendered,
    cols,
    rows,
    cellWidth,
    cellHeight,
    pythonBinary: config.python,
  });
}

async function renderJob(job, config) {
  const payload = {
    ...(job.payload || {}),
    prompt: job.prompt,
    negative_prompt: job.negative_prompt || job.payload?.negative_prompt || DEFAULT_NEGATIVE,
  };
  if (payload.render_mode === "frames_grid" && Array.isArray(payload.frames) && payload.frames.length) {
    return renderFrameGrid(job, config, payload);
  }
  await updateQueueJobProgress(config, job, {
    progress: 10,
    stage: "render_single",
    message: "рендер изображения",
  });
  return renderPayloadWithProvider({
    provider: config.provider,
    workerUrl: config.workerUrl,
    payload,
    partIndex: job.part_index,
    checkpoint: config.checkpoint,
  });
}

async function pollQueue(config) {
  return fetchJson(`${config.siteUrl}/api/trailer/local-queue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "poll", agent_token: config.token, provider: config.provider, limit: 1 }),
  }, 30000);
}

async function pollPcCommands(config) {
  return fetchJson(`${config.siteUrl}/api/trailer/local-queue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "poll_command", agent_token: config.token, provider: PC_COMMAND_PROVIDER, limit: 2 }),
  }, 30000);
}

async function completeQueueJob(config, job, result) {
  return fetchJson(`${config.siteUrl}/api/trailer/local-queue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "complete",
      agent_token: config.token,
      job_id: job.id,
      status: result.ok ? "done" : "failed",
      image: result.image || "",
      error: result.error || "",
      message: result.message || "",
    }),
  }, 120000);
}

async function executePcCommand(job, config, state) {
  const payload = job.payload && typeof job.payload === "object" ? job.payload : {};
  const command = String(payload.command || "").trim().toLowerCase();
  console.log(`[NeuroCine Agent] pc command: ${payload.command_label || command || job.id}`);

  if (command === "status") {
    const worker = await checkWorkerStatus(config);
    state.lastWorkerStatus = worker;
    return { ok: true, message: worker.ok ? "PC agent online. ComfyUI API online." : `PC agent online. ComfyUI API offline: ${worker.error}` };
  }

  if (command === "start_comfyui") {
    const message = await startComfyUi(config);
    state.lastWorkerStatus = await checkWorkerStatus(config);
    return { ok: true, message };
  }

  if (command === "restart_comfyui") {
    const stopped = await stopComfyUiProcesses(config);
    await sleep(2000);
    const message = await startComfyUi(config);
    state.lastWorkerStatus = await checkWorkerStatus(config);
    return { ok: true, message: `Stopped processes: ${stopped}. ${message}` };
  }

  if (command === "restart_agent") {
    await completeQueueJob(config, job, { ok: true, message: "Agent restarting now." });
    runDetached(process.execPath, process.argv.slice(1), { cwd: process.cwd(), env: process.env });
    setTimeout(() => process.exit(0), 600);
    return { ok: true, alreadyCompleted: true, message: "Agent restarting now." };
  }

  if (command === "reboot_pc") {
    await completeQueueJob(config, job, { ok: true, message: "Windows reboot scheduled in 15 seconds." });
    if (process.platform === "win32") {
      runDetached("shutdown.exe", ["/r", "/t", "15", "/c", "NeuroCine remote reboot"]);
    } else {
      runDetached("shutdown", ["-r", "+1"]);
    }
    return { ok: true, alreadyCompleted: true, message: "PC reboot scheduled." };
  }

  throw new Error(`Unsupported PC command: ${command || "empty"}`);
}

async function handlePcCommands(config, state) {
  const queue = await pollPcCommands(config);
  const commands = Array.isArray(queue.commands) ? queue.commands : [];
  for (const commandJob of commands) {
    try {
      const result = await executePcCommand(commandJob, config, state);
      if (!result.alreadyCompleted) {
        await completeQueueJob(config, commandJob, { ok: true, message: result.message || "Command done." });
      }
      console.log(`[NeuroCine Agent] pc command done: ${commandJob.part_label || commandJob.id}`);
    } catch (e) {
      await completeQueueJob(config, commandJob, { ok: false, error: e.message || "PC command failed" });
      console.error(`[NeuroCine Agent] pc command failed ${commandJob.part_label || commandJob.id}: ${e.message}`);
    }
  }
  return commands.length;
}

async function updateQueueJobProgress(config, job, patch = {}) {
  if (!job?.id) return null;
  try {
    return await fetchJson(`${config.siteUrl}/api/trailer/local-queue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "progress",
        agent_token: config.token,
        job_id: job.id,
        progress: patch.progress,
        stage: patch.stage || "",
        message: patch.message || "",
      }),
    }, 15000);
  } catch (e) {
    console.error(`[NeuroCine Agent] progress update skipped: ${e.message}`);
    return null;
  }
}

async function fetchOk(url, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: "GET", signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { ok: true, error: "" };
  } catch (e) {
    return { ok: false, error: e.message || "worker offline" };
  } finally {
    clearTimeout(timer);
  }
}

async function checkWorkerStatus(config) {
  if (config.provider === "automatic1111") {
    return fetchOk(`${config.workerUrl}/sdapi/v1/options`, 5000);
  }
  if (config.provider === "neurocine-worker") {
    return fetchOk(`${config.workerUrl}/health`, 5000);
  }
  return fetchOk(`${config.workerUrl}/system_stats`, 5000);
}

async function sendHeartbeat(config, workerStatus = null) {
  const worker = workerStatus || await checkWorkerStatus(config);
  const heartbeat = await fetchJson(`${config.siteUrl}/api/trailer/local-queue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "heartbeat",
      agent_token: config.token,
      provider: config.provider,
      worker_url: config.workerUrl,
      worker_ok: worker.ok,
      worker_error: worker.error,
      agent_version: "neurocine-local-agent-v1",
    }),
  }, 15000);
  return { heartbeat, worker };
}

function startHeartbeatLoop(config, state) {
  let heartbeatBusy = false;
  async function tick() {
    if (heartbeatBusy) return;
    heartbeatBusy = true;
    try {
      state.lastWorkerStatus = await checkWorkerStatus(config);
      const hb = await sendHeartbeat(config, state.lastWorkerStatus);
      const agent = hb?.heartbeat?.agent || {};
      const workerOk = agent.worker_ok ? "worker online" : `worker offline${agent.worker_error ? `: ${agent.worker_error}` : ""}`;
      console.log(`[NeuroCine Agent] heartbeat: ${workerOk}`);
    } catch (heartbeatError) {
      console.error(`[NeuroCine Agent] heartbeat error: ${heartbeatError.message}`);
    } finally {
      heartbeatBusy = false;
    }
  }

  const timer = setInterval(tick, config.heartbeatMs);
  tick();
  return () => clearInterval(timer);
}

async function main() {
  const provider = arg("provider", "comfyui");
  const defaultWorker = provider === "automatic1111" ? "http://127.0.0.1:7860" : "http://127.0.0.1:8188";
  const config = {
    siteUrl: cleanBaseUrl(arg("site", "http://localhost:3000"), "http://localhost:3000"),
    token: arg("token", ""),
    provider,
    workerUrl: cleanBaseUrl(arg("worker", defaultWorker), defaultWorker),
    checkpoint: arg("checkpoint", "RealVisXL_V5.0_fp16.safetensors"),
    python: arg("python", process.env.COMFYUI_PYTHON || process.env.PYTHON || DEFAULT_COMFY_PYTHON),
    comfyuiDir: arg("comfyui-dir", process.env.COMFYUI_DIR || DEFAULT_COMFY_DIR),
    comfyuiMain: arg("comfyui-main", ""),
    intervalMs: Math.max(1000, Number(arg("interval", "3000")) || 3000),
    heartbeatMs: Math.max(5000, Number(arg("heartbeat", "8000")) || 8000),
  };
  config.comfyuiMain = config.comfyuiMain || (config.comfyuiDir ? path.join(config.comfyuiDir, "main.py") : "");

  if (!config.token) {
    console.error("Нужен --token из блока NeuroCine Local Agent на сайте.");
    process.exit(1);
  }

  console.log(`[NeuroCine Agent] site=${config.siteUrl}`);
  console.log(`[NeuroCine Agent] provider=${config.provider} worker=${config.workerUrl}`);
  console.log(`[NeuroCine Agent] grid composer python=${config.python}`);
  if (config.provider === "comfyui") console.log(`[NeuroCine Agent] comfyui dir=${config.comfyuiDir || "not set"}`);
  console.log("[NeuroCine Agent] ждёт задания...");
  const state = { lastWorkerStatus: { ok: false, error: "worker status not checked yet" } };
  startHeartbeatLoop(config, state);

  while (true) {
    try {
      await handlePcCommands(config, state);

      if (!state.lastWorkerStatus.ok) {
        await sleep(config.intervalMs);
        continue;
      }

      const queue = await pollQueue(config);
      const jobs = Array.isArray(queue.jobs) ? queue.jobs : [];
      if (!jobs.length) {
        await sleep(config.intervalMs);
        continue;
      }

      for (const job of jobs) {
        console.log(`[NeuroCine Agent] render ${job.part_label || job.id}`);
        try {
          const image = await renderJob(job, config);
          await completeQueueJob(config, job, { ok: true, image });
          console.log(`[NeuroCine Agent] done ${job.part_label || job.id}`);
        } catch (e) {
          await completeQueueJob(config, job, { ok: false, error: e.message || "render failed" });
          console.error(`[NeuroCine Agent] failed ${job.part_label || job.id}: ${e.message}`);
        }
      }
    } catch (e) {
      console.error(`[NeuroCine Agent] queue error: ${e.message}`);
      await sleep(config.intervalMs * 2);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
