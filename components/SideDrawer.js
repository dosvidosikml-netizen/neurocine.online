"use client";

import { CREATE_TOOLS, TOOL_GROUPS, getToolsByGroup } from "../lib/toolsRegistry";

export default function SideDrawer({ open, onClose, onNavigate, onSelectTool, access }) {
  const plan = access?.isOwner || access?.isAdmin ? "OWNER" : access?.role === "pro" ? "PRO" : "FREE";
  return (
    <div className={`nc-drawer-wrap${open ? " open" : ""}`} aria-hidden={!open}>
      <div className="nc-drawer-backdrop" onClick={onClose} />
      <aside className="nc-drawer" aria-label="NeuroCine menu">
        <div className="nc-drawer-top">
          <div className="nc-drawer-logo">N</div>
          <div><strong>NeuroCine</strong><span>{plan} · AI Video Factory</span></div>
          <button type="button" onClick={onClose}>×</button>
        </div>

        <div className="nc-drawer-section">
          <h3>Главное</h3>
          <button type="button" onClick={() => onNavigate?.("setup")}>⌂ <span>Панель проекта</span></button>
          <button type="button" onClick={() => onNavigate?.("storyboard")}>▦ <span>Storyboard Studio</span></button>
          <button type="button" onClick={() => onNavigate?.("production")}>▻ <span>Production Pipeline</span></button>
          <button type="button" onClick={() => onNavigate?.("pack")}>◈ <span>Production Pack</span></button>
          <button type="button" onClick={() => onNavigate?.("projects")}>☁ <span>Project Library</span></button>
        </div>

        {TOOL_GROUPS.map(group => {
          const items = getToolsByGroup(group.id).filter(t => t.id !== "storyboard");
          if (!items.length) return null;
          return (
            <div className="nc-drawer-section" key={group.id}>
              <h3>{group.title}</h3>
              {items.map(tool => (
                <button key={tool.id} type="button" onClick={() => onSelectTool?.(tool)}>
                  {tool.icon} <span>{tool.title}</span>
                  <em>{tool.status === "active" ? "" : tool.status === "ready_ui" ? "UI" : "soon"}</em>
                </button>
              ))}
            </div>
          );
        })}
      </aside>
    </div>
  );
}
