"use client";

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

function pickLang(lang) {
  const value = lang || savedLang();
  return String(value || "ru").toLowerCase().startsWith("en") ? "en" : "ru";
}

export default function SideDrawer({ open, onClose, onNavigate, onSelectTool, access, uiLang }) {
  const lang = pickLang(uiLang);
  const isRu = lang === "ru";
  const plan = access?.isOwner || access?.isAdmin ? (isRu ? "ГЛАВНЫЙ РЕЖИССЁР" : "DIRECTOR") : access?.role === "pro" ? "PRO" : "FREE";
  const canOpenDirectorControl = Boolean(access?.isOwner || access?.isAdmin);
  const groupLabels = Object.fromEntries(getToolGroups(lang).map(group => [group.id, group.title]));
  const groups = GROUP_ORDER.map(id => ({
    id,
    title: groupLabels[id] || id,
    items: getToolsByGroup(id, lang),
  })).filter(group => group.items.length);

  function handleTool(tool) {
    if (tool.packTab) {
      window.dispatchEvent(new CustomEvent("neurocine-open-pack-tab", { detail: { tab: tool.packTab } }));
    }
    onSelectTool?.(tool);
    onNavigate?.(tool.anchor || tool.id);
    onClose?.();
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
