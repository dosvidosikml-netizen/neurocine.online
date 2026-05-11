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
  const plan = access?.isOwner || access?.isAdmin
    ? "OWNER"
    : access?.role === "pro"
    ? "PRO"
    : isSignedIn
    ? "FREE"
    : "AUTH";
  const keyState = access?.role === "pro" ? (access?.hasOwnApiKeys ? "LIVE" : "KEY") : plan;
  const displayName = account?.profile?.display_name || (email ? email.split("@")[0] : "Гость");
  const planLabel = access?.isOwner ? "Owner аккаунт" : access?.role === "pro" ? "Pro аккаунт" : isSignedIn ? "Бесплатный аккаунт" : "Гость";

  const [theme, setTheme] = useState("dark");
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const initial = readInitialTheme();
    setTheme(initial);
    applyTheme(initial);
  }, []);

  useEffect(() => {
    if (!profileOpen) return;
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
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

      <button className="nc-lang" type="button" onClick={onToggleLang} aria-label="Сменить язык">
        {uiLang.toUpperCase()}
      </button>

      <div className="nc-profile-wrap" ref={profileRef}>
        <button
          className="nc-profile"
          type="button"
          onClick={() => setProfileOpen(o => !o)}
          aria-haspopup="menu"
          aria-expanded={profileOpen}
          title={email || "Профиль"}
        >
          <span>{String(keyState || "U").slice(0, 3)}</span>
        </button>

        {profileOpen && (
          <div className="nc-profile-menu" role="menu">
            <div className="nc-profile-menu-head">
              <div className="nc-profile-menu-plan">{planLabel}</div>
              <div className="nc-profile-menu-name">{displayName}</div>
              {email && <div className="nc-profile-menu-email">{email}</div>}
            </div>

            <button
              type="button"
              className="nc-profile-menu-item nc-profile-menu-theme"
              onClick={toggleTheme}
              role="menuitem"
            >
              <span className="nc-profile-menu-icon" aria-hidden>{theme === "dark" ? "☀" : "☾"}</span>
              <span>Тема: {theme === "dark" ? "тёмная" : "светлая"}</span>
              <span className="nc-profile-menu-arrow" aria-hidden>→</span>
            </button>

            <button
              type="button"
              className="nc-profile-menu-item"
              onClick={() => handleProfileNav("pack")}
              role="menuitem"
            >
              <span className="nc-profile-menu-icon" aria-hidden>◆</span>
              <span>Партнёрская программа</span>
            </button>

            <button
              type="button"
              className="nc-profile-menu-item"
              onClick={() => handleProfileNav("setup")}
              role="menuitem"
            >
              <span className="nc-profile-menu-icon" aria-hidden>⚙</span>
              <span>Настройки</span>
            </button>

            <button
              type="button"
              className="nc-profile-menu-item"
              onClick={() => handleProfileNav("pack")}
              role="menuitem"
            >
              <span className="nc-profile-menu-icon" aria-hidden>♦</span>
              <span>Биллинг и тариф</span>
            </button>

            {isSignedIn ? (
              <button
                type="button"
                className="nc-profile-menu-item nc-profile-menu-danger"
                onClick={handleSignOut}
                role="menuitem"
              >
                <span className="nc-profile-menu-icon" aria-hidden>↪</span>
                <span>Выйти</span>
              </button>
            ) : (
              <button
                type="button"
                className="nc-profile-menu-item"
                onClick={() => handleProfileNav("auth")}
                role="menuitem"
              >
                <span className="nc-profile-menu-icon" aria-hidden>↩</span>
                <span>Войти</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
