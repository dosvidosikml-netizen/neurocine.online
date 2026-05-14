"use client";

import { useEffect } from "react";
import { hardenClipboardText } from "../lib/visualPromptQuality";

function hardenNodeText(node) {
  if (!node || node.dataset?.ncVisualHardened === "1") return;
  const text = node.textContent || "";
  const next = hardenClipboardText(text);
  if (next && next !== text) {
    node.textContent = next;
    if (node.dataset) node.dataset.ncVisualHardened = "1";
  }
}

function hardenVisiblePrompts() {
  const nodes = document.querySelectorAll("pre, textarea, .out-pre, .json-box pre");
  nodes.forEach((node) => {
    const value = "value" in node ? node.value : node.textContent;
    const next = hardenClipboardText(value || "");
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
      navigator.clipboard.writeText = (text) => originalWriteText(hardenClipboardText(text));
    }

    const OriginalBlob = window.Blob;
    function HardenedBlob(parts = [], options = {}) {
      try {
        const nextParts = Array.isArray(parts)
          ? parts.map((part) => typeof part === "string" ? hardenClipboardText(part) : part)
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

    return () => {
      observer.disconnect();
      if (originalWriteText) navigator.clipboard.writeText = originalWriteText;
      window.Blob = OriginalBlob;
    };
  }, []);

  return null;
}
