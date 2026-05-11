"use client";

function statusLabel(status) {
  if (status === "active") return "Работает";
  if (status === "ready_ui") return "UI-ready";
  return "Скоро";
}

export default function ToolCard({ tool, compact = false, onSelect }) {
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
      <span className={`nc-tool-status ${tool.status}`}>{statusLabel(tool.status)}</span>
    </button>
  );
}
