import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function normalizeWorkerUrl(value) {
  const input = String(value || "http://127.0.0.1:7860").trim();
  const raw = /^https?:\/\//i.test(input) ? input : `http://${input || "127.0.0.1:7860"}`;
  const url = new URL(raw);
  if (!LOCAL_HOSTS.has(url.hostname)) {
    throw new Error("Разрешены только локальные адреса: localhost или 127.0.0.1.");
  }
  return raw.replace(/\/+$/, "");
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

function buildDefaultComfyWorkflow(payload = {}) {
  const width = Number(payload.width || 936);
  const height = Number(payload.height || 1664);
  const steps = Number(payload.steps || 24);
  const cfg = Number(payload.cfg_scale || payload.cfg || 6);
  const seed = Number.isFinite(Number(payload.seed)) && Number(payload.seed) >= 0
    ? Math.floor(Number(payload.seed))
    : Math.floor(Math.random() * 999999999);
  const checkpoint = String(payload.checkpoint || payload.ckpt_name || "sd_xl_base_1.0.safetensors");
  if (String(payload.model_family || "sdxl").toLowerCase() === "flux") {
    throw new Error("FLUX требует ComfyUI workflow template. Вставь workflow JSON с плейсхолдерами в интерфейсе.");
  }
  const workflow = {
    "4": {
      class_type: "CheckpointLoaderSimple",
      inputs: { ckpt_name: checkpoint },
    },
    "5": {
      class_type: "EmptyLatentImage",
      inputs: { width, height, batch_size: 1 },
    },
    "6": {
      class_type: "CLIPTextEncode",
      inputs: { text: payload.prompt, clip: ["4", 1] },
    },
    "7": {
      class_type: "CLIPTextEncode",
      inputs: { text: payload.negative_prompt || "", clip: ["4", 1] },
    },
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
    "8": {
      class_type: "VAEDecode",
      inputs: { samples: ["3", 0], vae: ["4", 2] },
    },
    "9": {
      class_type: "SaveImage",
      inputs: { filename_prefix: payload.filename_prefix || "neurocine_trailer_part", images: ["8", 0] },
    },
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
  const outputs = root?.outputs || {};
  for (const output of Object.values(outputs)) {
    const image = Array.isArray(output?.images) ? output.images[0] : null;
    if (image?.filename) return image;
  }
  return null;
}

async function renderComfyImage(baseUrl, payload = {}) {
  const clientId = randomUUID();
  const workflow = payload.workflow || buildDefaultComfyWorkflow(payload);
  const submitted = await fetchJson(`${baseUrl}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: workflow, client_id: clientId }),
  }, 20000);
  const promptId = submitted.prompt_id;
  if (!promptId) throw new Error("ComfyUI не вернул prompt_id.");

  const started = Date.now();
  let image = null;
  while (Date.now() - started < 600000) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const history = await fetchJson(`${baseUrl}/history/${promptId}`, { method: "GET" }, 20000);
    image = findComfyImage(history, promptId);
    if (image) break;
  }
  if (!image) throw new Error("ComfyUI не вернул готовое изображение за 10 минут.");

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

export async function POST(req) {
  try {
    const body = await req.json();
    const action = body.action || "render";
    const provider = body.provider || "automatic1111";
    const baseUrl = normalizeWorkerUrl(body.workerUrl);

    if (action === "health") {
      const endpoint = provider === "automatic1111"
        ? `${baseUrl}/sdapi/v1/sd-models`
        : provider === "comfyui"
          ? `${baseUrl}/system_stats`
          : `${baseUrl}/health`;
      const data = await fetchJson(endpoint, { method: "GET" }, 12000);
      return NextResponse.json({ ok: true, provider, data });
    }

    const payload = body.payload || {};
    if (!payload.prompt || typeof payload.prompt !== "string") {
      return NextResponse.json({ ok: false, error: "Нужен prompt для локальной генерации." }, { status: 400 });
    }

    if (provider === "automatic1111") {
      const data = await fetchJson(`${baseUrl}/sdapi/v1/txt2img`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const image = normalizeImage(data.images?.[0]);
      if (!image) throw new Error("Automatic1111 не вернул изображение.");
      return NextResponse.json({ ok: true, provider, image });
    }

    if (provider === "comfyui") {
      const image = await renderComfyImage(baseUrl, payload);
      return NextResponse.json({ ok: true, provider, image });
    }

    const data = await fetchJson(`${baseUrl}/render-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, part_index: body.partIndex }),
    });
    const image = normalizeImage(data.image || data.data_url || data.dataUrl || data.images?.[0]);
    if (!image) throw new Error("NeuroCine worker не вернул изображение.");
    return NextResponse.json({ ok: true, provider, image });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || "Local image bridge error" }, { status: 500 });
  }
}
