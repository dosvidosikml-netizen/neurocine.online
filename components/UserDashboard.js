"use client";

import { getAccountAccess } from "../lib/accountRoles";

function fmtDate(value) {
  if (!value) return "—";
  try { return new Date(value).toLocaleDateString("ru-RU"); } catch { return "—"; }
}

function getPublicPlanLabel(access) {
  if (access.isOwner) return "OWNER";
  if (access.isAdmin) return "OWNER";
  if (access.role === "pro") return "PRO";
  return "DEMO";
}

export default function UserDashboard({ account, devMode }) {
  const session = account?.session || null;
  const profile = account?.profile || null;
  const user = session?.user || null;
  const access = getAccountAccess(profile, session);
  const email = profile?.email || user?.email || "guest";
  const name = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || email;
  const avatar = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || "";
  const publicPlan = getPublicPlanLabel(access);

  const isOwnerView = access.isOwner || access.isAdmin;
  const isProView = access.role === "pro" && !isOwnerView;
  const liveText = isOwnerView
    ? "LIVE открыт через platform API владельца"
    : isProView
      ? (access.hasOwnApiKeys ? "LIVE открыт через ваши API-ключи" : "LIVE откроется после подключения API-ключей")
      : "LIVE доступен в PRO";

  return (
    <section className="user-dashboard-v43" id="account">
      <div className="ud-head-v43">
        <div>
          <div className="ud-kicker-v43">User Control Center · v53 {isOwnerView ? "· OWNER" : ""}</div>
          <h2>Профиль и доступ</h2>
          <p>Понятная схема NeuroCine: DEMO для теста, PRO для работы со своими API-ключами, OWNER только для владельца платформы.</p>
        </div>
        <div className={`ud-access-badge-v43 role-${access.role}`}>
          <span>{isOwnerView ? "OWNER FULL ACCESS" : isProView ? "PRO STUDIO ACCESS" : "DEMO SANDBOX"}</span>
          <strong>{publicPlan}</strong>
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
          <strong className="ud-big-v43">{publicPlan}</strong>
          <p>{isOwnerView
            ? "Владелец: полный LIVE-доступ через API платформы. Этот режим видит только OWNER."
            : isProView
              ? "PRO — доступ к профессиональной студии. Реальные генерации идут через ваши подключённые API-ключи."
              : "DEMO — безопасный тестовый режим. Mock-генерация без списания API."}</p>
        </div>

        <div className="ud-card-v43">
          <div className="ud-label-v43">Доступ генерации</div>
          <strong className={access.canLive ? "ud-ok-v43" : "ud-lock-v43"}>{access.canLive ? "LIVE открыт" : "DEMO / PRO LOCK"}</strong>
          <p>{liveText}</p>
        </div>

        <div className="ud-card-v43">
          <div className="ud-label-v43">Лимиты</div>
          <div className="ud-limit-v43"><span>Генерации / мес</span><b>{isOwnerView ? "∞" : access.monthlyGenerations}</b></div>
          <div className="ud-limit-v43"><span>Cloud Projects</span><b>{isOwnerView ? "∞" : access.storageProjects}</b></div>
        </div>

        <div className="ud-card-v43 wide">
          <div className="ud-label-v43">Схема доступа</div>
          {isOwnerView ? (
            <>
              <div className="ud-role-row-v43"><span>Текущий режим</span><b>{devMode ? "DEMO без API" : "LIVE через platform API"}</b></div>
              <div className="ud-role-row-v43"><span>API</span><b>Render ENV / platform keys</b></div>
              <div className="ud-role-row-v43"><span>Лимиты</span><b>безлимит для владельца</b></div>
            </>
          ) : isProView ? (
            <>
              <div className="ud-role-row-v43"><span>PRO Studio</span><b>доступ к полному pipeline</b></div>
              <div className="ud-role-row-v43"><span>LIVE</span><b>{access.hasOwnApiKeys ? "работает через ваши API-ключи" : "ждёт подключения API-ключей"}</b></div>
              <div className="ud-role-row-v43"><span>API платформы</span><b>не используются</b></div>
            </>
          ) : (
            <>
              <div className="ud-role-row-v43"><span>DEMO</span><b>mock script / storyboard / prompts без API</b></div>
              <div className="ud-role-row-v43"><span>PRO</span><b>открывает студию и подключение своих API-ключей</b></div>
              <div className="ud-role-row-v43"><span>Cloud</span><b>{access.storageProjects} проекта</b></div>
            </>
          )}
        </div>

        {!isOwnerView && (
          <div className="ud-card-v43 wide pro-own-keys-v53">
            <div className="ud-label-v43">PRO · свои API-ключи</div>
            <strong className="ud-big-v43">Без списания API платформы</strong>
            <p>В PRO пользователь платит за доступ к NeuroCine Studio, Cloud Projects и pipeline. Реальные генерации запускаются через его OpenRouter / TTS / video API-ключи, а не через ключи владельца.</p>
            <div className="ud-role-row-v43"><span>OpenRouter</span><b>{access.hasOwnApiKeys ? "подключён" : "подключение в следующем шаге"}</b></div>
            <div className="ud-role-row-v43"><span>Безопасность</span><b>platform API остаются только для OWNER</b></div>
          </div>
        )}
      </div>
    </section>
  );
}
