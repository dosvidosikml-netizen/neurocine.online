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
          <div className="ud-kicker-v43">User Control Center · v43</div>
          <h2>Профиль и доступ</h2>
          <p>Роли, тарифы, лимиты, режим генерации и будущий PRO/BYO/API доступ в одном месте.</p>
        </div>
        <div className={`ud-access-badge-v43 role-${access.role}`}>
          <span>{devMode ? "DEMO MODE" : access.canLive ? "LIVE READY" : "LIVE LOCK"}</span>
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
          <p>{access.description}</p>
        </div>

        <div className="ud-card-v43">
          <div className="ud-label-v43">LIVE доступ</div>
          <strong className={access.canLive ? "ud-ok-v43" : "ud-lock-v43"}>{access.canLive ? "Разрешён" : "Заблокирован"}</strong>
          <p>{access.canLive ? "Можно запускать реальные API генерации." : "FREE/DEMO работает без списаний API. LIVE откроется через PRO, ADMIN или BYO API."}</p>
        </div>

        <div className="ud-card-v43">
          <div className="ud-label-v43">Лимиты</div>
          <div className="ud-limit-v43"><span>Генерации / мес</span><b>{access.monthlyGenerations}</b></div>
          <div className="ud-limit-v43"><span>Cloud Projects</span><b>{access.storageProjects}</b></div>
        </div>

        <div className="ud-card-v43 wide">
          <div className="ud-label-v43">Матрица доступа</div>
          <div className="ud-role-row-v43"><span>DEMO</span><b>mock без API</b></div>
          <div className="ud-role-row-v43"><span>FREE</span><b>аккаунт + cloud projects, LIVE lock</b></div>
          <div className="ud-role-row-v43"><span>PRO</span><b>LIVE через API платформы</b></div>
          <div className="ud-role-row-v43"><span>BYO API</span><b>LIVE через ключи пользователя</b></div>
          <div className="ud-role-row-v43"><span>ADMIN</span><b>полный доступ и управление ролями</b></div>
        </div>
      </div>
    </section>
  );
}
