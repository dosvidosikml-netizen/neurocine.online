"use client";

import { useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";
import { getAccountAccess, isOwnerEmail } from "../lib/accountRoles";

function getUserMeta(user) {
  const meta = user?.user_metadata || {};
  return {
    email: user?.email || meta.email || "",
    name: meta.full_name || meta.name || user?.email || "User",
    avatar: meta.avatar_url || meta.picture || "",
  };
}

export default function AuthPanel({ devMode = true, onModeToggle, onAccountChange }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const user = session?.user || null;
  const meta = useMemo(() => getUserMeta(user), [user]);
  const access = getAccountAccess(profile, session);
  
  useEffect(() => {
    let mounted = true;
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    async function loadSession() {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!mounted) return;
      if (sessionError) setError(sessionError.message);
      setSession(data?.session || null);
      setLoading(false);
    }

    loadSession();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession || null);
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
      const owner = isOwnerEmail(meta.email);
      const nextProfile = {
        id: user.id,
        email: meta.email,
        full_name: meta.name,
        avatar_url: meta.avatar,
        updated_at: new Date().toISOString(),
        ...(owner ? {
          role: "admin",
          plan: "admin",
          default_mode: "live",
          monthly_generation_limit: 999999,
          cloud_project_limit: 9999,
        } : {}),
      };

      await supabase.from("profiles").upsert(nextProfile, { onConflict: "id" });

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("id,email,full_name,avatar_url,role,plan,created_at,updated_at,default_mode,monthly_generation_limit,generations_used,cloud_project_limit,cloud_projects_used,api_keys_connected,api_key_status,pro_api_note,billing_status,billing_provider,billing_subscription_id,pro_activated_at,pro_expires_at")
        .eq("id", user.id)
        .maybeSingle();

      if (!mounted) return;
      if (profileError) {
        setError(profileError.message);
        setProfile({ ...nextProfile, role: "free", plan: "free" });
      } else {
        setProfile(data || { ...nextProfile, role: "free", plan: "free" });
      }
    }

    syncProfile();
    return () => { mounted = false; };
  }, [user?.id, meta.email, meta.name, meta.avatar]);

  useEffect(() => {
    onAccountChange?.({
      session,
      user,
      profile,
      access,
      isSignedIn: Boolean(user),
      isSupabaseConfigured,
    });
  }, [session, user?.id, profile?.id, profile?.role, profile?.plan, access.role, isSupabaseConfigured]);

  async function loginWithGoogle() {
    if (!isSupabaseConfigured || !supabase) {
      setError("Supabase ENV не настроены на Render");
      return;
    }
    setBusy(true);
    setError("");
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/storyboard` : undefined;
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (signInError) {
      setError(signInError.message);
      setBusy(false);
    }
  }

  async function logout() {
    if (!supabase) return;
    setBusy(true);
    setError("");
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) setError(signOutError.message);
    setBusy(false);
  }

  const generationModeText = !user
    ? "Вход нужен"
    : access.isOwner || access.isAdmin
      ? "LIVE OWNER"
      : access.role === "pro"
        ? (access.hasOwnApiKeys ? "PRO LIVE" : "PRO · ключ нужен")
        : "FREE PREVIEW";

  const canSwitchMode = Boolean(user && access.canLive);

  return (
    <section className="auth-panel-v42">
      <div className="auth-panel-main-v42">
        <div className="auth-label-v42">Аккаунт NeuroCine {access.isOwner || access.isAdmin ? "· OWNER" : ""}</div>
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
          <div className="auth-muted-v42">Войди через Google, чтобы сохранять проекты. FREE — попробовать студию, PRO — полный рабочий режим.</div>
        )}
      </div>

      <div className="auth-status-grid-v42">
        <div className={`auth-chip-v42 ${access.isOwner ? "is-owner" : access.isAdmin ? "is-admin" : access.role === "pro" ? "is-pro" : user ? "is-free" : "is-demo"}`}>
          <span>Статус</span>
          <strong>{user ? (access.isOwner || access.isAdmin ? "OWNER" : access.role === "pro" ? "PRO" : "FREE") : "AUTH"}</strong>
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
            {busy ? "Открываю Google..." : "Войти через Google"}
          </button>
        ) : (
          <button className="auth-logout-btn-v42" onClick={logout} disabled={busy} type="button">
            Выйти
          </button>
        )}
      </div>

      {!isSupabaseConfigured && <div className="auth-error-v42">Нет NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY в Render.</div>}
      {error && <div className="auth-error-v42">{error}</div>}
    </section>
  );
}
