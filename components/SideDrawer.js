"use client";

import { useEffect, useState } from "react";
import { getToolsByGroup, getToolGroups } from "../lib/toolsRegistry";

const GROUP_ORDER = ["workflow", "pack", "system"];
const UI_LANG_KEY = "neurocine.uiLang";

function savedLang() {
  if (typeof window === "undefined") return "ru";
  try {
    const v = window.localStorage.getItem(UI_LANG_KEY);
    return v === "en" ? "en" : "ru";
  } catch {
    return "ru";
  }
}

function saveLang(lang) {
  const next = lang === "en" ? "en" : "ru";
  try {
    window.localStorage.setItem(UI_LANG_KEY, next);
    window.dispatchEvent(new CustomEvent("neurocine-ui-lang", { detail: { lang: next } }));
  } catch {}
  return next;
}

function nextLangFromButton(button) {
  const title = String(button?.getAttribute?.("title") || button?.getAttribute?.("aria-label") || "").toLowerCase();
  const text = String(button?.textContent || "").toUpperCase();
  if (title.includes("english") || text.includes("EN")) return "en";
  if (title.includes("рус") || text.includes("RU")) return "ru";
  return savedLang() === "en" ? "ru" : "en";
}

function pickLang(lang, tick = 0) {
  void tick;
  const value = lang || savedLang();
  return String(value || "ru").toLowerCase().startsWith("en") ? "en" : "ru";
}

function routeTool(tool, onNavigate) {
  if (typeof window === "undefined") return;
  const route = String(tool?.route || "");
  const anchor = tool?.anchor || tool?.id;

  if (route.startsWith("/")) {
    window.location.href = route;
    return;
  }

  onNavigate?.(anchor);
}

export default function SideDrawer({ open, onClose, onNavigate, onSelectTool, access, uiLang }) {
  const [langTick, setLangTick] = useState(0);
  const lang = pickLang(uiLang, langTick);
  const isRu = lang === "ru";
  const plan = access?.isOwner || access?.isAdmin ? (isRu ? "ГЛАВНЫЙ РЕЖИССЁР" : "DIRECTOR") : access?.role === "pro" ? "PRO" : "FREE";
  const canOpenDirectorControl = Boolean(access?.isOwner || access?.isAdmin);
  const groupLabels = Object.fromEntries(getToolGroups(lang).map(group => [group.id, group.title]));
  const groups = GROUP_ORDER.map(id => ({
    id,
    title: groupLabels[id] || id,
    items: getToolsByGroup(id, lang),
  })).filter(group => group.items.length);

  useEffect(() => {
    function handleLangEvent() {
      setLangTick(v => v + 1);
    }
    function handleClick(event) {
      const button = event.target?.closest?.("button");
      if (!button) return;
      const isLangButton =
        button.classList?.contains("nc-lang") ||
        button.classList?.contains("lang-toggle-v33") ||
        (button.classList?.contains("top-pill-v40") && String(button.textContent || "").includes("🌐"));
      if (!isLangButton) return;
      const next = nextLangFromButton(button);
      setTimeout(() => {
        saveLang(next);
        setLangTick(v => v + 1);
      }, 0);
    }
    window.addEventListener("neurocine-ui-lang", handleLangEvent);
    document.addEventListener("click", handleClick, true);
    return () => {
      window.removeEventListener("neurocine-ui-lang", handleLangEvent);
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  function handleTool(tool) {
    if (tool.packTab) {
      window.dispatchEvent(new CustomEvent("neurocine-open-pack-tab", { detail: { tab: tool.packTab } }));
    }
    onSelectTool?.(tool);
    onClose?.();
    routeTool(tool, onNavigate);
  }

  function openDirectorControl() {
    onClose?.();
    window.location.href = "/director/control-room";
  }

  return (
    <div className={`nc-drawer-wrap${open ? " open" : ""}`} aria-hidden={!open}>
      <div className="nc-drawer-backdrop" onClick={onClose} />
      <aside className="nc-drawer" aria-label={isRu ? "Меню NeuroCine" : "NeuroCine menu"}>
        <div className="nc-drawer-top">
          <div className="nc-drawer-logo">N</div>
          <div><strong>NeuroCine</strong><span>{plan} · {isRu ? "фабрика AI-видео" : "AI Video Factory"}</span></div>
          <button type="button" onClick={onClose} aria-label={isRu ? "Закрыть меню" : "Close menu"}>×</button>
        </div>

        {groups.map(group => (
          <div className="nc-drawer-section" key={group.id}>
            <h3>{group.title}</h3>
            {group.items.map(tool => (
              <button key={tool.id} type="button" onClick={() => handleTool(tool)}>
                {tool.icon} <span>{tool.title}</span>
              </button>
            ))}
          </div>
        ))}

        {canOpenDirectorControl && (
          <div className="nc-drawer-section nc-director-control-section">
            <h3>{isRu ? "Режиссёрский пульт" : "Director Console"}</h3>
            <button type="button" onClick={openDirectorControl}>
              ✨ <span>{isRu ? "Консоль режиссёра" : "Director Console"}</span>
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
