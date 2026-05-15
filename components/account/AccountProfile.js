"use client";

import { useMemo } from "react";
import { getAccountAccess } from "../../lib/accountRoles";

function fmtDate(value) {
  if (!value) return "—";
  try { return new Date(value).toLocaleDateString("ru-RU"); } catch { return "—"; }
}

function metaFromAccount(account) {
  const session = account?.session || null;
  const user = session?.user || null;
  const profile = account?.profile || null;
  const meta = user?.user_metadata || {};
  const email = profile?.email || user?.email || meta.email || "guest";
  const name = profile?.full_name || meta.full_name || meta.name || email;
  const avatar = profile?.avatar_url || meta.avatar_url || meta.picture || "";
  return { session, user, profile, email, name, avatar };
}

function publicPlan(access) {
  if (access?.isOwner || access?.isAdmin) return "DIRECTOR";
  if (access?.role === "pro") return "PRO";
  return "FREE";
}

function AccountProfileStyles() {
  return (
    <style jsx global>{`
      .account-profile-v1 {
        border: 1px solid rgba(255,255,255,.12);
        background: rgba(255,255,255,.045);
        border-radius: 28px;
        padding: 20px;
        box-shadow: 0 20px 80px rgba(0,0,0,.28);
      }
      .account-profile-head-v1 {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 18px;
        margin-bottom: 16px;
      }
      .account-profile-kicker-v1 {
        margin-bottom: 8px;
        color: #f0abfc;
        font-size: 11px;
        font-weight: 950;
        letter-spacing: .24em;
        text-transform: uppercase;
      }
      .account-profile-head-v1 h2 {
        margin: 0 0 8px;
        font-size: clamp(24px, 4vw, 42px);
        line-height: 1;
        letter-spacing: -.05em;
      }
      .account-profile-head-v1 p,
      .account-profile-card-v1 p,
      .account-profile-card-v1 span,
      .account-profile-card-v1 em {
        color: rgba(238,240,248,.68);
        font-size: 13px;
      }
      .account-profile-badge-v1 {
        min-width: 150px;
        border: 1px solid rgba(250,204,21,.34);
        border-radius: 20px;
        padding: 12px 14px;
        background: linear-gradient(135deg, rgba(250,204,21,.12), rgba(168,85,247,.16));
        text-align: right;
        box-shadow: 0 0 30px rgba(250,204,21,.10);
      }
      .account-profile-badge-v1 span {
        display: block;
        margin-bottom: 4px;
        font-size: 10px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: .18em;
        color: rgba(255,247,214,.75);
      }
      .account-profile-badge-v1 strong {
        color: #fff7d6;
        font-size: 24px;
        text-shadow: 0 0 18px rgba(250,204,21,.35);
      }
      .account-profile-grid-v1 {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
      }
      .account-profile-card-v1 {
        border: 1px solid rgba(255,255,255,.10);
        background: rgba(0,0,0,.22);
        border-radius: 20px;
        padding: 15px;
        min-width: 0;
      }
      .account-profile-card-v1.wide { grid-column: span 2; }
      .account-profile-user-v1 {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .account-profile-user-v1 img,
      .account-profile-avatar-v1 {
        width: 46px;
        height: 46px;
        border-radius: 16px;
        object-fit: cover;
        flex: none;
      }
      .account-profile-avatar-v1 {
        display: grid;
        place-items: center;
        background: linear-gradient(135deg, #a855f7, #e53535);
        color: #fff;
        font-weight: 950;
      }
      .account-profile-user-v1 strong {
        display: block;
        margin-bottom: 3px;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .account-profile-label-v1 {
        margin-bottom: 8px;
        font-size: 10px;
        font-weight: 950;
        letter-spacing: .18em;
        text-transform: uppercase;
        color: rgba(238,240,248,.48);
      }
      .account-profile-big-v1 {
        display: block;
        margin-bottom: 6px;
        font-size: 24px;
        letter-spacing: -.04em;
      }
      .account-profile-row-v1 {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        padding: 8px 0;
        border-bottom: 1px solid rgba(255,255,255,.06);
      }
      .account-profile-row-v1:last-child { border-bottom: 0; }
      .account-profile-row-v1 b { text-align: right; }
      @media (max-width: 920px) {
        .account-profile-head-v1 { flex-direction: column; }
        .account-profile-badge-v1 { text-align: left; }
        .account-profile-grid-v1 { grid-template-columns: 1fr; }
        .account-profile-card-v1.wide { grid-column: span 1; }
      }
    `}</style>
  );
}

