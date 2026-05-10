"use client";

import { CREATE_TOOLS, TOOL_GROUPS, getToolsByGroup } from "../lib/toolsRegistry";
import ToolCard from "./ToolCard";

export default function CreateHub({ open, onClose, onSelectTool, access }) {
  if (!open) return null;
  const primary = CREATE_TOOLS.find(t => t.primary);
  const plan = access?.role === "pro" ? "PRO" : access?.isOwner || access?.isAdmin ? "OWNER" : "FREE";

  return (
    <div className="nc-create-hub" role="dialog" aria-modal="true" aria-label="Создать в NeuroCine">
      <div className="nc-create-backdrop" onClick={onClose} />
      <div className="nc-create-panel">
        <div className="nc-create-head">
          <div>
            <span>NeuroCine Factory</span>
            <h2>Создать</h2>
            <p>Выбери инструмент: storyboard, видео, голос, обложка или production pack.</p>
          </div>
          <button className="nc-round-close" type="button" onClick={onClose}>×</button>
        </div>

        {primary && <ToolCard tool={primary} onSelect={onSelectTool} />}

        <div className="nc-hub-plan-strip">
          <strong>{plan}</strong>
          <span>Активные модули запускаются сейчас. UI-ready и “Скоро” уже заложены как будущие инструменты AI Video Factory.</span>
        </div>

        <div className="nc-tool-grid">
          {CREATE_TOOLS.filter(t => !t.primary && t.id !== "all-tools").map(tool => (
            <ToolCard key={tool.id} tool={tool} compact onSelect={onSelectTool} />
          ))}
        </div>

        <div className="nc-group-list">
          {TOOL_GROUPS.map(group => {
            const list = getToolsByGroup(group.id);
            if (!list.length) return null;
            return (
              <section key={group.id}>
                <h3>{group.title}</h3>
                <div>{list.map(t => <button key={t.id} type="button" onClick={() => onSelectTool?.(t)}>{t.icon}<span>{t.title}</span></button>)}</div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
