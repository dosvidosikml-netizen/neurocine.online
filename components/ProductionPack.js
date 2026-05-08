// components/ProductionPack.js
// NeuroCine Production Pack v3.3 — RU/EN Studio UX + premium compact workflow
// Использует родные классы сайта: .step-section, .step-header, .step-body,
// .out-box, .out-head, .out-body, .out-pre, .field, .frow, .btn, .fb, .frame-card
// Никакого inline-CSS — только токены globals.css.
//
// Использование в page.js:
//   import ProductionPack from "@/components/ProductionPack";
//   <ProductionPack topic={topic} script={script} genre={projectType} storyboard={storyboard} />

"use client";
import { useEffect, useMemo, useState } from "react";
import { buildMockTtsPack, buildMockCoverPack, buildMockMusicPack, buildMockSeoPack, buildMockSocialPack } from "../lib/mockData";

// ─────── COMMON HELPERS ───────────────────────────────────────────
function safeJsonParse(raw, fallback) {
  try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}

function hashString(input = "") {
  let h = 2166136261;
  const str = String(input || "");
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function useStoredState(key, initialValue) {
  const [value, setValue] = useState(initialValue);
  useEffect(() => {
    if (!key) return;
    try { setValue(safeJsonParse(localStorage.getItem(key), initialValue)); } catch {}
  }, [key]);
  useEffect(() => {
    if (!key) return;
    try { localStorage.setItem(key, JSON.stringify(value)); window.dispatchEvent(new CustomEvent("neurocine-production-cache-change", { detail: { key } })); } catch {}
  }, [key, value]);
  return [value, setValue];
}

function useStoredString(key, initialValue) {
  const [value, setValue] = useState(initialValue);
  useEffect(() => {
    if (!key) return;
    try {
      const saved = localStorage.getItem(key);
      if (saved != null) setValue(saved);
    } catch {}
  }, [key]);
  useEffect(() => {
    if (!key) return;
    try { localStorage.setItem(key, String(value ?? "")); window.dispatchEvent(new CustomEvent("neurocine-production-cache-change", { detail: { key } })); } catch {}
  }, [key, value]);
  return [value, setValue];
}

function PackToolbar({ onClear }) {
  return (
    <div className="brow" style={{ marginTop: 10 }}>
      <button className="btn btn-xs btn-ghost" onClick={onClear}>Очистить сохранённый результат</button>
      <span className="out-label">Результат сохраняется в браузере и попадает в Cloud snapshot проекта</span>
    </div>
  );
}

function CopyBtn({ text, label = "Копировать", small = false }) {
  const [ok, setOk] = useState(false);
  const cls = `btn ${small ? "btn-xs" : "btn-sm"} ${ok ? "" : "btn-ghost"}`;
  return (
    <button
      className={cls}
      onClick={(e) => {
        e.stopPropagation();
        try { navigator.clipboard?.writeText(text || ""); } catch {}
        setOk(true);
        setTimeout(() => setOk(false), 1500);
      }}
      style={ok ? { color: "var(--green)", borderColor: "var(--green)" } : undefined}
    >
      {ok ? "✓ Скопировано" : label}
    </button>
  );
}

function OutBox({ label, children, copy, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`out-box out-box-v31 ${open ? "is-open" : "is-compact"}`}>
      <div className="out-head">
        <span className="out-label">{label}</span>
        <div className="out-actions">
          <button className="btn btn-xs btn-ghost" onClick={() => setOpen(v => !v)}>
            {open ? "Свернуть" : "Открыть"}
          </button>
          {copy != null && <CopyBtn text={copy} small />}
        </div>
      </div>
      <div className="out-body">{children}</div>
    </div>
  );
}

function StatusLine({ type, text }) {
  return <div className={`status-line${type ? " " + type : ""}`}>{text}</div>;
}

function apiHeaders(accessToken = "") {
  return {
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}


// ─────── SOCIAL VISUAL EXPORT HELPERS ─────────────────────────────
function safeFileName(input = "neurocine") {
  return String(input || "neurocine")
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70) || "neurocine";
}

