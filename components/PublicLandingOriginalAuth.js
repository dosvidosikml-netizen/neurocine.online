"use client";

import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

function formatFestivalDate() {
  const d = new Date();
  const weekday = new Intl.DateTimeFormat("en", { weekday: "short" }).format(d).toUpperCase();
  const day = String(d.getDate()).padStart(2, "0");
  const month = new Intl.DateTimeFormat("en", { month: "short" }).format(d).toUpperCase();
  const year = d.getFullYear();
  return `${weekday} · ${day} · ${month} · ${year}`;
}

function redirectToStoryboard() {
  if (typeof window !== "undefined") window.location.assign("/storyboard");
}

function getRedirectTo() {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}/storyboard`;
}

export default function PublicLandingOriginalAuth() {
  const [session, setSession] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [today, setToday] = useState("MON · 11 · MAY · 2026");
  const user = session?.user || null;

  useEffect(() => {
    setToday(formatFestivalDate());
  }, []);

  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured || !supabase) return () => { mounted = false; };

    supabase.auth.getSession()
      .then(({ data, error: sessionError }) => {
        if (!mounted) return;
        if (sessionError) setError(sessionError.message);
        setSession(data?.session || null);
      })
      .catch((e) => {
        if (mounted) setError(e?.message || "Не удалось проверить сессию");
      });

    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession || null);
      setBusy(false);
      if (nextSession?.user && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
        redirectToStoryboard();
      }
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  async function openStudio() {
    setError("");

    if (user) {
      redirectToStoryboard();
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setError("Supabase ENV не настроены. Открываю Studio в preview-режиме.");
      redirectToStoryboard();
      return;
    }

    setBusy(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getRedirectTo(),
          skipBrowserRedirect: true,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });

      if (signInError) {
        setError(`Google login error: ${signInError.message}`);
        setBusy(false);
        return;
      }

      if (data?.url) {
        window.location.assign(data.url);
        return;
      }

      setError("Google не вернул ссылку входа. Проверь Supabase Redirect URLs.");
      setBusy(false);
    } catch (e) {
      setError(e?.message || "Google login failed");
      setBusy(false);
    }
  }

  const ctaLabel = busy ? "Opening Google..." : "Open Studio";

  return (
    <main className="nc-public-landing nc-public-landing-original">
      <div className="page">
        <header className="fest-header">
          <div className="fest-top">
            <div className="left">
              <span className="fest-num">N</span>
              <span><b>NeuroCine</b> · Studio · Edition <b>04</b></span>
              <span>{today}</span>
            </div>
            <div></div>
            <div className="right">
              <span>● REC · LIVE</span>
              <span>Vol. <b>II</b> / {new Date().getFullYear()}</span>
              <span>$ 0.14 / video</span>
            </div>
          </div>

          {error && <div className="landing-error">{error}</div>}

          <div className="fest-title">
            <h1>
              NEURO<span className="red">CINE</span><br />
              <span className="it">festival</span> ↘
            </h1>
            <div className="fest-title-meta">
              <span>An AI Pipeline</span>
              <span>for Short <b>Cinema</b></span>
              <span>Veo 3 / Grok Imagine</span>
              <span><b>Strict</b> Validator · 7 checks</span>
            </div>
          </div>

          <div className="fest-sub">
            <h2>
              Гибридная студия, где <b>каждая модель</b> играет своё амплуа —
              и ни один <em>слабый</em> сценарий не уезжает в раскадровку.
            </h2>
            <button className="fest-sub-cta" type="button" onClick={openStudio} disabled={busy}>
              {ctaLabel} <span>→</span>
            </button>
          </div>
        </header>

        <section className="poster">
          <div className="p-headline">
            <div>
              <div className="p-pre">Film № 001 · Director's Cut</div>
              <h2>
                КИНО,<br />
                <span className="it">которое</span><br />
                <span className="out">пишет</span><br />
                СЕБЯ.
              </h2>
            </div>
            <div className="p-headline-foot">
              <span><b>04</b> Acts</span>
              <span><b>06</b> Frames</span>
              <span><b>1:24</b> Demo</span>
            </div>
          </div>

          <button className="p-vis" type="button" onClick={openStudio} disabled={busy}>
            <div className="p-vis-content">
              <div className="p-vis-kicker">Validator · Score</div>
              <h3>script<br /><span className="it">passed</span></h3>
            </div>
            <div className="p-vis-num">94<span className="small">/100</span></div>
          </button>

          <button className="p-info" type="button" onClick={openStudio} disabled={busy}>
            <div>
              <div className="p-info-pre">Quick Start</div>
              <h3>open<br /><span className="it">studio</span></h3>
              <div className="p-info-body">
                /storyboard — твой режиссёрский пульт.
                Autosave, SSE, hotkey ⌘ + ↵ на запуск.
              </div>
            </div>
            <div className="p-info-foot">
              <span>v 2.4</span>
              <span>→ run</span>
            </div>
          </button>

          <div className="p-stats">
            <div className="p-stat">
              <div className="p-stat-k">avg cost</div>
              <div className="p-stat-v">$0<span className="red">.14</span></div>
            </div>
            <div className="p-stat">
              <div className="p-stat-k">checks</div>
              <div className="p-stat-v">7<span className="sm">/7</span></div>
            </div>
            <div className="p-stat">
              <div className="p-stat-k">retries · max</div>
              <div className="p-stat-v"><span className="red">2</span><span className="sm">×</span></div>
            </div>
            <div className="p-stat">
              <div className="p-stat-k">prompt size</div>
              <div className="p-stat-v">2K<span className="sm">tok</span></div>
            </div>
          </div>
        </section>

        <section className="section" id="programme">
          <div className="section-bar">
            <span className="section-tag">Programme</span>
            <h3>The <span className="it">four</span> acts</h3>
            <span className="section-bar-meta">Section · I / IV</span>
          </div>

          <div className="programme">
            {[
              ["01", "Hook", "script", "Тема → 4-актная структура. Валидатор проверяет hook, ритм, \"ты\"-обращения, climax, outro. Score 0–100 · до 2 ретраев.", "GPT-5.4", "r"],
              ["02", "Storyboard", "stream", "SSE-стриминг кадров. Long-form через chunks по 90с. Render не рвёт коннект — поток держится живым.", "SSE · 16k", ""],
              ["03", "Auto", "chain", "DNA героя между кадрами: лицо, одежда, состояние. charFaceLock + модификаторы.", "v2 · strict", "y"],
              ["04", "Video", "prompt", "Target-aware. Veo 3 — flowing prompt + audio. Grok Imagine — компактный короткий motion prompt.", "Veo 3 / Grok", "r"],
            ].map(([num, name, it, desc, tag, tone]) => (
              <button className="prog-row" type="button" onClick={openStudio} key={num}>
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
            <h2 className="manifesto-h">
              Гибридная <span className="it">машина</span>,<br />
              а не одна <span className="it">модель</span>.
            </h2>
            <div className="manifesto-body">
              <p>
                Главное возражение против AI-видео всегда одно: оно <em>не помнит</em>,
                что снимало секунду назад. Лицо плывёт. Костюм исчезает. Между кадрами —
                провал.
              </p>
              <p>
                NeuroCine собран ровно против этого. <b>GPT-5.4</b> пишет сценарий,
                <b>Haiku 4.5</b> переводит кадры в промт, <b>Sonnet 4.6</b> читает картинку.
                Над всем — <b>strict validator</b> с семью проверками.
              </p>
              <p>
                Это и есть гибрид: <em>скорость</em> AI плюс <em>дисциплина</em>
                режиссёрского пульта.
              </p>
            </div>
            <div className="manifesto-stamp">
              <span className="dot"></span>
              <span>Approved · Director · {today}</span>
            </div>
          </div>

          <div className="manifesto-aside">
            <div>
              <div className="aside-pre">cast · the models</div>
              <h3 className="aside-h">
                Four <span className="it">actors.</span><br />
                One <span className="it">stage.</span>
              </h3>

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
            ["s1", "r", "HOOK", "act"],
            ["s2", "", "BUILD", "scene"],
            ["s3", "y", "RISE", "cut"],
            ["s4", "r", "CLIMAX", "beat"],
            ["s5", "", "FALL", "echo"],
            ["s6", "y", "OUTRO", "final"],
          ].map(([cls, tag, name, it], idx) => (
            <button className={`still ${cls}`} type="button" onClick={openStudio} key={cls}>
              <span className={`still-tag ${tag}`}>{String(idx + 1).padStart(2, "0")}</span>
              <span className="still-name">{name} <span className="it">{it}</span></span>
            </button>
          ))}
        </section>

        <section className="shout">
          <div className="shout-pre">Manifesto · <b>001</b></div>
          <p className="shout-text">
            AI НЕ ДОЛЖЕН<br />
            <span className="it">галлюцинировать.</span><br />
            ОН ДОЛЖЕН <span className="stk">РЕЖИССИРОВАТЬ</span>.
          </p>
          <div className="shout-foot">— NeuroCine · <b>Director's Note</b></div>
        </section>

        <section className="final">
          <div className="final-pre">Showtime · <b>00:00:14:08</b></div>
          <h2 className="final-h">
            ОДИН КАДР.<br />
            <span className="it">один</span> ПРОГОН.<br />
            <span className="stk">ОДИН</span> <span className="it">фильм.</span>
          </h2>
          <div className="final-row">
            <p className="final-p">
              От темы до готовой раскадровки с промтами под <b>Veo 3</b> или
              <b>Grok Imagine</b> — за минуты. Никаких сложных интерфейсов.
              Только пайплайн, который понимает кино.
            </p>
            <button className="final-cta" type="button" onClick={openStudio} disabled={busy}>
              {ctaLabel}
              <span>→</span>
            </button>
          </div>
        </section>

        <footer className="colophon">
          <span>© {new Date().getFullYear()} · <b>NeuroCine</b> · v2.4</span>
          <span className="mid">Set in <b>Archivo Black</b> · Newsreader · Mono</span>
          <span className="right">Next.js · React · <b>OpenRouter</b></span>
        </footer>
      </div>
    </main>
  );
}
