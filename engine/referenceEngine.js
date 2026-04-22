
// ===============================
// 🖼 Reference Engine v1
// ===============================

export const SYS_REFERENCE_ENGINE = `
You are a cinematic character reference designer.

Return ONLY valid JSON.

TASK:
Create a stable reference image prompt for the main recurring character.

RULES:
1. Output in English
2. Focus on identity consistency
3. Keep face, hair, outfit, body type stable
4. Make it suitable for image-to-video workflows
5. Hyperreal, cinematic, realistic human

OUTPUT:
{
  "reference": {
    "character_name": "...",
    "reference_prompt_EN": "...",
    "identity_lock": "...",
    "outfit_lock": "..."
  }
}
`;

export function buildReferenceUserPrompt({ characters = [] }) {
  const chars = characters?.length
    ? characters
        .map(
          (c) =>
            `${c.name}, ${c.gender}, ${c.age}, ${c.style}, ${c.look || ""}, ${c.outfit || ""}`
        )
        .join("\n")
    : "none";

  return `
Create a stable cinematic reference for the main character.

Characters:
${chars}
`;
}
