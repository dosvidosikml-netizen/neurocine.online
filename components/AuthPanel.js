"use client";

import { useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";
import { getAccountAccess } from "../lib/accountRoles";
import { buildAuthCallbackRedirect, getCurrentReturnTo } from "../lib/authRedirect";

function getUserMeta(user) {
  const meta = user?.user_metadata || {};
  return {
    email: user?.email || meta.email || "",
    name: meta.full_name || meta.name || user?.email || "User",
    avatar: meta.avatar_url || meta.picture || "",
  };
}

function getRedirectTo() {
  if (typeof window === "undefined") return undefined;
  return buildAuthCallbackRedirect(getCurrentReturnTo("/storyboard"));
}

function isStoryboardRoute() {
  if (typeof window === "undefined") return false;
  const path = window.location?.pathname || "";
  return path === "/storyboard" || path.startsWith("/storyboard/");
}

function clearLocalAuthFallback() {
  try {
    localStorage.removeItem("nc-auth-loading");
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const low = key.toLowerCase();
      if (
        low.includes("supabase") ||
        low.includes("sb-") ||
        low.includes("auth-token") ||
        low.includes("nc_account") ||
        low.includes("neurocine:account")
      ) keys.push(key);
    }
    keys.forEach((key) => localStorage.removeItem(key));
  } catch {}

  try {
    const keys = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key) continue;
      const low = key.toLowerCase();
      if (low.includes("supabase") || low.includes("auth-token") || low.includes("neurocine")) keys.push(key);
    }
    keys.forEach((key) => sessionStorage.removeItem(key));
  } catch {}
}

function AuthPanelStoryboardStyles() {
  return (
    <style jsx global>{`
      .auth-panel-v42.is-storyboard-compact {
        width: min(calc(100% - 18px), 1180px);
        margin: 8px auto 10px;
        padding: 8px;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 8px;
        align-items: center;
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 18px;
        background: rgba(8,10,18,.62);
        box-shadow: 0 12px 42px rgba(0,0,0,.26), inset 0 1px 0 rgba(255,255,255,.05);
        backdrop-filter: blur(14px);
      }
      .auth-panel-v42.is-storyboard-compact .auth-panel-main-v42 {
        min-width: 0;
      }
      .auth-panel-v42.is-storyboard-compact .auth-label-v42 {
        margin: 0 0 3px;
        font-size: 9px;
        letter-spacing: .18em;
        color: rgba(238,240,248,.44);
      }
      .auth-panel-v42.is-storyboard-compact .auth-user-v42 {
        display: grid;
        grid-template-columns: 34px minmax(0, 1fr);
        gap: 9px;
        align-items: center;
        min-width: 0;
      }
      .auth-panel-v42.is-storyboard-compact .auth-user-v42 img,
      .auth-panel-v42.is-storyboard-compact .auth-avatar-fallback-v42 {
        width: 34px;
        height: 34px;
        border-radius: 12px;
      }
      .auth-panel-v42.is-storyboard-compact .auth-user-v42 strong,
      .auth-panel-v42.is-storyboard-compact .auth-user-v42 span {
        display: block;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .auth-panel-v42.is-storyboard-compact .auth-user-v42 strong {
        font-size: 13px;
        line-height: 1.1;
      }
      .auth-panel-v42.is-storyboard-compact .auth-user-v42 span,
      .auth-panel-v42.is-storyboard-compact .auth-muted-v42 {
        color: rgba(238,240,248,.55);
        font-size: 11px;
      }
      .auth-panel-v42.is-storyboard-compact .auth-status-grid-v42 {
        display: none;
      }
      .auth-panel-v42.is-storyboard-compact .auth-actions-v42 {
        min-width: 0;
      }
      .auth-panel-v42.is-storyboard-compact .auth-google-btn-v42,
      .auth-panel-v42.is-storyboard-compact .auth-logout-btn-v42 {
        width: auto;
        min-width: 88px;
        height: 40px;
        padding: 0 14px;
        border-radius: 14px;
        font-size: 12px;
        font-weight: 900;
      }
      .auth-panel-v42.is-storyboard-compact .auth-error-v42 {
        grid-column: 1 / -1;
        margin: 0;
        padding: 8px 10px;
        border-radius: 12px;
        font-size: 11px;
      }
      @media (max-width: 430px) {
        .auth-panel-v42.is-storyboard-compact {
          width: min(calc(100% - 12px), 1180px);
          grid-template-columns: minmax(0, 1fr) auto;
          border-radius: 16px;
        }
        .auth-panel-v42.is-storyboard-compact .auth-label-v42 {
          display: none;
        }
        .auth-panel-v42.is-storyboard-compact .auth-user-v42 {
          grid-template-columns: 30px minmax(0, 1fr);
          gap: 8px;
        }
        .auth-panel-v42.is-storyboard-compact .auth-user-v42 img,
        .auth-panel-v42.is-storyboard-compact .auth-avatar-fallback-v42 {
          width: 30px;
          height: 30px;
          border-radius: 11px;
        }
        .auth-panel-v42.is-storyboard-compact .auth-user-v42 strong {
          font-size: 12px;
        }
        .auth-panel-v42.is-storyboard-compact .auth-user-v42 span {
          display: none;
        }
        .auth-panel-v42.is-storyboard-compact .auth-google-btn-v42,
        .auth-panel-v42.is-storyboard-compact .auth-logout-btn-v42 {
          min-width: 72px;
          height: 36px;
          padding: 0 12px;
          font-size: 11px;
        }
      }
    `}</style>
  );
}

