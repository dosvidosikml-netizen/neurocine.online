"use client";

import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

function go(path) {
  if (typeof window !== "undefined") window.location.assign(path);
}

function getRedirectTo(path = "/") {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}${path}`;
}

function HomeStyles() {
  return (
    <style jsx global>{`
      .nc-home-v1,
      .nc-home-v1 * { box-sizing: border-box; }
      .nc-home-v1 {
        min-height: 100vh;
        color: #f8fafc;
        background:
          radial-gradient(circle at 12% 0%, rgba(168,85,247,.22), transparent 34%),
          radial-gradient(circle at 90% 8%, rgba(255,92,42,.18), transparent 28%),
          radial-gradient(circle at 50% 100%, rgba(34,197,94,.10), transparent 34%),
          #07080f;
        overflow-x: hidden;
      }
      .nc-home-shell-v1 {
        width: min(1180px, calc(100% - 28px));
        margin: 0 auto;
        padding: 22px 0 90px;
      }
      .nc-home-top-v1 {
        position: sticky;
        top: 0;
        z-index: 40;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 0 14px;
        background: linear-gradient(to bottom, rgba(7,8,15,.96), rgba(7,8,15,.72), transparent);
        backdrop-filter: blur(12px);
      }
      .nc-home-logo-v1 {
        width: 54px;
        height: 54px;
        display: grid;
        place-items: center;
        border-radius: 18px;
        background: linear-gradient(135deg, #ff5a8a, #7c3aed);
        box-shadow: 0 16px 40px rgba(168,85,247,.26);
        font-size: 26px;
        font-weight: 950;
      }
      .nc-home-brand-v1 { min-width: 0; }
      .nc-home-brand-v1 strong { display: block; font-size: 18px; letter-spacing: -.03em; }
      .nc-home-brand-v1 span { display: block; color: rgba(238,240,248,.56); font-size: 12px; }
      .nc-home-spacer-v1 { flex: 1; }
      .nc-home-nav-v1 {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .nc-home-nav-v1 a,
      .nc-home-nav-v1 button {
        min-height: 42px;
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 15px;
        padding: 0 14px;
        background: rgba(255,255,255,.055);
        color: #eef0f8;
        text-decoration: none;
        font-size: 13px;
        font-weight: 850;
        cursor: pointer;
      }
      .nc-home-nav-v1 .primary {
        border-color: rgba(250,204,21,.28);
        background: linear-gradient(135deg, rgba(250,204,21,.14), rgba(168,85,247,.12));
        color: #fff7d6;
      }
      .nc-home-hero-v1 {
        position: relative;
        display: grid;
        grid-template-columns: minmax(0, 1.08fr) minmax(320px, .92fr);
        gap: 18px;
        align-items: stretch;
        margin-top: 18px;
      }
      .nc-home-hero-card-v1,
      .nc-home-demo-v1,
      .nc-home-section-v1,
      .nc-home-pricing-card-v1,
      .nc-home-step-v1 {
        border: 1px solid rgba(255,255,255,.11);
        background: rgba(255,255,255,.045);
        box-shadow: 0 22px 80px rgba(0,0,0,.30), inset 0 1px 0 rgba(255,255,255,.055);
        backdrop-filter: blur(16px);
      }
      .nc-home-hero-card-v1 {
        position: relative;
        overflow: hidden;
        border-radius: 34px;
        padding: clamp(24px, 5vw, 48px);
        min-height: 520px;
      }
      .nc-home-hero-card-v1::before {
        content: "";
        position: absolute;
        inset: -120px -160px auto auto;
        width: 320px;
        height: 320px;
        border-radius: 999px;
        background: rgba(250,204,21,.10);
        filter: blur(30px);
      }
      .nc-home-kicker-v1 {
        position: relative;
        margin-bottom: 16px;
        color: #c4b5fd;
        font-size: 12px;
        font-weight: 950;
        letter-spacing: .28em;
        text-transform: uppercase;
      }
      .nc-home-hero-card-v1 h1 {
        position: relative;
        margin: 0;
        max-width: 760px;
        font-size: clamp(44px, 8.5vw, 104px);
        line-height: .88;
        letter-spacing: -.085em;
      }
      .nc-home-hero-card-v1 h1 span {
        color: #f87171;
      }
      .nc-home-lead-v1 {
        position: relative;
        max-width: 680px;
        margin: 22px 0 0;
        color: rgba(238,240,248,.70);
        font-size: clamp(17px, 2.6vw, 24px);
        line-height: 1.42;
      }
      .nc-home-hero-actions-v1 {
        position: relative;
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 26px;
      }
      .nc-home-btn-v1 {
        min-height: 52px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        border: 1px solid rgba(255,255,255,.14);
        border-radius: 17px;
        padding: 0 18px;
        background: rgba(255,255,255,.065);
        color: #fff;
        text-decoration: none;
        font-size: 15px;
        font-weight: 900;
        cursor: pointer;
      }
      .nc-home-btn-v1.primary {
        border-color: rgba(255,92,42,.38);
        background: linear-gradient(135deg, #ff4d5f, #ff7a3d);
        color: #12070a;
        box-shadow: 0 18px 46px rgba(255,92,42,.26);
      }
      .nc-home-status-v1 {
        position: relative;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 30px;
      }
      .nc-home-pill-v1 {
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 999px;
        padding: 9px 12px;
        background: rgba(0,0,0,.20);
        color: rgba(238,240,248,.72);
        font-size: 12px;
        font-weight: 800;
      }
      .nc-home-demo-v1 {
        border-radius: 34px;
        padding: 20px;
        overflow: hidden;
      }
      .nc-home-demo-screen-v1 {
        min-height: 100%;
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 26px;
        padding: 20px;
        background:
          radial-gradient(circle at 25% 0%, rgba(250,204,21,.14), transparent 30%),
          linear-gradient(180deg, rgba(255,255,255,.055), rgba(255,255,255,.025));
      }
      .nc-home-demo-head-v1 {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 18px;
        color: rgba(238,240,248,.58);
        font-size: 12px;
        font-weight: 900;
        letter-spacing: .14em;
        text-transform: uppercase;
      }
      .nc-home-flow-mini-v1 {
        display: grid;
        gap: 10px;
      }
      .nc-home-flow-row-v1 {
        display: grid;
        grid-template-columns: 44px minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px;
        border: 1px solid rgba(255,255,255,.09);
        border-radius: 18px;
        padding: 12px;
        background: rgba(0,0,0,.20);
      }
      .nc-home-flow-row-v1 b {
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        border-radius: 15px;
        background: rgba(255,255,255,.075);
        color: #facc15;
      }
      .nc-home-flow-row-v1 strong { display: block; margin-bottom: 3px; }
      .nc-home-flow-row-v1 span { color: rgba(238,240,248,.55); font-size: 12px; }
      .nc-home-flow-row-v1 em { color: #86efac; font-style: normal; font-size: 11px; font-weight: 900; }
      .nc-home-section-v1 {
        margin-top: 18px;
        border-radius: 30px;
        padding: clamp(18px, 4vw, 32px);
      }
      .nc-home-section-head-v1 {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 16px;
        margin-bottom: 18px;
      }
      .nc-home-section-head-v1 h2 {
        margin: 0;
        font-size: clamp(28px, 5vw, 54px);
        line-height: .96;
        letter-spacing: -.065em;
      }
      .nc-home-section-head-v1 p {
        margin: 0;
        max-width: 420px;
        color: rgba(238,240,248,.62);
        line-height: 1.5;
      }
      .nc-home-pricing-v1 {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }
      .nc-home-pricing-card-v1 {
        position: relative;
        overflow: hidden;
        border-radius: 24px;
        padding: 20px;
      }
      .nc-home-pricing-card-v1.featured {
        border-color: rgba(250,204,21,.30);
        background:
          radial-gradient(circle at 80% 0%, rgba(250,204,21,.13), transparent 34%),
          rgba(255,255,255,.055);
      }
      .nc-home-plan-v1 {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        margin-bottom: 14px;
      }
      .nc-home-plan-v1 strong {
        font-size: 24px;
        letter-spacing: -.04em;
      }
      .nc-home-plan-v1 span {
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 999px;
        padding: 7px 9px;
        color: rgba(238,240,248,.70);
        font-size: 11px;
        font-weight: 900;
      }
      .nc-home-price-v1 {
        margin: 0 0 12px;
        font-size: 38px;
        font-weight: 950;
        letter-spacing: -.06em;
      }
      .nc-home-price-v1 small {
        color: rgba(238,240,248,.48);
        font-size: 14px;
        letter-spacing: 0;
      }
      .nc-home-list-v1 {
        display: grid;
        gap: 9px;
        margin: 16px 0 20px;
        padding: 0;
        list-style: none;
      }
      .nc-home-list-v1 li {
        color: rgba(238,240,248,.72);
        font-size: 13px;
        line-height: 1.35;
      }
      .nc-home-list-v1 li::before {
        content: "✓";
        margin-right: 8px;
        color: #86efac;
        font-weight: 950;
      }
      .nc-home-steps-v1 {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
      }
      .nc-home-step-v1 {
        border-radius: 22px;
        padding: 18px;
      }
      .nc-home-step-v1 b {
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        border-radius: 13px;
        background: linear-gradient(135deg, rgba(250,204,21,.22), rgba(168,85,247,.14));
        color: #facc15;
        margin-bottom: 12px;
      }
      .nc-home-step-v1 strong {
        display: block;
        margin-bottom: 7px;
        font-size: 17px;
      }
      .nc-home-step-v1 span {
        color: rgba(238,240,248,.58);
        font-size: 13px;
        line-height: 1.42;
      }
      .nc-home-error-v1 {
        margin-top: 12px;
        border: 1px solid rgba(248,113,113,.28);
        border-radius: 16px;
        padding: 12px 14px;
        background: rgba(248,113,113,.08);
        color: #fecaca;
        font-size: 13px;
      }
      .nc-home-footer-v1 {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        margin-top: 22px;
        color: rgba(238,240,248,.46);
        font-size: 12px;
      }
      @media (max-width: 920px) {
        .nc-home-hero-v1,
        .nc-home-pricing-v1,
        .nc-home-steps-v1 { grid-template-columns: 1fr; }
        .nc-home-hero-card-v1 { min-height: auto; }
        .nc-home-section-head-v1 { flex-direction: column; align-items: flex-start; }
        .nc-home-nav-v1 .hide-mobile { display: none; }
      }
      @media (max-width: 520px) {
        .nc-home-shell-v1 { width: min(100% - 18px, 1180px); padding-top: 12px; }
        .nc-home-top-v1 { gap: 9px; }
        .nc-home-logo-v1 { width: 48px; height: 48px; border-radius: 16px; }
        .nc-home-brand-v1 span { display: none; }
        .nc-home-nav-v1 a,
        .nc-home-nav-v1 button { min-height: 38px; padding: 0 11px; font-size: 12px; }
        .nc-home-hero-card-v1,
        .nc-home-demo-v1,
        .nc-home-section-v1 { border-radius: 24px; }
        .nc-home-flow-row-v1 { grid-template-columns: 38px minmax(0, 1fr); }
        .nc-home-flow-row-v1 em { display: none; }
        .nc-home-footer-v1 { flex-direction: column; }
      }
    `}</style>
  );
}

const plans = [
  {
    name: "FREE",
    tag: "старт",
    price: "0€",
    note: "для проверки идеи",
    items: ["вход через Google", "локальный черновик", "до 3 проектов", "preview‑режим Studio", "базовый storyboard workflow"],
    cta: "Попробовать Studio",
    action: "studio",
  },
  {
    name: "PRO",
    tag: "рабочий режим",
    price: "19€",
    note: "в месяц",
    items: ["полный production pipeline", "свои AI‑ключи", "Cloud Projects", "серии и пакеты", "экспорт JSON/TXT/prompts"],
    cta: "Выбрать PRO",
    action: "account",
    featured: true,
  },
  {
    name: "DIRECTOR",
    tag: "admin / studio",
    price: "Custom",
    note: "для владельца и команды",
    items: ["platform API", "панель режиссёра", "управление пользователями", "usage и лимиты", "изолированные модули /series"],
    cta: "Открыть кабинет",
    action: "director",
  },
];

export default function PublicLandingOriginalAuth() {
  const [session, setSession] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const user = session?.user || null;

  useEffect(() => {
    let mounted = true;
    if (!isSupabaseConfigured || !supabase) return () => { mounted = false; };

    supabase.auth.getSession()
      .then(({ data, error: sessionError }) => {
        if (!mounted) return;
        if (sessionError) setError(sessionError.message);
        setSession(data?.session || null);
      })
      .catch((e) => {
        if (mounted) setError(e?.message || "Не удалось проверить сессию");
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession || null);
      setBusy(false);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  async function loginOnly() {
    setError("");
    if (user) return;
    if (!isSupabaseConfigured || !supabase) {
      setError("Supabase ENV не настроены.");
      return;
    }
    setBusy(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getRedirectTo("/"),
          skipBrowserRedirect: true,
          queryParams: { access_type: "offline", prompt: "select_account" },
        },
      });
      if (signInError) throw signInError;
      if (data?.url) window.location.assign(data.url);
      else throw new Error("Google не вернул ссылку входа.");
    } catch (e) {
      setError(e?.message || "Google login failed");
      setBusy(false);
    }
  }

  async function openStudio() {
    setError("");
    if (user) {
      go("/storyboard");
      return;
    }
    if (!isSupabaseConfigured || !supabase) {
      setError("Supabase ENV не настроены. Открываю Studio в preview-режиме.");
      go("/storyboard");
      return;
    }
    setBusy(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getRedirectTo("/storyboard"),
          skipBrowserRedirect: true,
          queryParams: { access_type: "offline", prompt: "select_account" },
        },
      });
      if (signInError) throw signInError;
      if (data?.url) window.location.assign(data.url);
      else throw new Error("Google не вернул ссылку входа.");
    } catch (e) {
      setError(e?.message || "Google login failed");
      setBusy(false);
    }
  }

  function handlePlanAction(action) {
    if (action === "studio") return openStudio();
    if (action === "director") return go("/director/control-room");
    return go("/account");
  }

  return (
    <main className="nc-home-v1">
      <HomeStyles />
      <div className="nc-home-shell-v1">
        <header className="nc-home-top-v1">
          <div className="nc-home-logo-v1">N</div>
          <div className="nc-home-brand-v1">
            <strong>NeuroCine</strong>
            <span>AI Video Factory · Director Studio</span>
          </div>
          <div className="nc-home-spacer-v1" />
          <nav className="nc-home-nav-v1">
            <a className="hide-mobile" href="#pricing">Тарифы</a>
            <a className="hide-mobile" href="#how">Как работает</a>
            {user ? (
              <button type="button" onClick={() => go("/account")}>Профиль</button>
            ) : (
              <button type="button" onClick={loginOnly} disabled={busy}>{busy ? "..." : "Войти"}</button>
            )}
            <button className="primary" type="button" onClick={openStudio} disabled={busy}>Studio</button>
          </nav>
        </header>

        {error && <div className="nc-home-error-v1">{error}</div>}

        <section className="nc-home-hero-v1">
          <div className="nc-home-hero-card-v1">
            <div className="nc-home-kicker-v1">Главная NeuroCine</div>
            <h1>AI‑студия для короткого <span>кино</span>.</h1>
            <p className="nc-home-lead-v1">
              От темы до сценария, storyboard JSON, PART‑сетки, video prompt, TTS, обложки и SEO‑пакета. Storyboard — не главная страница, а один из инструментов Studio.
            </p>
            <div className="nc-home-hero-actions-v1">
              <button className="nc-home-btn-v1 primary" type="button" onClick={openStudio} disabled={busy}>＋ Создать проект</button>
              <button className="nc-home-btn-v1" type="button" onClick={() => go("/projects")}>Мои проекты</button>
              <button className="nc-home-btn-v1" type="button" onClick={() => go("/account")}>Профиль и тариф</button>
            </div>
            <div className="nc-home-status-v1">
              <span className="nc-home-pill-v1">FREE Preview</span>
              <span className="nc-home-pill-v1">PRO Pipeline</span>
              <span className="nc-home-pill-v1">DIRECTOR Control Room</span>
              <span className="nc-home-pill-v1">/series отдельно</span>
            </div>
          </div>

          <aside className="nc-home-demo-v1">
            <div className="nc-home-demo-screen-v1">
              <div className="nc-home-demo-head-v1"><span>Production Route</span><span>{user ? "online" : "guest"}</span></div>
              <div className="nc-home-flow-mini-v1">
                {[
                  ["01", "Тема", "идея ролика", "start"],
                  ["02", "Сценарий", "хук, диктор, структура", "script"],
                  ["03", "Storyboard", "JSON, кадры, VO/SFX", "studio"],
                  ["04", "Пакет", "TTS, обложка, SEO", "export"],
                ].map(([n, title, desc, state]) => (
                  <div className="nc-home-flow-row-v1" key={n}>
                    <b>{n}</b>
                    <div><strong>{title}</strong><span>{desc}</span></div>
                    <em>{state}</em>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section className="nc-home-section-v1" id="pricing">
          <div className="nc-home-section-head-v1">
            <h2>Тарифы</h2>
            <p>Карточки доступа должны быть понятны сразу: что бесплатно, где начинается рабочий режим, где находится админский уровень.</p>
          </div>
          <div className="nc-home-pricing-v1">
            {plans.map((plan) => (
              <article className={`nc-home-pricing-card-v1${plan.featured ? " featured" : ""}`} key={plan.name}>
                <div className="nc-home-plan-v1"><strong>{plan.name}</strong><span>{plan.tag}</span></div>
                <div className="nc-home-price-v1">{plan.price} <small>{plan.note}</small></div>
                <ul className="nc-home-list-v1">
                  {plan.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
                <button className={`nc-home-btn-v1${plan.featured ? " primary" : ""}`} type="button" onClick={() => handlePlanAction(plan.action)}>{plan.cta}</button>
              </article>
            ))}
          </div>
        </section>

        <section className="nc-home-section-v1" id="how">
          <div className="nc-home-section-head-v1">
            <h2>Как это работает</h2>
            <p>Главная объясняет продукт. Studio запускается отдельно из меню, кнопки плюс или CTA.</p>
          </div>
          <div className="nc-home-steps-v1">
            {[
              ["01", "Идея", "Пользователь задаёт тему, формат, стиль и длительность."],
              ["02", "Сценарий", "AI собирает структуру, дикторский текст и ритм ролика."],
              ["03", "Storyboard", "Отдельный модуль строит JSON, кадры, image/video prompts."],
              ["04", "Пакет", "Обложка, музыка, TTS, SEO и экспорт проекта."],
            ].map(([n, title, desc]) => (
              <div className="nc-home-step-v1" key={n}><b>{n}</b><strong>{title}</strong><span>{desc}</span></div>
            ))}
          </div>
        </section>

        <footer className="nc-home-footer-v1">
          <span>© {new Date().getFullYear()} NeuroCine Online</span>
          <span>Главная · Studio · Projects · Account · Director</span>
        </footer>
      </div>
    </main>
  );
}