function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function wrapCanvasText(ctx, text, maxWidth) {
  const words = String(text || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawSocialCard({ item, index, total, type = "carousel", topic = "NeuroCine" }) {
  const isStory = type === "story";
  const W = 1080;
  const H = isStory ? 1920 : 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const bg = item?.bg || (isStory ? "#090b14" : "#100011");
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, bg);
  grad.addColorStop(0.55, "#08080d");
  grad.addColorStop(1, "#170006");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // cinematic texture grid
  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = "#ffffff";
  for (let y = 0; y < H; y += 54) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  for (let x = 0; x < W; x += 54) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const pad = 78;
  roundRectPath(ctx, pad, pad, W - pad * 2, H - pad * 2, 54);
  ctx.fillStyle = "rgba(0,0,0,0.34)";
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.48)";
  ctx.font = "900 34px Arial, sans-serif";
  ctx.fillText(`${index + 1}/${total}`, W / 2, isStory ? 190 : 160);

  ctx.font = isStory ? "140px Arial, sans-serif" : "112px Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(item?.emoji || "🎬", W / 2, isStory ? 430 : 340);

  const headline = String(item?.headline || "").toUpperCase();
  ctx.font = isStory ? "900 86px Arial, sans-serif" : "900 72px Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.65)";
  ctx.shadowBlur = 18;
  const headLines = wrapCanvasText(ctx, headline, W - pad * 3).slice(0, isStory ? 5 : 4);
  const headStart = isStory ? 620 : 470;
  const headLineH = isStory ? 100 : 84;
  headLines.forEach((line, i) => ctx.fillText(line, W / 2, headStart + i * headLineH));
  ctx.shadowBlur = 0;

  const sub = String(item?.sub || "");
  ctx.font = isStory ? "500 48px Arial, sans-serif" : "500 40px Arial, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  const subLines = wrapCanvasText(ctx, sub, W - pad * 3).slice(0, isStory ? 7 : 5);
  const subStart = headStart + headLines.length * headLineH + 70;
  const subLineH = isStory ? 64 : 54;
  subLines.forEach((line, i) => ctx.fillText(line, W / 2, subStart + i * subLineH));

  const stampY = H - (isStory ? 250 : 185);
  roundRectPath(ctx, pad + 34, stampY, W - (pad + 34) * 2, isStory ? 98 : 82, 22);
  ctx.fillStyle = "rgba(185,28,28,0.18)";
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = "rgba(248,113,113,0.88)";
  ctx.stroke();
  ctx.fillStyle = "#fca5a5";
  ctx.font = isStory ? "900 42px Arial, sans-serif" : "900 36px Arial, sans-serif";
  ctx.fillText(String(topic || "NEUROCINE").toUpperCase().slice(0, 38), W / 2, stampY + (isStory ? 63 : 54));

  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.font = "700 24px Arial, sans-serif";
  ctx.fillText("NEUROCINE · SOCIAL VISUAL EXPORT", W / 2, H - 70);

  return canvas.toDataURL("image/png");
}

function SocialExportButtons({ carousel = [], slides = [], topic = "neurocine" }) {
  const [status, setStatus] = useState("");
  const base = safeFileName(topic || "neurocine");

  function exportSet(items, type) {
    if (!items?.length) return;
    setStatus("Готовлю PNG…");
    items.forEach((item, index) => {
      setTimeout(() => {
        const url = drawSocialCard({ item, index, total: items.length, type, topic });
        downloadDataUrl(url, `${base}-${type}-${String(index + 1).padStart(2, "0")}.png`);
        if (index === items.length - 1) setStatus("✓ PNG скачаны. Загрузи их в Facebook как обычные изображения.");
      }, index * 220);
    });
  }

  return (
    <div className="out-box">
      <div className="out-head">
        <span className="out-label">Экспорт визуалов для Facebook / Stories</span>
      </div>
      <div className="out-body">
        <div className="brow" style={{ marginBottom: 10 }}>
          <button className="btn btn-sm btn-ghost" onClick={() => exportSet(carousel, "carousel")} disabled={!carousel?.length}>
            Скачать карусель PNG
          </button>
          <button className="btn btn-sm btn-ghost" onClick={() => exportSet(slides, "story")} disabled={!slides?.length}>
            Скачать Stories PNG 9:16
          </button>
        </div>
        <div className="out-pre" style={{ color: "var(--muted)", fontSize: 12 }}>
          Копировать = текст. Для красивой публикации Facebook нужны PNG-карточки. После скачивания выбери их в Facebook как изображения/карусель.
        </div>
        {status && <StatusLine text={status} />}
      </div>
    </div>
  );
}

