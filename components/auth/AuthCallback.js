"use client";

import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient";
import { clearAuthReturnTo, getSafeReturnTo, readAuthReturnTo } from "../../lib/authRedirect";

export default function AuthCallback({ next = "/storyboard" }) {
  const [message, setMessage] = useState("Завершаю вход…");

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      if (!isSupabaseConfigured || !supabase) {
        setMessage("Supabase не настроен. Проверь ENV на Render.");
        return;
      }

      const fallback = readAuthReturnTo(next || "/storyboard");
      const safeNext = getSafeReturnTo(next || fallback || "/storyboard");

      try {
        const { data, error } = await supabase.auth.getSession();
        if (cancelled) return;
        if (error) throw error;
        clearAuthReturnTo();
        const target = data?.session?.user ? safeNext : "/storyboard";
        window.location.replace(target);
      } catch (e) {
        if (cancelled) return;
        setMessage(e?.message || "Не удалось завершить вход.");
      }
    }

    finish();
    return () => { cancelled = true; };
  }, [next]);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#07080f", color: "#eef0f8", padding: 24 }}>
      <section style={{ width: "min(560px, 100%)", border: "1px solid rgba(255,255,255,.14)", borderRadius: 28, background: "rgba(255,255,255,.055)", padding: 28, boxShadow: "0 24px 90px rgba(0,0,0,.55)" }}>
        <div style={{ color: "#f0abfc", fontSize: 11, fontWeight: 900, letterSpacing: ".24em", textTransform: "uppercase", marginBottom: 10 }}>NEUROCINE AUTH</div>
        <h1 style={{ margin: "0 0 10px", fontSize: 34, lineHeight: 1 }}>Вход в NeuroCine</h1>
        <p style={{ margin: 0, color: "rgba(238,240,248,.68)", fontSize: 14 }}>{message}</p>
      </section>
    </main>
  );
}