export default function AccountProfile({ account }) {
  const { session, user, profile, email, name, avatar } = metaFromAccount(account);
  const access = useMemo(() => getAccountAccess(profile, session), [profile, session]);
  const director = Boolean(access.isOwner || access.isAdmin);
  const pro = access.role === "pro" && !director;
  const liveReady = Boolean(access.canLive);

  return (
    <section className="account-profile-v1">
      <AccountProfileStyles />
      <div className="account-profile-head-v1">
        <div>
          <div className="account-profile-kicker-v1">Центр аккаунта · {publicPlan(access)}</div>
          <h2>Профиль и доступ</h2>
          <p>Этот кабинет живёт отдельно от Студии раскадровки. Storyboard больше не хранит профиль, тарифы и служебные панели.</p>
        </div>
        <div className="account-profile-badge-v1">
          <span>Текущий доступ</span>
          <strong>{publicPlan(access)}</strong>
        </div>
      </div>

      <div className="account-profile-grid-v1">
        <article className="account-profile-card-v1 wide">
          <div className="account-profile-user-v1">
            {avatar ? <img src={avatar} alt="" /> : <div className="account-profile-avatar-v1">{String(name || "U").slice(0,1).toUpperCase()}</div>}
            <div>
              <strong>{user ? name : "Гость"}</strong>
              <span>{user ? email : "Войдите через Google"}</span>
            </div>
          </div>
        </article>

        <article className="account-profile-card-v1">
          <div className="account-profile-label-v1">Тариф</div>
          <strong className="account-profile-big-v1">{publicPlan(access)}</strong>
          <p>{director ? "Служебный доступ владельца платформы." : pro ? "PRO — полный рабочий режим NeuroCine." : "FREE — базовый предпросмотр NeuroCine."}</p>
        </article>

        <article className="account-profile-card-v1">
          <div className="account-profile-label-v1">Генерация</div>
          <strong className="account-profile-big-v1">{liveReady ? "LIVE" : "PREVIEW"}</strong>
          <p>{director ? "LIVE через platform API." : pro ? "LIVE зависит от собственного AI‑ключа." : "LIVE доступен в PRO."}</p>
        </article>

        <article className="account-profile-card-v1 wide">
          <div className="account-profile-label-v1">Лимиты</div>
          <div className="account-profile-row-v1"><span>Генерации / мес</span><b>{director ? "∞" : Number(profile?.monthly_generation_limit ?? access.monthlyGenerations ?? 0)}</b></div>
          <div className="account-profile-row-v1"><span>Cloud Projects</span><b>{director ? "∞" : Number(profile?.cloud_project_limit ?? access.storageProjects ?? 0)}</b></div>
          <div className="account-profile-row-v1"><span>API source</span><b>{access.apiSource || "none"}</b></div>
          <div className="account-profile-row-v1"><span>Профиль создан</span><b>{fmtDate(profile?.created_at)}</b></div>
        </article>

        <article className="account-profile-card-v1 wide">
          <div className="account-profile-label-v1">Схема доступа</div>
          <div className="account-profile-row-v1"><span>FREE</span><b>preview + базовый workflow</b></div>
          <div className="account-profile-row-v1"><span>PRO</span><b>полный pipeline + свои AI‑ключи</b></div>
          <div className="account-profile-row-v1"><span>DIRECTOR</span><b>platform API + консоль управления</b></div>
        </article>
      </div>
    </section>
  );
}
