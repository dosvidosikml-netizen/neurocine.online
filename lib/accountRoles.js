// NeuroCine access matrix v48 — OWNER / ADMIN / DEMO / FREE / PRO / BYO

export const OWNER_EMAIL_FALLBACK = "dosvidosikml@gmail.com";

export function parseAdminEmails(raw = "") {
  return String(raw || "")
    .split(/[;,\s]+/g)
    .map(v => v.trim().toLowerCase())
    .filter(Boolean);
}

export function getAdminEmails() {
  const envEmails = parseAdminEmails(
    process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.ADMIN_EMAILS || ""
  );
  const all = new Set([OWNER_EMAIL_FALLBACK, ...envEmails]);
  return Array.from(all).filter(Boolean);
}

export function isOwnerEmail(email = "") {
  const normalized = String(email || "").trim().toLowerCase();
  return normalized && getAdminEmails().includes(normalized);
}

export const ROLE_MATRIX = {
  demo: {
    label: "DEMO",
    plan: "demo",
    canLive: false,
    canUseOwnApi: false,
    canUseAdminApi: false,
    isAdmin: false,
    isOwner: false,
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
    isAdmin: false,
    isOwner: false,
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
    isAdmin: false,
    isOwner: false,
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
    isAdmin: false,
    isOwner: false,
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
    isAdmin: true,
    isOwner: false,
    monthlyGenerations: 99999,
    storageProjects: 999,
    description: "Полный доступ: LIVE, API платформы, управление ролями.",
  },
  owner: {
    label: "OWNER",
    plan: "admin",
    canLive: true,
    canUseOwnApi: true,
    canUseAdminApi: true,
    isAdmin: true,
    isOwner: true,
    monthlyGenerations: 999999,
    storageProjects: 9999,
    description: "Владелец NeuroCine: полный доступ без лимитов и без BYO API.",
  },
};

export function normalizeRole(role, plan, email = "") {
  if (isOwnerEmail(email)) return "owner";
  const rawRole = String(role || "").toLowerCase();
  const rawPlan = String(plan || "").toLowerCase();
  if (rawRole === "owner") return "owner";
  if (rawRole === "admin" || rawPlan === "admin") return "admin";
  const key = ROLE_MATRIX[rawRole] ? rawRole : (ROLE_MATRIX[rawPlan] ? rawPlan : "free");
  return key;
}

export function getAccountEmail(profile, session) {
  return profile?.email || session?.user?.email || session?.user?.user_metadata?.email || "";
}

export function getAccountAccess(profile, session) {
  if (!session?.user) return { role: "demo", ...ROLE_MATRIX.demo, defaultMode: "demo" };
  const email = getAccountEmail(profile, session);
  const role = normalizeRole(profile?.role, profile?.plan, email);
  const base = ROLE_MATRIX[role] || ROLE_MATRIX.free;
  const isPrivileged = role === "owner" || role === "admin";
  return {
    role,
    ...base,
    label: base.label,
    plan: base.plan,
    monthlyGenerations: isPrivileged ? base.monthlyGenerations : Number(profile?.monthly_generation_limit ?? base.monthlyGenerations),
    generationsUsed: Number(profile?.generations_used ?? 0),
    storageProjects: isPrivileged ? base.storageProjects : Number(profile?.cloud_project_limit ?? base.storageProjects),
    cloudProjectsUsed: Number(profile?.cloud_projects_used ?? 0),
    defaultMode: isPrivileged ? "live" : (profile?.default_mode || base.plan || "demo"),
  };
}

export function isLiveAllowed(profile, session) {
  return Boolean(getAccountAccess(profile, session).canLive);
}

export function shouldForceLiveForAccount(profile, session) {
  const access = getAccountAccess(profile, session);
  return access.role === "owner" || access.role === "admin";
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
