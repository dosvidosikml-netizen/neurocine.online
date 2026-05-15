"use client";

import { useEffect, useRef } from "react";

export default function ProfileSettingsModal({
  open,
  onClose,
  account,
  access,
  theme = "dark",
  onToggleTheme,
  onNavigate,
  onSignOut,
}) {
  const panelRef = useRef(null);

  const email = account?.profile?.email || account?.session?.user?.email || "";
  const userMeta = account?.session?.user?.user_metadata || {};
  const isSignedIn = Boolean(account?.session?.user);
  const displayName =
    account?.profile?.display_name ||
    account?.profile?.full_name ||
    userMeta.full_name ||
    userMeta.name ||
    (email ? email.split("@")[0] : "Гость");
  const avatarUrl = account?.profile?.avatar_url || userMeta.avatar_url || userMeta.picture || "";
  const roleLabel = access?.isOwner || access?.isAdmin
    ? "РЕЖИССЁР LIVE"
    : access?.role === "pro"
      ? "PRO"
      : isSignedIn
        ? "FREE"
        : "ГОСТЬ";

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKey(event) {
      if (event.key === "Escape") onClose?.();
    }

    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  function nav(target) {
    onClose?.();
    onNavigate?.(target);
  }

  function signOut() {
    onClose?.();
    onSignOut?.();
  }

  return (
    <div className="nc-profile-window-v1" role="presentation">
      <ProfileSettingsModalStyles />
      <button className="nc-profile-window-backdrop-v1" type="button" aria-label="Закрыть профиль" onClick={onClose} />

      <section className="nc-profile-window-panel-v1" role="dialog" aria-modal="true" aria-label="Профиль NeuroCine" ref={panelRef}>
        <div className="nc-profile-window-glow-v1" aria-hidden />
        <button className="nc-profile-window-close-v1" type="button" onClick={onClose} aria-label="Закрыть">×</button>

        <header className="nc-profile-window-head-v1">
          <div className="nc-profile-window-kicker-v1">ПРОФИЛЬ NEUROCINE</div>
          <div className="nc-profile-window-user-v1">
            {avatarUrl ? <img src={avatarUrl} alt="" /> : <div className="nc-profile-window-avatar-v1">{String(displayName || "U").slice(0, 1).toUpperCase()}</div>}
            <div>
              <h2>{displayName}</h2>
              <p>{email || "Вход не выполнен"}</p>
            </div>
          </div>
          <div className="nc-profile-window-role-v1">
            <span>Доступ</span>
            <strong>{roleLabel}</strong>
          </div>
        </header>

        <div className="nc-profile-window-grid-v1">
          <button type="button" className="nc-profile-window-action-v1" onClick={onToggleTheme}>
            <span>☀</span>
            <div><strong>Тема интерфейса</strong><em>{theme === "dark" ? "Тёмная" : "Светлая"}</em></div>
            <b>→</b>
          </button>

          <button type="button" className="nc-profile-window-action-v1" onClick={() => nav("setup")}>
            <span>⚙</span>
            <div><strong>Настройки Studio</strong><em>язык, рабочий режим, стартовые параметры</em></div>
            <b>→</b>
          </button>

          <button type="button" className="nc-profile-window-action-v1" onClick={() => nav("pack")}>
            <span>♦</span>
            <div><strong>Биллинг и тариф</strong><em>FREE / PRO / DIRECTOR</em></div>
            <b>→</b>
          </button>

          <button type="button" className="nc-profile-window-action-v1" onClick={() => nav("pack")}>
            <span>◆</span>
            <div><strong>Партнёрская программа</strong><em>реферальные ссылки и условия</em></div>
            <b>→</b>
          </button>

          {isSignedIn ? (
            <button type="button" className="nc-profile-window-action-v1 danger nc-profile-menu-item" onClick={signOut}>
              <span>↪</span>
              <div><strong>Выйти</strong><em>закрыть текущую сессию</em></div>
              <b>→</b>
            </button>
          ) : (
            <button type="button" className="nc-profile-window-action-v1 nc-profile-menu-item" onClick={() => nav("auth")}>
              <span>↩</span>
              <div><strong>Войти</strong><em>Google OAuth через Supabase</em></div>
              <b>→</b>
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function ProfileSettingsModalStyles() {
  return (
    <style jsx global>{`
      .nc-profile-window-v1,
      .nc-profile-window-v1 * { box-sizing: border-box; }

      .nc-profile-window-v1 {
        position: fixed;
        inset: 0;
        z-index: 2147483200;
        display: grid;
        place-items: center;
        padding: 18px;
      }

      .nc-profile-window-backdrop-v1 {
        position: absolute;
        inset: 0;
        border: 0;
        background:
          radial-gradient(circle at 50% 22%, rgba(168,85,247,.24), transparent 36%),
          radial-gradient(circle at 80% 80%, rgba(250,204,21,.10), transparent 34%),
          rgba(3,5,10,.74);
        backdrop-filter: blur(16px);
        cursor: pointer;
        animation: nc-profile-window-fade-v1 .18s ease both;
      }

      .nc-profile-window-panel-v1 {
        position: relative;
        width: min(460px, calc(100vw - 26px));
        max-height: min(700px, calc(100vh - 90px));
        overflow: auto;
        border: 1px solid rgba(255,255,255,.14);
        border-radius: 30px;
        padding: 14px;
        background:
          radial-gradient(circle at 12% 0%, rgba(168,85,247,.24), transparent 36%),
          radial-gradient(circle at 100% 12%, rgba(250,204,21,.14), transparent 34%),
          linear-gradient(145deg, rgba(15,17,29,.98), rgba(7,9,16,.96));
        box-shadow: 0 34px 120px rgba(0,0,0,.74), inset 0 1px 0 rgba(255,255,255,.07);
        color: #eef0f8;
        animation: nc-profile-window-in-v1 .22s cubic-bezier(.2,.8,.2,1) both;
      }

      .nc-profile-window-glow-v1 {
        position: absolute;
        right: -60px;
        top: -70px;
        width: 190px;
        height: 190px;
        border-radius: 999px;
        background: rgba(250,204,21,.12);
        filter: blur(28px);
        pointer-events: none;
      }

      .nc-profile-window-close-v1 {
        position: absolute;
        right: 14px;
        top: 14px;
        z-index: 2;
        width: 40px;
        height: 40px;
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 15px;
        background: rgba(255,255,255,.075);
        color: #fff;
        font-size: 27px;
        line-height: 1;
        cursor: pointer;
      }

      .nc-profile-window-head-v1 {
        position: relative;
        padding: 18px 56px 18px 18px;
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 24px;
        background: rgba(255,255,255,.055);
      }

      .nc-profile-window-kicker-v1 {
        margin-bottom: 13px;
        color: #c4b5fd;
        font-size: 10px;
        font-weight: 950;
        letter-spacing: .22em;
      }

      .nc-profile-window-user-v1 {
        display: grid;
        grid-template-columns: 56px minmax(0, 1fr);
        align-items: center;
        gap: 13px;
        min-width: 0;
      }

      .nc-profile-window-user-v1 img,
      .nc-profile-window-avatar-v1 {
        width: 56px;
        height: 56px;
        border-radius: 19px;
        object-fit: cover;
        background: linear-gradient(135deg, #ff5a8a, #7c3aed);
      }

      .nc-profile-window-avatar-v1 {
        display: grid;
        place-items: center;
        color: #fff;
        font-size: 25px;
        font-weight: 950;
      }

      .nc-profile-window-user-v1 h2 {
        margin: 0 0 4px;
        overflow: hidden;
        color: #fff;
        font-size: clamp(24px, 7vw, 34px);
        line-height: 1.02;
        letter-spacing: -.05em;
        text-overflow: ellipsis;
      }

      .nc-profile-window-user-v1 p {
        margin: 0;
        overflow-wrap: anywhere;
        color: rgba(238,240,248,.62);
        font-size: 13px;
      }

      .nc-profile-window-role-v1 {
        margin-top: 14px;
        width: fit-content;
        border: 1px solid rgba(250,204,21,.26);
        border-radius: 999px;
        padding: 9px 12px;
        background: rgba(250,204,21,.08);
      }

      .nc-profile-window-role-v1 span {
        margin-right: 8px;
        color: rgba(238,240,248,.50);
        font-size: 10px;
        font-weight: 950;
        letter-spacing: .15em;
        text-transform: uppercase;
      }

      .nc-profile-window-role-v1 strong {
        color: #facc15;
        font-size: 12px;
        font-weight: 950;
      }

      .nc-profile-window-grid-v1 {
        display: grid;
        gap: 9px;
        margin-top: 12px;
      }

      .nc-profile-window-action-v1 {
        width: 100%;
        min-height: 58px;
        display: grid;
        grid-template-columns: 42px minmax(0, 1fr) auto;
        align-items: center;
        gap: 11px;
        border: 1px solid rgba(255,255,255,.09);
        border-radius: 18px;
        padding: 10px 12px;
        background: rgba(255,255,255,.045);
        color: #eef0f8;
        text-align: left;
        cursor: pointer;
        transition: transform .16s ease, border-color .16s ease, background .16s ease;
      }

      .nc-profile-window-action-v1:hover {
        transform: translateY(-1px);
        border-color: rgba(250,204,21,.24);
        background: rgba(255,255,255,.075);
      }

      .nc-profile-window-action-v1 > span {
        width: 42px;
        height: 42px;
        display: grid;
        place-items: center;
        border-radius: 15px;
        background: rgba(255,255,255,.07);
        color: #facc15;
        font-size: 18px;
      }

      .nc-profile-window-action-v1 strong {
        display: block;
        margin-bottom: 3px;
        color: #fff;
        font-size: 15px;
        font-weight: 900;
      }

      .nc-profile-window-action-v1 em {
        display: block;
        overflow: hidden;
        color: rgba(238,240,248,.52);
        font-size: 12px;
        font-style: normal;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .nc-profile-window-action-v1 b {
        color: rgba(238,240,248,.42);
      }

      .nc-profile-window-action-v1.danger {
        border-color: rgba(248,113,113,.22);
        background: rgba(248,113,113,.075);
      }

      .nc-profile-window-action-v1.danger > span {
        color: #fca5a5;
      }

      @media (max-width: 520px) {
        .nc-profile-window-v1 { padding: 11px; }
        .nc-profile-window-panel-v1 {
          width: min(392px, calc(100vw - 18px));
          max-height: calc(100vh - 102px);
          border-radius: 25px;
          padding: 12px;
        }
        .nc-profile-window-head-v1 {
          padding: 15px 50px 15px 15px;
          border-radius: 21px;
        }
        .nc-profile-window-user-v1 {
          grid-template-columns: 48px minmax(0, 1fr);
          gap: 11px;
        }
        .nc-profile-window-user-v1 img,
        .nc-profile-window-avatar-v1 {
          width: 48px;
          height: 48px;
          border-radius: 17px;
        }
        .nc-profile-window-action-v1 {
          min-height: 54px;
          grid-template-columns: 38px minmax(0, 1fr) auto;
          border-radius: 16px;
        }
        .nc-profile-window-action-v1 > span {
          width: 38px;
          height: 38px;
          border-radius: 14px;
        }
      }

      @keyframes nc-profile-window-in-v1 {
        from { opacity: 0; transform: translateY(18px) scale(.96); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      @keyframes nc-profile-window-fade-v1 {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `}</style>
  );
}
