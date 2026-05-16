"use client";

export default function CartoonSafeResetBar({ onReset }) {
  return (
    <div className="nc-cartoon-safe-reset">
      <button type="button" onClick={() => onReset?.("Сценарий очищен. Проект сброшен.")}>🧹 Очистить сценарий</button>
      <button type="button" className="danger" onClick={() => onReset?.("Мульт-проект сброшен.")}>↺ Сбросить всё</button>
      <style jsx>{`
        .nc-cartoon-safe-reset{position:relative;z-index:6;display:grid;grid-template-columns:1fr 1fr;gap:12px;width:min(860px,calc(100vw - 44px));margin:12px auto 18px}
        button{min-height:50px;border-radius:18px;border:1px solid rgba(0,212,255,.22);background:rgba(6,10,28,.58);color:rgba(230,245,255,.88);font-size:13px;font-weight:900;letter-spacing:.055em;box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 10px 26px rgba(0,0,0,.16);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
        button.danger{border-color:rgba(255,77,95,.34);color:#ffd7dc;background:rgba(42,8,16,.52)}
        :global(html[data-theme="light"]) button{border-color:rgba(22,163,74,.24);background:rgba(255,255,255,.84);color:#14532d;box-shadow:inset 0 1px 0 rgba(255,255,255,.94),0 10px 24px rgba(15,42,27,.07)}
        :global(html[data-theme="light"]) button.danger{border-color:rgba(239,68,68,.24);background:rgba(255,245,245,.88);color:#991b1b}
        @media(max-width:430px){.nc-cartoon-safe-reset{width:calc(100vw - 32px);gap:10px;margin:10px auto 16px}button{min-height:48px;border-radius:16px;font-size:12px}}
      `}</style>
    </div>
  );
}
