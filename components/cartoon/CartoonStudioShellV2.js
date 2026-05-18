"use client";

import { useEffect, useState } from "react";
import AuthPanel from "../AuthPanel";
import CartoonTopActionBar from "./CartoonTopActionBar";
import MobileBottomNav from "../MobileBottomNav";
import SideDrawer from "../SideDrawer";
import CreateHub from "../CreateHub";
import QuantumCartoonCreatorV2 from "./QuantumCartoonCreatorV2";
import { getAccountAccess, shouldForceLiveForAccount } from "../../lib/accountRoles";

export default function CartoonStudioShellV2() {
  const [account, setAccount] = useState(null);
  const [sideDrawerOpen, setSideDrawerOpen] = useState(false);
  const [createHubOpen, setCreateHubOpen] = useState(false);
  const [uiLang, setUiLang] = useState("ru");
  const [creatorKey, setCreatorKey] = useState(1);
  const [cleanNote, setCleanNote] = useState("");

  const accountAccess = getAccountAccess(account?.profile, account?.session);
  const liveAllowed = shouldForceLiveForAccount(accountAccess);
  const devMode = !liveAllowed;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("neurocine.uiLang");
      if (saved === "en" || saved === "ru") setUiLang(saved);
    } catch {}
  }, []);

  function navigate(target = "cartoon") {
    const clean = String(target || "cartoon").replace(/^#/, "");
    setSideDrawerOpen(false);
    setCreateHubOpen(false);

    const routes = {
      cartoon: "/cartoon",
      studio: "/studio",
      home: "/studio",
      tools: "/studio",
      projects: "/projects",
      account: "/account",
      profile: "/account",
      series: "/series",
      "director-console": "/director/control-room",
    };

    window.location.href = routes[clean] || `/storyboard#${clean}`;
  }

  function handleCreateToolSelect(tool) {
    if (!tool) return;
    const route = String(tool.route || "");
    setSideDrawerOpen(false);
    setCreateHubOpen(false);

    if (route.startsWith("/")) {
      window.location.href = route;
      return;
    }

    navigate(tool.anchor || route.split("#")[1] || "setup");
  }

  function toggleLang() {
    const next = uiLang === "ru" ? "en" : "ru";
    setUiLang(next);
    try {
      window.localStorage.setItem("neurocine.uiLang", next);
      window.dispatchEvent(new CustomEvent("neurocine-ui-lang", { detail: { lang: next } }));
    } catch {}
  }

  function clearCartoonStorage() {
    const match = (key) => /cartoon|qcc|quantumCartoon|neurocine\.cartoon/i.test(String(key || ""));
    try {
      for (const key of Object.keys(window.localStorage || {})) {
        if (match(key)) window.localStorage.removeItem(key);
      }
    } catch {}
    try {
      for (const key of Object.keys(window.sessionStorage || {})) {
        if (match(key)) window.sessionStorage.removeItem(key);
      }
    } catch {}
  }

  function cleanStart() {
    clearCartoonStorage();
    setCleanNote("Новый чистый мульт-проект создан");
    setCreatorKey((value) => value + 1);
    try {
      window.history.replaceState(null, "", "/cartoon");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {}
  }

  function hardCleanStart() {
    clearCartoonStorage();
    try {
      window.location.replace(`/cartoon?fresh=${Date.now()}`);
    } catch {
      setCreatorKey((value) => value + 1);
      setCleanNote("Кэш очищен, проект сброшен");
    }
  }

  return (
    <main className="studio nc-cartoon-studio-shell">
      <style jsx global>{`
        .nc-cartoon-clean-start{
          position:fixed !important;
          left:16px;
          right:16px;
          bottom:148px;
          z-index:2147483000;
          width:auto;
          display:grid !important;
          grid-template-columns:1fr 1fr;
          gap:10px;
          pointer-events:auto;
        }
        .nc-cartoon-clean-start button{
          min-height:46px;
          border-radius:16px;
          border:1px solid rgba(0,212,255,.34);
          background:rgba(5,10,28,.86);
          color:rgba(225,246,255,.94);
          font-weight:900;
          letter-spacing:.06em;
          box-shadow:inset 0 1px 0 rgba(255,255,255,.08), 0 14px 34px rgba(0,0,0,.30), 0 0 24px rgba(0,212,255,.10);
          backdrop-filter:blur(16px);
          -webkit-backdrop-filter:blur(16px);
        }
        .nc-cartoon-clean-start button.danger{
          border-color:rgba(255,77,95,.46);
          color:#ffd6dc;
          background:rgba(44,8,18,.82);
        }
        .nc-cartoon-clean-note{
          grid-column:1 / -1;
          justify-self:center;
          max-width:92vw;
          padding:7px 12px;
          border-radius:999px;
          border:1px solid rgba(45,212,255,.20);
          background:rgba(2,6,23,.70);
          color:rgba(45,212,255,.88);
          font-size:12px;
          line-height:1.35;
          text-align:center;
          letter-spacing:.05em;
          backdrop-filter:blur(12px);
          -webkit-backdrop-filter:blur(12px);
        }
        html[data-theme="light"] .nc-cartoon-clean-start button{
          border-color:rgba(22,163,74,.28);
          background:rgba(255,255,255,.92);
          color:#14532d;
          box-shadow:inset 0 1px 0 rgba(255,255,255,.96),0 12px 28px rgba(15,42,27,.13);
        }
        html[data-theme="light"] .nc-cartoon-clean-start button.danger{
          border-color:rgba(239,68,68,.30);
          background:rgba(255,245,245,.94);
          color:#991b1b;
        }
        html[data-theme="light"] .nc-cartoon-clean-note{color:#166534;background:rgba(255,255,255,.88);border-color:rgba(22,163,74,.20);}
        @media(max-width:430px){
          .nc-cartoon-clean-start{left:14px;right:14px;bottom:134px;gap:8px;}
          .nc-cartoon-clean-start button{min-height:43px;border-radius:15px;font-size:11px;}
        }
      `}</style>

      <div className="nc-mobile-shell" id="tools">
        <CartoonTopActionBar
          account={account}
          access={accountAccess}
          uiLang={uiLang}
          onToggleLang={toggleLang}
          onOpenMenu={() => setSideDrawerOpen(true)}
          onNavigate={navigate}
        />
        <SideDrawer
          open={sideDrawerOpen}
          onClose={() => setSideDrawerOpen(false)}
          onNavigate={navigate}
          onSelectTool={handleCreateToolSelect}
          access={accountAccess}
          uiLang={uiLang}
        />
        <CreateHub
          open={createHubOpen}
          onClose={() => setCreateHubOpen(false)}
          onSelectTool={handleCreateToolSelect}
          access={accountAccess}
        />
        <MobileBottomNav onCreate={() => setCreateHubOpen(true)} onNavigate={navigate} />
      </div>

      <AuthPanel devMode={devMode} onAccountChange={setAccount} />

      <div className="nc-cartoon-clean-start" aria-label="Cartoon clean start controls">
        <button type="button" onClick={cleanStart}>🧹 Новый проект</button>
        <button type="button" className="danger" onClick={hardCleanStart}>🗑 Очистить всё + кэш</button>
        {cleanNote && <div className="nc-cartoon-clean-note">{cleanNote}</div>}
      </div>

      <section className="nc-cartoon-workspace" aria-label="Quantum Cartoon Creator">
        <QuantumCartoonCreatorV2 key={creatorKey} />
      </section>
    </main>
  );
}