export default function AuthPanel({ devMode = true, onModeToggle, onAccountChange }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [compactStoryboard, setCompactStoryboard] = useState(false);

  const user = session?.user || null;
  const meta = useMemo(() => getUserMeta(user), [user]);
  const access = getAccountAccess(profile, session);

  useEffect(() => {
    setCompactStoryboard(isStoryboardRoute());
  }, []);

  useEffect(() => {
    let mounted = true;

    async function bootAuth() {
      if (!isSupabaseConfigured || !supabase) {
        setLoading(false);
        return;
      }

      try {
        const timeout = setTimeout(() => {
          if (mounted) setLoading(false);
        }, 3000);

        const { data, error: sessionError } = await supabase.auth.getSession();

        clearTimeout(timeout);

        if (!mounted) return;

        if (sessionError) {
          console.warn("Auth restore failed", sessionError);
          setError(sessionError.message);
        }

        setSession(data?.session || null);
      } catch (e) {
        console.warn("Auth bootstrap failed", e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    bootAuth();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession || null);
      setBusy(false);
      setLoading(false);
      try { localStorage.removeItem("nc-auth-loading"); } catch {}
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured || !supabase || !user?.id) {
      setProfile(null);
      return;
    }

    async function syncProfile() {
      try {
        const baseProfile = {
          id: user.id,
          email: meta.email,
          full_name: meta.name,
          avatar_url: meta.avatar,
          updated_at: new Date().toISOString(),
        };

        await supabase.from("profiles").upsert(baseProfile, { onConflict: "id" });

        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (!mounted) return;
        setProfile(data || baseProfile);
      } catch (e) {
        console.warn("Profile sync failed", e);
      }
    }

    syncProfile();

    return () => {
      mounted = false;
    };
  }, [user?.id, meta.email]);

  useEffect(() => {
    onAccountChange?.({
      session,
      user,
      profile,
      access,
      isSignedIn: Boolean(user),
      isSupabaseConfigured,
    });
  }, [session, user?.id, profile?.id]);

  async function loginWithGoogle() {
    setError("");

    if (!isSupabaseConfigured || !supabase) {
      setError("Supabase ENV не настроены на Render");
      return;
    }

    setBusy(true);

    try {
      localStorage.setItem("nc-auth-loading", "1");

      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getRedirectTo(),
          skipBrowserRedirect: true,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });

      if (signInError) {
        setBusy(false);
        setError(signInError.message);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      setBusy(false);
      setError("OAuth URL missing");
    } catch (e) {
      setBusy(false);
      setError(e?.message || "Google login failed");
    }
  }

  async function logout() {
    setBusy(true);
    setError("");

    try {
      if (isSupabaseConfigured && supabase?.auth?.signOut) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.warn("Logout failed", e);
    } finally {
      clearLocalAuthFallback();
      window.location.assign("/?signed_out=1");
    }
  }

  const generationModeText = !user
    ? "Вход нужен"
    : access.isOwner || access.isAdmin
      ? "DIRECTOR LIVE"
      : access.role === "pro"
        ? (access.hasOwnApiKeys ? "PRO LIVE" : "PRO · ключ нужен")
        : "FREE PREVIEW";

  const canSwitchMode = Boolean(user && access.canLive);

  return (
    <section className={`auth-panel-v42${compactStoryboard ? " is-storyboard-compact" : ""}`}>
      {compactStoryboard && <AuthPanelStoryboardStyles />}
      <div className="auth-panel-main-v42">
        <div className="auth-label-v42">Аккаунт NeuroCine {access.isOwner || access.isAdmin ? "· DIRECTOR" : ""}</div>

        {loading ? (
          <div className="auth-muted-v42">Проверяю вход...</div>
        ) : user ? (
          <div className="auth-user-v42">
            {meta.avatar ? <img src={meta.avatar} alt="" /> : <div className="auth-avatar-fallback-v42">{String(meta.name || "U").slice(0, 1).toUpperCase()}</div>}
            <div>
              <strong>{meta.name}</strong>
              <span>{meta.email}</span>
            </div>
          </div>
        ) : (
          <div className="auth-muted-v42">Войди через Google, чтобы сохранять проекты.</div>
        )}
      </div>

      <div className="auth-status-grid-v42">
        <div className={`auth-chip-v42 ${access.isOwner ? "is-owner" : access.isAdmin ? "is-admin" : access.role === "pro" ? "is-pro" : user ? "is-free" : "is-demo"}`}>
          <span>Статус</span>
          <strong>{user ? (access.isOwner || access.isAdmin ? "DIRECTOR" : access.role === "pro" ? "PRO" : "FREE") : "AUTH"}</strong>
        </div>

        {canSwitchMode ? (
          <button className={`auth-chip-v42 auth-mode-v42 ${devMode ? "is-demo" : "is-live"}`} onClick={onModeToggle} type="button">
            <span>Режим генерации</span>
            <strong>{generationModeText}</strong>
          </button>
        ) : (
          <div className={`auth-chip-v42 auth-mode-v42 ${access.role === "pro" ? "is-pro" : "is-demo"}`}>
            <span>Режим генерации</span>
            <strong>{generationModeText}</strong>
          </div>
        )}
      </div>

      <div className="auth-actions-v42">
        {!user ? (
          <button className="auth-google-btn-v42" onClick={loginWithGoogle} disabled={busy || !isSupabaseConfigured} type="button">
            {busy ? "Открываю..." : compactStoryboard ? "Войти" : "Войти через Google"}
          </button>
        ) : (
          <button className="auth-logout-btn-v42" onClick={logout} disabled={busy} type="button">
            {busy ? "..." : "Выйти"}
          </button>
        )}
      </div>

      {!isSupabaseConfigured && <div className="auth-error-v42">Нет NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY в Render.</div>}
      {error && <div className="auth-error-v42">{error}</div>}
    </section>
  );
}
