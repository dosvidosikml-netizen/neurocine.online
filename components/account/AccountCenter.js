"use client";

import { useState } from "react";
import AuthPanel from "../AuthPanel";
import BillingPanel from "../BillingPanel";
import AccountProfile from "./AccountProfile";

function AccountCenterStyles() {
  return (
    <style jsx global>{`
      .nc-account-page {
        min-height: 100vh;
        padding: 22px;
        background:
          radial-gradient(circle at 10% 0%, rgba(168, 85, 247, .16), transparent 34%),
          radial-gradient(circle at 90% 12%, rgba(255, 138, 76, .12), transparent 30%),
          #07080f;
      }
      .nc-account-shell { max-width: 1220px; margin: 0 auto; display: grid; gap: 18px; }
      .nc-account-hero {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 18px;
        border: 1px solid rgba(255,255,255,.12);
        background: rgba(255,255,255,.045);
        border-radius: 30px;
        padding: 24px;
        box-shadow: 0 20px 80px rgba(0,0,0,.32);
      }
      .nc-account-hero p {
        margin: 0 0 9px;
        color: #f0abfc;
        font-size: 11px;
        font-weight: 950;
        letter-spacing: .24em;
        text-transform: uppercase;
      }
      .nc-account-hero h1 {
        margin: 0 0 10px;
        font-size: clamp(28px, 5vw, 52px);
        line-height: .96;
        letter-spacing: -.06em;
      }
      .nc-account-hero span { color: rgba(238,240,248,.68); font-size: 14px; }
      .nc-account-nav { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
      .nc-account-nav a {
        border: 1px solid rgba(255,255,255,.14);
        background: rgba(255,255,255,.08);
        color: #eef0f8;
        text-decoration: none;
        border-radius: 14px;
        padding: 11px 15px;
        font-weight: 850;
        font-size: 13px;
      }
      .nc-account-note {
        border: 1px solid rgba(255,255,255,.10);
        background: rgba(0,0,0,.24);
        border-radius: 22px;
        padding: 15px 18px;
        color: rgba(238,240,248,.66);
        font-size: 13px;
      }
      @media (max-width: 820px) {
        .nc-account-page { padding: 12px; }
        .nc-account-hero { flex-direction: column; border-radius: 24px; }
        .nc-account-nav { justify-content: flex-start; }
      }
    `}</style>
  );
}

export default function AccountCenter() {
  const [account, setAccount] = useState(null);
  const [devMode, setDevMode] = useState(true);
  const isSignedIn = Boolean(account?.session?.user);

  return (
    <main className="nc-account-page">
      <AccountCenterStyles />
      <div className="nc-account-shell">
        <header className="nc-account-hero">
          <div>
            <p>ЦЕНТР АККАУНТА</p>
            <h1>Профиль, тариф и AI‑ключи</h1>
            <span>Служебные панели вынесены из Студии раскадровки. Storyboard больше не должен быть кабинетом аккаунта.</span>
          </div>
          <nav className="nc-account-nav">
            <a href="/storyboard">Студия раскадровки</a>
            <a href="/projects">Библиотека проектов</a>
            <a href="/director/control-room">Консоль режиссёра</a>
          </nav>
        </header>

        <AuthPanel devMode={devMode} onModeToggle={() => setDevMode(v => !v)} onAccountChange={setAccount} />
        {!isSignedIn && <div className="nc-account-note">Войди через Google, чтобы увидеть профиль, тариф и настройки доступа.</div>}
        {isSignedIn && <AccountProfile account={account} />}
        {isSignedIn && <BillingPanel account={account} />}
      </div>
    </main>
  );
}
