"use client";

import { useEffect } from "react";
import { hardenClipboardText } from "../lib/visualPromptQuality";
import { applyCharacterBibleToPrompt } from "./CharacterBiblePatch";

function enhanceText(text = "") {
  return applyCharacterBibleToPrompt(hardenClipboardText(text));
}

function hardenNodeText(node) {
  if (!node) return;
  const text = node.textContent || "";
  const next = enhanceText(text);
  if (next && next !== text) {
    node.textContent = next;
    if (node.dataset) node.dataset.ncVisualHardened = "1";
  }
}

function hardenVisiblePrompts() {
  const nodes = document.querySelectorAll("pre, textarea, .out-pre, .json-box pre");
  nodes.forEach((node) => {
    const value = "value" in node ? node.value : node.textContent;
    const next = enhanceText(value || "");
    if (!next || next === value) return;
    if ("value" in node) {
      node.value = next;
      node.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      hardenNodeText(node);
    }
  });
}

export default function VisualPromptQualityPatch() {
  useEffect(() => {
    const originalWriteText = navigator.clipboard?.writeText?.bind(navigator.clipboard);
    if (originalWriteText) {
      navigator.clipboard.writeText = (text) => originalWriteText(enhanceText(text));
    }

    const OriginalBlob = window.Blob;
    function HardenedBlob(parts = [], options = {}) {
      try {
        const nextParts = Array.isArray(parts)
          ? parts.map((part) => typeof part === "string" ? enhanceText(part) : part)
          : parts;
        return new OriginalBlob(nextParts, options);
      } catch {
        return new OriginalBlob(parts, options);
      }
    }
    HardenedBlob.prototype = OriginalBlob.prototype;
    Object.setPrototypeOf(HardenedBlob, OriginalBlob);
    window.Blob = HardenedBlob;

    hardenVisiblePrompts();
    const observer = new MutationObserver(() => hardenVisiblePrompts());
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    const onBible = () => hardenVisiblePrompts();
    window.addEventListener("neurocine:character-bible-updated", onBible);

    return () => {
      observer.disconnect();
      window.removeEventListener("neurocine:character-bible-updated", onBible);
      if (originalWriteText) navigator.clipboard.writeText = originalWriteText;
      window.Blob = OriginalBlob;
    };
  }, []);

  return null;
}
