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
  const key = String(role || plan || "free").toLowerCase();
  return ROLE_MATRIX[key] ? key : "free";
}

export function getAccountAccess(profile, session) {
  if (!session?.user) return { role: "demo", ...ROLE_MATRIX.demo };
  const role = normalizeRole(profile?.role, profile?.plan);
  return { role, ...ROLE_MATRIX[role] };
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
