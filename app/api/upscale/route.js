const MAX_IMAGE_PAYLOAD = 10 * 1024 * 1024;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function normalizeFactor(value) {
  const v = String(value || "x2").toLowerCase().trim();
  return v === "x4" || v === "4" || v === "4x" ? "x4" : "x2";
}

function normalizeOutput(output) {
  if (!output) return "";
  if (typeof output === "string") return output;
  if (Array.isArray(output)) return output[0] || "";
  if (typeof output === "object" && output.url) return output.url;
  return String(output || "");
}

async function fetchPrediction(id) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN is missing on server.");

  const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const rawText = await response.text();
  let data;
  try {
    data = JSON.parse(rawText);
  } catch (e) {
    throw new Error(`Replicate returned non-JSON response. Status: ${response.status}`);
  }

  if (!response.ok) {
    throw new Error(data?.detail || data?.error || `Replicate API error (${response.status})`);
  }

  return data;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return json({ error: "Missing prediction id" }, 400);

    const data = await fetchPrediction(id);
    return json({
      id: data.id,
      status: data.status,
      output: normalizeOutput(data.output),
      error: data.error || null,
      prediction: data,
    });
  } catch (error) {
    return json({ error: error.message || "Upscale polling failed" }, 500);
  }
}

export async function POST(req) {
  try {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) return json({ error: "REPLICATE_API_TOKEN is missing on server." }, 500);

    const body = await req.json();
    const image = String(body.image || body.image_url || "").trim();
    if (!image) return json({ error: "Image URL or data URL is required." }, 400);

    if (image.length > MAX_IMAGE_PAYLOAD * 1.45) {
      return json({ error: "Image payload is too large. Use an image URL or upload an image under 10MB." }, 413);
    }

    const upscale_factor = normalizeFactor(body.upscale_factor || body.scale || body.factor);
    const compression_quality = Math.min(100, Math.max(1, Number(body.compression_quality || 95)));

    const response = await fetch("https://api.replicate.com/v1/models/google/upscaler/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: "wait=60",
      },
      body: JSON.stringify({
        input: {
          image,
          upscale_factor,
          compression_quality,
        },
      }),
    });

    const rawText = await response.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      throw new Error(`Replicate returned non-JSON response. Status: ${response.status}`);
    }

    if (!response.ok) {
      throw new Error(data?.detail || data?.error || `Replicate API error (${response.status})`);
    }

    return json({
      id: data.id,
      status: data.status,
      output: normalizeOutput(data.output),
      upscale_factor,
      compression_quality,
      prediction_url: data.urls?.get || null,
      prediction: data,
    });
  } catch (error) {
    return json({ error: error.message || "Upscale failed" }, 500);
  }
}
