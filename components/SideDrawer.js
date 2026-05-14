"use client";

import { getToolsByGroup } from "../lib/toolsRegistry";

const GROUP_ORDER = ["workflow", "pack", "system"];

function navigateTool(tool, onNavigate) {
  if (tool?.route && tool.route.startsWith("/")) {
    const url = new URL(tool.route, window.location.origin);
    const currentPath = window.location.pathname;

    if (url.pathname !== currentPath) {
      window.location.href = tool.route;
      return true;
    }

    if (url.hash) {
      const anchor = url.hash.replace(/^#/, "");
      onNavigate?.(anchor);
      window.history.replaceState(null, "", tool.route);
      return true;
    }
  }

  onNavigate?.(tool?.anchor || tool?.id);
  return false;
}

export default function SideDrawer({ open, onClose, onNavigate, onSelectTool, access }) {
  const plan = access?.isOwner || access?.isAdmin ? "DIRECTOR" : access?.role === "pro" ? "PRO" : "FREE";
  const groups = GROUP_ORDER.map(id => ({
    id,
    title: id === "workflow" ? "Рабочий поток" : id === "pack" ? "Production Pack" : "Система",
    items: getToolsByGroup(id),
  })).filter(group => group.items.length);

  function handleTool(tool) {
    if (tool.packTab) {
      window.dispatchEvent(new CustomEvent("neurocine-open-pack-tab", { detail: { tab: tool.packTab } }));
    }
    onSelectTool?.(tool);
    const routed = navigateTool(tool, onNavigate);
    if (!routed) onClose?.();
    else onClose?.();
  }

  return (
    <div className={`nc-drawer-wrap${open ? " open" : ""}`} aria-hidden={!open}>
      <div className="nc-drawer-backdrop" onClick={onClose} />
      <aside className="nc-drawer" aria-label="NeuroCine menu">
        <div className="nc-drawer-top">
          <div className="nc-drawer-logo">N</div>
          <div><strong>NeuroCine</strong><span>{plan} · AI Video Factory</span></div>
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
      </aside>
    </div>
  );
}
