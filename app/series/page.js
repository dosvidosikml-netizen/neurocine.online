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
            width: min(calc(100% - 18px), 1080px);
            min-height: calc(100dvh - 48px);
            margin: 18px auto 96px;
            display: grid;
            align-content: center;
            gap: 14px;
            color: var(--nc-text, #f8fafc);
          }

          .nc-series-card-v1 {
            position: relative;
            overflow: hidden;
            border: 1px solid var(--nc-border, rgba(255,255,255,.10));
            border-radius: 30px;
            padding: 26px;
            background:
              radial-gradient(circle at 0% 0%, rgba(168,85,247,.18), transparent 34%),
              radial-gradient(circle at 100% 0%, rgba(250,204,21,.11), transparent 32%),
              linear-gradient(145deg, var(--nc-card-strong, rgba(12,14,24,.94)), var(--nc-card-muted, rgba(7,9,16,.82)));
            box-shadow: var(--nc-shadow-soft, 0 18px 60px rgba(0,0,0,.38));
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
          }

          .nc-series-card-v1::before {
            content: "";
            position: absolute;
            right: -120px;
            top: -140px;
            width: 320px;
            height: 320px;
            border-radius: 999px;
            background: radial-gradient(circle, rgba(139,92,246,.18), transparent 70%);
            pointer-events: none;
          }

          .nc-series-card-v1::after {
            content: "";
            position: absolute;
            left: -120px;
            bottom: -160px;
            width: 360px;
            height: 360px;
            border-radius: 999px;
            background: radial-gradient(circle, rgba(255,77,95,.12), transparent 72%);
            pointer-events: none;
          }

          .nc-series-card-v1 > * {
            position: relative;
            z-index: 1;
          }

          .nc-series-kicker-v1 {
            margin-bottom: 10px;
            color: var(--nc-violet, #c4b5fd);
            font-size: 10px;
            font-weight: 950;
            letter-spacing: .24em;
            text-transform: uppercase;
          }

          .nc-series-title-v1 {
            margin: 0;
            max-width: 780px;
            color: var(--nc-text, #f8fafc);
            font-size: clamp(38px, 9vw, 82px);
            line-height: .92;
            letter-spacing: -.08em;
          }

          .nc-series-copy-v1 {
            margin: 16px 0 0;
            max-width: 720px;
            color: var(--nc-muted, rgba(238,240,248,.68));
            font-size: 14px;
            line-height: 1.62;
          }

          .nc-series-grid-v1 {
            display: grid;
            grid-template-columns: 1fr;
            gap: 10px;
            margin-top: 20px;
          }

          .nc-series-chip-v1 {
            min-height: 112px;
            display: grid;
            align-content: space-between;
            border: 1px solid var(--nc-border, rgba(255,255,255,.09));
            border-radius: 20px;
            padding: 15px;
            background: linear-gradient(145deg, var(--nc-card, rgba(255,255,255,.045)), var(--nc-card-muted, rgba(255,255,255,.025)));
            box-shadow: inset 0 1px 0 rgba(255,255,255,.05);
          }

          .nc-series-chip-v1 span {
            display: block;
            margin-bottom: 8px;
            color: var(--nc-muted, rgba(238,240,248,.48));
            font-size: 9px;
            font-weight: 950;
            letter-spacing: .18em;
            text-transform: uppercase;
          }

          .nc-series-chip-v1 strong {
            color: var(--nc-gold, #facc15);
            font-size: 14px;
            line-height: 1.25;
          }

          html[data-theme="light"] .nc-series-chip-v1 strong {
            color: #b45309;
          }

          .nc-series-actions-v1 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-top: 20px;
          }

          .nc-series-btn-v1 {
            min-height: 48px;
            border: 1px solid var(--nc-border, rgba(255,255,255,.12));
            border-radius: 999px;
            padding: 0 16px;
            background: var(--nc-card, rgba(255,255,255,.055));
            color: var(--nc-text-soft, #eef0f8);
            font-size: 12px;
            font-weight: 950;
            cursor: pointer;
            transition: transform .16s ease, border-color .16s ease, background .16s ease;
          }

          .nc-series-btn-v1:hover {
            transform: translateY(-1px);
            border-color: var(--nc-border-strong, rgba(255,255,255,.20));
            background: var(--nc-card-strong, rgba(255,255,255,.09));
            color: var(--nc-text, #fff);
          }

          .nc-series-btn-v1.primary {
            border-color: transparent;
            background: linear-gradient(135deg, var(--nc-red, #ff4d5f), var(--nc-orange, #ff7a3d));
            color: #fff;
            box-shadow: 0 14px 38px rgba(255,77,95,.18);
          }

          @media (min-width: 780px) {
            .nc-series-page-v1 { margin-top: 26px; }
            .nc-series-card-v1 { padding: 38px; }
            .nc-series-grid-v1 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          }

          @media (max-width: 430px) {
            .nc-series-page-v1 {
              width: min(calc(100% - 14px), 1080px);
              align-content: start;
              padding-top: 12px;
              padding-bottom: calc(112px + env(safe-area-inset-bottom));
            }
            .nc-series-card-v1 {
              border-radius: 24px;
              padding: 20px;
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
            <div className="nc-series-chip-v1"><span>Module 03</span><strong>Эпизоды → production pipeline</strong></div>
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
