"use client";

import { useEffect, useState } from "react";
import ProfileSettingsModal from "../ProfileSettingsModal";
import CartoonTopBrand from "./CartoonTopBrand";

const THEME_STORAGE_KEY = "neurocine.theme";

const LANG_FLAGS = {
  ru: { flag: "🇷🇺", title: "Switch to English" },
  en: { flag: "🇬🇧", title: "Переключить на русский" },
};

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

function getInitials(name, email) {
  const source = (name || email || "").trim();
  if (!source) return "U";
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export default function CartoonTopActionBar({ account, access, uiLang = "ru", onToggleLang, onOpenMenu, onNavigate, onSignOut }) {
  const email = account?.profile?.email || account?.session?.user?.email || "";
  const userMeta = account?.session?.user?.user_metadata || {};
  const isSignedIn = Boolean(account?.session?.user);
  const displayName = account?.profile?.display_name || account?.profile?.full_name || userMeta.full_name || userMeta.name || (email ? email.split("@")[0] : "Гость");
  const avatarUrl = account?.profile?.avatar_url || userMeta.avatar_url || userMeta.picture || "";
  const planBadge = access?.isOwner || access?.isAdmin ? "DIR" : access?.role === "pro" ? "PRO" : isSignedIn ? "FREE" : "";
  const langInfo = LANG_FLAGS[String(uiLang || "ru").toLowerCase()] || LANG_FLAGS.ru;
  const initials = getInitials(displayName, email);
  const [theme, setTheme] = useState("dark");
  const [profileOpen, setProfileOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const initial = readInitialTheme();
    setTheme(initial);
    applyTheme(initial);
  }, []);

  useEffect(() => { setImgError(false); }, [avatarUrl]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    try { window.localStorage.setItem(THEME_STORAGE_KEY, next); } catch {}
  }

  const showAvatarImg = avatarUrl && !imgError;

  return (
    <>
      <header className="nc-top-action-bar nc-cartoon-top-action-bar">
        <button className="nc-top-icon" type="button" onClick={onOpenMenu} aria-label="Меню">☰</button>
        <button className="nc-top-brand-slot" type="button" onClick={() => onNavigate?.("setup")} aria-label="NeuroCine">
          <CartoonTopBrand />
        </button>
        <button className="nc-lang nc-lang-flag" type="button" onClick={onToggleLang} aria-label={langInfo.title} title={langInfo.title}>
          <span className="nc-lang-flag-emoji" role="img" aria-hidden>{langInfo.flag}</span>
        </button>
        <div className="nc-profile-wrap">
          <button className={"nc-profile nc-profile-avatar" + (showAvatarImg ? " has-image" : "")} type="button" onClick={() => setProfileOpen(true)} aria-haspopup="dialog" aria-expanded={profileOpen} title={email || "Профиль"}>
            {showAvatarImg ? <img src={avatarUrl} alt={displayName} onError={() => setImgError(true)} draggable="false" /> : <span className="nc-profile-initials">{initials}</span>}
            {planBadge && <span className={"nc-profile-plan-dot plan-" + planBadge.toLowerCase()} aria-hidden>{planBadge[0]}</span>}
          </button>
        </div>
      </header>
      <ProfileSettingsModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        account={account}
        access={access}
        theme={theme}
        onToggleTheme={toggleTheme}
        onNavigate={onNavigate}
        onSignOut={onSignOut || (() => onNavigate?.("auth"))}
      />
    </>
  );
}
