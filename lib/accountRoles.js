export const ROLE_MATRIX = {
  demo: {
    label: "DEMO",
    plan: "demo",
    canLive: false,
    canUseOwnApi: false,
    canUseAdminApi: false,
    monthlyGenerations: 20,
    storageProjects: 3,
    description: "Тестовый режим без списания API. Mock script / storyboard / prompts.",
  },
  free: {
    label: "FREE",
    plan: "free",
    canLive: false,
    canUseOwnApi: false,
    canUseAdminApi: false,
    monthlyGenerations: 30,
    storageProjects: 5,
    description: "Аккаунт создан. LIVE заблокирован до PRO или своих API.",
  },
  pro: {
    label: "PRO",
    plan: "pro",
    canLive: true,
    canUseOwnApi: false,
    canUseAdminApi: true,
    monthlyGenerations: 500,
    storageProjects: 100,
    description: "PRO-доступ к LIVE генерации через API платформы.",
  },
  byo_api: {
    label: "BYO API",
    plan: "byo_api",
    canLive: true,
    canUseOwnApi: true,
    canUseAdminApi: false,
    monthlyGenerations: 9999,
    storageProjects: 100,
    description: "Пользователь подключает собственные API ключи.",
  },
  admin: {
    label: "ADMIN",
    plan: "admin",
    canLive: true,
    canUseOwnApi: true,
    canUseAdminApi: true,
    monthlyGenerations: 99999,
    storageProjects: 999,
    description: "Полный доступ разработчика: LIVE, админ-API, управление ролями.",
  },
};

export function normalizeRole(role, plan) {
  const rawRole = String(role || "").toLowerCase();
  const rawPlan = String(plan || "").toLowerCase();
  const key = ROLE_MATRIX[rawRole] ? rawRole : (ROLE_MATRIX[rawPlan] ? rawPlan : "free");
  return key;
}

export function getAccountAccess(profile, session) {
  if (!session?.user) return { role: "demo", ...ROLE_MATRIX.demo };
  const role = normalizeRole(profile?.role, profile?.plan);
  const base = ROLE_MATRIX[role] || ROLE_MATRIX.free;
  return {
    role,
    ...base,
    monthlyGenerations: Number(profile?.monthly_generation_limit ?? base.monthlyGenerations),
    generationsUsed: Number(profile?.generations_used ?? 0),
    storageProjects: Number(profile?.cloud_project_limit ?? base.storageProjects),
    cloudProjectsUsed: Number(profile?.cloud_projects_used ?? 0),
    defaultMode: profile?.default_mode || base.plan || "demo",
  };
}

export function isLiveAllowed(profile, session) {
  return Boolean(getAccountAccess(profile, session).canLive);
}

export function buildDefaultUserSettings() {
  return {
    ui_lang: "ru",
    default_mode: "demo",
    default_aspect_ratio: "9:16",
    default_video_target: "veo3",
    default_style_preset: "cinematic",
  };
}
