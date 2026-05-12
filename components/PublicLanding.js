"use client";

import { useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

function getUserMeta(user) {
  const meta = user?.user_metadata || {};
  return {
    email: user?.email || meta.email || "",
    name: meta.full_name || meta.name || user?.email || "Director",
    avatar: meta.avatar_url || meta.picture || "",
  };
}

export default function PublicLanding() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const user = session?.user || null;
  const meta = useMemo(() => getUserMeta(user), [user]);

  useEffect(() => {
    let mounted = true;
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data?.session || null);
      setLoading(false);
    }

    loadSession();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession || null);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  async function loginWithGoogle() {
    if (!isSupabaseConfigured || !supabase) {
      window.location.href = "/storyboard";
      return;
    }
    setBusy(true);
    setError("");
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/storyboard` : undefined;
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (signInError) {
      setError(signInError.message);
      setBusy(false);
    }
  }

  function openStudio() {
    if (user || !isSupabaseConfigured) {
      window.location.href = "/storyboard";
      return;
    }
    loginWithGoogle();
  }

  function scrollToProgramme() {
    document.getElementById("programme")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const openLabel = user ? "Open Studio" : busy ? "Opening Google..." : "Sign in / Open Studio";
  const authLabel = user ? `Studio: ${meta.name}` : busy ? "Opening Google..." : "Войти через Google";

  return (
    <main className="nc-public-landing">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo:wght@400;500;600;700;900&family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,500;0,6..72,800;1,6..72,300;1,6..72,500;1,6..72,800&family=JetBrains+Mono:wght@400;500;700&display=swap');

        .nc-public-landing{
          --bone:#f3efe6;
          --bone-2:#e8e3d6;
          --ink:#0a0a0a;
          --ink-soft:#1a1a1a;
          --rule-soft:rgba(10,10,10,.14);
          --red:#e8331c;
          --red-deep:#b8210a;
          --yellow:#f4d92e;
          --indigo:#1f2a78;
          --cream:#faf5e6;
          --font-display:'Archivo Black',Impact,sans-serif;
          --font-ui:'Archivo',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
          --font-serif:'Newsreader',Georgia,serif;
          --font-mono:'JetBrains Mono',ui-monospace,monospace;
          position:relative;
          min-height:100vh;
          background:var(--bone);
          color:var(--ink);
          font-family:var(--font-ui);
          line-height:1.45;
          overflow-x:hidden;
          isolation:isolate;
          -webkit-font-smoothing:antialiased;
        }
        .nc-public-landing *,
        .nc-public-landing *::before,
        .nc-public-landing *::after{box-sizing:border-box}
        .nc-public-landing a{color:inherit;text-decoration:none}
        .nc-public-landing button{background:none;border:none;font:inherit;color:inherit;cursor:pointer}
        .nc-public-landing::before{
          content:"";position:absolute;inset:0;z-index:1;pointer-events:none;
          background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='1.6' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.04 0 0 0 0 0.04 0 0 0 0 0.03 0 0 0 0.22 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
          mix-blend-mode:multiply;opacity:.55;
        }
        .nc-public-landing .page{position:relative;z-index:2}

        .nc-public-landing .fest-header{border-bottom:4px solid var(--ink);background:var(--bone)}
        .nc-public-landing .fest-top{
          display:grid;grid-template-columns:auto 1fr auto;align-items:center;
          padding:14px 28px;gap:24px;border-bottom:1px solid var(--ink);
          font-family:var(--font-mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;
        }
        .nc-public-landing .fest-top .left{display:flex;gap:18px;align-items:center;flex-wrap:wrap}
        .nc-public-landing .fest-top .right{display:flex;gap:14px;align-items:center;justify-content:flex-end;flex-wrap:wrap}
        .nc-public-landing .fest-top b{font-weight:500;color:var(--red)}
        .nc-public-landing .fest-num{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;background:var(--red);color:var(--bone);font-family:var(--font-display);letter-spacing:0;font-size:14px}
        .nc-public-landing .auth-pill{display:inline-flex;align-items:center;gap:8px;padding:9px 12px;background:var(--ink);color:var(--bone);font-family:var(--font-display);font-size:10px;letter-spacing:.08em;text-transform:uppercase;transition:.16s ease;white-space:nowrap}
        .nc-public-landing .auth-pill:hover{background:var(--red)}
        .nc-public-landing .auth-dot{width:8px;height:8px;border-radius:50%;background:var(--yellow);box-shadow:0 0 0 2px rgba(244,217,46,.16)}

        .nc-public-landing .fest-title{position:relative;padding:60px 28px 38px;display:grid;grid-template-columns:1fr auto;align-items:end;gap:28px}
        .nc-public-landing .fest-title h1{font-family:var(--font-display);font-size:clamp(72px,16vw,240px);line-height:.78;letter-spacing:-.05em;text-transform:uppercase;color:var(--ink);margin:0}
        .nc-public-landing .fest-title h1 .red{color:var(--red)}
        .nc-public-landing .fest-title h1 .it{font-family:var(--font-serif);font-style:italic;font-weight:500;letter-spacing:-.025em;text-transform:lowercase}
        .nc-public-landing .fest-title-meta{display:flex;flex-direction:column;gap:6px;font-family:var(--font-mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;text-align:right}
        .nc-public-landing .fest-title-meta b{color:var(--red);font-weight:500}
        .nc-public-landing .fest-sub{padding:0 28px 22px;display:flex;justify-content:space-between;align-items:end;border-bottom:1px solid var(--ink);gap:28px;flex-wrap:wrap}
        .nc-public-landing .fest-sub h2{font-family:var(--font-serif);font-style:italic;font-weight:500;font-size:clamp(20px,2.4vw,32px);line-height:1.2;letter-spacing:-.015em;color:var(--ink);max-width:780px;margin:0}
        .nc-public-landing .fest-sub h2 b{font-family:var(--font-display);font-style:normal;background:var(--yellow);padding:0 8px;letter-spacing:-.01em}
        .nc-public-landing .fest-sub-cta{display:inline-flex;align-items:center;gap:10px;padding:14px 22px;background:var(--ink);color:var(--bone);font-family:var(--font-display);font-size:14px;letter-spacing:.04em;text-transform:uppercase;transition:all .15s}
        .nc-public-landing .fest-sub-cta:hover{background:var(--red)}

        .nc-public-landing .poster{display:grid;grid-template-columns:1.3fr .9fr .8fr;grid-template-rows:auto auto;border-bottom:4px solid var(--ink)}
        .nc-public-landing .p-headline{grid-column:1/2;grid-row:1/3;background:var(--red);color:var(--bone);padding:48px 36px 36px;border-right:1px solid var(--ink);position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;min-height:560px}
        .nc-public-landing .p-headline::before{content:"●";position:absolute;top:24px;right:32px;font-size:36px;color:var(--bone);animation:ncPulseRed 1.8s ease-in-out infinite}
        @keyframes ncPulseRed{0%,100%{opacity:1}50%{opacity:.5}}
        .nc-public-landing .p-pre{font-family:var(--font-mono);font-size:11px;letter-spacing:.22em;text-transform:uppercase;opacity:.85}
        .nc-public-landing .p-headline h2{font-family:var(--font-display);font-size:clamp(48px,8vw,116px);line-height:.84;letter-spacing:-.04em;text-transform:uppercase;margin:18px 0 0}
        .nc-public-landing .p-headline h2 .it{font-family:var(--font-serif);font-style:italic;font-weight:500;letter-spacing:-.02em;text-transform:lowercase;color:var(--yellow)}
        .nc-public-landing .p-headline h2 .out{-webkit-text-stroke:1.5px var(--bone);color:transparent}
        .nc-public-landing .p-headline-foot{display:flex;justify-content:space-between;align-items:end;margin-top:28px;font-family:var(--font-mono);font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;gap:12px;flex-wrap:wrap}
        .nc-public-landing .p-headline-foot b{font-weight:500}

        .nc-public-landing .p-vis{grid-column:2/3;grid-row:1/2;background:var(--ink);color:var(--bone);padding:32px;border-bottom:1px solid var(--bone-2);position:relative;overflow:hidden;min-height:280px;display:flex;flex-direction:column;justify-content:space-between}
        .nc-public-landing .p-vis::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 70% 30%,rgba(232,51,28,.4),transparent 50%),radial-gradient(circle at 30% 70%,rgba(244,217,46,.18),transparent 50%)}
        .nc-public-landing .p-vis-content{position:relative;z-index:2}
        .nc-public-landing .p-vis-kicker{font-family:var(--font-mono);font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--yellow);margin-bottom:18px}
        .nc-public-landing .p-vis h3{font-family:var(--font-display);font-size:36px;line-height:.95;letter-spacing:-.03em;text-transform:uppercase;color:var(--bone);margin:0 0 14px}
        .nc-public-landing .p-vis h3 .it{font-family:var(--font-serif);font-style:italic;font-weight:500;text-transform:lowercase;color:var(--yellow)}
        .nc-public-landing .p-vis-num{font-family:var(--font-display);font-size:120px;line-height:.85;letter-spacing:-.05em;color:var(--yellow);text-align:right;position:relative;z-index:2}
        .nc-public-landing .p-vis-num .small{font-family:var(--font-serif);font-style:italic;font-weight:500;font-size:40px;color:var(--bone)}
        .nc-public-landing .p-info{grid-column:3/4;grid-row:1/2;background:var(--yellow);color:var(--ink);padding:30px 28px;border-bottom:1px solid var(--ink);min-height:280px;display:flex;flex-direction:column;justify-content:space-between}
        .nc-public-landing .p-info-pre{font-family:var(--font-mono);font-size:10.5px;letter-spacing:.2em;text-transform:uppercase}
        .nc-public-landing .p-info h3{font-family:var(--font-display);font-size:34px;line-height:.95;letter-spacing:-.025em;text-transform:uppercase;margin:14px 0 12px}
        .nc-public-landing .p-info h3 .it{font-family:var(--font-serif);font-style:italic;font-weight:500;text-transform:lowercase}
        .nc-public-landing .p-info-body{font-family:var(--font-serif);font-size:14px;line-height:1.5;color:var(--ink-soft)}
        .nc-public-landing .p-info-foot{font-family:var(--font-mono);font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;padding-top:14px;border-top:1px solid var(--ink);display:flex;justify-content:space-between;margin-top:14px}
        .nc-public-landing .p-stats{grid-column:2/4;grid-row:2/3;background:var(--bone);padding:32px;display:grid;grid-template-columns:repeat(4,1fr);gap:24px}
        .nc-public-landing .p-stat{border-right:1px solid var(--rule-soft);padding-right:24px}
        .nc-public-landing .p-stat:last-child{border-right:none;padding-right:0}
        .nc-public-landing .p-stat-k{font-family:var(--font-mono);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--ink-soft);margin-bottom:10px}
        .nc-public-landing .p-stat-v{font-family:var(--font-display);font-size:54px;line-height:.95;letter-spacing:-.04em;color:var(--ink)}
        .nc-public-landing .p-stat-v .red{color:var(--red)}
        .nc-public-landing .p-stat-v .sm{font-family:var(--font-serif);font-style:italic;font-weight:500;font-size:24px;color:var(--ink-soft)}

        .nc-public-landing .section{border-bottom:4px solid var(--ink)}
        .nc-public-landing .section-bar{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:24px;padding:18px 28px;border-bottom:1px solid var(--ink);background:var(--ink);color:var(--bone)}
        .nc-public-landing .section-tag{display:inline-block;padding:6px 14px;background:var(--red);color:var(--bone);font-family:var(--font-display);font-size:14px;letter-spacing:.04em;text-transform:uppercase}
        .nc-public-landing .section-bar h3{font-family:var(--font-display);font-size:clamp(28px,4vw,56px);line-height:.95;letter-spacing:-.03em;text-transform:uppercase;color:var(--bone);margin:0}
        .nc-public-landing .section-bar h3 .it{font-family:var(--font-serif);font-style:italic;font-weight:500;text-transform:lowercase;color:var(--yellow)}
        .nc-public-landing .section-bar-meta{font-family:var(--font-mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--bone-2)}
        .nc-public-landing .programme{display:flex;flex-direction:column}
        .nc-public-landing .prog-row{display:grid;grid-template-columns:80px 1.1fr 1.6fr auto auto;gap:28px;align-items:center;padding:24px 28px;border-bottom:1px solid var(--ink);transition:background .18s;cursor:pointer;text-align:left}
        .nc-public-landing .prog-row:hover{background:var(--yellow)}
        .nc-public-landing .prog-row:last-child{border-bottom:none}
        .nc-public-landing .prog-time{font-family:var(--font-display);font-size:38px;line-height:.95;letter-spacing:-.03em;color:var(--ink)}
        .nc-public-landing .prog-name{font-family:var(--font-display);font-size:28px;line-height:.95;letter-spacing:-.025em;text-transform:uppercase;color:var(--ink)}
        .nc-public-landing .prog-name .it{font-family:var(--font-serif);font-style:italic;font-weight:500;text-transform:lowercase;color:var(--red)}
        .nc-public-landing .prog-desc{font-family:var(--font-serif);font-size:15px;line-height:1.5;color:var(--ink-soft)}
        .nc-public-landing .prog-tag{display:inline-block;padding:5px 11px;background:var(--ink);color:var(--bone);font-family:var(--font-mono);font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;white-space:nowrap}
        .nc-public-landing .prog-tag.r{background:var(--red)}
        .nc-public-landing .prog-tag.y{background:var(--yellow);color:var(--ink)}
        .nc-public-landing .prog-arrow{font-family:var(--font-display);font-size:32px;color:var(--ink)}
        .nc-public-landing .prog-row:hover .prog-arrow{color:var(--red);transform:translateX(4px);transition:transform .2s}

        .nc-public-landing .manifesto{display:grid;grid-template-columns:1.2fr 1fr;border-bottom:4px solid var(--ink)}
        .nc-public-landing .manifesto-text{padding:64px 48px;border-right:1px solid var(--ink);background:var(--bone);position:relative}
        .nc-public-landing .manifesto-num{font-family:var(--font-display);font-size:170px;line-height:.85;letter-spacing:-.06em;color:var(--red);margin-bottom:18px}
        .nc-public-landing .manifesto-num .it{font-family:var(--font-serif);font-style:italic;font-weight:500;color:var(--ink)}
        .nc-public-landing .manifesto-h{font-family:var(--font-display);font-size:clamp(34px,5vw,64px);line-height:.95;letter-spacing:-.035em;text-transform:uppercase;color:var(--ink);margin:0 0 28px;max-width:560px}
        .nc-public-landing .manifesto-h .it{font-family:var(--font-serif);font-style:italic;font-weight:500;text-transform:lowercase;color:var(--red)}
        .nc-public-landing .manifesto-body{font-family:var(--font-serif);font-size:17px;line-height:1.6;color:var(--ink-soft);max-width:540px;margin-bottom:28px}
        .nc-public-landing .manifesto-body p{margin:0 0 14px}
        .nc-public-landing .manifesto-body b{background:var(--yellow);padding:0 4px;color:var(--ink);font-weight:500}
        .nc-public-landing .manifesto-body em{font-style:italic;color:var(--red)}
        .nc-public-landing .manifesto-stamp{display:inline-flex;align-items:center;gap:10px;padding:10px 16px;border:2px solid var(--ink);background:var(--bone);font-family:var(--font-mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink);transform:rotate(-2deg)}
        .nc-public-landing .manifesto-stamp .dot{width:8px;height:8px;background:var(--red);border-radius:50%}
        .nc-public-landing .manifesto-aside{background:var(--ink);color:var(--bone);padding:64px 48px;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden}
        .nc-public-landing .aside-pre{font-family:var(--font-mono);font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--yellow);margin-bottom:24px}
        .nc-public-landing .aside-h{font-family:var(--font-display);font-size:clamp(32px,4.4vw,56px);line-height:.95;letter-spacing:-.035em;text-transform:uppercase;margin:0}
        .nc-public-landing .aside-h .it{font-family:var(--font-serif);font-style:italic;font-weight:500;text-transform:lowercase;color:var(--red)}
        .nc-public-landing .aside-list{margin-top:36px;display:flex;flex-direction:column;gap:18px}
        .nc-public-landing .aside-row{display:grid;grid-template-columns:auto 1fr auto;gap:18px;align-items:baseline;padding-bottom:16px;border-bottom:1px solid rgba(243,239,230,.14)}
        .nc-public-landing .aside-row:last-child{border-bottom:none}
        .nc-public-landing .aside-row .id{font-family:var(--font-display);font-size:22px;color:var(--red);letter-spacing:-.02em}
        .nc-public-landing .aside-row .lb{font-family:var(--font-display);font-size:20px;text-transform:uppercase;letter-spacing:-.02em;color:var(--bone)}
        .nc-public-landing .aside-row .lb .it{font-family:var(--font-serif);font-style:italic;font-weight:500;text-transform:lowercase;color:var(--yellow)}
        .nc-public-landing .aside-row .meta{font-family:var(--font-mono);font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--bone-2)}

        .nc-public-landing .gallery{display:grid;grid-template-columns:repeat(6,1fr);border-bottom:4px solid var(--ink)}
        .nc-public-landing .still{aspect-ratio:3/4;border-right:1px solid var(--ink);position:relative;overflow:hidden;cursor:pointer;transition:transform .25s}
        .nc-public-landing .still:last-child{border-right:none}
        .nc-public-landing .still:hover{transform:translateY(-4px)}
        .nc-public-landing .still::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(0,0,0,.6) 100%)}
        .nc-public-landing .still-tag{position:absolute;top:14px;left:14px;font-family:var(--font-mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;padding:4px 8px;background:var(--ink);color:var(--bone);z-index:2}
        .nc-public-landing .still-tag.r{background:var(--red)}
        .nc-public-landing .still-tag.y{background:var(--yellow);color:var(--ink)}
        .nc-public-landing .still-name{position:absolute;bottom:14px;left:14px;right:14px;font-family:var(--font-display);font-size:18px;line-height:1;letter-spacing:-.02em;text-transform:uppercase;color:var(--bone);z-index:2}
        .nc-public-landing .still-name .it{font-family:var(--font-serif);font-style:italic;font-weight:500;text-transform:lowercase;color:var(--yellow)}
        .nc-public-landing .s1{background:linear-gradient(160deg,#e8331c 0%,#6a0a0a 100%)}
        .nc-public-landing .s2{background:linear-gradient(135deg,#1f2a78 0%,#0a0a0a 100%)}
        .nc-public-landing .s3{background:linear-gradient(120deg,#f4d92e 0%,#6a4a0a 100%)}
        .nc-public-landing .s4{background:linear-gradient(180deg,#0a0a0a 0%,#2a2a4a 50%,#e8331c 100%)}
        .nc-public-landing .s5{background:linear-gradient(45deg,#6a3a1a 0%,#e8331c 100%)}
        .nc-public-landing .s6{background:linear-gradient(160deg,#1a2a3a 0%,#0a0a0a 70%,#f4d92e 100%)}

        .nc-public-landing .shout{background:var(--yellow);padding:90px 36px;border-bottom:4px solid var(--ink);text-align:center;position:relative}
        .nc-public-landing .shout-pre{font-family:var(--font-mono);font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:var(--ink);margin-bottom:36px}
        .nc-public-landing .shout-pre b{color:var(--red);font-weight:500}
        .nc-public-landing .shout-text{font-family:var(--font-display);font-size:clamp(42px,7.6vw,130px);line-height:.86;letter-spacing:-.04em;text-transform:uppercase;color:var(--ink);margin:0}
        .nc-public-landing .shout-text .it{font-family:var(--font-serif);font-style:italic;font-weight:500;text-transform:lowercase;color:var(--red)}
        .nc-public-landing .shout-text .stk{-webkit-text-stroke:1.5px var(--ink);color:transparent}
        .nc-public-landing .shout-foot{margin-top:36px;font-family:var(--font-mono);font-size:11px;letter-spacing:.22em;text-transform:uppercase}
        .nc-public-landing .shout-foot b{color:var(--red);font-weight:500}

        .nc-public-landing .final{background:var(--red);color:var(--bone);padding:80px 36px 60px;border-bottom:4px solid var(--ink);position:relative;overflow:hidden}
        .nc-public-landing .final::before{content:"●";position:absolute;top:48px;right:60px;font-size:80px;color:var(--yellow);animation:ncSpinSlow 10s linear infinite;transform-origin:center}
        @keyframes ncSpinSlow{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        .nc-public-landing .final-pre{font-family:var(--font-mono);font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:var(--bone-2);margin-bottom:30px}
        .nc-public-landing .final-h{font-family:var(--font-display);font-size:clamp(48px,10vw,180px);line-height:.82;letter-spacing:-.05em;text-transform:uppercase;max-width:1200px;margin:0}
        .nc-public-landing .final-h .it{font-family:var(--font-serif);font-style:italic;font-weight:500;text-transform:lowercase;color:var(--yellow);letter-spacing:-.03em}
        .nc-public-landing .final-h .stk{-webkit-text-stroke:2px var(--bone);color:transparent}
        .nc-public-landing .final-row{margin-top:48px;display:grid;grid-template-columns:1fr auto;gap:48px;align-items:center;border-top:1px solid var(--bone);padding-top:32px}
        .nc-public-landing .final-p{font-family:var(--font-serif);font-size:18px;line-height:1.5;max-width:680px;margin:0}
        .nc-public-landing .final-p b{background:var(--bone);color:var(--ink);padding:0 6px;font-weight:500}
        .nc-public-landing .final-cta{display:inline-flex;align-items:center;gap:14px;padding:22px 28px;background:var(--ink);color:var(--bone);font-family:var(--font-display);font-size:20px;letter-spacing:.04em;text-transform:uppercase;transition:background .18s;white-space:nowrap}
        .nc-public-landing .final-cta:hover{background:var(--yellow);color:var(--ink)}
        .nc-public-landing .landing-error{margin:16px 28px 0;padding:12px 14px;border:2px solid var(--red);font-family:var(--font-mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;background:var(--bone);color:var(--red)}

        .nc-public-landing .colophon{padding:28px 28px 20px;background:var(--bone);display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;align-items:center;font-family:var(--font-mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-soft)}
        .nc-public-landing .colophon .mid{text-align:center}
        .nc-public-landing .colophon .right{text-align:right}
        .nc-public-landing .colophon b{color:var(--red);font-weight:500}

        @media (max-width:1100px){
          .nc-public-landing .poster{grid-template-columns:1fr 1fr}
          .nc-public-landing .p-headline{grid-column:1/3;grid-row:1/2;min-height:auto}
          .nc-public-landing .p-vis{grid-column:1/2;grid-row:2/3}
          .nc-public-landing .p-info{grid-column:2/3;grid-row:2/3}
          .nc-public-landing .p-stats{grid-column:1/3;grid-row:3/4;grid-template-columns:repeat(2,1fr)}
          .nc-public-landing .manifesto{grid-template-columns:1fr}
          .nc-public-landing .manifesto-text{border-right:none;border-bottom:1px solid var(--ink)}
          .nc-public-landing .gallery{grid-template-columns:repeat(3,1fr)}
          .nc-public-landing .prog-row{grid-template-columns:auto 1fr;gap:18px}
          .nc-public-landing .prog-desc,.nc-public-landing .prog-tag,.nc-public-landing .prog-arrow{display:none}
          .nc-public-landing .fest-title{grid-template-columns:1fr}
          .nc-public-landing .fest-title-meta{text-align:left}
        }
        @media (max-width:640px){
          .nc-public-landing .fest-top{grid-template-columns:1fr;gap:12px;font-size:10px;padding:14px 18px}
          .nc-public-landing .fest-top .left,.nc-public-landing .fest-top .right{justify-content:flex-start;flex-wrap:wrap;gap:12px}
          .nc-public-landing .fest-title,.nc-public-landing .fest-sub{padding-left:18px;padding-right:18px}
          .nc-public-landing .p-headline,.nc-public-landing .p-vis,.nc-public-landing .p-info,.nc-public-landing .p-stats,.nc-public-landing .section-bar,.nc-public-landing .prog-row,.nc-public-landing .manifesto-text,.nc-public-landing .manifesto-aside,.nc-public-landing .shout,.nc-public-landing .final,.nc-public-landing .colophon{padding-left:18px;padding-right:18px}
          .nc-public-landing .gallery{grid-template-columns:repeat(2,1fr)}
          .nc-public-landing .colophon{grid-template-columns:1fr;text-align:left}
          .nc-public-landing .colophon .mid,.nc-public-landing .colophon .right{text-align:left}
          .nc-public-landing .final-row{grid-template-columns:1fr;gap:24px}
          .nc-public-landing .p-stats{grid-template-columns:1fr}
          .nc-public-landing .p-stat{border-right:none;border-bottom:1px solid var(--rule-soft);padding-bottom:18px}
          .nc-public-landing .section-bar{grid-template-columns:1fr;align-items:start}
          .nc-public-landing .aside-row{grid-template-columns:auto 1fr;gap:12px}
          .nc-public-landing .aside-row .meta{grid-column:2/3}
        }
      `}</style>

      <div className="page">
        <header className="fest-header">
          <div className="fest-top">
            <div className="left">
              <span className="fest-num">N</span>
              <span><b>NeuroCine</b> · Studio · Edition <b>04</b></span>
              <span>Festival Build · 2026</span>
            </div>
            <div></div>
            <div className="right">
              <button className="auth-pill" type="button" onClick={openStudio} disabled={busy || loading}>
                <span className="auth-dot" /> {loading ? "Checking..." : authLabel}
              </button>
              <span>Vol. <b>II</b> / 2026</span>
              <span>$ 0.14 / video</span>
            </div>
          </div>

          {error && <div className="landing-error">{error}</div>}

          <div className="fest-title">
            <h1>NEURO<span className="red">CINE</span><br /><span className="it">festival</span> ↘</h1>
            <div className="fest-title-meta">
              <span>An AI Pipeline</span>
              <span>for Short <b>Cinema</b></span>
              <span>Veo 3 / Grok Imagine</span>
              <span><b>Strict</b> Validator · 7 checks</span>
            </div>
          </div>

          <div className="fest-sub">
            <h2>Гибридная студия, где <b>каждая модель</b> играет своё амплуа — и ни один <em>слабый</em> сценарий не уезжает в раскадровку.</h2>
            <button className="fest-sub-cta" type="button" onClick={openStudio} disabled={busy || loading}>{openLabel} <span>→</span></button>
          </div>
        </header>

        <section className="poster">
          <div className="p-headline">
            <div>
              <div className="p-pre">Film № 001 · Director's Cut</div>
              <h2>КИНО,<br /><span className="it">которое</span><br /><span className="out">пишет</span><br />СЕБЯ.</h2>
            </div>
            <div className="p-headline-foot"><span><b>04</b> Acts</span><span><b>06</b> Frames</span><span><b>1:24</b> Demo</span></div>
          </div>

          <button className="p-vis" type="button" onClick={scrollToProgramme}>
            <div className="p-vis-content"><div className="p-vis-kicker">Validator · Score</div><h3>script<br /><span className="it">passed</span></h3></div>
            <div className="p-vis-num">94<span className="small">/100</span></div>
          </button>

          <button className="p-info" type="button" onClick={openStudio} disabled={busy || loading}>
            <div><div className="p-info-pre">Quick Start</div><h3>open<br /><span className="it">studio</span></h3><div className="p-info-body">/storyboard — твой режиссёрский пульт. Autosave, SSE, hotkey ⌘ + ↵ на запуск.</div></div>
            <div className="p-info-foot"><span>v 2.4</span><span>→ run</span></div>
          </button>

          <div className="p-stats">
            <div className="p-stat"><div className="p-stat-k">avg cost</div><div className="p-stat-v">$0<span className="red">.14</span></div></div>
            <div className="p-stat"><div className="p-stat-k">checks</div><div className="p-stat-v">7<span className="sm">/7</span></div></div>
            <div className="p-stat"><div className="p-stat-k">retries · max</div><div className="p-stat-v"><span className="red">2</span><span className="sm">×</span></div></div>
            <div className="p-stat"><div className="p-stat-k">prompt size</div><div className="p-stat-v">2K<span className="sm">tok</span></div></div>
          </div>
        </section>

        <section className="section" id="programme">
          <div className="section-bar"><span className="section-tag">Programme</span><h3>The <span className="it">four</span> acts</h3><span className="section-bar-meta">Section · I / IV</span></div>
          <div className="programme">
            {[
              ["01", "Hook", "script", "Тема → 4-актная структура. Валидатор проверяет hook, ритм, обращение к зрителю, climax и outro.", "GPT-5.4", "r"],
              ["02", "Storyboard", "stream", "SSE-стриминг кадров. Long-form через chunks по 90с. Render не рвёт соединение — поток держится живым.", "SSE · 16k", ""],
              ["03", "Auto", "chain", "DNA героя между кадрами: лицо, одежда, состояние, стиль мира и continuity между PART-сетками.", "v2 · strict", "y"],
              ["04", "Video", "prompt", "Target-aware: Veo 3 получает flowing prompt + audio, Grok — компактный короткий motion prompt.", "Veo 3 / Grok", "r"],
            ].map(([num, name, it, desc, tag, tone]) => (
              <button className="prog-row" key={num} type="button" onClick={openStudio}>
                <div className="prog-time">{num}</div>
                <div><div className="prog-name">{name} <span className="it">{it}</span></div></div>
                <div className="prog-desc">{desc}</div>
                <span className={`prog-tag ${tone}`}>{tag}</span>
                <span className="prog-arrow">→</span>
              </button>
            ))}
          </div>
        </section>

        <section className="manifesto">
          <div className="manifesto-text">
            <div className="manifesto-num">02<span className="it">.</span></div>
            <h2 className="manifesto-h">Гибридная <span className="it">машина</span>,<br />а не одна <span className="it">модель</span>.</h2>
            <div className="manifesto-body">
              <p>Главное возражение против AI-видео всегда одно: оно <em>не помнит</em>, что снимало секунду назад. Лицо плывёт. Костюм исчезает. Между кадрами — провал.</p>
              <p>NeuroCine собран против этого. <b>GPT-5.4</b> пишет сценарий, <b>Haiku 4.5</b> переводит кадры в промт, <b>Sonnet 4.6</b> читает картинку. Над всем — <b>strict validator</b> с семью проверками.</p>
              <p>Это и есть гибрид: <em>скорость</em> AI плюс <em>дисциплина</em> режиссёрского пульта.</p>
            </div>
            <div className="manifesto-stamp"><span className="dot"></span><span>Approved · Director · 2026</span></div>
          </div>
          <div className="manifesto-aside">
            <div>
              <div className="aside-pre">cast · the models</div>
              <h3 className="aside-h">Four <span className="it">actors.</span><br />One <span className="it">stage.</span></h3>
              <div className="aside-list">
                <div className="aside-row"><span className="id">A</span><span className="lb">GPT <span className="it">5.4</span></span><span className="meta">script · 92%</span></div>
                <div className="aside-row"><span className="id">B</span><span className="lb">Haiku <span className="it">4.5</span></span><span className="meta">prompt · 78%</span></div>
                <div className="aside-row"><span className="id">C</span><span className="lb">Sonnet <span className="it">4.6</span></span><span className="meta">vision · 64%</span></div>
                <div className="aside-row"><span className="id">D</span><span className="lb">Suno <span className="it">+ TTS</span></span><span className="meta">media · 48%</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="gallery">
          {[
            ["s1", "r", "HOOK", "act"], ["s2", "", "BUILD", "scene"], ["s3", "y", "RISE", "cut"],
            ["s4", "r", "CLIMAX", "beat"], ["s5", "", "FALL", "echo"], ["s6", "y", "OUTRO", "final"],
          ].map(([cls, tag, name, it], idx) => (
            <button className={`still ${cls}`} key={cls} type="button" onClick={openStudio}>
              <span className={`still-tag ${tag}`}>{String(idx + 1).padStart(2, "0")}</span>
              <span className="still-name">{name} <span className="it">{it}</span></span>
            </button>
          ))}
        </section>

        <section className="shout">
          <div className="shout-pre">Manifesto · <b>001</b></div>
          <p className="shout-text">AI НЕ ДОЛЖЕН<br /><span className="it">галлюцинировать.</span><br />ОН ДОЛЖЕН <span className="stk">РЕЖИССИРОВАТЬ</span>.</p>
          <div className="shout-foot">— NeuroCine · <b>Director's Note</b></div>
        </section>

        <section className="final">
          <div className="final-pre">Showtime · <b>00:00:14:08</b></div>
          <h2 className="final-h">ОДИН КАДР.<br /><span className="it">один</span> ПРОГОН.<br /><span className="stk">ОДИН</span> <span className="it">фильм.</span></h2>
          <div className="final-row">
            <p className="final-p">От темы до готовой раскадровки с промтами под <b>Veo 3</b> или <b>Grok Imagine</b> — за минуты. Никаких сложных интерфейсов. Только пайплайн, который понимает кино.</p>
            <button className="final-cta" type="button" onClick={openStudio} disabled={busy || loading}>{openLabel} <span>→</span></button>
          </div>
        </section>

        <footer className="colophon"><span>© 2026 · <b>NeuroCine</b> · v2.4</span><span className="mid">Set in <b>Archivo Black</b> · Newsreader · Mono</span><span className="right">Next.js · React · <b>OpenRouter</b></span></footer>
      </div>
    </main>
  );
}
