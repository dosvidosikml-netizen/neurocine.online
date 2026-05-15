"use client";

import { useCallback, useMemo, useState } from "react";
import AuthPanel from "../AuthPanel";
import CloudProjectsPanel from "../CloudProjectsPanel";

function ProjectsCenterStyles() {
  return (
    <style jsx global>{`
      .nc-projects-page {
        min-height: 100vh;
        padding: 22px;
        background:
          radial-gradient(circle at 10% 0%, rgba(56, 189, 248, .14), transparent 34%),
          radial-gradient(circle at 88% 12%, rgba(168, 85, 247, .14), transparent 30%),
          #07080f;
      }
      .nc-projects-shell { max-width: 1220px; margin: 0 auto; display: grid; gap: 18px; }
      .nc-projects-hero {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 18px;
        border: 1px solid rgba(255,255,255,.12);
        background: rgba(255,255,255,.045);
        border-radius: 30px;
        padding: 24px;
        box-shadow: 0 20px 80px rgba(0,0,0,.32);
      }
      .nc-projects-hero p {
        margin: 0 0 9px;
        color: #93c5fd;
        font-size: 11px;
        font-weight: 950;
        letter-spacing: .24em;
        text-transform: uppercase;
      }
      .nc-projects-hero h1 {
        margin: 0 0 10px;
        font-size: clamp(28px, 5vw, 52px);
        line-height: .96;
        letter-spacing: -.06em;
      }
      .nc-projects-hero span { color: rgba(238,240,248,.68); font-size: 14px; }
      .nc-projects-nav { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
      .nc-projects-nav a {
        border: 1px solid rgba(255,255,255,.14);
        background: rgba(255,255,255,.08);
        color: #eef0f8;
        text-decoration: none;
        border-radius: 14px;
        padding: 11px 15px;
        font-weight: 850;
        font-size: 13px;
      }
      .nc-projects-note {
        border: 1px solid rgba(255,255,255,.10);
        background: rgba(0,0,0,.24);
        border-radius: 22px;
        padding: 15px 18px;
        color: rgba(238,240,248,.66);
        font-size: 13px;
      }
      @media (max-width: 820px) {
        .nc-projects-page { padding: 12px; }
        .nc-projects-hero { flex-direction: column; border-radius: 24px; }
        .nc-projects-nav { justify-content: flex-start; }
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
