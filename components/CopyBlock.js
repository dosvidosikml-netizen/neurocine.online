"use client";

import { useState } from "react";

export default function CopyBlock({ title, text, compact = false }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(String(text || ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 900);
  }

  return (
    <div className="prompt">
      <div className="prompt-head">
        <strong>{title}</strong>
        <button className="btn dark" onClick={copy}>{copied ? "Скопировано" : "Копировать"}</button>
      </div>
      <pre style={{ maxHeight: compact ? 180 : "none", overflow: "auto" }}>{text}</pre>
    </div>
  );
}
