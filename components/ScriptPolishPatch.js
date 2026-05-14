"use client";

import { useEffect } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";
import { validateScript } from "../lib/scriptValidator";

function setNativeValue(el, value) {
  if (!el) return;
  const proto = Object.getPrototypeOf(el);
  const desc = Object.getOwnPropertyDescriptor(proto, "value");
  if (desc?.set) desc.set.call(el, value);
  else el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

function findFieldByLabel(labelText) {
  const labels = Array.from(document.querySelectorAll("label"));
  const label = labels.find((x) => String(x.textContent || "").toLowerCase().includes(labelText.toLowerCase()));
  if (!label) return null;
  const wrap = label.closest(".setup-field-v40, .setup-manual-v40, .setup-main-v40") || label.parentElement;
  return wrap?.querySelector?.("input, textarea") || null;
}

function getSetupValues() {
  const scriptEl = document.querySelector("textarea.setup-script-v40") || findFieldByLabel("готовый сценарий");
  const topicEl = document.querySelector("textarea.setup-topic-v40") || findFieldByLabel("тема ролика");
  const toneEl = findFieldByLabel("тон / жанр") || findFieldByLabel("тон");
  const activeDuration = Array.from(document.querySelectorAll(".setup-pills-v40 button.active"))
    .map((b) => String(b.textContent || ""))
    .find((x) => /с|м/.test(x));
  let duration = 60;
  if (activeDuration) {
    const n = Number(String(activeDuration).replace(/[^0-9.]/g, ""));
    if (String(activeDuration).includes("м")) duration = n * 60;
    else if (n) duration = n;
  }
  return {
    scriptEl,
    script: String(scriptEl?.value || "").trim(),
    topic: String(topicEl?.value || "").trim(),
    tone: String(toneEl?.value || "cinematic documentary thriller").trim(),
    duration,
  };
}

function findQualityBox() {
  return Array.from(document.querySelectorAll(".out-box")).find((box) =>
    String(box.textContent || "").includes("Качество сценария")
  );
}

export default function ScriptPolishPatch() {
  useEffect(() => {
    let busy = false;

    async function run(mode) {
      if (busy) return;
      const data = getSetupValues();
      if (!data.script || !data.scriptEl) {
        alert("Сначала нужен сценарий для усиления.");
        return;
      }

      busy = true;
      const buttons = Array.from(document.querySelectorAll("[data-nc-script-polish]"));
      buttons.forEach((b) => { b.disabled = true; b.textContent = "Ждём..."; });

      try {
        let token = "";
        if (isSupabaseConfigured && supabase?.auth?.getSession) {
          const { data: sessionData } = await supabase.auth.getSession();
          token = sessionData?.session?.access_token || "";
        }

        const validation = validateScript(data.script);
        const res = await fetch("/api/script-polish", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ mode, script: data.script, topic: data.topic, tone: data.tone, duration: data.duration, validation }),
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok || payload.error || payload.apiError) {
          throw new Error(payload.error || payload.warning || `HTTP ${res.status}`);
        }
        if (payload.text) setNativeValue(data.scriptEl, payload.text);
      } catch (e) {
        alert(e?.message || "Не удалось усилить сценарий");
      } finally {
        busy = false;
        buttons.forEach((b) => {
          b.disabled = false;
          b.textContent = b.dataset.ncScriptPolish === "improve" ? "Усилить" : "Добить до 100";
        });
      }
    }

    function mountButtons() {
      const box = findQualityBox();
      if (!box || box.querySelector("[data-nc-script-polish]")) return;
      const head = box.querySelector(".out-head") || box;
      let target = head.querySelector(".out-actions-v33");
      if (!target) {
        target = document.createElement("div");
        target.className = "out-actions-v33";
        target.style.display = "flex";
        target.style.gap = "8px";
        target.style.flexWrap = "wrap";
        target.style.justifyContent = "flex-end";
        head.appendChild(target);
      }

      const improve = document.createElement("button");
      improve.type = "button";
      improve.className = "btn btn-sm btn-ghost";
      improve.dataset.ncScriptPolish = "improve";
      improve.textContent = "Усилить";
      improve.addEventListener("click", () => run("improve"));

      const polish = document.createElement("button");
      polish.type = "button";
      polish.className = "btn btn-sm btn-ghost";
      polish.dataset.ncScriptPolish = "polish";
      polish.textContent = "Добить до 100";
      polish.addEventListener("click", () => run("polish"));

      target.prepend(improve);
      target.prepend(polish);
    }

    mountButtons();
    const observer = new MutationObserver(mountButtons);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
