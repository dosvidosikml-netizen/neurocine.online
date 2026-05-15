"use client";

export default function SeriesPage() {
  function goStudio() {
    window.location.href = "/studio";
  }

  function goStoryboard() {
    window.location.href = "/storyboard#setup";
  }

  return (
    <main className="studio nc-studio-home-page-v1">
      <section className="nc-series-page-v1">
        <style jsx global>{`
          .nc-series-page-v1,
          .nc-series-page-v1 * { box-sizing: border-box; }

          .nc-series-page-v1 {
            width: min(calc(100% - 18px), 980px);
            min-height: calc(100dvh - 48px);
            margin: 18px auto 96px;
            display: grid;
            align-content: center;
            gap: 14px;
            color: #f8fafc;
          }

          .nc-series-card-v1 {
            position: relative;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,.10);
            border-radius: 28px;
            padding: 22px;
            background:
              radial-gradient(circle at 0% 0%, rgba(168,85,247,.20), transparent 34%),
              radial-gradient(circle at 100% 0%, rgba(250,204,21,.10), transparent 32%),
              linear-gradient(145deg, rgba(12,14,24,.94), rgba(7,9,16,.82));
            box-shadow: 0 18px 60px rgba(0,0,0,.38), inset 0 1px 0 rgba(255,255,255,.06);
            backdrop-filter: blur(16px);
          }

          .nc-series-kicker-v1 {
            margin-bottom: 10px;
            color: #c4b5fd;
            font-size: 10px;
            font-weight: 950;
            letter-spacing: .24em;
            text-transform: uppercase;
          }

          .nc-series-title-v1 {
            margin: 0;
            max-width: 760px;
            font-size: clamp(34px, 9vw, 74px);
            line-height: .95;
            letter-spacing: -.075em;
          }

          .nc-series-copy-v1 {
            margin: 16px 0 0;
            max-width: 680px;
            color: rgba(238,240,248,.68);
            font-size: 14px;
            line-height: 1.55;
          }

          .nc-series-grid-v1 {
            display: grid;
            grid-template-columns: 1fr;
            gap: 10px;
            margin-top: 18px;
          }

          .nc-series-chip-v1 {
            border: 1px solid rgba(255,255,255,.09);
            border-radius: 18px;
            padding: 13px;
            background: rgba(255,255,255,.045);
          }

          .nc-series-chip-v1 span {
            display: block;
            margin-bottom: 6px;
            color: rgba(238,240,248,.48);
            font-size: 9px;
            font-weight: 950;
            letter-spacing: .18em;
            text-transform: uppercase;
          }

          .nc-series-chip-v1 strong {
            color: #facc15;
            font-size: 13px;
            line-height: 1.25;
          }

          .nc-series-actions-v1 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 9px;
            margin-top: 18px;
          }

          .nc-series-btn-v1 {
            min-height: 46px;
            border: 1px solid rgba(255,255,255,.12);
            border-radius: 16px;
            padding: 0 14px;
            background: rgba(255,255,255,.055);
            color: #eef0f8;
            font-size: 12px;
            font-weight: 950;
            cursor: pointer;
          }

          .nc-series-btn-v1.primary {
            border-color: rgba(255,92,42,.34);
            background: linear-gradient(135deg, #ff4d5f, #ff7a3d);
            color: #16080a;
          }

          @media (min-width: 780px) {
            .nc-series-page-v1 { margin-top: 26px; }
            .nc-series-card-v1 { padding: 34px; }
            .nc-series-grid-v1 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          }

          @media (max-width: 430px) {
            .nc-series-page-v1 {
              width: min(calc(100% - 14px), 980px);
              align-content: start;
              padding-top: 12px;
              padding-bottom: calc(112px + env(safe-area-inset-bottom));
            }
            .nc-series-card-v1 {
              border-radius: 24px;
              padding: 18px;
            }
            .nc-series-actions-v1 { grid-template-columns: 1fr; }
          }
        `}</style>

        <div className="nc-series-card-v1">
          <div className="nc-series-kicker-v1">NeuroCine Series Workspace</div>
          <h1 className="nc-series-title-v1">Сериалы и сезоны</h1>
          <p className="nc-series-copy-v1">
            Раздел подготовлен под многосерийные проекты: сезоны, повторяющихся персонажей,
            continuity bible, episode arcs и общий визуальный стиль. Полный series engine подключим отдельно,
            без риска для рабочего storyboard-пайплайна.
          </p>

          <div className="nc-series-grid-v1">
            <div className="nc-series-chip-v1"><span>Module 01</span><strong>Series bible и мир проекта</strong></div>
            <div className="nc-series-chip-v1"><span>Module 02</span><strong>Герои, якоря и continuity</strong></div>
            <div className="nc-series-chip-v1"><span>Module 03</span><strong>Эпизоды → storyboard pipeline</strong></div>
          </div>

          <div className="nc-series-actions-v1">
            <button className="nc-series-btn-v1" type="button" onClick={goStudio}>← Главная Studio</button>
            <button className="nc-series-btn-v1 primary" type="button" onClick={goStoryboard}>＋ Создать первый ролик</button>
          </div>
        </div>
      </section>
    </main>
  );
}
