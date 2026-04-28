"use client";

export default function StoryboardTable({ scenes = [], onSelect }) {
  if (!scenes.length) {
    return <div className="drop">Storyboard пустой. Вставь сценарий и нажми «СДЕЛАТЬ ВИДЕО».</div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Кадр / время</th>
            <th>Визуал</th>
            <th>Промт для анимации</th>
            <th>VO</th>
            <th>SFX</th>
          </tr>
        </thead>
        <tbody>
          {scenes.map((s, i) => (
            <tr key={s.id} onClick={() => onSelect?.(i)} style={{ cursor: "pointer" }}>
              <td>
                <strong style={{ color: "#fca5a5" }}>{s.id}</strong>
                <div className="small muted">{s.start}–{s.end}s</div>
                <div className="small muted">{s.beat_type}</div>
              </td>
              <td>{s.description_ru || s.visual || s.image_prompt_en}</td>
              <td>{String(s.video_prompt_en || "").slice(0, 420)}...</td>
              <td>{s.vo_ru}</td>
              <td>{s.sfx}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
