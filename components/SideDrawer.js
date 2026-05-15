"use client";

import { getToolsByGroup } from "../lib/toolsRegistry";

const GROUP_ORDER = ["workflow", "pack", "system"];

export default function SideDrawer({ open, onClose, onNavigate, onSelectTool, access }) {
  const plan = access?.isOwner || access?.isAdmin ? "ГЛАВНЫЙ РЕЖИССЁР" : access?.role === "pro" ? "PRO" : "FREE";
  const canOpenDirectorControl = Boolean(access?.isOwner || access?.isAdmin);
  const groups = GROUP_ORDER.map(id => ({
    id,
    title: id === "workflow" ? "Рабочий поток" : id === "pack" ? "Продакшн‑пак" : "Система",
    items: getToolsByGroup(id),
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
      <aside className="nc-drawer" aria-label="Меню NeuroCine">
        <div className="nc-drawer-top">
          <div className="nc-drawer-logo">N</div>
          <div><strong>NeuroCine</strong><span>{plan} · фабрика AI-видео</span></div>
          <button type="button" onClick={onClose} aria-label="Закрыть меню">×</button>
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
            <h3>Режиссёрский пульт</h3>
            <button type="button" onClick={openDirectorControl}>
              ✨ <span>Режиссёрская рубка</span>
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
