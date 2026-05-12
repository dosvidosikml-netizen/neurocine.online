"use client";

import { useEffect, useRef, useState } from "react";

const THEME_STORAGE_KEY = "neurocine.theme";

function applyTheme(theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", theme === "light" ? "light" : "dark");
}

function readInitialTheme() {
  if (typeof window === "undefined") return "dark";
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  return "dark";
}

const LANG_FLAGS = {
  ru: { flag: "🇷🇺", next: "en", title: "Switch to English" },
  en: { flag: "🇬🇧", next: "ru", title: "Переключить на русский" }
};

function getInitials(name, email) {
  const source = (name || email || "").trim();
  if (!source) return "U";
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function StudioShellSkin() {
  return (
    <style jsx global>{`
      .setup-style-grid-v40 {
        display: flex !important;
        grid-template-columns: none !important;
        gap: 12px !important;
        overflow-x: auto !important;
        padding: 2px 2px 14px !important;
        scroll-snap-type: x proximity;
        scrollbar-width: thin;
      }
      .setup-style-grid-v40::-webkit-scrollbar { height: 7px; }
      .setup-style-grid-v40::-webkit-scrollbar-thumb { background: rgba(255,255,255,.18); border-radius: 999px; }
      .setup-style-grid-v40 button {
        flex: 0 0 164px !important;
        min-height: 178px !important;
        border-radius: 20px !important;
        padding: 98px 12px 12px !important;
        position: relative !important;
        overflow: hidden !important;
        text-align: left !important;
        scroll-snap-align: start;
        background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.025)) !important;
      }
      .setup-style-grid-v40 button::before {
        content: "";
        position: absolute;
        left: 10px;
        right: 10px;
        top: 10px;
        height: 76px;
        border-radius: 15px;
        background:
          radial-gradient(circle at 24% 24%, rgba(255,255,255,.34), transparent 24%),
          radial-gradient(circle at 78% 28%, rgba(255,120,72,.38), transparent 28%),
          linear-gradient(135deg, #161821, #41251f 52%, #050507);
        border: 1px solid rgba(255,255,255,.08);
      }
      .setup-style-grid-v40 button::after {
        content: "Style DNA · visual lock";
        position: absolute;
        left: 12px;
        right: 12px;
        bottom: 12px;
        color: rgba(255,255,255,.42);
        font-size: 10px;
        font-weight: 700;
        line-height: 1.25;
        pointer-events: none;
      }
      .setup-style-grid-v40 button:nth-child(3n+1)::before { background: radial-gradient(circle at 30% 20%, rgba(255,255,255,.30), transparent 25%), linear-gradient(135deg,#070514,#1c0a3d 44%,#003e54); }
      .setup-style-grid-v40 button:nth-child(3n+2)::before { background: radial-gradient(circle at 30% 20%, rgba(255,255,255,.22), transparent 25%), linear-gradient(135deg,#130408,#3a0711 50%,#050507); }
      .setup-style-grid-v40 button:nth-child(3n+3)::before { background: radial-gradient(circle at 30% 20%, rgba(255,255,255,.20), transparent 25%), linear-gradient(135deg,#15160d,#4b3b1f 45%,#111); }
      .setup-style-grid-v40 button:hover { transform: translateY(-2px); }
      .setup-style-grid-v40 button.active {
        border-color: rgba(255,138,76,.82) !important;
        background: linear-gradient(180deg, rgba(255,138,76,.16), rgba(255,255,255,.035)) !important;
        box-shadow: 0 0 0 1px rgba(255,138,76,.18), 0 18px 44px rgba(255,92,42,.14) !important;
      }
      .setup-style-grid-v40 button.active::after { content: "SELECTED · Director style lock"; color: rgba(255,210,180,.72); }

      @media (max-width: 760px) {
        html, body { overflow-x: hidden !important; }
        body { padding-bottom: calc(108px + env(safe-area-inset-bottom)) !important; }
        .setup-style-grid-v40 button { flex-basis: 148px !important; min-height: 168px !important; }

        .col, .step-body, .pack-body, .production-pack, .step-section {
          min-width: 0 !important;
          max-width: 100% !important;
          overflow: visible !important;
        }

        .frow,
        .frow.frow2 {
          display: flex !important;
          flex-direction: column !important;
          align-items: stretch !important;
          grid-template-columns: none !important;
          gap: 14px !important;
          width: 100% !important;
          min-width: 0 !important;
        }

        .frow > *,
        .frow.frow2 > * {
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
        }

        .out-box,
        .out-box-v31 {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          border-radius: 18px !important;
          overflow: hidden !important;
          margin-inline: 0 !important;
          background: rgba(5, 7, 13, .74) !important;
        }

        .out-head {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          gap: 10px !important;
          min-height: 58px !important;
          padding: 14px !important;
        }

        .out-label {
          flex: 1 1 auto !important;
          min-width: 0 !important;
          max-width: 100% !important;
          font-size: 11px !important;
          line-height: 1.35 !important;
          letter-spacing: .24em !important;
          overflow-wrap: anywhere !important;
          word-break: normal !important;
        }

        .out-actions {
          display: flex !important;
          flex: 0 0 auto !important;
          gap: 8px !important;
          align-items: center !important;
        }

        .out-actions .btn,
        .out-actions button {
          min-height: 38px !important;
          padding: 0 12px !important;
          border-radius: 11px !important;
          font-size: 13px !important;
          white-space: nowrap !important;
        }

        .out-body {
          padding: 16px 14px !important;
          max-width: 100% !important;
          min-width: 0 !important;
          overflow: hidden !important;
        }

        .out-box-v31.is-compact .out-body {
          max-height: 224px !important;
          overflow: hidden !important;
          position: relative !important;
        }

        .out-box-v31.is-compact .out-body::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 44px;
          background: linear-gradient(to bottom, rgba(5,7,13,0), rgba(5,7,13,.96));
          pointer-events: none;
        }

        .out-box-v31.is-open .out-body {
          max-height: none !important;
          overflow: visible !important;
        }

        .out-box-v31.is-open .out-body::after { display: none !important; }

        .out-pre,
        .out-pre.compact,
        .out-pre.mono,
        .out-pre.mono.compact {
          max-width: 100% !important;
          white-space: pre-wrap !important;
          overflow-wrap: anywhere !important;
          word-break: break-word !important;
          font-size: 14px !important;
          line-height: 1.58 !important;
          letter-spacing: 0 !important;
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
        }

        .frame-card-row {
          display: block !important;
          padding: 14px !important;
          min-width: 0 !important;
        }

        .frame-card-lbl {
          margin-bottom: 8px !important;
          font-size: 10px !important;
          line-height: 1.35 !important;
          letter-spacing: .28em !important;
        }

        .frame-card-val {
          max-width: 100% !important;
          font-size: 17px !important;
          line-height: 1.45 !important;
          overflow-wrap: anywhere !important;
          word-break: break-word !important;
        }

        .frame-btns {
          display: flex !important;
          align-items: center !important;
          gap: 10px !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          padding: 2px 0 12px !important;
          scroll-snap-type: x proximity;
          -webkit-overflow-scrolling: touch;
        }

        .frame-btns .fb {
          flex: 0 0 auto !important;
          min-height: 44px !important;
          padding: 0 18px !important;
          border-radius: 13px !important;
          white-space: nowrap !important;
          font-size: 12px !important;
        }

        .brow {
          display: flex !important;
          flex-wrap: wrap !important;
          gap: 10px !important;
          padding-bottom: 8px !important;
        }

        .brow .btn,
        .brow a.btn {
          flex: 1 1 180px !important;
          min-height: 44px !important;
          justify-content: center !important;
          white-space: normal !important;
        }

        .nc-bottom-nav {
          padding-bottom: calc(10px + env(safe-area-inset-bottom)) !important;
        }

        main,
        .studio-page,
        .page,
        .wrap,
        .app-shell,
        .storyboard-page {
          padding-bottom: calc(140px + env(safe-area-inset-bottom)) !important;
        }
      }
    `}</style>
  );
}

export default function TopActionBar({
  account,
  access,
  uiLang = "ru",
  onToggleLang,
  onOpenMenu,
  onOpenCreate,
  onNavigate,
  onSignOut,
}) {
  const email = account?.profile?.email || account?.session?.user?.email || "";
  const isSignedIn = Boolean(account?.session?.user);
  const displayName = account?.profile?.display_name || (email ? email.split("@")[0] : "Гость");
  const avatarUrl = account?.profile?.avatar_url || account?.session?.user?.user_metadata?.avatar_url || "";
  const planLabel = access?.isOwner
    ? "Director аккаунт"
    : access?.role === "pro"
    ? "Pro аккаунт"
    : isSignedIn
    ? "Бесплатный аккаунт"
    : "Гость";
  const planBadge = access?.isOwner ? "DIR" : access?.role === "pro" ? "PRO" : isSignedIn ? "FREE" : "";

  const langKey = String(uiLang || "ru").toLowerCase();
  const langInfo = LANG_FLAGS[langKey] || LANG_FLAGS.ru;
  const initials = getInitials(displayName, email);

  const [theme, setTheme] = useState("dark");
  const [profileOpen, setProfileOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const initial = readInitialTheme();
    setTheme(initial);
    applyTheme(initial);
  }, []);

  useEffect(() => {
    if (!profileOpen) return;
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    function handleKey(e) {
      if (e.key === "Escape") setProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [profileOpen]);

  useEffect(() => { setImgError(false); }, [avatarUrl]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    try { window.localStorage.setItem(THEME_STORAGE_KEY, next); } catch {}
  }

  function handleProfileNav(target) {
    setProfileOpen(false);
    onNavigate?.(target);
  }

  function handleSignOut() {
    setProfileOpen(false);
    if (onSignOut) onSignOut();
    else onNavigate?.("auth");
  }

  const showAvatarImg = avatarUrl && !imgError;

  return (
    <>
      <StudioShellSkin />
      <header className="nc-top-action-bar">
        <button className="nc-top-icon" type="button" onClick={onOpenMenu} aria-label="Меню">☰</button>

        <button className="nc-top-logo" type="button" onClick={() => onNavigate?.("setup")} aria-label="NeuroCine">
          <span>N</span>
        </button>

        <div className="nc-top-spacer" aria-hidden></div>

        <button className="nc-lang nc-lang-flag" type="button" onClick={onToggleLang} aria-label={langInfo.title} title={langInfo.title}>
          <span className="nc-lang-flag-emoji" role="img" aria-hidden>{langInfo.flag}</span>
        </button>

        <div className="nc-profile-wrap" ref={profileRef}>
          <button
            className={"nc-profile nc-profile-avatar" + (showAvatarImg ? " has-image" : "")}
            type="button"
            onClick={() => setProfileOpen(o => !o)}
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            title={email || "Профиль"}
          >
            {showAvatarImg ? (
              <img src={avatarUrl} alt={displayName} onError={() => setImgError(true)} draggable="false" />
            ) : (
              <span className="nc-profile-initials">{initials}</span>
            )}
            {planBadge && <span className={"nc-profile-plan-dot plan-" + planBadge.toLowerCase()} aria-hidden>{planBadge[0]}</span>}
          </button>

          {profileOpen && (
            <div className="nc-profile-menu" role="menu">
              <div className="nc-profile-menu-head">
                <div className="nc-profile-menu-plan">{planLabel}</div>
                <div className="nc-profile-menu-name">{displayName}</div>
                {email && <div className="nc-profile-menu-email">{email}</div>}
              </div>

              <button type="button" className="nc-profile-menu-item nc-profile-menu-theme" onClick={toggleTheme} role="menuitem">
                <span className="nc-profile-menu-icon" aria-hidden>{theme === "dark" ? "☀" : "☾"}</span>
                <span>Тема: {theme === "dark" ? "тёмная" : "светлая"}</span>
                <span className="nc-profile-menu-arrow" aria-hidden>→</span>
              </button>

              <button type="button" className="nc-profile-menu-item" onClick={() => handleProfileNav("pack")} role="menuitem">
                <span className="nc-profile-menu-icon" aria-hidden>◆</span>
                <span>Партнёрская программа</span>
              </button>

              <button type="button" className="nc-profile-menu-item" onClick={() => handleProfileNav("setup")} role="menuitem">
                <span className="nc-profile-menu-icon" aria-hidden>⚙</span>
                <span>Настройки</span>
              </button>

              <button type="button" className="nc-profile-menu-item" onClick={() => handleProfileNav("pack")} role="menuitem">
                <span className="nc-profile-menu-icon" aria-hidden>♦</span>
                <span>Биллинг и тариф</span>
              </button>

              {isSignedIn ? (
                <button type="button" className="nc-profile-menu-item nc-profile-menu-danger" onClick={handleSignOut} role="menuitem">
                  <span className="nc-profile-menu-icon" aria-hidden>↪</span>
                  <span>Выйти</span>
                </button>
              ) : (
                <button type="button" className="nc-profile-menu-item" onClick={() => handleProfileNav("auth")} role="menuitem">
                  <span className="nc-profile-menu-icon" aria-hidden>↩</span>
                  <span>Войти</span>
                </button>
              )}
            </div>
          )}
        </div>
      </header>
    </>
  );
}
