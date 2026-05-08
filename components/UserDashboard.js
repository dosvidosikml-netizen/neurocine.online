"use client";

import { getAccountAccess } from "../lib/accountRoles";

function fmtDate(value) {
  if (!value) return "—";
  try { return new Date(value).toLocaleDateString("ru-RU"); } catch { return "—"; }
}

export default function UserDashboard({ account, devMode }) {
  const session = account?.session || null;
  const profile = account?.profile || null;
  const user = session?.user || null;
  const access = getAccountAccess(profile, session);
  const email = profile?.email || user?.email || "guest";
  const name = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || email;
  const avatar = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || "";

  return (
    <section className="user-dashboard-v43" id="account">
      <div className="ud-head-v43">
        <div>
          <div className="ud-kicker-v43">User Control Center · v50 {access.isOwner ? "· OWNER" : access.isAdmin ? "· ADMIN" : ""}</div>
          <h2>Профиль и доступ</h2>
          <p>Роли, тарифы, лимиты, режим генерации и будущий PRO/BYO/API доступ в одном месте.</p>
        </div>
        <div className={`ud-access-badge-v43 role-${access.role}`}>
          <span>{access.isOwner ? "OWNER FULL ACCESS" : access.isAdmin ? "ADMIN FULL ACCESS" : access.canLive ? "LIVE READY" : "DEMO SANDBOX"}</span>
          <strong>{access.label}</strong>
        </div>
      </div>

      <div className="ud-grid-v43">
        <div className="ud-card-v43 user">
          <div className="ud-user-row-v43">
            {avatar ? <img src={avatar} alt="" /> : <div className="ud-avatar-v43">{String(name || "U").slice(0, 1).toUpperCase()}</div>}
            <div>
              <strong>{user ? name : "Гость"}</strong>
              <span>{user ? email : "Войдите через Google"}</span>
            </div>
          </div>
          <div className="ud-mini-v43">
            <span>Создан</span><b>{fmtDate(profile?.created_at)}</b>
          </div>
          <div className="ud-mini-v43">
            <span>ID</span><b>{user?.id ? `${user.id.slice(0, 8)}…` : "—"}</b>
          </div>
        </div>

        <div className="ud-card-v43">
          <div className="ud-label-v43">Тариф</div>
          <strong className="ud-big-v43">{access.label}</strong>
          <p>{access.isOwner ? "Владелец: полный LIVE-доступ через API платформы, без BYO ключей и без лимитов." : access.isAdmin ? "ADMIN: LIVE открыт через API платформы." : "DEMO/FREE: только безопасный mock-режим без списания API."}</p>
        </div>

        <div className="ud-card-v43">
          <div className="ud-label-v43">Доступ генерации</div>
          <strong className={access.canLive ? "ud-ok-v43" : "ud-lock-v43"}>{access.canLive ? "LIVE открыт" : "DEMO только"}</strong>
          <p>{access.canLive ? "Можно запускать реальные API генерации." : "LIVE скрыт и заблокирован. Реальные API не вызываются до PRO, ADMIN или BYO API."}</p>
        </div>

        <div className="ud-card-v43">
          <div className="ud-label-v43">Лимиты</div>
          <div className="ud-limit-v43"><span>Генерации / мес</span><b>{access.monthlyGenerations}</b></div>
          <div className="ud-limit-v43"><span>Cloud Projects</span><b>{access.storageProjects}</b></div>
        </div>

        <div className="ud-card-v43 wide">
          <div className="ud-label-v43">Схема доступа</div>
          {access.canLive ? (
            <>
              <div className="ud-role-row-v43"><span>Текущий режим</span><b>{devMode ? "DEMO без API" : "LIVE через API платформы"}</b></div>
              <div className="ud-role-row-v43"><span>API</span><b>{access.isOwner || access.isAdmin ? "platform keys" : "PRO/BYO"}</b></div>
              <div className="ud-role-row-v43"><span>Лимиты</span><b>{access.isOwner || access.isAdmin ? "безлимит" : "по тарифу"}</b></div>
            </>
          ) : (
            <>
              <div className="ud-role-row-v43"><span>DEMO</span><b>mock script / storyboard / prompts без API</b></div>
              <div className="ud-role-row-v43"><span>LIVE</span><b>заблокирован до PRO / ADMIN / BYO API</b></div>
              <div className="ud-role-row-v43"><span>Cloud</span><b>{access.storageProjects} проекта</b></div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
