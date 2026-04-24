// lib/videoProviders.js
// Demo providers. Replace with real Grok/Veo/Runway/Pika/Luma calls.

export async function demoImageProvider({ prompt, negative_prompt, seed, reference_image }) {
  return {
    type: "image",
    url: "",
    prompt,
    negative_prompt,
    seed,
    reference_image,
    note: "Demo image placeholder. Replace demoImageProvider with real image API.",
  };
}

export async function demoVideoProvider({ prompt, image, seed, reference_image }) {
  return {
    type: "video",
    url: "",
    prompt,
    image,
    seed,
    reference_image,
    note: "Demo video placeholder. Replace demoVideoProvider with real video API.",
  };
}

export async function demoRenderProvider({ timeline }) {
  return {
    type: "final_video",
    url: "",
    timeline,
    note: "Demo render placeholder. Replace demoRenderProvider with real renderer.",
  };
}
