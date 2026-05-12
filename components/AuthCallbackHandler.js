"use client";

import { useEffect } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

export default function AuthCallbackHandler() {
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!isSupabaseConfigured || !supabase || typeof window === "undefined") return;

      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error_description") || url.searchParams.get("error");

      if (error) {
        console.warn("NeuroCine OAuth callback error:", error);
        return;
      }

      if (!code || !supabase.auth.exchangeCodeForSession) return;

      try {
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;

        if (exchangeError) {
          console.warn("NeuroCine OAuth exchange failed:", exchangeError.message);
          return;
        }

        if (data?.session) {
          const cleanUrl = `${url.origin}${url.pathname}`;
          window.history.replaceState({}, document.title, cleanUrl);
          window.dispatchEvent(new CustomEvent("neurocine-auth-ready"));
        }
      } catch (e) {
        console.warn("NeuroCine OAuth exchange crashed:", e);
      }
    }

    run();
    return () => { cancelled = true; };
  }, []);

  return null;
}