// ─────── 🎙 TTS STUDIO TAB ────────────────────────────────────────
function TtsStudioTab({ topic, script, genre, cacheKey, devMode, liveAllowed = false, accessToken = "" }) {
  const [data, setData] = useStoredState(`${cacheKey}:tts:data`, null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [activeScript, setActiveScript] = useState("google");

  async function run() {
    if (!script?.trim() && !devMode) { setErr("Сначала создай сценарий в шаге 01"); return; }
    if (devMode) { setErr(""); setData(buildMockTtsPack({ topic, script })); return; }
    if (!liveAllowed) { setErr("LIVE-генерация доступна в PRO после подключения AI-ключа."); return; }
    setBusy(true); setErr(""); setData(null);
    try {
      const r = await fetch("/api/tts-studio", {
        method: "POST",
        headers: apiHeaders(accessToken),
        body: JSON.stringify({ topic, script, genre, generationMode: "live" })
      });
      const d = await r.json();
      if (d.error) setErr(d.error); else setData(d.ttsStudio);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  if (!data) {
    return (
      <div>
        <p className="step-desc" style={{ marginBottom: 14 }}>
          AI подберёт лучший Google AI Studio голос и перепишет скрипт в 3 формата (Google AI · ElevenLabs · Чистый).
          Промт готов для копирования в aistudio.google.com.
        </p>
        <button className="btn btn-red btn-full" onClick={run} disabled={busy || !script?.trim()}>
          {busy ? "Генерация…" : "Сгенерировать TTS настройки"}
        </button>
        {err && <StatusLine type="err" text={`✗ ${err}`} />}
        {!script?.trim() && <StatusLine text="Сначала создай сценарий в шаге 01" />}
      </div>
    );
  }

  const scripts = {
    google:     { label: "Google AI",  text: data.script_google || "" },
    elevenlabs: { label: "ElevenLabs", text: data.script_elevenlabs || "" },
    clean:      { label: "Чистый",     text: data.script_clean || "" },
  };

  return (
    <div className="col">
      <div className="frow frow2">
        <OutBox label="Scene" copy={data.scene}>
          <div className="out-pre mono">{data.scene}</div>
        </OutBox>
        <OutBox label="Context" copy={data.context}>
          <div className="out-pre">{data.context}</div>
        </OutBox>
      </div>

      <OutBox label="Голос" copy={data.voice_id}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
          <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.04em", color: "#fca5a5" }}>{data.voice_id}</span>
          {data.voice_desc && <span className="out-label">{data.voice_desc}</span>}
        </div>
        <div className="out-pre">{data.voice_reason}</div>
      </OutBox>

      {data.pacing_tips && (
        <OutBox label="Советы по темпу">
          <div className="out-pre" style={{ whiteSpace: "pre-wrap" }}>{data.pacing_tips}</div>
        </OutBox>
      )}

      <div>
        <div className="frame-btns" style={{ marginBottom: 8 }}>
          {Object.entries(scripts).map(([k, v]) => (
            <button
              key={k}
              className={`fb ${activeScript === k ? "active" : ""}`}
              onClick={() => setActiveScript(k)}
            >
              {v.label}
            </button>
          ))}
        </div>
        <OutBox label={`Скрипт · ${scripts[activeScript].label}`} copy={scripts[activeScript].text}>
          <div className="out-pre mono compact">{scripts[activeScript].text}</div>
        </OutBox>
      </div>

      <div className="brow" style={{ marginTop: 4 }}>
        <button className="btn btn-sm btn-ghost" onClick={run}>Обновить</button>
        <a className="btn btn-sm btn-ghost" href="https://aistudio.google.com/" target="_blank" rel="noreferrer">
          Открыть Google AI Studio →
        </a>
      </div>
      <PackToolbar onClear={() => setData(null)} />
    </div>
  );
}

// ─────── 🖼 COVER DIRECTOR TAB ───────────────────────────────────
function CoverTab({ topic, script, storyboard, cacheKey, devMode, liveAllowed = false, accessToken = "" }) {
  const [data, setData] = useStoredState(`${cacheKey}:cover:data`, null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [mode, setMode] = useStoredString(`${cacheKey}:cover:mode`, "viral");
  const [style, setStyle] = useStoredString(`${cacheKey}:cover:style`, "viral");
  const [activeVariant, setActiveVariant] = useStoredString(`${cacheKey}:cover:variant`, "poster");

  async function run() {
    if (devMode) { setErr(""); setData(buildMockCoverPack({ topic, script, storyboard })); return; }
    if (!liveAllowed) { setErr("LIVE-генерация доступна в PRO после подключения AI-ключа."); return; }
    setBusy(true); setErr(""); setData(null);
    try {
      const r = await fetch("/api/cover", {
        method: "POST",
        headers: apiHeaders(accessToken),
        body: JSON.stringify({ topic, script, storyboard, mode, style, platform: "shorts", generationMode: devMode ? "demo" : "live" })
      });
      const d = await r.json();
      if (d.error) setErr(d.error); else setData(d.cover || d);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  const sourceReady = Boolean(topic?.trim() || script?.trim() || storyboard?.scenes?.length);

  if (!data) {
    return (
      <div className="col">
        <p className="step-desc" style={{ marginBottom: 14 }}>
          Cover Director V2 анализирует сценарий и собирает не просто картинку, а готовое вирусное превью: главный заголовок,
          факты сбоку, нижний крючок, текстовые зоны и 9:16 prompt для Flow / Nano Banana / Midjourney.
        </p>

        <div className="frow frow2">
          <div className="field">
            <label>CTR режим</label>
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="safe">SAFE · документально</option>
              <option value="viral">VIRAL · сильный крючок</option>
              <option value="extreme">EXTREME CTR · максимально цепко</option>
            </select>
          </div>
          <div className="field">
            <label>Стиль превью</label>
            <select value={style} onChange={(e) => setStyle(e.target.value)}>
              <option value="viral">Viral Documentary</option>
              <option value="netflix">Netflix Documentary</option>
              <option value="conspiracy">Conspiracy / Classified</option>
              <option value="truecrime">True Crime Evidence</option>
              <option value="mrbeast">MrBeast Energy</option>
            </select>
          </div>
        </div>

        <button className="btn btn-red btn-full" onClick={run} disabled={busy || !sourceReady}>
          {busy ? "Режиссура превью…" : "Сгенерировать вирусную обложку V2"}
        </button>
        {err && <StatusLine type="err" text={`✗ ${err}`} />}
        {!sourceReady && <StatusLine text="Нужна тема, сценарий или storyboard" />}
      </div>
    );
  }

  const variant = data.variants?.find(v => v.id === activeVariant) || data.variants?.[0];
  const layoutText = [
    `TOP: ${data.main_title}`,
    `SIDE: ${(data.side_facts || []).join(" / ")}`,
    `BOTTOM: ${data.bottom_hook}`,
  ].join("\n");

  return (
    <div className="col">
      <StatusLine text={`Cover Director: ${data.theme} · ${data.mode} · ${data.style} · ${data.format}`} />

      <div className="frow frow2">
        <OutBox label="Текстовая иерархия" copy={layoutText}>
          <div className="frame-card-row">
            <div className="frame-card-lbl">TOP TITLE</div>
            <div className="frame-card-val" style={{ fontWeight: 900, color: "#fca5a5", whiteSpace: "pre-wrap" }}>{data.main_title}</div>
          </div>
          <div className="frame-card-row">
            <div className="frame-card-lbl">SIDE FACTS</div>
            <div className="frame-card-val">{data.side_facts?.join(" · ")}</div>
          </div>
          <div className="frame-card-row">
            <div className="frame-card-lbl">BOTTOM HOOK</div>
            <div className="frame-card-val" style={{ fontWeight: 900 }}>{data.bottom_hook}</div>
          </div>
        </OutBox>

        <OutBox label="Психология клика" copy={(data.psychology || []).join("\n")}>
          <div className="out-pre compact">{(data.psychology || []).map(x => `• ${x}`).join("\n")}</div>
          <div className="out-pre compact" style={{ marginTop: 8, color: "var(--muted)" }}>{data.angle}</div>
        </OutBox>
      </div>

      <div className="frame-btns" style={{ marginBottom: 8 }}>
        {(data.variants || []).map(v => (
          <button key={v.id} className={`fb ${activeVariant === v.id ? "active" : ""}`} onClick={() => setActiveVariant(v.id)}>
            {v.title}
          </button>
        ))}
      </div>

      {variant && (
        <OutBox label={`IMAGE PROMPT · ${variant.title}`} copy={variant.prompt_EN}>
          <div className="out-pre mono compact">{variant.prompt_EN}</div>
        </OutBox>
      )}

      {data.negative_prompt_EN && (
        <OutBox label="NEGATIVE PROMPT" copy={data.negative_prompt_EN}>
          <div className="out-pre mono compact">{data.negative_prompt_EN}</div>
        </OutBox>
      )}

      <div className="brow">
        <button className="btn btn-sm btn-ghost" onClick={run}>Обновить с этими настройками</button>
        <a className="btn btn-sm btn-ghost" href="https://www.midjourney.com/imagine" target="_blank" rel="noreferrer">
          Midjourney →
        </a>
      </div>
      <PackToolbar onClear={() => setData(null)} />
    </div>
  );
}

// ─────── 🎵 MUSIC + 🚀 SEO TAB ────────────────────────────────────
function MusicSeoTab({ topic, script, genre, storyboard, cacheKey, devMode, liveAllowed = false, accessToken = "" }) {
  const [music, setMusic] = useStoredState(`${cacheKey}:music:data`, null);
  const [seo, setSeo] = useStoredState(`${cacheKey}:seo:data`, null);
  const [musicMode, setMusicMode] = useStoredString(`${cacheKey}:music:mode`, "cinematic_thriller");
  const [seoPlatform, setSeoPlatform] = useStoredString(`${cacheKey}:seo:platform`, "youtube_shorts");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function run() {
    if (devMode) { setErr(""); setMusic(buildMockMusicPack({ topic, script, genre, storyboard })); setSeo(buildMockSeoPack({ topic, script, genre })); return; }
    if (!liveAllowed) { setErr("LIVE-генерация доступна в PRO после подключения AI-ключа."); return; }
    setBusy(true); setErr(""); setMusic(null); setSeo(null);
    try {
      const [m, s] = await Promise.all([
        fetch("/api/music-suno", {
          method: "POST",
          headers: apiHeaders(accessToken),
          body: JSON.stringify({ topic, script, genre, storyboard, musicMode, generationMode: "live" })
        }).then(r => r.json()),
        fetch("/api/seo-pack", {
          method: "POST",
          headers: apiHeaders(accessToken),
          body: JSON.stringify({ topic, script, genre, platform: seoPlatform, generationMode: "live" })
        }).then(r => r.json()),
      ]);
      if (m.error || s.error) setErr(m.error || s.error);
      setMusic(m.music || null);
      setSeo(s.seo_variants || null);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  if (!music && !seo) {
    return (
      <div>
        <p className="step-desc" style={{ marginBottom: 14 }}>
          Music + SEO V2 собирает не сырой текст, а production-ready пакет: Suno prompt, negative, длительность, цель трека и SEO под платформы.
        </p>
        <div className="frow frow2">
          <div className="field">
            <label>Музыкальный режим</label>
            <select value={musicMode} onChange={(e) => setMusicMode(e.target.value)}>
              <option value="cinematic_thriller">Cinematic Thriller</option>
              <option value="dark_documentary">Dark Documentary</option>
              <option value="alien_mystery">Alien Mystery</option>
              <option value="historical_horror">Historical Horror</option>
              <option value="epic_disaster">Epic Disaster</option>
            </select>
          </div>
          <div className="field">
            <label>SEO платформа</label>
            <select value={seoPlatform} onChange={(e) => setSeoPlatform(e.target.value)}>
              <option value="youtube_shorts">YouTube Shorts</option>
              <option value="tiktok">TikTok</option>
              <option value="instagram_reels">Instagram Reels</option>
              <option value="facebook_reels">Facebook Reels</option>
            </select>
          </div>
        </div>
        <button className="btn btn-red btn-full" onClick={run} disabled={busy || (!topic && !script)}>
          {busy ? "Генерация…" : "Сгенерировать музыку и SEO"}
        </button>
        {err && <StatusLine type="err" text={`✗ ${err}`} />}
      </div>
    );
  }

  return (
    <div className="col">
      {music && (
        <OutBox label={`Музыка · Suno AI · ${music.duration_hint || "auto"}`} copy={[music.music_EN, music.negative_EN ? `Negative: ${music.negative_EN}` : "", music.usage_ru || ""].filter(Boolean).join("\n\n")}>
          <div className="out-pre mono" style={{ marginBottom: 8 }}>{music.music_EN}</div>
          {music.negative_EN && (
            <div className="out-pre" style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>
              <b>Negative:</b> {music.negative_EN}
            </div>
          )}
          {music.usage_ru && <div className="out-pre" style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}><b>Как использовать:</b> {music.usage_ru}</div>}
          {music.notes_ru && <div className="out-pre" style={{ fontSize: 12, color: "var(--muted)" }}>{music.notes_ru}</div>}
        </OutBox>
      )}

      {seo && Array.isArray(seo) && seo.length > 0 && (
        <>
          <div className="out-label">SEO матрица — 3 варианта</div>
          {seo.map((v, i) => {
            const fullText = `${v.title}\n\n${v.desc}\n\n${v.tags?.join(" ")}`;
            return (
              <OutBox key={i} label={`Вариант ${i + 1} · ${(v.type || "").toUpperCase()}`} copy={fullText}>
                <div className="frame-card-row">
                  <div className="frame-card-lbl">Заголовок</div>
                  <div className="frame-card-val" style={{ fontWeight: 800 }}>{v.title}</div>
                </div>
                <div className="frame-card-row">
                  <div className="frame-card-lbl">Описание</div>
                  <div className="frame-card-val">{v.desc}</div>
                </div>
                <div className="frame-card-row">
                  <div className="frame-card-lbl">Хэштеги</div>
                  <div className="frame-card-val" style={{ color: "#fca5a5" }}>{v.tags?.join(" ")}</div>
                </div>
              </OutBox>
            );
          })}
        </>
      )}

      <div className="brow">
        <button className="btn btn-sm btn-ghost" onClick={run}>Обновить</button>
        <a className="btn btn-sm btn-ghost" href="https://suno.com/create" target="_blank" rel="noreferrer">
          Открыть Suno →
        </a>
      </div>
      <PackToolbar onClear={() => { setMusic(null); setSeo(null); }} />
    </div>
  );
}

// ─────── 📘 SOCIAL PACK TAB ───────────────────────────────────────
function SocialPackTab({ topic, script, genre, cacheKey, devMode, liveAllowed = false, accessToken = "" }) {
  const [data, setData] = useStoredState(`${cacheKey}:social:data`, null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function run() {
    if (!script?.trim() && !devMode) { setErr("Сначала создай сценарий"); return; }
    if (devMode) { setErr(""); setData(buildMockSocialPack({ topic, script, genre })); return; }
    if (!liveAllowed) { setErr("LIVE-генерация доступна в PRO после подключения AI-ключа."); return; }
    setBusy(true); setErr(""); setData(null);
    try {
      const r = await fetch("/api/social-pack", {
        method: "POST",
        headers: apiHeaders(accessToken),
        body: JSON.stringify({ topic, script, genre, generationMode: "live" })
      });
      const d = await r.json();
      if (d.error) setErr(d.error); else setData(d.social);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  if (!data) {
    return (
      <div>
        <p className="step-desc" style={{ marginBottom: 14 }}>
          Полный пакет: Facebook пост · Reels caption · Instagram карусель (5 слайдов) · Stories тизеры (3 слайда).
        </p>
        <button className="btn btn-red btn-full" onClick={run} disabled={busy || !script?.trim()}>
          {busy ? "Генерация…" : "Сгенерировать Social Pack"}
        </button>
        {err && <StatusLine type="err" text={`✗ ${err}`} />}
      </div>
    );
  }

  const fbText = `${data.post_hook}\n\n${data.post_body}\n\n${data.post_question}\n\n${data.post_tags}`;

  return (
    <div className="col">
      <SocialExportButtons carousel={data.carousel || []} slides={data.slides || []} topic={topic || data.post_hook || "neurocine"} />
      <OutBox label="Facebook публикация" copy={fbText}>
        <div className="out-pre" style={{ fontWeight: 800, marginBottom: 8 }}>{data.post_hook}</div>
        <div className="out-pre" style={{ whiteSpace: "pre-wrap", marginBottom: 10, color: "var(--muted)" }}>{data.post_body}</div>
        <div className="out-pre" style={{ fontWeight: 800, paddingTop: 10, borderTop: "1px solid var(--border)", marginBottom: 6 }}>
          {data.post_question}
        </div>
        <div className="out-pre" style={{ fontSize: 11, color: "#fca5a5" }}>{data.post_tags}</div>
      </OutBox>

      {data.reels_caption && (
        <OutBox label="Instagram Reels caption" copy={data.reels_caption}>
          <div className="out-pre" style={{ whiteSpace: "pre-wrap" }}>{data.reels_caption}</div>
        </OutBox>
      )}

      {data.tiktok_caption && (
        <OutBox label="TikTok caption" copy={data.tiktok_caption}>
          <div className="out-pre" style={{ whiteSpace: "pre-wrap" }}>{data.tiktok_caption}</div>
        </OutBox>
      )}

      {data.youtube_pinned_comment && (
        <OutBox label="YouTube pinned comment" copy={data.youtube_pinned_comment}>
          <div className="out-pre" style={{ whiteSpace: "pre-wrap" }}>{data.youtube_pinned_comment}</div>
        </OutBox>
      )}

      {data.carousel && data.carousel.length > 0 && (
        <OutBox
          label={`Карусель · ${data.carousel.length} слайдов`}
          copy={data.carousel.map((s, i) => `СЛАЙД ${i + 1}:\n${s.emoji} ${s.headline}\n${s.sub}`).join("\n\n")}
        >
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            {data.carousel.map((s, i) => (
              <div key={i} style={{
                flexShrink: 0, width: 130, borderRadius: "var(--radius-xs)",
                overflow: "hidden", border: "1px solid var(--border)"
              }}>
                <div style={{
                  background: s.bg || "#0d0010",
                  padding: "16px 10px", minHeight: 140,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 6, textAlign: "center"
                }}>
                  <div style={{ fontSize: 9, fontWeight: 900, color: "var(--muted2)", letterSpacing: "0.18em" }}>{i + 1}/{data.carousel.length}</div>
                  <div style={{ fontSize: 20 }}>{s.emoji}</div>
                  <div style={{ fontSize: 11, fontWeight: 900, color: "var(--text)", lineHeight: 1.3 }}>{s.headline}</div>
                  <div style={{ fontSize: 9, color: "var(--muted)", lineHeight: 1.3 }}>{s.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </OutBox>
      )}

      {data.slides && data.slides.length > 0 && (
        <OutBox
          label={`Stories · ${data.slides.length} тизера`}
          copy={data.slides.map((s, i) => `STORIES ${i + 1}:\n${s.emoji} ${s.headline}\n${s.sub}`).join("\n\n")}
        >
          <div style={{ display: "flex", gap: 8 }}>
            {data.slides.map((s, i) => (
              <div key={i} style={{
                flex: 1, borderRadius: "var(--radius-xs)",
                overflow: "hidden", border: "1px solid var(--border)"
              }}>
                <div style={{
                  background: s.bg || "#0d0010",
                  padding: "14px 10px", minHeight: 100,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 6, textAlign: "center"
                }}>
                  <div style={{ fontSize: 18 }}>{s.emoji}</div>
                  <div style={{ fontSize: 11, fontWeight: 900, color: "var(--text)", lineHeight: 1.2 }}>{s.headline}</div>
                  <div style={{ fontSize: 9, color: "var(--muted)", lineHeight: 1.3 }}>{s.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </OutBox>
      )}

      <div className="brow"><button className="btn btn-sm btn-ghost" onClick={run}>Обновить</button></div>
      <PackToolbar onClear={() => setData(null)} />
    </div>
  );
}



// ─────── 🧭 VISUAL EXPLAINER STUDIO TAB ──────────────────────────
function buildVisualExplainerPack({ topic = "", script = "", mode = "auto", format = "shorts" }) {
  const source = `${topic}\n${script}`.toLowerCase();
  const isTunguska = /тунгус|сибир|метеор|вспышк|воронк|оскол|тайг/.test(source);
  const isPrison = /тюрьм|остров|заключ|побег|камера|каторг/.test(source);
  const isPlague = /чума|эпидем|зараж|болезн|город|смерт/.test(source);
  const isMedieval = /средневек|казн|ведьм|палач|король|инквиз/.test(source);

  const dna = isTunguska ? "mystery_disaster_files" : isPrison ? "prison_escape_map" : isPlague ? "plague_spread_timeline" : isMedieval ? "medieval_evidence_board" : "documentary_evidence_graphics";
  const title = isTunguska ? "Траектория вспышки над Сибирью" : isPrison ? "Карта побега и ловушка острова" : isPlague ? "Как страх накрыл город" : isMedieval ? "Схема средневекового приговора" : "Документальная схема события";
  const visualSymbol = isTunguska ? "white-hot aerial blast, radial forest collapse, no crater marker" : isPrison ? "isolated island, sea currents, prison block, escape route" : isPlague ? "infected city map, spreading fog, death timeline" : isMedieval ? "court table, execution route, crowd pressure lines" : "evidence board, timeline, arrows, classified markers";

  const overlays = [
    {
      name: "Animated Map Overlay",
      use: "карта/локация/масштаб события",
      prompt: `Create a cinematic documentary animated map overlay for: ${title}. Visual symbol: ${visualSymbol}. Dark Netflix/HBO documentary style, red evidence lines, subtle grain, clean readable labels in Russian, 9:16 vertical composition, no clutter, slow camera push-in, professional motion graphics.`
    },
    {
      name: "Evidence Board Overlay",
      use: "факты, версии, доказательства",
      prompt: `Create a dark investigative evidence board overlay for: ${title}. Use pinned photos, red strings, classified stamps, short Russian labels, one central impossible clue, high contrast, cinematic realism, clean mobile readability, 9:16.`
    },
    {
      name: "Timeline Motion Graphic",
      use: "даты/последовательность событий",
      prompt: `Create a vertical documentary timeline motion graphic for: ${title}. Show 4-5 key beats from the script, large date markers, smoky background, red highlight pulses, slow parallax, Russian labels, cinematic true mystery style.`
    },
    {
      name: "Trajectory / Cause Diagram",
      use: "траектория, причина, удар, распространение",
      prompt: `Create a clean cinematic cause-and-effect diagram for: ${title}. Show arrows, blast radius or route lines, scale markers, minimal Russian labels, dark background, amber/red glow, 9:16 vertical, documentary explainer style.`
    }
  ];

  const manimBlueprint = `# NeuroCine Visual Explainer Blueprint\nSCENE: ${title}\nDNA: ${dna}\nFORMAT: ${format === "shorts" ? "1080x1920 vertical" : "1920x1080 horizontal"}\n\nLAYERS:\n1. dark textured background with subtle film grain\n2. main map/evidence object appears with slow fade\n3. red trajectory/evidence lines animate from left to right\n4. 3-5 Russian labels pop in one by one\n5. final warning stamp / question appears\n\nCAMERA:\nslow push-in, slight parallax, no chaotic movement\n\nSFX:\nlow drone, soft impact hits on label reveals, distant wind, paper/evidence flickers`;

  const shotList = [
    "0.0–1.5s · dark background, map/evidence object fades in",
    "1.5–3.0s · red line/trajectory starts moving",
    "3.0–5.0s · 2-3 labels appear with soft impact hits",
    "5.0–7.0s · main clue is highlighted",
    "7.0–8.0s · final question/warning stamp appears"
  ];

  return { dna, title, visualSymbol, overlays, manimBlueprint, shotList };
}

function VisualExplainerTab({ topic, script, cacheKey }) {
  const [data, setData] = useStoredState(`${cacheKey}:explainer:data`, null);
  const [mode, setMode] = useStoredString(`${cacheKey}:explainer:mode`, "auto");
  const [format, setFormat] = useStoredString(`${cacheKey}:explainer:format`, "shorts");
  const [active, setActive] = useStoredString(`${cacheKey}:explainer:active`, "Animated Map Overlay");

  function run() {
    setData(buildVisualExplainerPack({ topic, script, mode, format }));
  }

  if (!data) {
    return (
      <div className="col">
        <p className="step-desc" style={{ marginBottom: 14 }}>
          Visual Explainer Studio создаёт промты и blueprint для документальных графических вставок: карты, таймлайны, evidence board, траектории и схемы. Это безопасный первый слой перед будущим Python/Manim render-worker.
        </p>
        <div className="frow frow2">
          <div className="field">
            <label>Тип графики</label>
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="auto">AUTO · по сценарию</option>
              <option value="map">Animated Map</option>
              <option value="timeline">Timeline</option>
              <option value="evidence">Evidence Board</option>
              <option value="trajectory">Trajectory Diagram</option>
            </select>
          </div>
          <div className="field">
            <label>Формат</label>
            <select value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="shorts">9:16 Shorts / Reels</option>
              <option value="wide">16:9 YouTube</option>
            </select>
          </div>
        </div>
        <button className="btn btn-red btn-full" onClick={run} disabled={!topic && !script}>
          Сгенерировать Visual Explainer Pack
        </button>
        {!topic && !script && <StatusLine text="Нужна тема или сценарий" />}
      </div>
    );
  }

  const current = data.overlays?.find(x => x.name === active) || data.overlays?.[0];
  const allText = [
    `TITLE: ${data.title}`,
    `DNA: ${data.dna}`,
    `VISUAL SYMBOL: ${data.visualSymbol}`,
    "",
    ...(data.overlays || []).map(x => `${x.name}:\n${x.prompt}`),
    "",
    data.manimBlueprint,
    "",
    `SHOT LIST:\n${(data.shotList || []).join("\n")}`
  ].join("\n");

  return (
    <div className="col">
      <StatusLine text={`Visual Explainer: ${data.title} · ${data.dna}`} />

      <OutBox label="Explainer DNA" copy={`TITLE: ${data.title}\nDNA: ${data.dna}\nVISUAL SYMBOL: ${data.visualSymbol}`}>
        <div className="frame-card-row"><div className="frame-card-lbl">TITLE</div><div className="frame-card-val" style={{ fontWeight: 900 }}>{data.title}</div></div>
        <div className="frame-card-row"><div className="frame-card-lbl">DNA</div><div className="frame-card-val">{data.dna}</div></div>
        <div className="frame-card-row"><div className="frame-card-lbl">SYMBOL</div><div className="frame-card-val">{data.visualSymbol}</div></div>
      </OutBox>

      <div className="frame-btns" style={{ marginBottom: 8 }}>
        {(data.overlays || []).map(x => (
          <button key={x.name} className={`fb ${active === x.name ? "active" : ""}`} onClick={() => setActive(x.name)}>
            {x.name}
          </button>
        ))}
      </div>

      {current && (
        <OutBox label={`PROMPT · ${current.name}`} copy={current.prompt}>
          <div className="out-pre mono compact">{current.prompt}</div>
          <div className="out-pre" style={{ marginTop: 8, color: "var(--muted)" }}>Использование: {current.use}</div>
        </OutBox>
      )}

      <OutBox label="Manim / Render Blueprint" copy={data.manimBlueprint}>
        <div className="out-pre mono compact">{data.manimBlueprint}</div>
      </OutBox>

      <OutBox label="Shot List · 8 секунд" copy={(data.shotList || []).join("\n")}>
        <div className="out-pre compact">{(data.shotList || []).join("\n")}</div>
      </OutBox>

      <div className="brow">
        <CopyBtn text={allText} label="Копировать весь pack" />
        <button className="btn btn-sm btn-ghost" onClick={run}>Обновить</button>
      </div>
      <PackToolbar onClear={() => setData(null)} />
    </div>
  );
}

// ─────── MAIN COMPONENT ───────────────────────────────────────────
const PACK_I18N = {
  ru: {
    title: "Production Pack",
    desc: "TTS · Cover Director · Музыка · SEO · Social Visual Export · Visual Explainer — результаты сохраняются после обновления браузера",
    version: "v3.4",
    tabs: {
      tts: ["TTS Studio", "озвучка", "VOICE"],
      cover: ["Cover Director", "CTR превью", "CTR READY"],
      music: ["Музыка + SEO", "публикация", "SEO READY"],
      social: ["Social Pack", "PNG export", "PNG EXPORT"],
      explainer: ["Visual Explainer", "карты/схемы", "OVERLAYS"],
    }
  },
  en: {
    title: "Production Pack",
    desc: "TTS · Cover Director · Music · SEO · Social Visual Export · Visual Explainer — DEMO/PRO Own Keys mode, results persist after refresh",
    version: "v3.4",
    tabs: {
      tts: ["TTS Studio", "voiceover", "VOICE"],
      cover: ["Cover Director", "CTR thumbnail", "CTR READY"],
      music: ["Music + SEO", "publishing", "SEO READY"],
      social: ["Social Pack", "PNG export", "PNG EXPORT"],
      explainer: ["Visual Explainer", "maps/diagrams", "OVERLAYS"],
    }
  }
};

export default function ProductionPack({ topic = "", script = "", genre = "ИСТОРИЯ", storyboard = null, lang = "ru", devMode = false, liveAllowed = false, userId = "guest", accessToken = "", onCacheChange = null }) {
  const sourceKey = useMemo(() => hashString(`${topic}|${script?.slice(0, 1200)}|${storyboard?.scenes?.length || 0}`), [topic, script, storyboard]);
  const ownerKey = String(userId || "guest").replace(/[^a-zA-Z0-9_-]/g, "_");
  const cacheKey = `neurocine:production:v49:${ownerKey}:${devMode ? "demo" : "pro"}:${sourceKey}`;
  const [activeTab, setActiveTab] = useStoredString(`neurocine:production:v49:${ownerKey}:activeTab`, "cover");

  useEffect(() => {
    if (!onCacheChange) return;
    const handler = (event) => {
      const key = String(event?.detail?.key || "");
      if (!key || key.startsWith(cacheKey) || key.includes(`${ownerKey}:activeTab`)) onCacheChange();
    };
    window.addEventListener("neurocine-production-cache-change", handler);
    return () => window.removeEventListener("neurocine-production-cache-change", handler);
  }, [cacheKey, ownerKey, onCacheChange]);

  const t = PACK_I18N[lang] || PACK_I18N.ru;

  const tabs = [
    { id: "tts", icon: "🎙️", label: t.tabs.tts[0], sub: t.tabs.tts[1], status: t.tabs.tts[2], comp: <TtsStudioTab topic={topic} script={script} genre={genre} cacheKey={cacheKey} devMode={devMode} liveAllowed={liveAllowed} accessToken={accessToken} /> },
    { id: "cover", icon: "🧲", label: t.tabs.cover[0], sub: t.tabs.cover[1], status: t.tabs.cover[2], comp: <CoverTab topic={topic} script={script} storyboard={storyboard} cacheKey={cacheKey} devMode={devMode} liveAllowed={liveAllowed} accessToken={accessToken} /> },
    { id: "music", icon: "🎧", label: t.tabs.music[0], sub: t.tabs.music[1], status: t.tabs.music[2], comp: <MusicSeoTab topic={topic} script={script} genre={genre} storyboard={storyboard} cacheKey={cacheKey} devMode={devMode} liveAllowed={liveAllowed} accessToken={accessToken} /> },
    { id: "social", icon: "📲", label: t.tabs.social[0], sub: t.tabs.social[1], status: t.tabs.social[2], comp: <SocialPackTab topic={topic} script={script} genre={genre} cacheKey={cacheKey} devMode={devMode} liveAllowed={liveAllowed} accessToken={accessToken} /> },
    { id: "explainer", icon: "🗺️", label: t.tabs.explainer[0], sub: t.tabs.explainer[1], status: t.tabs.explainer[2], comp: <VisualExplainerTab topic={topic} script={script} cacheKey={cacheKey} /> },
  ];

  return (
    <section className="step-section studio-step-card production-pack-v30">
      <div className="step-header">
        <div className="step-num">04</div>
        <div className="step-info">
          <div className="step-title">{t.title}</div>
          <div className="step-desc">{t.desc}</div>
        </div>
        <span className="step-badge">{devMode ? "DEMO PREVIEW" : t.version}</span>
      </div>
      <div className="step-body">
        <div className="pack-v31-grid" role="tablist" aria-label="Production Pack modules">
          {tabs.map(t => {
            const isActive = activeTab === t.id;
            const status = t.status;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`pack-v31-card ${isActive ? "active" : ""}`}
                onClick={() => setActiveTab(t.id)}
              >
                <span className="pack-v31-topline"><span className="pack-v31-icon">{t.icon}</span><span>{status}</span></span>
                <strong>{t.label}</strong>
                <em>{t.sub}</em>
              </button>
            );
          })}
        </div>
        <div className="pack-v31-content">
          {tabs.find(t => t.id === activeTab)?.comp}
        </div>
      </div>
    </section>
  );
}
