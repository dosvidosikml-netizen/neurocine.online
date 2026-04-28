"use client";

import CopyBlock from "./CopyBlock";

export default function FrameInspector({ frame, onNext, onPrev }) {
  if (!frame) {
    return <div className="drop">Выбери кадр или создай storyboard.</div>;
  }

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>{frame.id}</h2>
          <div className="muted small">{frame.start}–{frame.end}s · {frame.beat_type} · {frame.emotion}</div>
        </div>
        <div className="row">
          <button className="btn" onClick={onPrev}>PREV</button>
          <button className="btn red" onClick={onNext}>NEXT FRAME</button>
        </div>
      </div>

      <CopyBlock title="🎥 IMAGE PROMPT (EN)" text={frame.image_prompt_en} />
      <CopyBlock title="🎞 VIDEO PROMPT (EN + SFX)" text={frame.video_prompt_en} />
      <CopyBlock title="🎙 VO (RU)" text={frame.vo_ru} />
      <CopyBlock title="🔊 SFX" text={frame.sfx} />
      <CopyBlock title="🧷 CONTINUITY NOTE" text={frame.continuity_note} compact />
    </div>
  );
}
