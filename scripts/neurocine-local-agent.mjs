#!/usr/bin/env node

import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { access, mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const DEFAULT_NEGATIVE = "bad hands, bad anatomy, deformed hands, deformed fingers, extra fingers, missing fingers, bad face, face asymmetry, eyes asymmetry, deformed eyes, deformed mouth, ugly, deformed, low quality, normal quality, lowres, low detail, blurry, soft focus, mushy texture, smeared skin, washed out, flat contrast, jpeg artifacts, overprocessed, oversmoothed skin, airbrushed skin, beauty retouching, fashion editorial, glossy glamour lighting, duplicate people, extra characters, text, subtitles, captions, watermark, UI, logo, frame labels, numbers, random hooded robe, random cloak, cult robe, anonymous hooded figure, contact sheet, gallery cards, nested grid, comic, illustration, painting, cartoon, anime, CGI, render, plastic skin";
const DEFAULT_COMFY_PYTHON = process.platform === "win32"
  ? "C:\\Users\\Admin\\AI\\ComfyUI\\.venv\\Scripts\\python.exe"
  : "python3";
const DEFAULT_COMFY_DIR = process.platform === "win32"
  ? "C:\\Users\\Admin\\AI\\ComfyUI"
  : "";
const PC_COMMAND_PROVIDER = "pc-command";
const PRODUCTION_DOWNLOADS = {
  checkpoint: "https://huggingface.co/SG161222/RealVisXL_V5.0/resolve/main/RealVisXL_V5.0_fp16.safetensors",
  ipadapter: "https://huggingface.co/h94/IP-Adapter/resolve/main/sdxl_models/ip-adapter-plus-face_sdxl_vit-h.safetensors",
  clipVision: "https://huggingface.co/h94/IP-Adapter/resolve/main/models/image_encoder/model.safetensors",
  upscale: "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth",
  ipadapterNode: "https://github.com/cubiq/ComfyUI_IPAdapter_plus.git",
};

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

async function fetchJson(url, options = {}, timeoutMs = 600000, attempts = 4) {
  return fetchJsonWithRetry(url, options, timeoutMs, attempts);
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
  if (payload.workflow) return payload;
  const rawAnchors = Array.isArray(payload.reference_anchors)
    ? payload.reference_anchors.filter((item) => item && typeof item === "object" && item.image_data)
    : [];
  if (rawAnchors.length) {
    const referenceAnchors = [];
    for (let index = 0; index < rawAnchors.length; index += 1) {
      const anchor = rawAnchors[index];
      const prefix = [payload.filename_prefix, anchor.kind, anchor.id || anchor.name || index].filter(Boolean).join("_");
      const initImage = await uploadComfyInputImage(baseUrl, anchor.image_data, prefix || `neurocine_ref_${index + 1}`);
      if (initImage) referenceAnchors.push({ ...anchor, init_image: initImage, image_data: "" });
    }
    const primary = referenceAnchors.find((item) => item.kind === "character")
      || referenceAnchors.find((item) => item.kind === "location")
      || referenceAnchors[0];
    return {
      ...payload,
      reference_anchors: referenceAnchors,
      init_image: payload.init_image || primary?.init_image || "",
      denoise: clampNumber(payload.denoise ?? primary?.denoise, 0.35, 0.95, 0.72),
      init_anchor_kind: primary?.kind || payload.init_anchor_kind || "reference",
      init_anchor_name: primary?.name || primary?.reference_name || payload.init_anchor_name || "",
    };
  }
  if (payload.init_image) return payload;
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
  const timeoutMs = Math.max(30000, Number(config.comfyuiStartTimeoutMs || 120000) || 120000);
  const startedAt = Date.now();
  runDetached(config.python, [config.comfyuiMain, "--listen", "127.0.0.1", "--port", String(port)], { cwd: config.comfyuiDir });
  while (Date.now() - startedAt < timeoutMs) {
    await sleep(2000);
    const status = await checkWorkerStatus(config);
    if (status.ok) return `ComfyUI started on port ${port}.`;
  }
  throw new Error(`ComfyUI start command was sent, but API did not become ready within ${Math.round(timeoutMs / 1000)} seconds.`);
}

async function autoStartWorkerIfNeeded(config, state, reason = "worker offline") {
  if (!config.autoStartWorker || config.provider !== "comfyui") return false;
  const now = Date.now();
  const last = Number(state.lastAutoStartAt || 0);
  if (state.autoStartBusy) return false;
  if (last && now - last < config.autoStartCooldownMs) return false;

  state.autoStartBusy = true;
  state.lastAutoStartAt = now;
  try {
    console.log(`[NeuroCine Agent] ComfyUI offline (${reason}); auto-starting...`);
    const message = await startComfyUi(config);
    state.lastWorkerStatus = await checkWorkerStatus(config);
    console.log(`[NeuroCine Agent] ${message}`);
    return state.lastWorkerStatus.ok === true;
  } catch (e) {
    state.lastWorkerStatus = await checkWorkerStatus(config);
    console.error(`[NeuroCine Agent] ComfyUI auto-start failed: ${e.message}`);
    return false;
  } finally {
    state.autoStartBusy = false;
  }
}

async function pathExists(filePath = "") {
  if (!filePath) return false;
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function findFileRecursive(rootDir = "", fileName = "", maxDepth = 3) {
  const target = String(fileName || "").trim().toLowerCase();
  if (!rootDir || !target) return "";
  const exact = path.join(rootDir, fileName);
  if (await pathExists(exact)) return exact;

  async function walk(dir, depth) {
    if (depth > maxDepth) return "";
    let entries = [];
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return "";
    }
    for (const entry of entries) {
      const next = path.join(dir, entry.name);
      if (entry.isFile() && entry.name.toLowerCase() === target) return next;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const found = await walk(path.join(dir, entry.name), depth + 1);
      if (found) return found;
    }
    return "";
  }

  return walk(rootDir, 0);
}

async function modelRequirement(config, folder, fileName, label, required = true) {
  const root = config.comfyuiDir ? path.join(config.comfyuiDir, "models", folder) : "";
  const found = await findFileRecursive(root, fileName, 4);
  return {
    key: folder,
    label,
    file: fileName,
    folder: root,
    ok: Boolean(found),
    required,
    path: found,
  };
}

function comfyModelPath(config, folder, fileName) {
  if (!config.comfyuiDir) throw new Error("Missing --comfyui-dir. Cannot install ComfyUI production files.");
  return path.join(config.comfyuiDir, "models", folder, fileName);
}

function productionInstallPayload(config) {
  return {
    production_quality: "slow_production",
    reference_mode: "ipadapter",
    pixel_upscale: true,
    checkpoint: config.checkpoint || "RealVisXL_V5.0_fp16.safetensors",
    ipadapter_model: "ip-adapter-plus-face_sdxl_vit-h.safetensors",
    clip_vision_model: "CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors",
    upscale_model: "RealESRGAN_x4plus.pth",
  };
}

function productionDownloadSpecs(config, payload = productionInstallPayload(config)) {
  const checkpoint = String(payload.checkpoint || config.checkpoint || "").trim();
  const checkpointUrl = process.env.NEUROCINE_CHECKPOINT_URL
    || process.env.REALVISXL_URL
    || (checkpoint === "RealVisXL_V5.0_fp16.safetensors" ? PRODUCTION_DOWNLOADS.checkpoint : "");
  return [
    {
      key: "checkpoint",
      label: `checkpoint ${checkpoint}`,
      folder: "checkpoints",
      file: checkpoint,
      url: checkpointUrl,
      required: true,
    },
    {
      key: "ipadapter",
      label: `IPAdapter ${payload.ipadapter_model}`,
      folder: "ipadapter",
      file: payload.ipadapter_model,
      url: process.env.NEUROCINE_IPADAPTER_URL || PRODUCTION_DOWNLOADS.ipadapter,
      required: true,
    },
    {
      key: "clip_vision",
      label: `CLIP Vision ${payload.clip_vision_model}`,
      folder: "clip_vision",
      file: payload.clip_vision_model,
      url: process.env.NEUROCINE_CLIP_VISION_URL || PRODUCTION_DOWNLOADS.clipVision,
      required: true,
    },
    {
      key: "upscale",
      label: `upscale ${payload.upscale_model}`,
      folder: "upscale_models",
      file: payload.upscale_model,
      url: process.env.NEUROCINE_UPSCALE_URL || PRODUCTION_DOWNLOADS.upscale,
      required: true,
    },
  ].filter((item) => item.file);
}

async function downloadFile(url, destination, label = "file") {
  if (!url) {
    return { ok: false, skipped: true, message: `${label}: no download URL configured` };
  }
  if (await pathExists(destination)) {
    return { ok: true, skipped: true, message: `${label}: already exists` };
  }
  await mkdir(path.dirname(destination), { recursive: true });
  const partial = `${destination}.partial`;
  await rm(partial, { force: true }).catch(() => {});
  try {
    console.log(`[NeuroCine Agent] downloading ${label} -> ${destination}`);
    const res = await fetch(url, { headers: { "User-Agent": "NeuroCine-Local-Agent/1.0" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (!res.body) {
      await writeFile(partial, Buffer.from(await res.arrayBuffer()));
    } else {
      await pipeline(Readable.fromWeb(res.body), createWriteStream(partial));
    }
    await rename(partial, destination);
    return { ok: true, downloaded: true, message: `${label}: downloaded` };
  } catch (e) {
    await rm(partial, { force: true }).catch(() => {});
    throw new Error(`${label} download failed: ${e.message}`);
  }
}

async function downloadMissingModel(config, spec) {
  const destination = comfyModelPath(config, spec.folder, spec.file);
  if (await pathExists(destination)) return { ok: true, skipped: true, message: `${spec.label}: already exists` };
  return downloadFile(spec.url, destination, spec.label);
}

async function ensureGitRepo(url, destination, label = "custom node") {
  await mkdir(path.dirname(destination), { recursive: true });
  const gitDir = path.join(destination, ".git");
  if (await pathExists(gitDir)) {
    console.log(`[NeuroCine Agent] updating ${label}: ${destination}`);
    await runProcess("git", ["pull", "--ff-only"], { cwd: destination });
    return { ok: true, updated: true, message: `${label}: updated` };
  }
  if (await pathExists(destination)) {
    return {
      ok: true,
      skipped: true,
      message: `${label}: folder already exists, not a git repo`,
    };
  }
  console.log(`[NeuroCine Agent] cloning ${label}: ${url}`);
  await runProcess("git", ["clone", "--depth", "1", url, destination], { cwd: path.dirname(destination) });
  return { ok: true, installed: true, message: `${label}: installed` };
}

async function installNodeRequirements(config, nodeDir, label = "custom node") {
  const requirements = path.join(nodeDir, "requirements.txt");
  if (!(await pathExists(requirements))) {
    return { ok: true, skipped: true, message: `${label}: no requirements.txt` };
  }
  console.log(`[NeuroCine Agent] installing requirements for ${label}`);
  await runProcess(config.python || DEFAULT_COMFY_PYTHON, ["-m", "pip", "install", "-r", requirements], { cwd: nodeDir });
  return { ok: true, installed: true, message: `${label}: requirements installed` };
}

async function installProductionAssets(config) {
  if (config.provider !== "comfyui") throw new Error("Production install works only with ComfyUI provider.");
  if (!config.comfyuiDir) throw new Error("Missing --comfyui-dir.");

  const payload = productionInstallPayload(config);
  const workerBefore = await checkWorkerStatus(config);
  const before = await getProductionReadiness(config, workerBefore.ok, payload);
  const actions = [];
  let nodeChanged = false;

  const ipadapterNodeDir = path.join(config.comfyuiDir, "custom_nodes", "ComfyUI_IPAdapter_plus");
  const ipadapterNodeOk = await customNodeFolderExists(config, ["ComfyUI_IPAdapter_plus", "ComfyUI_IPAdapter_plus-main"]);
  if (!ipadapterNodeOk) {
    const repo = await ensureGitRepo(PRODUCTION_DOWNLOADS.ipadapterNode, ipadapterNodeDir, "ComfyUI IPAdapter Plus");
    actions.push(repo.message);
    const req = await installNodeRequirements(config, ipadapterNodeDir, "ComfyUI IPAdapter Plus");
    actions.push(req.message);
    nodeChanged = repo.installed === true || repo.updated === true || req.installed === true;
  }

  for (const spec of productionDownloadSpecs(config, payload)) {
    const result = await downloadMissingModel(config, spec);
    actions.push(result.message);
  }

  if (nodeChanged && workerBefore.ok && process.platform === "win32") {
    const queue = await getWorkerQueueStatus(config, true);
    if (!queue.active && !queue.pending_count) {
      const stopped = await stopComfyUiProcesses(config);
      await sleep(2000);
      const started = await startComfyUi(config);
      actions.push(`ComfyUI restarted after node install, stopped: ${stopped}. ${started}`);
    } else {
      actions.push("ComfyUI is busy; restart it after render to load new nodes.");
    }
  }

  const workerAfter = await checkWorkerStatus(config);
  const after = await getProductionReadiness(config, workerAfter.ok, payload);
  const prefix = after.ready ? "Production install complete." : "Production install incomplete.";
  const beforeText = before.ready ? "was ready" : `was missing ${before.missing?.length || 0}`;
  const afterText = after.ready ? "ready now" : productionReadinessMessage(after);
  return {
    ok: after.ready,
    message: `${prefix} Before: ${beforeText}; after: ${afterText}. ${actions.filter(Boolean).slice(0, 10).join(" ")}`,
  };
}

async function loadComfyObjectInfo(config, workerOk = false) {
  if (!workerOk || config.provider !== "comfyui") return {};
  try {
    return await fetchJson(`${config.workerUrl}/object_info`, { method: "GET" }, 12000, 1);
  } catch {
    return {};
  }
}

function objectInfoHas(objectInfo = {}, classNames = []) {
  return classNames.every((name) => Boolean(objectInfo?.[name]));
}

async function customNodeFolderExists(config, folders = []) {
  if (!config.comfyuiDir) return false;
  for (const folder of folders) {
    if (await pathExists(path.join(config.comfyuiDir, "custom_nodes", folder))) return true;
  }
  return false;
}

async function nodeRequirement(config, objectInfo, spec) {
  const objectOk = objectInfoHas(objectInfo, spec.class_names || []);
  const folderOk = await customNodeFolderExists(config, spec.folders || []);
  return {
    key: spec.key,
    label: spec.label,
    ok: objectOk || folderOk,
    required: spec.required !== false,
    classes: spec.class_names || [],
    folders: spec.folders || [],
  };
}

function productionNeeds(payload = {}) {
  const quality = String(payload.production_quality || "").toLowerCase();
  const referenceMode = String(payload.reference_mode || "").toLowerCase();
  const family = String(payload.model_family || "sdxl").toLowerCase();
  return {
    production: quality.includes("production") || payload.workflow_mode === "sdxl_hires",
    ipadapter: referenceMode === "ipadapter" || Boolean(payload.ipadapter_model) || quality.includes("production"),
    upscale: payload.pixel_upscale === true || Boolean(payload.upscale_model) || quality.includes("production"),
    wan: family.includes("wan") || quality.includes("wan"),
  };
}

async function getProductionReadiness(config, workerOk = false, payload = {}) {
  const needs = productionNeeds(payload);
  const checkpoint = String(payload.checkpoint || config.checkpoint || "RealVisXL_V5.0_fp16.safetensors").trim();
  const ipadapterModel = String(payload.ipadapter_model || "ip-adapter-plus-face_sdxl_vit-h.safetensors").trim();
  const clipVisionModel = String(payload.clip_vision_model || "CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors").trim();
  const upscaleModel = String(payload.upscale_model || "RealESRGAN_x4plus.pth").trim();
  const models = [];
  const nodes = [];

  if (config.provider !== "comfyui") {
    return {
      status: "unsupported",
      ready: false,
      checked_at: new Date().toISOString(),
      missing: ["Production check работает только для ComfyUI."],
      warnings: [],
      models,
      nodes,
      comfyui_dir: config.comfyuiDir || "",
    };
  }

  models.push(await modelRequirement(config, "checkpoints", checkpoint, `checkpoint: ${checkpoint}`, true));
  if (needs.ipadapter) {
    models.push(await modelRequirement(config, "ipadapter", ipadapterModel, `IPAdapter: ${ipadapterModel}`, true));
    models.push(await modelRequirement(config, "clip_vision", clipVisionModel, `CLIP Vision: ${clipVisionModel}`, true));
  }
  if (needs.upscale) {
    models.push(await modelRequirement(config, "upscale_models", upscaleModel, `Upscale: ${upscaleModel}`, true));
  }

  const objectInfo = await loadComfyObjectInfo(config, workerOk);
  if (needs.ipadapter) {
    nodes.push(await nodeRequirement(config, objectInfo, {
      key: "ipadapter_plus",
      label: "ComfyUI IPAdapter Plus nodes",
      class_names: ["IPAdapterModelLoader", "IPAdapterAdvanced", "CLIPVisionLoader"],
      folders: ["ComfyUI_IPAdapter_plus", "ComfyUI_IPAdapter_plus-main"],
    }));
  }
  if (needs.upscale && workerOk) {
    nodes.push({
      key: "upscale_nodes",
      label: "ComfyUI upscale nodes",
      ok: objectInfoHas(objectInfo, ["UpscaleModelLoader", "ImageUpscaleWithModel"]),
      required: true,
      classes: ["UpscaleModelLoader", "ImageUpscaleWithModel"],
      folders: [],
    });
  }

  nodes.push(await nodeRequirement(config, objectInfo, {
    key: "wan22_optional",
    label: "Wan2.2 video nodes (optional next stage)",
    class_names: ["WanVideoSampler"],
    folders: ["ComfyUI-WanVideoWrapper", "ComfyUI_WanVideoWrapper"],
    required: false,
  }));

  const missing = [
    ...models.filter((item) => item.required && !item.ok).map((item) => item.label),
    ...nodes.filter((item) => item.required && !item.ok).map((item) => item.label),
  ];
  const warnings = [
    ...models.filter((item) => !item.required && !item.ok).map((item) => item.label),
    ...nodes.filter((item) => !item.required && !item.ok).map((item) => item.label),
  ];

  return {
    status: missing.length ? "missing" : "ready",
    ready: missing.length === 0,
    checked_at: new Date().toISOString(),
    comfyui_dir: config.comfyuiDir || "",
    worker_online: workerOk,
    needs,
    missing,
    warnings,
    models,
    nodes,
  };
}

function productionReadinessMessage(readiness = {}) {
  if (readiness.ready) {
    const warn = readiness.warnings?.length ? ` Optional missing: ${readiness.warnings.slice(0, 3).join("; ")}.` : "";
    return `Production pipeline ready.${warn}`;
  }
  const missing = Array.isArray(readiness.missing) ? readiness.missing.slice(0, 6).join("; ") : "unknown requirements";
  return `Production pipeline missing: ${missing}`;
}

async function assertProductionReady(config, payload = {}) {
  if (config.provider !== "comfyui") return;
  const needs = productionNeeds(payload);
  if (!needs.production && !needs.ipadapter && !needs.upscale && !needs.wan) return;
  const worker = await checkWorkerStatus(config);
  if (!worker.ok) throw new Error(`ComfyUI offline: ${worker.error}`);
  const readiness = await getProductionReadiness(config, worker.ok, payload);
  if (!readiness.ready) {
    throw new Error(`${productionReadinessMessage(readiness)}. Установи недостающие модели/ноды или выбери debug-пресет.`);
  }
}

async function composeGridWithPillow({ images, cols, rows, cellWidth, cellHeight, pythonBinary, outputFormat = "jpeg", jpegQuality = 97 }) {
  if (!images.length) throw new Error("No frame images to compose");
  const tempRoot = await mkdir(path.join(tmpdir(), `neurocine-grid-${Date.now()}-${Math.random().toString(36).slice(2)}`), { recursive: true });
  const manifestPath = path.join(tempRoot, "manifest.json");
  const scriptPath = path.join(tempRoot, "compose_grid.py");
  const safeFormat = String(outputFormat || "jpeg").toLowerCase() === "png" ? "png" : "jpeg";
  const outputPath = path.join(tempRoot, safeFormat === "png" ? "grid.png" : "grid.jpg");
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
      output_format: safeFormat,
      jpeg_quality: Math.max(90, Math.min(98, Math.round(Number(jpegQuality) || 97))),
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
output_format = str(data.get("output_format", "jpeg")).lower()
jpeg_quality = int(data.get("jpeg_quality", 97))

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

if output_format == "png":
    canvas.save(data["output"], "PNG", compress_level=1, optimize=False)
else:
    canvas.save(data["output"], "JPEG", quality=jpeg_quality, subsampling=0, optimize=False)
`, "utf8");
    await runProcess(pythonBinary, [scriptPath, manifestPath]);
    const buffer = await readFile(outputPath);
    const mime = safeFormat === "png" ? "image/png" : "image/jpeg";
    return {
      image: `data:${mime};base64,${buffer.toString("base64")}`,
      bytes: buffer.length,
      width: cols * cellWidth,
      height: rows * cellHeight,
      mime,
    };
  } catch (e) {
    throw new Error(`Grid compose failed: ${e.message}. Install/keep Pillow in ComfyUI venv or pass --python to the local agent.`);
  } finally {
    await rm(tempRoot, { recursive: true, force: true }).catch(() => {});
  }
}

function buildComfyWorkflow(payload = {}, checkpoint) {
  const width = Number(payload.width || 936);
  const height = Number(payload.height || 1664);
  const useHires = payload.workflow_mode === "sdxl_hires" || payload.hires === true || Number(payload.hires_steps || 0) > 0;
  const usePixelUpscale = payload.pixel_upscale === true || payload.upscale_model;
  const baseWidth = useHires
    ? Math.max(512, Math.round(Number(payload.base_width || Math.min(width, Math.round(width * 0.72))) / 8) * 8)
    : width;
  const baseHeight = useHires
    ? Math.max(768, Math.round(Number(payload.base_height || Math.min(height, Math.round(height * 0.72))) / 8) * 8)
    : height;
  const steps = Number(payload.steps || 24);
  const hiresSteps = Math.max(4, Math.min(30, Number(payload.hires_steps || 10) || 10));
  const hiresDenoise = clampNumber(payload.hires_denoise, 0.18, 0.55, 0.32);
  const cfg = Number(payload.cfg_scale || payload.cfg || 6);
  const hasInitImage = Boolean(payload.init_image);
  const preparedAnchors = Array.isArray(payload.reference_anchors)
    ? payload.reference_anchors.filter((item) => item && typeof item === "object" && item.init_image)
    : [];
  const referenceMode = String(payload.reference_mode || (hasInitImage ? "ipadapter" : "none")).toLowerCase();
  const useIpAdapter = (hasInitImage || preparedAnchors.length) && referenceMode !== "img2img" && referenceMode !== "none";
  const useInitLatent = hasInitImage && referenceMode === "img2img";
  const denoise = useInitLatent ? clampNumber(payload.denoise, 0.35, 0.95, 0.72) : 1;
  const seed = Number.isFinite(Number(payload.seed)) && Number(payload.seed) >= 0
    ? Math.floor(Number(payload.seed))
    : Math.floor(Math.random() * 999999999);
  if (String(payload.model_family || "sdxl").toLowerCase() === "flux") {
    throw new Error("FLUX requires a ComfyUI workflow template in payload.workflow. Paste a workflow JSON template in the web UI.");
  }
  const workflow = {
    "4": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: payload.checkpoint || checkpoint } },
    "5": { class_type: "EmptyLatentImage", inputs: { width: baseWidth, height: baseHeight, batch_size: 1 } },
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
  if (useHires) {
    workflow["10"] = {
      class_type: "LatentUpscale",
      inputs: {
        samples: ["3", 0],
        upscale_method: payload.latent_upscale_method || "bislerp",
        width,
        height,
        crop: "disabled",
      },
    };
    workflow["11"] = {
      class_type: "KSampler",
      inputs: {
        seed: seed + 1,
        steps: hiresSteps,
        cfg,
        sampler_name: payload.hires_sampler_name || payload.sampler_name || "dpmpp_2m",
        scheduler: payload.hires_scheduler || payload.scheduler || "karras",
        denoise: hiresDenoise,
        model: ["4", 0],
        positive: ["6", 0],
        negative: ["7", 0],
        latent_image: ["10", 0],
      },
    };
    workflow["8"].inputs.samples = ["11", 0];
  }
  if (hasInitImage) {
    workflow["20"] = { class_type: "LoadImage", inputs: { image: payload.init_image } };
    workflow["21"] = {
      class_type: "ImageScale",
      inputs: {
        image: ["20", 0],
        upscale_method: "lanczos",
        width: baseWidth,
        height: baseHeight,
        crop: "center",
      },
    };
    workflow["22"] = { class_type: "VAEEncode", inputs: { pixels: ["21", 0], vae: ["4", 2] } };
    if (useInitLatent) workflow["3"].inputs.latent_image = ["22", 0];
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
  if (useIpAdapter) {
    workflow["24"] = {
      class_type: "IPAdapterModelLoader",
      inputs: {
        ipadapter_file: payload.ipadapter_model || "ip-adapter-plus-face_sdxl_vit-h.safetensors",
      },
    };
    workflow["25"] = {
      class_type: "CLIPVisionLoader",
      inputs: {
        clip_name: payload.clip_vision_model || "CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors",
      },
    };
    const anchors = preparedAnchors.length
      ? preparedAnchors
      : [{ kind: payload.init_anchor_kind || "reference", init_image: payload.init_image }];
    const sortedAnchors = anchors
      .map((item, index) => ({ ...item, _index: index }))
      .sort((a, b) => {
        const rank = { style: 1, location: 2, character: 3 };
        return (rank[a.kind] || 2) - (rank[b.kind] || 2) || a._index - b._index;
      })
      .slice(0, 3);
    sortedAnchors.forEach((anchor, index) => {
      const loadId = String(260 + index * 3);
      const scaleId = String(261 + index * 3);
      const adapterId = String(262 + index * 3);
      const imageRef = index === 0 && hasInitImage && anchor.init_image === payload.init_image && workflow["21"]
        ? ["21", 0]
        : [scaleId, 0];
      if (!(index === 0 && hasInitImage && anchor.init_image === payload.init_image && workflow["21"])) {
        workflow[loadId] = { class_type: "LoadImage", inputs: { image: anchor.init_image } };
        workflow[scaleId] = {
          class_type: "ImageScale",
          inputs: {
            image: [loadId, 0],
            upscale_method: "lanczos",
            width: baseWidth,
            height: baseHeight,
            crop: "center",
          },
        };
      }
      workflow[adapterId] = {
        class_type: "IPAdapterAdvanced",
        inputs: {
          model: modelRef,
          ipadapter: ["24", 0],
          image: imageRef,
          weight: clampNumber(anchor.ipadapter_weight ?? payload.ipadapter_weight, 0.15, 1.35, 0.72),
          weight_type: anchor.ipadapter_weight_type || payload.ipadapter_weight_type || "linear",
          combine_embeds: anchor.ipadapter_combine_embeds || payload.ipadapter_combine_embeds || "average",
          start_at: clampNumber(anchor.ipadapter_start_at ?? payload.ipadapter_start_at, 0, 1, 0),
          end_at: clampNumber(anchor.ipadapter_end_at ?? payload.ipadapter_end_at, 0, 1, 0.82),
          embeds_scaling: anchor.ipadapter_embeds_scaling || payload.ipadapter_embeds_scaling || "K+V",
          clip_vision: ["25", 0],
        },
      };
      modelRef = [adapterId, 0];
    });
  }
  workflow["6"].inputs.clip = clipRef;
  workflow["7"].inputs.clip = clipRef;
  workflow["3"].inputs.model = modelRef;
  if (workflow["11"]) workflow["11"].inputs.model = modelRef;
  if (usePixelUpscale) {
    workflow["40"] = {
      class_type: "UpscaleModelLoader",
      inputs: { model_name: payload.upscale_model || "RealESRGAN_x4plus.pth" },
    };
    workflow["41"] = {
      class_type: "ImageUpscaleWithModel",
      inputs: { upscale_model: ["40", 0], image: ["8", 0] },
    };
    workflow["42"] = {
      class_type: "ImageScale",
      inputs: {
        image: ["41", 0],
        upscale_method: payload.final_downscale_method || "lanczos",
        width,
        height,
        crop: "disabled",
      },
    };
    workflow["9"].inputs.images = ["42", 0];
  }
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
  const referenceBank = payload.reference_bank && typeof payload.reference_bank === "object" ? payload.reference_bank : {};
  const resolveReferenceAnchor = (anchor = null) => {
    if (!anchor || typeof anchor !== "object") return null;
    const banked = anchor.bank_key ? referenceBank[anchor.bank_key] : null;
    return { ...(banked && typeof banked === "object" ? banked : {}), ...anchor, image_data: anchor.image_data || banked?.image_data || "" };
  };

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
      seed: baseSeed + i * 9973,
      filename_prefix: `neurocine_trailer_part_${String(job.part_index + 1).padStart(2, "0")}_frame_${String(i + 1).padStart(2, "0")}`,
    };
    const resolvedAnchors = Array.isArray(frame.reference_anchors)
      ? frame.reference_anchors.map(resolveReferenceAnchor).filter((item) => item?.image_data).slice(0, 3)
      : [];
    const resolvedSingleAnchor = resolveReferenceAnchor(frame.reference_anchor);
    if (resolvedAnchors.length) {
      framePayload.reference_anchors = resolvedAnchors;
      framePayload.reference_anchor = framePayload.reference_anchors.find((item) => item.kind === "character")
        || framePayload.reference_anchors.find((item) => item.kind === "location")
        || framePayload.reference_anchors[0];
      framePayload.reference_mode = framePayload.reference_anchor.reference_mode || framePayload.reference_mode || "ipadapter";
      framePayload.denoise = framePayload.reference_anchor.denoise || framePayload.denoise;
    } else if (resolvedSingleAnchor?.image_data) {
      framePayload.reference_anchor = resolvedSingleAnchor;
      framePayload.denoise = resolvedSingleAnchor.denoise || framePayload.denoise;
      framePayload.reference_mode = resolvedSingleAnchor.reference_mode || framePayload.reference_mode || "ipadapter";
      framePayload.ipadapter_weight = resolvedSingleAnchor.ipadapter_weight || framePayload.ipadapter_weight;
      framePayload.ipadapter_start_at = resolvedSingleAnchor.ipadapter_start_at ?? framePayload.ipadapter_start_at;
      framePayload.ipadapter_end_at = resolvedSingleAnchor.ipadapter_end_at || framePayload.ipadapter_end_at;
      framePayload.ipadapter_weight_type = resolvedSingleAnchor.ipadapter_weight_type || framePayload.ipadapter_weight_type;
      framePayload.ipadapter_embeds_scaling = resolvedSingleAnchor.ipadapter_embeds_scaling || framePayload.ipadapter_embeds_scaling;
    }
    delete framePayload.frames;
    delete framePayload.workflow;
    delete framePayload.reference_bank;
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
    outputFormat: payload.grid_output_format || "jpeg",
    jpegQuality: payload.grid_jpeg_quality || 97,
  });
}

async function renderJob(job, config) {
  const payload = {
    ...(job.payload || {}),
    prompt: job.prompt,
    negative_prompt: job.negative_prompt || job.payload?.negative_prompt || DEFAULT_NEGATIVE,
  };
  await assertProductionReady(config, payload);
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
  const output = result.image && typeof result.image === "object" ? result.image : null;
  return fetchJson(`${config.siteUrl}/api/trailer/local-queue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "complete",
      agent_token: config.token,
      job_id: job.id,
      status: result.ok ? "done" : "failed",
      image: output?.image || result.image || "",
      output_meta: output ? {
        bytes: output.bytes || 0,
        width: output.width || 0,
        height: output.height || 0,
        mime: output.mime || "image/png",
      } : null,
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
    const readiness = await getProductionReadiness(config, worker.ok, {
      production_quality: "slow_production",
      reference_mode: "ipadapter",
      pixel_upscale: true,
      checkpoint: config.checkpoint,
    });
    state.lastWorkerStatus = worker;
    const workerMessage = worker.ok ? "PC agent online. ComfyUI API online." : `PC agent online. ComfyUI API offline: ${worker.error}`;
    return { ok: true, message: `${workerMessage} ${productionReadinessMessage(readiness)}` };
  }

  if (command === "production_check") {
    const worker = await checkWorkerStatus(config);
    const readiness = await getProductionReadiness(config, worker.ok, {
      production_quality: "slow_production",
      reference_mode: "ipadapter",
      pixel_upscale: true,
      checkpoint: config.checkpoint,
    });
    state.lastWorkerStatus = worker;
    return { ok: readiness.ready, message: productionReadinessMessage(readiness) };
  }

  if (command === "install_production") {
    const result = await installProductionAssets(config);
    state.lastWorkerStatus = await checkWorkerStatus(config);
    return result;
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

  if (command === "sleep_pc") {
    await completeQueueJob(config, job, { ok: true, message: "Windows sleep scheduled in 5 seconds." });
    if (process.platform === "win32") {
      runDetached("powershell.exe", [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        "Start-Sleep -Seconds 5; Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Application]::SetSuspendState([System.Windows.Forms.PowerState]::Suspend, $false, $false)",
      ]);
    } else {
      runDetached("systemctl", ["suspend"]);
    }
    return { ok: true, alreadyCompleted: true, message: "PC sleep scheduled." };
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
        await completeQueueJob(config, commandJob, {
          ok: result.ok !== false,
          message: result.ok === false ? "" : (result.message || "Command done."),
          error: result.ok === false ? (result.message || "PC command failed") : "",
        });
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

function nodeByClass(workflow = {}, classType = "") {
  return Object.values(workflow || {}).find((node) => node?.class_type === classType) || null;
}

function extractPromptSection(text = "", header = "") {
  const raw = String(text || "");
  const index = raw.indexOf(header);
  if (index < 0) return "";
  const rest = raw.slice(index + header.length);
  return rest.split(/\n\s*\n/)[0].replace(/\s+/g, " ").trim().slice(0, 260);
}

function summarizeComfyQueueEntry(entry = []) {
  const promptId = String(entry?.[1] || "");
  const workflow = entry?.[2] && typeof entry[2] === "object" ? entry[2] : {};
  const sampler = nodeByClass(workflow, "KSampler")?.inputs || {};
  const checkpoint = nodeByClass(workflow, "CheckpointLoaderSimple")?.inputs || {};
  const latent = nodeByClass(workflow, "EmptyLatentImage")?.inputs || {};
  const hiresLatent = nodeByClass(workflow, "LatentUpscale")?.inputs || {};
  const save = nodeByClass(workflow, "SaveImage")?.inputs || {};
  const positive = nodeByClass(workflow, "CLIPTextEncode")?.inputs?.text || "";
  const frameMatch = String(positive || "").match(/This is PART\s+(\d+),\s*frame\s+(\d+)\s+of\s+(\d+)/i);
  const label = frameMatch ? `PART ${frameMatch[1]}, кадр ${frameMatch[2]}/${frameMatch[3]}` : "";
  return {
    prompt_id: promptId,
    part: frameMatch ? `PART ${frameMatch[1]}` : "",
    frame: frameMatch ? `${frameMatch[2]}/${frameMatch[3]}` : "",
    label,
    filename_prefix: String(save.filename_prefix || "").slice(0, 160),
    checkpoint: String(checkpoint.ckpt_name || "").slice(0, 160),
    size: (hiresLatent.width && hiresLatent.height)
      ? `${hiresLatent.width}x${hiresLatent.height}`
      : latent.width && latent.height ? `${latent.width}x${latent.height}` : "",
    steps: Number(sampler.steps || 0) || 0,
    cfg: Number(sampler.cfg || 0) || 0,
    sampler: String(sampler.sampler_name || "").slice(0, 120),
    scheduler: String(sampler.scheduler || "").slice(0, 120),
    visual_beat: extractPromptSection(positive, "VISUAL BEAT:"),
  };
}

async function getWorkerQueueStatus(config, workerOk = false) {
  if (!workerOk || config.provider !== "comfyui") {
    return {
      active: false,
      running_count: 0,
      pending_count: 0,
      status: workerOk ? "idle" : "offline",
      updated_at: new Date().toISOString(),
      current: {},
    };
  }
  try {
    const data = await fetchJson(`${config.workerUrl}/queue`, { method: "GET" }, 8000, 1);
    const running = Array.isArray(data.queue_running) ? data.queue_running : [];
    const pending = Array.isArray(data.queue_pending) ? data.queue_pending : [];
    const current = running.length ? summarizeComfyQueueEntry(running[0]) : {};
    return {
      active: running.length > 0,
      running_count: running.length,
      pending_count: pending.length,
      status: running.length ? "running" : pending.length ? "pending" : "idle",
      updated_at: new Date().toISOString(),
      current,
    };
  } catch (e) {
    return {
      active: false,
      running_count: 0,
      pending_count: 0,
      status: "unknown",
      updated_at: new Date().toISOString(),
      error: e.message || "queue status failed",
      current: {},
    };
  }
}

async function sendHeartbeat(config, workerStatus = null) {
  const worker = workerStatus || await checkWorkerStatus(config);
  const workerQueue = await getWorkerQueueStatus(config, worker.ok);
  const productionReadiness = await getProductionReadiness(config, worker.ok, {
    production_quality: "slow_production",
    reference_mode: "ipadapter",
    pixel_upscale: true,
    checkpoint: config.checkpoint,
  });
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
      worker_queue: {
        ...workerQueue,
        production_readiness: productionReadiness,
      },
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
      const queue = agent.worker_queue || {};
      const queueText = queue.active
        ? `, ComfyUI ${queue.current?.label || "rendering"}`
        : queue.pending_count
          ? `, ComfyUI pending ${queue.pending_count}`
          : "";
      console.log(`[NeuroCine Agent] heartbeat: ${workerOk}${queueText}`);
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
    autoStartWorker: String(arg("auto-start-worker", process.env.NEUROCINE_AUTO_START_WORKER || "true")).toLowerCase() !== "false",
    autoStartCooldownMs: Math.max(10000, Number(arg("auto-start-cooldown", "60000")) || 60000),
    comfyuiStartTimeoutMs: Math.max(30000, Number(arg("comfyui-start-timeout", process.env.COMFYUI_START_TIMEOUT || "120000")) || 120000),
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
  if (config.provider === "comfyui") console.log(`[NeuroCine Agent] comfyui auto-start=${config.autoStartWorker ? "on" : "off"}`);
  console.log("[NeuroCine Agent] ждёт задания...");
  const state = { lastWorkerStatus: { ok: false, error: "worker status not checked yet" }, autoStartBusy: false, lastAutoStartAt: 0 };
  startHeartbeatLoop(config, state);

  while (true) {
    try {
      await handlePcCommands(config, state);

      if (!state.lastWorkerStatus.ok) {
        await autoStartWorkerIfNeeded(config, state, state.lastWorkerStatus.error || "worker offline");
      }

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
