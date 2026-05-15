"use client";

function pickLang(lang = "ru") {
  return String(lang || "ru").toLowerCase().startsWith("en") ? "en" : "ru";
}

function statusLabel(status, lang = "ru") {
  const isRu = pickLang(lang) === "ru";
  if (status === "active") return isRu ? "Работает" : "Active";
  return isRu ? "Работает" : "Active";
}

export default function ToolCard({ tool, compact = false, onSelect, uiLang = "ru" }) {
  if (!tool) return null;
  return (
    <button
      type="button"
      className={`nc-tool-card accent-${tool.accent || "gray"}${tool.primary ? " primary" : ""}${compact ? " compact" : ""}`}
      onClick={() => onSelect?.(tool)}
    >
      <span className="nc-tool-icon">{tool.icon}</span>
      <span className="nc-tool-copy">
        <strong>{tool.title}</strong>
        <em>{tool.subtitle}</em>
        {!compact && <small>{tool.description}</small>}
      </span>
      <span className={`nc-tool-status ${tool.status || "active"}`}>{statusLabel(tool.status, uiLang)}</span>
    </button>
  );
}
