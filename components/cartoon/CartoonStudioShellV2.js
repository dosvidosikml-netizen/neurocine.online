"use client";

import { useEffect, useState } from "react";
import AuthPanel from "../AuthPanel";
import CartoonTopActionBar from "./CartoonTopActionBar";
import MobileBottomNav from "../MobileBottomNav";
import SideDrawer from "../SideDrawer";
import CreateHub from "../CreateHub";
import QuantumCartoonCreatorV2 from "./QuantumCartoonCreatorV2";
import CartoonAutosaveBridge from "./CartoonAutosaveBridge";
import CartoonPaidScriptBridge from "./CartoonPaidScriptBridge";
import CartoonTimingBridge from "./CartoonTimingBridge";
import { getAccountAccess, shouldForceLiveForAccount } from "../../lib/accountRoles";

export default function CartoonStudioShellV2() {
  const [account, setAccount] = useState(null);
  const [sideDrawerOpen, setSideDrawerOpen] = useState(false);
  const [createHubOpen, setCreateHubOpen] = useState(false);
  const [uiLang, setUiLang] = useState("ru");
  const [creatorKey, setCreatorKey] = useState(1);

  const accountAccess = getAccountAccess(account?.profile, account?.session);
  const forceLiveForAdmin = shouldForceLiveForAccount(account?.profile, account?.session);
  const isSignedIn = !!account?.session?.user;
  const liveAllowed = forceLiveForAdmin || (isSignedIn && accountAccess.canLive);
  const devMode = !liveAllowed;
  const authToken = account?.session?.access_token || "";

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

  useEffect(() => {
    window.neurocineCartoonCleanStart = () => {
      try { window.neurocineClearCartoonAutosave?.(); } catch {}
      setCreatorKey((value) => value + 1);
      try {
        window.history.replaceState(null, "", "/cartoon");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch {}
    };

    window.neurocineCartoonHardCleanStart = () => {
      const match = (key) => /cartoon|qcc|quantumCartoon|frame2x2|production\.core/i.test(String(key || ""));
      try {
        const lsKeys = [];
        for (let i = 0; i < (window.localStorage?.length || 0); i++) lsKeys.push(window.localStorage.key(i));
        lsKeys.forEach((key) => { if (match(key)) window.localStorage.removeItem(key); });
      } catch {}
      try {
        const ssKeys = [];
        for (let i = 0; i < (window.sessionStorage?.length || 0); i++) ssKeys.push(window.sessionStorage.key(i));
        ssKeys.forEach((key) => { if (match(key)) window.sessionStorage.removeItem(key); });
      } catch {}
      try { window.location.replace(`/cartoon?fresh=${Date.now()}`); }
      catch { setCreatorKey((value) => value + 1); }
    };
  }, []);

  return (
    <main className="studio nc-cartoon-studio-shell">
      <style jsx global>{`
        body.route-cartoon .auth-panel-v42,
        .nc-cartoon-studio-shell .auth-panel-v42{
          display:none !important;
        }
        body.route-cartoon .nc-frame2x2-quick,
        body.route-cartoon .nc-prod-core-fab,
        body.route-cartoon .nc-prod-core-panel{
          display:none !important;
        }
        .nc-cartoon-workspace{
          position:relative;
          z-index:1;
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
      <CartoonAutosaveBridge />
      <CartoonTimingBridge />
      <CartoonPaidScriptBridge liveAllowed={liveAllowed} authToken={authToken} />

      <section className="nc-cartoon-workspace" aria-label="Quantum Cartoon Creator">
        <QuantumCartoonCreatorV2 key={creatorKey} liveAllowed={liveAllowed} />
      </section>
    </main>
  );
}
