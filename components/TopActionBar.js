"use client";

export default function TopActionBar({ account, access, uiLang = "ru", onToggleLang, onOpenMenu, onOpenCreate, onNavigate }) {
  const email = account?.profile?.email || account?.session?.user?.email || "";
  const plan = access?.isOwner || access?.isAdmin ? "OWNER" : access?.role === "pro" ? "PRO" : account?.session?.user ? "FREE" : "AUTH";
  const keyState = access?.role === "pro" ? (access?.hasOwnApiKeys ? "LIVE" : "KEY") : plan;

  return (
    <header className="nc-top-action-bar">
      <button className="nc-top-icon" type="button" onClick={onOpenMenu} aria-label="Меню">☰</button>
      <button className="nc-top-logo" type="button" onClick={() => onNavigate?.("setup")} aria-label="NeuroCine">
        <span>N</span>
      </button>
      <button className="nc-top-credit" type="button" onClick={onOpenCreate} title="Создать">
        <b>+</b>
      </button>
      <button className="nc-top-icon" type="button" onClick={() => onNavigate?.("setup")} aria-label="Настройки">⚙</button>
      <button className="nc-lang" type="button" onClick={onToggleLang}>{uiLang.toUpperCase()}</button>
      <button className="nc-profile" type="button" onClick={() => onNavigate?.("pack")} title={email || "Профиль"}>
        <span>{String(keyState || "U").slice(0, 3)}</span>
      </button>
    </header>
  );
}
