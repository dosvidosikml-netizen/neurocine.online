
export function generateScenes(script) {
  const lines = script.split(/\n|\./).map(s=>s.trim()).filter(Boolean);
  let t=0;
  return lines.map((l,i)=>({
    id:`frame_${i+1}`,
    start:t,
    duration:3,
    end:t+3,
    vo:l,
    sfx:"dark ambience",
    image:`SCENE PRIMARY FOCUS: ${l}. cinematic documentary thriller, realistic, no subtitles`,
    video:`ANIMATE CURRENT FRAME: cinematic motion. SFX: dark ambience`
  }));
}
