#!/usr/bin/env node

import { randomUUID } from "node:crypto";

const DEFAULT_NEGATIVE = "text, subtitles, captions, watermark, UI, logo, frame labels, numbers, contact sheet, gallery cards, nested grid, comic, illustration, painting, cartoon, anime, CGI, render, plastic skin";

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
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || json.detail || `HTTP ${res.status}`);
    return json;
  } finally {
    clearTimeout(timer);
  }
}

function normalizeImage(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("data:image/")) return raw;
  return `data:image/png;base64,${raw}`;
}

function buildComfyWorkflow(payload = {}, checkpoint) {
  const width = Number(payload.width || 936);
  const height = Number(payload.height || 1664);
  const steps = Number(payload.steps || 24);
  const cfg = Number(payload.cfg_scale || payload.cfg || 6);
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
        denoise: 1,
        model: ["4", 0],
        positive: ["6", 0],
        negative: ["7", 0],
        latent_image: ["5", 0],
      },
    },
    "8": { class_type: "VAEDecode", inputs: { samples: ["3", 0], vae: ["4", 2] } },
    "9": { class_type: "SaveImage", inputs: { filename_prefix: "neurocine_trailer_part", images: ["8", 0] } },
  };
  let modelRef = ["4", 0];
  let clipRef = ["4", 1];
  const loras = Array.isArray(payload.loras) ? payload.loras.filter((x) => x?.name) : [];
  loras.forEach((lora, index) => {
    const id = String(10 + index);
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
  const workflow = payload.workflow || buildComfyWorkflow(payload, checkpoint);
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
  const res = await fetch(`${baseUrl}/view?${params.toString()}`);
  if (!res.ok) throw new Error(`ComfyUI image download failed: HTTP ${res.status}`);
  const contentType = res.headers.get("content-type") || "image/png";
  const buffer = Buffer.from(await res.arrayBuffer());
  return `data:${contentType};base64,${buffer.toString("base64")}`;
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

async function renderJob(job, config) {
  const payload = {
    ...(job.payload || {}),
    prompt: job.prompt,
    negative_prompt: job.negative_prompt || job.payload?.negative_prompt || DEFAULT_NEGATIVE,
  };
  if (config.provider === "automatic1111") return renderAutomatic1111({ baseUrl: config.workerUrl, payload });
  if (config.provider === "neurocine-worker") return renderNeurocineWorker({ baseUrl: config.workerUrl, payload, partIndex: job.part_index });
  return renderComfy({ baseUrl: config.workerUrl, payload, checkpoint: config.checkpoint });
}

async function pollQueue(config) {
  return fetchJson(`${config.siteUrl}/api/trailer/local-queue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "poll", agent_token: config.token, provider: config.provider, limit: 1 }),
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
    }),
  }, 120000);
}

async function main() {
  const provider = arg("provider", "comfyui");
  const defaultWorker = provider === "automatic1111" ? "http://127.0.0.1:7860" : "http://127.0.0.1:8188";
  const config = {
    siteUrl: cleanBaseUrl(arg("site", "http://localhost:3000"), "http://localhost:3000"),
    token: arg("token", ""),
    provider,
    workerUrl: cleanBaseUrl(arg("worker", defaultWorker), defaultWorker),
    checkpoint: arg("checkpoint", "sd_xl_base_1.0.safetensors"),
    intervalMs: Math.max(1000, Number(arg("interval", "3000")) || 3000),
  };

  if (!config.token) {
    console.error("Нужен --token из блока NeuroCine Local Agent на сайте.");
    process.exit(1);
  }

  console.log(`[NeuroCine Agent] site=${config.siteUrl}`);
  console.log(`[NeuroCine Agent] provider=${config.provider} worker=${config.workerUrl}`);
  console.log("[NeuroCine Agent] ждёт задания...");

  while (true) {
    try {
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
