"use client";

import { useEffect, useState } from "react";
import AuthPanel from "../AuthPanel";
import CartoonTopActionBar from "./CartoonTopActionBar";
import MobileBottomNav from "../MobileBottomNav";
import SideDrawer from "../SideDrawer";
import CreateHub from "../CreateHub";
import QuantumCartoonCreatorV2 from "./QuantumCartoonCreatorV2";
import CartoonSafeResetBar from "./CartoonSafeResetBar";
import { getAccountAccess, shouldForceLiveForAccount } from "../../lib/accountRoles";

export default function CartoonStudioShellV2() {
  const [account, setAccount] = useState(null);
  const [sideDrawerOpen, setSideDrawerOpen] = useState(false);
  const [createHubOpen, setCreateHubOpen] = useState(false);
  const [uiLang, setUiLang] = useState("ru");
  const [creatorKey, setCreatorKey] = useState(1);

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

  function resetCreator() {
    setCreatorKey((value) => value + 1);
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch {}
  }

  return (
    <main className="studio nc-cartoon-studio-shell">
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
      <CartoonSafeResetBar onReset={resetCreator} />

      <section className="nc-cartoon-workspace" aria-label="Quantum Cartoon Creator">
        <QuantumCartoonCreatorV2 key={creatorKey} />
      </section>
    </main>
  );
}
