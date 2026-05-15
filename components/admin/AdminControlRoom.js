"use client";

import { useEffect, useMemo, useState } from "react";
import AdminPanel from "../AdminPanel";
import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient";
import { getAccountAccess, isOwnerEmail } from "../../lib/accountRoles";

function userMeta(user) {
  const meta = user?.user_metadata || {};
  return {
    email: user?.email || meta.email || "",
    name: meta.full_name || meta.name || user?.email || "Главный режиссёр",
    avatar: meta.avatar_url || meta.picture || "",
  };
}

function redirectToControlRoom() {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}/director/control-room`;
}

function ControlRoomStyles() {
  return (
    <style jsx global>{`
      .nc-admin-page {
        min-height: 100vh;
        padding: 22px;
        background:
          radial-gradient(circle at 12% 0%, rgba(168, 85, 247, 0.20), transparent 34%),
          radial-gradient(circle at 90% 8%, rgba(229, 53, 53, 0.13), transparent 32%),
          radial-gradient(circle at 50% 100%, rgba(250, 204, 21, 0.07), transparent 35%),
          #07080f;
      }
      .nc-admin-gate {
        min-height: calc(100vh - 44px);
        display: grid;
        place-items: center;
      }
      .nc-admin-card {
        width: min(620px, 100%);
        border: 1px solid rgba(255,255,255,.12);
        background: rgba(255,255,255,.055);
        border-radius: 28px;
        padding: 28px;
        box-shadow: 0 24px 90px rgba(0,0,0,.55), 0 0 55px rgba(168,85,247,.12);
      }
      .nc-admin-card span,
      .nc-admin-hero p {
        display: block;
        margin-bottom: 10px;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: .28em;
        text-transform: uppercase;
        color: #f0abfc;
      }
      .nc-admin-card h1,
      .nc-admin-hero h1 {
        margin: 0 0 10px;
        font-size: clamp(28px, 5vw, 52px);
        line-height: .96;
        letter-spacing: -.06em;
      }
      .nc-admin-card p,
      .nc-admin-hero span,
      .nc-admin-rail small {
        color: rgba(238,240,248,.66);
        font-size: 14px;
      }
      .nc-admin-card em {
        display: block;
        margin-top: 14px;
        color: #fca5a5;
        font-style: normal;
        font-size: 13px;
      }
      .nc-admin-card button,
      .nc-admin-card a,
      .nc-admin-hero a,
      .nc-admin-hero button,
      .nc-admin-rail a {
        border: 1px solid rgba(255,255,255,.14);
        background: rgba(255,255,255,.08);
        color: #eef0f8;
        border-radius: 14px;
        padding: 11px 15px;
        font-weight: 850;
        font-size: 13px;
        cursor: pointer;
        text-decoration: none;
      }
      .nc-admin-card button {
        width: 100%;
        margin-top: 20px;
        background: linear-gradient(135deg, #a855f7, #e53535, #facc15);
        border-color: transparent;
        box-shadow: 0 0 28px rgba(168,85,247,.26);
      }
      .nc-admin-card a {
        display: inline-flex;
        margin-top: 12px;
      }
      .nc-admin-card.danger { border-color: rgba(229,53,53,.35); }
      .nc-admin-gate-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 18px; }
      .nc-admin-gate-actions button { width: auto; margin: 0; }
      .nc-admin-gate-actions a { margin: 0; }
      .nc-admin-hero {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 20px;
        max-width: 1440px;
        margin: 0 auto 20px;
        border: 1px solid rgba(255,255,255,.12);
        background: rgba(255,255,255,.045);
        border-radius: 30px;
        padding: 24px;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 18px 80px rgba(0,0,0,.35);
      }
      .nc-admin-hero nav {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }
      .nc-admin-owner-badge {
        display: inline-flex !important;
        align-items: center;
        gap: 10px;
        width: fit-content;
        margin: 14px 0 0 !important;
        padding: 10px 14px;
        border: 1px solid rgba(250,204,21,.38);
        border-radius: 999px;
        background: linear-gradient(135deg, rgba(250,204,21,.16), rgba(168,85,247,.18), rgba(229,53,53,.12));
        color: #fff7d6 !important;
        font-size: 12px !important;
        font-weight: 950;
        letter-spacing: .08em !important;
        text-transform: uppercase;
        box-shadow: 0 0 32px rgba(250,204,21,.18), 0 0 60px rgba(168,85,247,.12);
      }
      .nc-admin-owner-badge strong {
        color: #fff;
        text-shadow: 0 0 14px rgba(250,204,21,.55), 0 0 24px rgba(168,85,247,.35);
      }
      .nc-admin-grid {
        max-width: 1440px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: 260px minmax(0, 1fr);
        gap: 18px;
        align-items: start;
      }
      .nc-admin-rail {
        position: sticky;
        top: 18px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        border: 1px solid rgba(255,255,255,.1);
        background: rgba(0,0,0,.25);
        border-radius: 24px;
        padding: 16px;
      }
      .nc-admin-rail b {
        margin-bottom: 6px;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: .22em;
        color: rgba(238,240,248,.54);
      }
      .nc-admin-rail a {
        display: block;
        background: rgba(255,255,255,.045);
      }
      .nc-admin-content { min-width: 0; }
      .nc-admin-content .admin-panel-v59 { margin: 0; }
      @media (max-width: 900px) {
        .nc-admin-page { padding: 12px; }
        .nc-admin-hero { flex-direction: column; border-radius: 24px; }
        .nc-admin-hero nav { justify-content: flex-start; }
        .nc-admin-grid { grid-template-columns: 1fr; }
        .nc-admin-rail { position: static; }
      }
    `}</style>
  );
}

function AdminAccessGate({ account, loading, onLogin, onLogout, busy, error }) {
  const access = account?.access || {};
  const signedIn = Boolean(account?.session?.user);
  const allowed = Boolean(access.isOwner || access.isAdmin);

  if (loading) {
    return <><ControlRoomStyles /><div className="nc-admin-gate"><div className="nc-admin-card"><b>Проверяю режиссёрский доступ…</b><p>Загружаю сессию и профиль.</p></div></div></>;
  }

  if (!isSupabaseConfigured) {
    return <><ControlRoomStyles /><div className="nc-admin-gate"><div className="nc-admin-card danger"><b>Supabase не настроен</b><p>Для «Режиссёрской рубки» нужны NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY.</p></div></div></>;
  }

  if (!signedIn) {
    return (
      <>
        <ControlRoomStyles />
        <div className="nc-admin-gate">
          <div className="nc-admin-card">
            <span>РЕЖИССЁРСКАЯ РУБКА</span>
            <h1>Закрытая панель управления</h1>
            <p>Войди через аккаунт владельца или администратора NeuroCine. Центральная Storyboard Studio здесь не загружается и не патчится.</p>
            {error && <em>{error}</em>}
            <button type="button" onClick={onLogin} disabled={busy}>{busy ? "Открываю Google…" : "Войти через Google"}</button>
            <a href="/storyboard">← Вернуться в Студию раскадровки</a>
          </div>
        </div>
      </>
    );
  }

  if (!allowed) {
    return (
      <>
        <ControlRoomStyles />
        <div className="nc-admin-gate">
          <div className="nc-admin-card danger">
            <span>403</span>
            <h1>Нужен доступ главного режиссёра</h1>
            <p>Этот раздел доступен только владельцу или администратору. Твой текущий план: {access.publicLabel || access.label || "пользователь"}.</p>
            <div className="nc-admin-gate-actions">
              <button type="button" onClick={onLogout} disabled={busy}>Выйти</button>
              <a href="/storyboard">В Студию раскадровки</a>
            </div>
          </div>
        </div>
      </>
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
        if (sessionError) setError(sessionError.message || "Ошибка сессии");
        setSession(data?.session || null);
      } catch (e) {
        if (mounted) setError(e?.message || "Не удалось загрузить авторизацию");
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
        if (mounted) setError(e?.message || "Не удалось загрузить профиль");
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
      <ControlRoomStyles />
      <header className="nc-admin-hero">
        <div>
          <p>РЕЖИССЁРСКАЯ РУБКА</p>
          <h1>Панель управления NeuroCine</h1>
          <span>Админка вынесена из /storyboard. Центральная Студия раскадровки остаётся чистой.</span>
          <span className="nc-admin-owner-badge">✨ <strong>{meta.name || "Главный режиссёр"}</strong> · сияющий доступ владельца</span>
        </div>
        <nav>
          <a href="/storyboard">Студия раскадровки</a>
          <a href="/series">Студия сериалов</a>
          <button type="button" onClick={logout} disabled={busy}>Выйти</button>
        </nav>
      </header>

      <section className="nc-admin-grid">
        <aside className="nc-admin-rail">
          <b>Модули управления</b>
          <a href="#director-console-content">Пользователи и роли</a>
          <a href="#director-console-content">Заявки и тарифы</a>
          <a href="#director-console-content">Журнал генераций</a>
          <a href="#director-console-content">API и модели</a>
          <small>Следующие модули подключим сюда, а не в /storyboard.</small>
        </aside>
        <div className="nc-admin-content">
          <AdminPanel account={account} />
        </div>
      </section>
    </main>
  );
}
