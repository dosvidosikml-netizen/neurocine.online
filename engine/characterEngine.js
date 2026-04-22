// ===============================
// 🧬 Character Engine v1
// ===============================

export function buildCharacterDNA({ name, gender, age, style }) {
  return {
    name,
    gender,
    age,
    style,

    look: `
${gender}, ${age} years old,
face consistent, cinematic details,
skin texture realistic,
no distortion, no variation,
identity locked
`,

    outfit: `
${style},
same clothes across all scenes,
no changes
`,
  };
}

export function injectCharactersIntoScript(script, characters) {
  if (!characters.length) return script;

  const desc = characters
    .map(
      (c) =>
        `${c.name}: ${c.gender}, ${c.age}, ${c.style}`
    )
    .join("\n");

  return `
Characters:
${desc}

Script:
${script}
`;
}
