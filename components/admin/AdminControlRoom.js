"use client";

import { useEffect, useMemo, useState } from "react";
import AdminPanel from "../AdminPanel";
import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient";
import { getAccountAccess, isOwnerEmail } from "../../lib/accountRoles";

function userMeta(user) {
  const meta = user?.user_metadata || {};
  return {
    email: user?.email || meta.email || "",
    name: meta.full_name || meta.name || user?.email || "Director",
    avatar: meta.avatar_url || meta.picture || "",
  };
}

function redirectToControlRoom() {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}/director/control-room`;
}

function AdminAccessGate({ account, loading, onLogin, onLogout, busy, error }) {
  const access = account?.access || {};
  const signedIn = Boolean(account?.session?.user);
  const allowed = Boolean(access.isOwner || access.isAdmin);

  if (loading) {
    return <div className="nc-admin-gate"><div className="nc-admin-card"><b>Проверяю Director-доступ…</b><p>Загружаю сессию и профиль.</p></div></div>;
  }

  if (!isSupabaseConfigured) {
    return <div className="nc-admin-gate"><div className="nc-admin-card danger"><b>Supabase не настроен</b><p>Для Director Control Room нужны NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY.</p></div></div>;
  }

  if (!signedIn) {
    return (
      <div className="nc-admin-gate">
        <div className="nc-admin-card">
          <span>DIRECTOR CONTROL ROOM</span>
          <h1>Закрытая панель управления</h1>
          <p>Войди через аккаунт владельца или администратора NeuroCine. Storyboard Studio не загружается и не патчится.</p>
          {error && <em>{error}</em>}
          <button type="button" onClick={onLogin} disabled={busy}>{busy ? "Открываю Google…" : "Войти через Google"}</button>
          <a href="/storyboard">← Вернуться в Storyboard Studio</a>
        </div>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="nc-admin-gate">
        <div className="nc-admin-card danger">
          <span>403</span>
          <h1>Director access required</h1>
          <p>Этот раздел доступен только владельцу или администратору. Твой текущий план: {access.publicLabel || access.label || "USER"}.</p>
          <div className="nc-admin-gate-actions">
            <button type="button" onClick={onLogout} disabled={busy}>Выйти</button>
            <a href="/storyboard">В Storyboard Studio</a>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function AdminControlRoom() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const user = session?.user || null;
  const meta = useMemo(() => userMeta(user), [user]);
  const access = getAccountAccess(profile, session);
  const account = { session, user, profile, access, isSignedIn: Boolean(user), isSupabaseConfigured };
  const allowed = Boolean(access.isOwner || access.isAdmin);

  useEffect(() => {
    let mounted = true;
    async function boot() {
      if (!isSupabaseConfigured || !supabase) {
        setLoading(false);
        return;
      }
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (!mounted) return;
        if (sessionError) setError(sessionError.message || "Auth session error");
        setSession(data?.session || null);
      } catch (e) {
        if (mounted) setError(e?.message || "Auth bootstrap failed");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    boot();
    const { data: sub } = supabase?.auth?.onAuthStateChange?.((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession || null);
      setBusy(false);
      setLoading(false);
    }) || { data: null };
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
    async function loadProfile() {
      try {
        const owner = isOwnerEmail(meta.email);
        const baseProfile = {
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
        await supabase.from("profiles").upsert(baseProfile, { onConflict: "id" });
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
        if (mounted) setProfile(data || baseProfile);
      } catch (e) {
        if (mounted) setError(e?.message || "Profile load failed");
      }
    }
    loadProfile();
    return () => { mounted = false; };
  }, [user?.id, meta.email]);

  async function loginWithGoogle() {
    setError("");
    if (!isSupabaseConfigured || !supabase) {
      setError("Supabase ENV не настроены");
      return;
    }
    setBusy(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectToControlRoom(),
          skipBrowserRedirect: true,
          queryParams: { access_type: "offline", prompt: "select_account" },
        },
      });
      if (signInError) throw signInError;
      if (data?.url) window.location.href = data.url;
      else throw new Error("OAuth URL missing");
    } catch (e) {
      setBusy(false);
      setError(e?.message || "Google login failed");
    }
  }

  async function logout() {
    setBusy(true);
    try { await supabase?.auth?.signOut?.(); } catch {}
    setSession(null);
    setProfile(null);
    setBusy(false);
  }

  const gate = <AdminAccessGate account={account} loading={loading} onLogin={loginWithGoogle} onLogout={logout} busy={busy} error={error} />;
  if (loading || !allowed) return <main className="nc-admin-page">{gate}</main>;

  return (
    <main className="nc-admin-page">
      <header className="nc-admin-hero">
        <div>
          <p>DIRECTOR CONTROL ROOM</p>
          <h1>Панель управления NeuroCine</h1>
          <span>Админка вынесена из /storyboard. Центральная Studio остаётся чистой.</span>
        </div>
        <nav>
          <a href="/storyboard">Storyboard Studio</a>
          <a href="/series">Series Studio</a>
          <button type="button" onClick={logout} disabled={busy}>Выйти</button>
        </nav>
      </header>

      <section className="nc-admin-grid">
        <aside className="nc-admin-rail">
          <b>Control modules</b>
          <a href="#director-console-content">Users & Roles</a>
          <a href="#director-console-content">Billing requests</a>
          <a href="#director-console-content">Usage events</a>
          <a href="#director-console-content">API access</a>
          <small>Следующие модули подключим сюда, не в /storyboard.</small>
        </aside>
        <div className="nc-admin-content">
          <AdminPanel account={account} />
        </div>
      </section>
    </main>
  );
}
