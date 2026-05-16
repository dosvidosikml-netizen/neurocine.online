"use client";

import { useEffect, useState } from "react";
import AuthPanel from "../AuthPanel";
import TopActionBar from "../TopActionBar";
import MobileBottomNav from "../MobileBottomNav";
import SideDrawer from "../SideDrawer";
import CreateHub from "../CreateHub";
import QuantumCartoonCreator from "./QuantumCartoonCreator";
import { getAccountAccess, shouldForceLiveForAccount } from "../../lib/accountRoles";

export default function CartoonStudioShell() {
  const [account, setAccount] = useState(null);
  const [sideDrawerOpen, setSideDrawerOpen] = useState(false);
  const [createHubOpen, setCreateHubOpen] = useState(false);
  const [uiLang, setUiLang] = useState("ru");

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

    if (clean === "cartoon") {
      window.location.href = "/cartoon";
      return;
    }
    if (clean === "studio" || clean === "home" || clean === "tools") {
      window.location.href = "/studio";
      return;
    }
    if (clean === "projects") {
      window.location.href = "/projects";
      return;
    }
    if (clean === "account" || clean === "profile") {
      window.location.href = "/account";
      return;
    }
    if (clean === "series") {
      window.location.href = "/series";
      return;
    }
    if (clean === "director-console") {
      window.location.href = "/director/control-room";
      return;
    }
    window.location.href = `/storyboard#${clean}`;
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

    const anchor = tool.anchor || route.split("#")[1] || "setup";
    navigate(anchor);
  }

  function toggleLang() {
    const next = uiLang === "ru" ? "en" : "ru";
    setUiLang(next);
    try {
      window.localStorage.setItem("neurocine.uiLang", next);
      window.dispatchEvent(new CustomEvent("neurocine-ui-lang", { detail: { lang: next } }));
    } catch {}
  }

  return (
    <main className="studio nc-cartoon-studio-shell">
      <div className="nc-mobile-shell" id="tools">
        <TopActionBar
          account={account}
          access={accountAccess}
          uiLang={uiLang}
          onToggleLang={toggleLang}
          onOpenMenu={() => setSideDrawerOpen(true)}
          onOpenCreate={() => setCreateHubOpen(true)}
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
        <MobileBottomNav
          onCreate={() => setCreateHubOpen(true)}
          onNavigate={navigate}
        />
      </div>

      <AuthPanel devMode={devMode} onAccountChange={setAccount} />

      <section className="nc-cartoon-workspace" aria-label="Quantum Cartoon Creator">
        <QuantumCartoonCreator />
      </section>
    </main>
  );
}
