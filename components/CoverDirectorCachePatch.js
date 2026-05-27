"use client";

import { useEffect } from "react";

const PATCH_VERSION = "cover-cache-purge-v3";

function shouldPurgeKey(key = "") {
  const k = String(key || "");
  return (
    k.includes(":cover:data") ||
    k.includes(":cover:variant") ||
    k.includes(":cover:mode") ||
    k.includes(":cover:style") ||
    k.includes(":poster") ||
    k.includes(":thumbnail") ||
    k.includes("coverDirector") ||
    k.includes("CoverDirector")
  );
}

function purgeAllCoverCache() {
  const removed = [];
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (!key || !shouldPurgeKey(key)) continue;
      localStorage.removeItem(key);
      removed.push(key);
    }
  } catch {}
  return removed;
}

export default function CoverDirectorCachePatch() {
  useEffect(() => {
    let removed = [];
    try {
      const last = sessionStorage.getItem(PATCH_VERSION);
      removed = purgeAllCoverCache();
      sessionStorage.setItem(PATCH_VERSION, "done");

      window.dispatchEvent(new CustomEvent("neurocine-production-cache-change", {
        detail: { reason: "all-cover-director-cache-purged", removed },
      }));

      // One reload only after the first purge, so already-mounted React state cannot keep stale cover data.
      // Auth/session keys are not touched.
      if (removed.length && last !== "done") {
        window.location.reload();
      }
    } catch {}
  }, []);

  return null;
}
