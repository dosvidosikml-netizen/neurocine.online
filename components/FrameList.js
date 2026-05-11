"use client";

export default function FrameList({ scenes = [], active = 0, onSelect }) {
  return (
    <div className="frame-list">
      {scenes.map((s, i) => (
        <button
          key={s.id}
          className={`frame-btn ${active === i ? "active" : ""}`}
          onClick={() => onSelect(i)}
        >
          <strong>{s.id}</strong>
          <div className="small muted">{s.start}–{s.end}s · {s.beat_type}</div>
          <div className="small" style={{ marginTop: 6 }}>{String(s.vo_ru || "").slice(0, 90)}</div>
        </button>
      ))}
    </div>
  );
}
