"use client";

import { useEffect, useState } from "react";

const KEY = "neurocine:series-to-studio:v1";

function byLabel(text) {
  const label = Array.from(document.querySelectorAll("label")).find((x) => String(x.textContent || "").toLowerCase().includes(text.toLowerCase()));
  const wrap = label?.closest?.(".setup-field-v40, .setup-manual-v40, .setup-main-v40") || label?.parentElement;
  return wrap?.querySelector?.("input, textarea") || null;
}

function setVal(el, value) {
  if (!el || value == null) return false;
  const proto = Object.getPrototypeOf(el);
  const desc = Object.getOwnPropertyDescriptor(proto, "value");
  if (desc?.set) desc.set.call(el, String(value));
  else el.value = String(value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

function buildText(payload) {
  const d = payload?.seriesDraft || {};
  const ep = Array.isArray(d.episodes) ? d.episodes[0] : null;
  return [
    d.title ? `Название: ${d.title}` : "",
    d.logline ? `Идея: ${d.logline}` : "",
    d.world ? `Мир: ${d.world}` : "",
    ep?.beat ? `Серия 1: ${ep.title || "Серия 1"}. ${ep.beat}` : "",
    Array.isArray(d.cast) && d.cast.length ? `Герои: ${d.cast.map((c) => c.ui_label_ru || c.name).join(", ")}` : "",
  ].filter(Boolean).join("\n\n");
}

export default function SeriesStudioHandoffPatch() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!window.location.pathname.startsWith("/storyboard")) return;
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return;
    let payload = null;
    try { payload = JSON.parse(raw); } catch {}
    if (!payload) return;

    let n = 0;
    const timer = window.setInterval(() => {
      n += 1;
      const topic = document.querySelector("textarea.setup-topic-v40") || byLabel("тема ролика");
      const script = document.querySelector("textarea.setup-script-v40") || byLabel("готовый сценарий");
      const name = byLabel("название проекта");
      const tone = byLabel("тон");
      if (!topic && n < 20) return;

      const text = buildText(payload);
      setVal(name, payload.projectName || payload.seriesDraft?.title || "NeuroCine Series");
      setVal(topic, payload.topic || text);
      if (script && !String(script.value || "").trim()) setVal(script, text);
      setVal(tone, payload.tone || payload.seriesDraft?.genre || "cinematic documentary thriller");
      sessionStorage.removeItem(KEY);
      setDone(true);
      window.clearInterval(timer);
    }, 500);

    return () => window.clearInterval(timer);
  }, []);

  if (!done) return null;
  return <div className="nc-series-handoff-banner"><b>🎞 Сериал передан в Studio</b><button type="button" onClick={() => setDone(false)}>×</button></div>;
}
