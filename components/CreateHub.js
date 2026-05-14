"use client";

import { CREATE_TOOLS, TOOL_GROUPS, getToolsByGroup } from "../lib/toolsRegistry";
import ToolCard from "./ToolCard";

function navigateTool(tool) {
  if (tool?.route && tool.route.startsWith("/")) {
    const url = new URL(tool.route, window.location.origin);
    const current = window.location.pathname;

    if (url.pathname !== current) {
      window.location.href = tool.route;
      return true;
    }

    if (url.hash) {
      const anchor = url.hash.replace(/^#/, "");
      document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", tool.route);
      return true;
    }
  }
  return false;
}

export default function CreateHub({ open, onClose, onSelectTool, access }) {
  if (!open) return null;
  const primary = CREATE_TOOLS.find(t => t.primary);
  const plan = access?.isOwner || access?.isAdmin ? "DIRECTOR" : access?.role === "pro" ? "PRO" : "FREE";

  function handleSelect(tool) {
    if (tool.packTab) {
      window.dispatchEvent(new CustomEvent("neurocine-open-pack-tab", { detail: { tab: tool.packTab } }));
    }
    onSelectTool?.(tool);
    const routed = navigateTool(tool);
    onClose?.();
    if (!routed && tool?.anchor) {
      document.getElementById(tool.anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div className="nc-create-hub" role="dialog" aria-modal="true" aria-label="Создать в NeuroCine">
      <div className="nc-create-backdrop" onClick={onClose} />
      <div className="nc-create-panel">
        <div className="nc-create-head">
          <div>
            <span>NeuroCine Factory</span>
            <h2>Создать</h2>
            <p>Выбери рабочий модуль: Shorts, сериал, storyboard, production pack или публикационный пакет.</p>
          </div>
          <button className="nc-round-close" type="button" onClick={onClose}>×</button>
        </div>

        {primary && <ToolCard tool={primary} onSelect={handleSelect} />}

        <div className="nc-hub-plan-strip">
          <strong>{plan}</strong>
          <span>Активные инструменты NeuroCine: сценарий, сериалы, storyboard, pipeline и production pack.</span>
        </div>

        <div className="nc-tool-grid">
          {CREATE_TOOLS.filter(t => !t.primary).map(tool => (
            <ToolCard key={tool.id} tool={tool} compact onSelect={handleSelect} />
          ))}
        </div>

        <div className="nc-group-list">
          {TOOL_GROUPS.map(group => {
            const list = getToolsByGroup(group.id);
            if (!list.length) return null;
            return (
              <section key={group.id}>
                <h3>{group.title}</h3>
                <div>{list.map(t => <button key={t.id} type="button" onClick={() => handleSelect(t)}>{t.icon}<span>{t.title}</span></button>)}</div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
