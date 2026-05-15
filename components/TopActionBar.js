"use client";

import { useEffect, useRef, useState } from "react";
import ProfileMenuModalSkin from "./ProfileMenuModalSkin";

const THEME_STORAGE_KEY = "neurocine.theme";

function applyTheme(theme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme === "light" ? "light" : "dark");
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
  ru: { flag: "🇷🇺", title: "Switch to English" },
  en: { flag: "🇬🇧", title: "Переключить на русский" },
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
      /* v70 — mobile-safe real carousel override for app/storyboard/page.js */
      .setup-v40,
      .setup-grid-v40,
      .setup-options-v40,
      .setup-main-v40 {
        min-width: 0 !important;
        max-width: 100% !important;
      }

      .setup-v40 .setup-options-v40 .setup-block-v40:has(.setup-style-grid-v40) {
        overflow: hidden !important;
        max-width: 100% !important;
        min-width: 0 !important;
        padding-right: 0 !important;
      }

      .setup-v40 .setup-options-v40 .setup-block-v40 .setup-style-grid-v40,
      .setup-style-grid-v40 {
        display: flex !important;
        flex-direction: row !important;
        flex-wrap: nowrap !important;
        grid-template-columns: none !important;
        align-items: stretch !important;
        gap: 14px !important;
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        overflow-x: auto !important;
        overflow-y: hidden !important;
        padding: 4px 0 18px !important;
        scroll-snap-type: x proximity;
        scroll-padding-left: 0;
        -webkit-overflow-scrolling: touch;
        touch-action: pan-x pan-y;
        overscroll-behavior-x: contain;
        scrollbar-width: thin;
        isolation: isolate;
      }

      .setup-v40 .setup-style-grid-v40::-webkit-scrollbar,
      .setup-style-grid-v40::-webkit-scrollbar { height: 7px; }
      .setup-v40 .setup-style-grid-v40::-webkit-scrollbar-thumb,
      .setup-style-grid-v40::-webkit-scrollbar-thumb { background: rgba(255,255,255,.18); border-radius: 999px; }

      .setup-v40 .setup-options-v40 .setup-block-v40 .setup-style-grid-v40 button,
      .setup-style-grid-v40 button {
        flex: 0 0 168px !important;
        width: 168px !important;
        max-width: 168px !important;
        min-width: 168px !important;
        min-height: 204px !important;
        border-radius: 22px !important;
        padding: 118px 14px 35px !important;
        position: relative !important;
        overflow: hidden !important;
        text-align: left !important;
        scroll-snap-align: start;
        white-space: normal !important;
        line-height: 1.08 !important;
        background: linear-gradient(180deg, rgba(255,255,255,.075), rgba(255,255,255,.025)) !important;
        border: 1px solid rgba(255,255,255,.12) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 12px 34px rgba(0,0,0,.20) !important;
        z-index: 1 !important;
        cursor: pointer !important;
        -webkit-tap-highlight-color: rgba(255,138,76,.18);
      }

      .setup-v40 .setup-style-grid-v40 button::before,
      .setup-style-grid-v40 button::before {
        content: "";
        position: absolute;
        left: 10px;
        right: 10px;
        top: 10px;
        height: 92px;
        border-radius: 16px;
        border: 1px solid rgba(255,255,255,.10);
        box-shadow: inset 0 0 0 1px rgba(0,0,0,.20);
        pointer-events: none;
      }

      .setup-v40 .setup-style-grid-v40 button::after,
      .setup-style-grid-v40 button::after {
        content: "STYLE DNA · VISUAL LOCK";
        position: absolute;
        left: 14px;
        right: 14px;
        bottom: 12px;
        color: rgba(255,255,255,.42);
        font-size: 9px;
        font-weight: 900;
        letter-spacing: .11em;
        line-height: 1.25;
        pointer-events: none;
      }

      .setup-v40 .setup-style-grid-v40 button:nth-child(1)::before,
      .setup-style-grid-v40 button:nth-child(1)::before {
        background:
          radial-gradient(circle at 34% 18%, rgba(255,255,255,.55), transparent 11%),
          linear-gradient(0deg, rgba(10,11,14,.42), rgba(10,11,14,.1)),
          linear-gradient(135deg,#10131b,#2b2f38 48%,#0b0d10);
      }
      .setup-v40 .setup-style-grid-v40 button:nth-child(2)::before,
      .setup-style-grid-v40 button:nth-child(2)::before {
        background:
          linear-gradient(90deg, transparent 0 44%, rgba(255,255,255,.16) 45% 48%, transparent 49%),
          radial-gradient(circle at 75% 22%, rgba(150,0,0,.62), transparent 24%),
          linear-gradient(135deg,#080609,#2b0a0f 58%,#050507);
      }
      .setup-v40 .setup-style-grid-v40 button:nth-child(3)::before,
      .setup-style-grid-v40 button:nth-child(3)::before {
        background:
          linear-gradient(105deg, transparent 0 28%, rgba(255,255,255,.15) 29% 33%, transparent 34%),
          radial-gradient(circle at 62% 38%, rgba(210,30,20,.50), transparent 18%),
          linear-gradient(135deg,#0a0b0f,#211014 44%,#040405);
      }
      .setup-v40 .setup-style-grid-v40 button:nth-child(4)::before,
      .setup-style-grid-v40 button:nth-child(4)::before {
        background:
          linear-gradient(0deg, rgba(50,40,22,.45), transparent 46%),
          radial-gradient(circle at 22% 34%, rgba(230,190,80,.45), transparent 20%),
          linear-gradient(135deg,#14120c,#4b321a 54%,#10100d);
      }
      .setup-v40 .setup-style-grid-v40 button:nth-child(5)::before,
      .setup-style-grid-v40 button:nth-child(5)::before {
        background:
          linear-gradient(90deg, rgba(255,0,120,.25), transparent 18%, transparent 74%, rgba(0,200,255,.25)),
          radial-gradient(circle at 34% 25%, rgba(255,0,210,.60), transparent 20%),
          linear-gradient(135deg,#090015,#1d0b47 50%,#002f43);
      }
      .setup-v40 .setup-style-grid-v40 button:nth-child(6)::before,
      .setup-style-grid-v40 button:nth-child(6)::before {
        background:
          linear-gradient(0deg, rgba(255,90,190,.28) 0 18%, transparent 19%),
          linear-gradient(90deg, rgba(0,255,255,.22), transparent, rgba(255,0,170,.22)),
          linear-gradient(135deg,#13002b,#2b1445 52%,#071c37);
      }
      .setup-v40 .setup-style-grid-v40 button:nth-child(7)::before,
      .setup-style-grid-v40 button:nth-child(7)::before {
        background:
          linear-gradient(90deg, transparent 0 48%, rgba(0,255,255,.35) 49% 52%, transparent 53%),
          radial-gradient(circle at 72% 22%, rgba(255,0,128,.5), transparent 20%),
          linear-gradient(135deg,#02111a,#092a3c 48%,#1d0229);
      }
      .setup-v40 .setup-style-grid-v40 button:nth-child(8)::before,
      .setup-style-grid-v40 button:nth-child(8)::before {
        background:
          repeating-linear-gradient(0deg, rgba(255,255,255,.10) 0 1px, transparent 1px 5px),
          linear-gradient(135deg,#090909,#252525 47%,#050505);
      }
      .setup-v40 .setup-style-grid-v40 button:nth-child(9)::before,
      .setup-style-grid-v40 button:nth-child(9)::before {
        background:
          radial-gradient(circle at 32% 26%, rgba(255,235,180,.55), transparent 21%),
          linear-gradient(135deg,#20170d,#5a391d 44%,#090705);
      }
      .setup-v40 .setup-style-grid-v40 button:nth-child(n+10)::before,
      .setup-style-grid-v40 button:nth-child(n+10)::before {
        background:
          radial-gradient(circle at 28% 25%, rgba(255,255,255,.25), transparent 20%),
          radial-gradient(circle at 76% 40%, rgba(120,80,255,.34), transparent 24%),
          linear-gradient(135deg,#0b0c12,#26233b 52%,#050507);
      }

      .setup-v40 .setup-style-grid-v40 button.active,
      .setup-style-grid-v40 button.active {
        border-color: rgba(255,138,76,.88) !important;
        background: linear-gradient(180deg, rgba(255,138,76,.18), rgba(255,255,255,.035)) !important;
        box-shadow: 0 0 0 1px rgba(255,138,76,.22), 0 18px 44px rgba(255,92,42,.16) !important;
      }
      .setup-v40 .setup-style-grid-v40 button.active::after,
      .setup-style-grid-v40 button.active::after {
        content: "SELECTED · DIRECTOR LOCK";
        color: rgba(255,214,186,.78);
      }

      @media (max-width: 760px) {
        html, body { overflow-x: hidden !important; width: 100% !important; max-width: 100% !important; }
        body { padding-bottom: calc(108px + env(safe-area-inset-bottom)) !important; }
        .setup-v40,
        .setup-grid-v40,
        .setup-options-v40,
        .setup-main-v40,
        .setup-v40 .setup-options-v40 .setup-block-v40 {
          min-width: 0 !important;
          max-width: 100% !important;
          overflow-x: hidden !important;
        }
        .setup-v40 .setup-options-v40 .setup-block-v40:has(.setup-style-grid-v40) {
          width: 100% !important;
          max-width: 100% !important;
          padding-inline: 14px !important;
          overflow: hidden !important;
        }
        .setup-v40 .setup-style-grid-v40,
        .setup-style-grid-v40 {
          width: 100% !important;
          max-width: 100% !important;
          margin-inline: 0 !important;
          padding-inline: 0 !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
        }
        .setup-v40 .setup-style-grid-v40 button,
        .setup-style-grid-v40 button {
          flex-basis: 154px !important;
          width: 154px !important;
          max-width: 154px !important;
          min-width: 154px !important;
          min-height: 190px !important;
          padding: 108px 12px 35px !important;
          font-size: 14px !important;
        }
        .setup-v40 .setup-style-grid-v40 button::before,
        .setup-style-grid-v40 button::before { height: 84px !important; }
        .col, .step-body, .pack-body, .production-pack, .step-section { min-width: 0 !important; max-width: 100% !important; overflow: visible !important; }
        .frow, .frow.frow2 { display: flex !important; flex-direction: column !important; align-items: stretch !important; grid-template-columns: none !important; gap: 14px !important; width: 100% !important; min-width: 0 !important; }
        .frow > *, .frow.frow2 > * { width: 100% !important; min-width: 0 !important; max-width: 100% !important; }
        .out-box, .out-box-v31 { width: 100% !important; max-width: 100% !important; min-width: 0 !important; border-radius: 18px !important; overflow: hidden !important; margin-inline: 0 !important; background: rgba(5, 7, 13, .74) !important; }
        .out-head { display: flex !important; align-items: center !important; justify-content: space-between !important; gap: 10px !important; min-height: 58px !important; padding: 14px !important; }
        .out-label { flex: 1 1 auto !important; min-width: 0 !important; max-width: 100% !important; font-size: 11px !important; line-height: 1.35 !important; letter-spacing: .24em !important; overflow-wrap: anywhere !important; word-break: normal !important; }
        .out-actions { display: flex !important; flex: 0 0 auto !important; gap: 8px !important; align-items: center !important; }
        .out-actions .btn, .out-actions button { min-height: 38px !important; padding: 0 12px !important; border-radius: 11px !important; font-size: 13px !important; white-space: nowrap !important; }
        .out-body { padding: 16px 14px !important; max-width: 100% !important; min-width: 0 !important; overflow: hidden !important; }
        .out-box-v31.is-compact .out-body { max-height: 224px !important; overflow: hidden !important; position: relative !important; }
        .out-box-v31.is-compact .out-body::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 44px; background: linear-gradient(to bottom, rgba(5,7,13,0), rgba(5,7,13,.96)); pointer-events: none; }
        .out-box-v31.is-open .out-body { max-height: none !important; overflow: visible !important; }
        .out-box-v31.is-open .out-body::after { display: none !important; }
        .out-pre, .out-pre.compact, .out-pre.mono, .out-pre.mono.compact { max-width: 100% !important; white-space: pre-wrap !important; overflow-wrap: anywhere !important; word-break: break-word !important; font-size: 14px !important; line-height: 1.58 !important; letter-spacing: 0 !important; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important; }
        .frame-card-row { display: block !important; padding: 14px !important; min-width: 0 !important; }
        .frame-card-lbl { margin-bottom: 8px !important; font-size: 10px !important; line-height: 1.35 !important; letter-spacing: .28em !important; }
        .frame-card-val { max-width: 100% !important; font-size: 17px !important; line-height: 1.45 !important; overflow-wrap: anywhere !important; word-break: break-word !important; }
        .frame-btns { display: flex !important; align-items: center !important; gap: 10px !important; overflow-x: auto !important; overflow-y: hidden !important; padding: 2px 0 12px !important; scroll-snap-type: x proximity; -webkit-overflow-scrolling: touch; }
        .frame-btns .fb { flex: 0 0 auto !important; min-height: 44px !important; padding: 0 18px !important; border-radius: 13px !important; white-space: nowrap !important; font-size: 12px !important; }
        .brow { display: flex !important; flex-wrap: wrap !important; gap: 10px !important; padding-bottom: 8px !important; }
        .brow .btn, .brow a.btn { flex: 1 1 180px !important; min-height: 44px !important; justify-content: center !important; white-space: normal !important; }
        .nc-bottom-nav { padding-bottom: calc(10px + env(safe-area-inset-bottom)) !important; }
        main, .studio-page, .page, .wrap, .app-shell, .storyboard-page { padding-bottom: calc(140px + env(safe-area-inset-bottom)) !important; }
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
  onNavigate,
  onSignOut,
}) {
  const email = account?.profile?.email || account?.session?.user?.email || "";
  const isSignedIn = Boolean(account?.session?.user);
  const displayName = account?.profile?.display_name || (email ? email.split("@")[0] : "Гость");
  const avatarUrl = account?.profile?.avatar_url || account?.session?.user?.user_metadata?.avatar_url || "";
  const planLabel = access?.isOwner ? "Director аккаунт" : access?.role === "pro" ? "Pro аккаунт" : isSignedIn ? "Бесплатный аккаунт" : "Гость";
  const planBadge = access?.isOwner ? "DIR" : access?.role === "pro" ? "PRO" : isSignedIn ? "FREE" : "";
  const langInfo = LANG_FLAGS[String(uiLang || "ru").toLowerCase()] || LANG_FLAGS.ru;
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
      <ProfileMenuModalSkin />
      <header className="nc-top-action-bar">
        <button className="nc-top-icon" type="button" onClick={onOpenMenu} aria-label="Меню">☰</button>
        <button className="nc-top-logo" type="button" onClick={() => onNavigate?.("setup")} aria-label="NeuroCine"><span>N</span></button>
        <div className="nc-top-spacer" aria-hidden></div>
        <button className="nc-lang nc-lang-flag" type="button" onClick={onToggleLang} aria-label={langInfo.title} title={langInfo.title}>
          <span className="nc-lang-flag-emoji" role="img" aria-hidden>{langInfo.flag}</span>
        </button>
        <div className="nc-profile-wrap" ref={profileRef}>
          <button className={"nc-profile nc-profile-avatar" + (showAvatarImg ? " has-image" : "")} type="button" onClick={() => setProfileOpen(o => !o)} aria-haspopup="menu" aria-expanded={profileOpen} title={email || "Профиль"}>
            {showAvatarImg ? <img src={avatarUrl} alt={displayName} onError={() => setImgError(true)} draggable="false" /> : <span className="nc-profile-initials">{initials}</span>}
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
                <span className="nc-profile-menu-icon" aria-hidden>{theme === "dark" ? "☀" : "☾"}</span><span>Тема: {theme === "dark" ? "тёмная" : "светлая"}</span><span className="nc-profile-menu-arrow" aria-hidden>→</span>
              </button>
              <button type="button" className="nc-profile-menu-item" onClick={() => handleProfileNav("pack")} role="menuitem"><span className="nc-profile-menu-icon" aria-hidden>◆</span><span>Партнёрская программа</span></button>
              <button type="button" className="nc-profile-menu-item" onClick={() => handleProfileNav("setup")} role="menuitem"><span className="nc-profile-menu-icon" aria-hidden>⚙</span><span>Настройки</span></button>
              <button type="button" className="nc-profile-menu-item" onClick={() => handleProfileNav("pack")} role="menuitem"><span className="nc-profile-menu-icon" aria-hidden>♦</span><span>Биллинг и тариф</span></button>
              {isSignedIn ? (
                <button type="button" className="nc-profile-menu-item nc-profile-menu-danger" onClick={handleSignOut} role="menuitem"><span className="nc-profile-menu-icon" aria-hidden>↪</span><span>Выйти</span></button>
              ) : (
                <button type="button" className="nc-profile-menu-item" onClick={() => handleProfileNav("auth")} role="menuitem"><span className="nc-profile-menu-icon" aria-hidden>↩</span><span>Войти</span></button>
              )}
            </div>
          )}
        </div>
      </header>
    </>
  );
}
