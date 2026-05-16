"use client";

import { useCallback, useMemo, useState } from "react";
import AuthPanel from "../AuthPanel";
import CloudProjectsPanel from "../CloudProjectsPanel";

function ProjectsCenterStyles() {
  return (
    <style jsx global>{`
      .nc-projects-page {
        min-height: 100dvh;
        padding: 22px;
        color: var(--nc-text, var(--text));
        background:
          radial-gradient(circle at 10% 0%, rgba(56, 189, 248, .14), transparent 34%),
          radial-gradient(circle at 88% 12%, rgba(168, 85, 247, .14), transparent 30%),
          var(--nc-page-bg, #07080f);
      }

      html[data-theme="light"] .nc-projects-page {
        background:
          radial-gradient(circle at 10% 0%, rgba(56, 189, 248, .16), transparent 34%),
          radial-gradient(circle at 88% 12%, rgba(168, 85, 247, .12), transparent 30%),
          linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
      }

      .nc-projects-shell {
        max-width: 1220px;
        margin: 0 auto;
        display: grid;
        gap: 18px;
      }

      .nc-projects-hero {
        position: relative;
        overflow: hidden;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: start;
        gap: 18px;
        border: 1px solid var(--nc-border, rgba(255,255,255,.12));
        background:
          radial-gradient(circle at 0% 0%, rgba(255,77,95,.10), transparent 34%),
          linear-gradient(145deg, var(--nc-card-strong, rgba(255,255,255,.075)), var(--nc-card-muted, rgba(255,255,255,.030)));
        border-radius: 30px;
        padding: 24px;
        box-shadow: var(--nc-shadow-soft, 0 20px 80px rgba(0,0,0,.32));
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
      }

      .nc-projects-hero::after {
        content: "";
        position: absolute;
        right: -120px;
        bottom: -140px;
        width: 320px;
        height: 320px;
        border-radius: 999px;
        background: radial-gradient(circle, rgba(56,189,248,.14), transparent 70%);
        pointer-events: none;
      }

      .nc-projects-hero > * {
        position: relative;
        z-index: 1;
      }

      .nc-projects-hero p {
        margin: 0 0 9px;
        color: var(--nc-blue, #38bdf8);
        font-size: 11px;
        font-weight: 950;
        letter-spacing: .24em;
        text-transform: uppercase;
      }

      .nc-projects-hero h1 {
        margin: 0 0 10px;
        color: var(--nc-text, #eef0f8);
        font-size: clamp(30px, 5vw, 58px);
        line-height: .94;
        letter-spacing: -.065em;
      }

      .nc-projects-hero span {
        display: block;
        max-width: 640px;
        color: var(--nc-muted, rgba(238,240,248,.68));
        font-size: 14px;
        line-height: 1.6;
      }

      .nc-projects-nav {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      .nc-projects-nav a {
        min-height: 42px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--nc-border, rgba(255,255,255,.14));
        background: var(--nc-card, rgba(255,255,255,.08));
        color: var(--nc-text-soft, #eef0f8);
        text-decoration: none;
        border-radius: 999px;
        padding: 0 15px;
        font-weight: 850;
        font-size: 13px;
        transition: transform .16s ease, border-color .16s ease, background .16s ease;
      }

      .nc-projects-nav a:hover {
        transform: translateY(-1px);
        border-color: var(--nc-border-strong, rgba(255,255,255,.22));
        background: var(--nc-card-strong, rgba(255,255,255,.10));
        color: var(--nc-text, #fff);
      }

      .nc-projects-nav a.primary {
        color: #fff;
        border-color: transparent;
        background: linear-gradient(135deg, var(--nc-red, #ff4d5f), var(--nc-orange, #ff7a3d));
        box-shadow: 0 14px 38px rgba(255,77,95,.18);
      }

      .nc-projects-note {
        border: 1px solid var(--nc-border, rgba(255,255,255,.10));
        background: var(--nc-card, rgba(0,0,0,.24));
        border-radius: 22px;
        padding: 15px 18px;
        color: var(--nc-muted-strong, rgba(238,240,248,.66));
        font-size: 13px;
        box-shadow: var(--nc-shadow-soft, none);
      }

      @media (max-width: 820px) {
        .nc-projects-page {
          padding: 12px;
          padding-bottom: calc(132px + env(safe-area-inset-bottom));
        }
        .nc-projects-hero {
          grid-template-columns: 1fr;
          border-radius: 24px;
          padding: 20px;
        }
        .nc-projects-nav {
          justify-content: flex-start;
        }
        .nc-projects-nav a {
          flex: 1 1 150px;
          min-width: 0;
        }
      }
    `}</style>
  );
}

function buildEmptySnapshot() {
  return {
    neurocine_project_snapshot: true,
    version: "projects-center-empty-v1",
    exported_at: new Date().toISOString(),
    app: "NeuroCine Projects",
    project: { projectName: "NeuroCine Project", topic: "", projectType: "film", stylePreset: "cinematic", duration: 60, aspectRatio: "9:16", tone: "cinematic documentary thriller" },
    script_pack: { script: "", scriptValidation: null },
    storyboard_pack: { storyboard: null, jsonIn: "", sbMode: "safe", target: "veo3", validation: null },
    production_pipeline: {},
    images: {},
    production_pack_cache: {},
  };
}

export default function ProjectsCenter() {
  const [account, setAccount] = useState(null);
  const [status, setStatus] = useState("");
  const isSignedIn = Boolean(account?.session?.user);

  const buildSnapshot = useCallback(() => buildEmptySnapshot(), []);
  const applySnapshot = useCallback((snapshot) => {
    try {
      window.sessionStorage.setItem("neurocine:project-to-studio:v1", JSON.stringify(snapshot || {}));
    } catch {}
    setStatus("✓ Проект выбран. Открой Студию раскадровки для продолжения работы.");
  }, []);

  const autoSaveKey = useMemo(() => "projects-center-readonly", []);

  return (
    <main className="nc-projects-page">
      <ProjectsCenterStyles />
      <div className="nc-projects-shell">
        <header className="nc-projects-hero">
          <div>
            <p>БИБЛИОТЕКА ПРОЕКТОВ</p>
            <h1>Cloud Projects NeuroCine</h1>
            <span>Проекты вынесены из Студии раскадровки. Здесь хранение, поиск и управление snapshots.</span>
          </div>
          <nav className="nc-projects-nav">
            <a className="primary" href="/studio">Главная Studio</a>
            <a href="/storyboard">Студия раскадровки</a>
            <a href="/account">Центр аккаунта</a>
            <a href="/director/control-room">Консоль режиссёра</a>
          </nav>
        </header>

        <AuthPanel devMode={true} onModeToggle={() => {}} onAccountChange={setAccount} />
        {!isSignedIn && <div className="nc-projects-note">Войди через Google, чтобы открыть облачную библиотеку проектов.</div>}
        {isSignedIn && (
          <CloudProjectsPanel
            account={account}
            projectName="NeuroCine Project"
            buildSnapshot={buildSnapshot}
            applySnapshot={applySnapshot}
            onStatus={setStatus}
            autoSaveKey={autoSaveKey}
            autoSaveEnabled={false}
          />
        )}
        {status && <div className="snapshot-status">{status}</div>}
      </div>
    </main>
  );
}
