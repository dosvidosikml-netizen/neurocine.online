"use client";

import { getCreateTools, getToolGroups, getToolsByGroup } from "../lib/toolsRegistry";
import ToolCard from "./ToolCard";

function pickLang(lang = "ru") {
  return String(lang || "ru").toLowerCase().startsWith("en") ? "en" : "ru";
}

export default function CreateHub({ open, onClose, onSelectTool, access, uiLang = "ru" }) {
  if (!open) return null;
  const lang = pickLang(uiLang);
  const isRu = lang === "ru";
  const tools = getCreateTools(lang);
  const groups = getToolGroups(lang);
  const primary = tools.find(t => t.primary);
  const plan = access?.isOwner || access?.isAdmin ? (isRu ? "ГЛАВНЫЙ РЕЖИССЁР" : "DIRECTOR") : access?.role === "pro" ? "PRO" : "FREE";

  function handleSelect(tool) {
    if (tool.packTab) {
      window.dispatchEvent(new CustomEvent("neurocine-open-pack-tab", { detail: { tab: tool.packTab } }));
    }
    onSelectTool?.(tool);
    onClose?.();
  }

  return (
    <div className="nc-create-hub" role="dialog" aria-modal="true" aria-label={isRu ? "Создать в NeuroCine" : "Create in NeuroCine"}>
      <div className="nc-create-backdrop" onClick={onClose} />
      <div className="nc-create-panel">
        <div className="nc-create-head">
          <div>
            <span>{isRu ? "Фабрика NeuroCine" : "NeuroCine Factory"}</span>
            <h2>{isRu ? "Создать" : "Create"}</h2>
            <p>{isRu ? "Только реальные рабочие модули: сценарий, storyboard, pipeline и production pack." : "Only real working modules: script, storyboard, pipeline and production pack."}</p>
          </div>
          <button className="nc-round-close" type="button" onClick={onClose}>×</button>
        </div>

        {primary && <ToolCard tool={primary} onSelect={handleSelect} uiLang={lang} />}

        <div className="nc-hub-plan-strip">
          <strong>{plan}</strong>
          <span>{isRu ? "Показываются только активные инструменты, которые уже есть в текущем продакшн-пайплайне." : "Only active tools already available in the current production pipeline are shown."}</span>
        </div>

        <div className="nc-tool-grid">
          {tools.filter(t => !t.primary).map(tool => (
            <ToolCard key={tool.id} tool={tool} compact onSelect={handleSelect} uiLang={lang} />
          ))}
        </div>

        <div className="nc-group-list">
          {groups.map(group => {
            const list = getToolsByGroup(group.id, lang);
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
