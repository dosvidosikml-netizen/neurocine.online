"use client";

import { useEffect } from "react";

function looksLikeRawCoverSceneFact(value = "") {
  const text = String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
  if (!text) return false;
  return (
    text.length > 32 ||
    (/\b(он|она|они|ты|доктор|человек|герой|камера)\b/i.test(text) &&
      /(ид[её]т|выходит|останавливается|смотрит|подходит|проходит|говорит|видит|держит|стоит|сидит|лежит|поворачивается|открывает|закрывает|бер[её]т|подпустил|между|у стены|в переулок)/i.test(text))
  );
}

function hasBadCoverPayload(raw = "") {
  try {
    const data = JSON.parse(String(raw || "null"));
    const facts = Array.isArray(data?.side_facts) ? data.side_facts : [];
    return facts.some(looksLikeRawCoverSceneFact);
  } catch {
    return false;
  }
}

function purgeBadCoverCache() {
  const removed = [];
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (!key || !key.includes(":cover:data")) continue;
      const raw = localStorage.getItem(key);
      if (hasBadCoverPayload(raw)) {
        localStorage.removeItem(key);
        removed.push(key);
      }
    }
  } catch {}
  return removed;
}

export default function CoverDirectorCachePatch() {
  useEffect(() => {
    const removed = purgeBadCoverCache();
    if (!removed.length) return;

    try {
      window.dispatchEvent(new CustomEvent("neurocine-production-cache-change", {
        detail: { reason: "stale-cover-director-cache-purged", removed },
      }));
    } catch {}

    try {
      const reloadKey = "neurocine.coverDirectorCachePatch.reloaded";
      if (!sessionStorage.getItem(reloadKey)) {
        sessionStorage.setItem(reloadKey, "1");
        window.location.reload();
      }
    } catch {}
  }, []);

  return null;
}
