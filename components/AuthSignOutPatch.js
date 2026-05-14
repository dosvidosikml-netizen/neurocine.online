"use client";

import { useEffect } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

const LOGOUT_SELECTORS = [
  ".nc-profile-menu-danger",
  "[data-neurocine-logout]",
];

function clearLocalAuthFallback() {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const low = key.toLowerCase();
      if (
        low.includes("supabase") ||
        low.includes("sb-") ||
        low.includes("auth-token") ||
        low.includes("nc_account") ||
        low.includes("neurocine:account")
      ) keys.push(key);
    }
    keys.forEach((key) => localStorage.removeItem(key));
  } catch {}

  try {
    const keys = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key) continue;
      const low = key.toLowerCase();
      if (low.includes("supabase") || low.includes("auth-token") || low.includes("neurocine")) keys.push(key);
    }
    keys.forEach((key) => sessionStorage.removeItem(key));
  } catch {}
}

export default function AuthSignOutPatch() {
  useEffect(() => {
    let busy = false;

    async function doSignOut() {
      if (busy) return;
      busy = true;

      try {
        if (isSupabaseConfigured && supabase?.auth?.signOut) {
          await supabase.auth.signOut({ scope: "global" });
        }
      } catch (e) {
        console.warn("NeuroCine signOut failed, applying local fallback", e);
      } finally {
        clearLocalAuthFallback();
        window.location.assign("/?signed_out=1");
      }
    }

    function onPointerDown(e) {
      const target = e.target;
      if (!target?.closest) return;
      const hit = LOGOUT_SELECTORS.some((selector) => target.closest(selector));
      if (!hit) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();
      doSignOut();
    }

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("click", onPointerDown, true);
    document.addEventListener("touchstart", onPointerDown, true);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("click", onPointerDown, true);
      document.removeEventListener("touchstart", onPointerDown, true);
    };
  }, []);

  return null;
}
