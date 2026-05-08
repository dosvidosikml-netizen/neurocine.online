// NeuroCine access matrix v53 — DEMO / PRO Own Keys / OWNER
// Public users never see ADMIN/BYO wording. ADMIN/OWNER is an internal platform role only.

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
  return Boolean(normalized && getAdminEmails().includes(normalized));
}

export const ROLE_MATRIX = {
  demo: {
    label: "DEMO",
    plan: "demo",
    publicLabel: "DEMO",
    canLive: false,
    canUseOwnApi: false,
    canUseAdminApi: false,
    needsOwnApiKeys: false,
    isAdmin: false,
    isOwner: false,
    monthlyGenerations: 20,
    storageProjects: 3,
    apiSource: "none",
    description: "Тестовый режим без списания API. Mock script / storyboard / prompts.",
  },
  free: {
    label: "DEMO",
    plan: "free",
    publicLabel: "DEMO",
    canLive: false,
    canUseOwnApi: false,
    canUseAdminApi: false,
    needsOwnApiKeys: false,
    isAdmin: false,
    isOwner: false,
    monthlyGenerations: 30,
    storageProjects: 3,
    apiSource: "none",
    description: "Бесплатный тестовый доступ. LIVE доступен после перехода на PRO и подключения своих API-ключей.",
  },
  pro: {
    label: "PRO",
    plan: "pro",
    publicLabel: "PRO",
    canLive: false,
    canUseOwnApi: true,
    canUseAdminApi: false,
    needsOwnApiKeys: true,
    isAdmin: false,
    isOwner: false,
    monthlyGenerations: 999999,
    storageProjects: 100,
    apiSource: "user_keys",
    description: "PRO открывает профессиональную студию и LIVE-режим через API-ключи пользователя. API платформы не используются.",
  },
  admin: {
    label: "ADMIN",
    plan: "admin",
    publicLabel: "OWNER",
    canLive: true,
    canUseOwnApi: false,
    canUseAdminApi: true,
    needsOwnApiKeys: false,
    isAdmin: true,
    isOwner: false,
    monthlyGenerations: 99999,
    storageProjects: 999,
    apiSource: "platform_keys",
    description: "Внутренний доступ владельца/админа: LIVE через platform API.",
  },
  owner: {
    label: "OWNER",
    plan: "admin",
    publicLabel: "OWNER",
    canLive: true,
    canUseOwnApi: false,
    canUseAdminApi: true,
    needsOwnApiKeys: false,
    isAdmin: true,
    isOwner: true,
    monthlyGenerations: 999999,
    storageProjects: 9999,
    apiSource: "platform_keys",
    description: "Владелец NeuroCine: полный LIVE-доступ через platform API без публичных PRO-ограничений.",
  },
};

export function normalizeRole(role, plan, email = "") {
  if (isOwnerEmail(email)) return "owner";
  const rawRole = String(role || "").toLowerCase();
  const rawPlan = String(plan || "").toLowerCase();
  if (rawRole === "owner") return "owner";
  if (rawRole === "admin" || rawPlan === "admin") return "admin";
  // Legacy BYO users are now treated as PRO Own Keys users.
  if (rawRole === "byo_api" || rawPlan === "byo_api") return "pro";
  if (rawRole === "pro" || rawPlan === "pro") return "pro";
  if (rawRole === "demo" || rawPlan === "demo") return "demo";
  return "free";
}

export function getAccountEmail(profile, session) {
  return profile?.email || session?.user?.email || session?.user?.user_metadata?.email || "";
}

export function hasConnectedOwnApiKeys(profile) {
  return Boolean(
    profile?.api_keys_connected === true ||
    profile?.api_keys_connected === "true" ||
    profile?.own_api_connected === true ||
    profile?.own_api_connected === "true"
  );
}

export function getAccountAccess(profile, session) {
  if (!session?.user) return { role: "demo", ...ROLE_MATRIX.demo, defaultMode: "demo", hasOwnApiKeys: false };
  const email = getAccountEmail(profile, session);
  const role = normalizeRole(profile?.role, profile?.plan, email);
  const base = ROLE_MATRIX[role] || ROLE_MATRIX.free;
  const isPrivileged = role === "owner" || role === "admin";
  const hasOwnApiKeys = hasConnectedOwnApiKeys(profile);
  const proLiveReady = role === "pro" && hasOwnApiKeys;
  const canLive = isPrivileged || proLiveReady;

  return {
    role,
    ...base,
    label: base.label,
    publicLabel: base.publicLabel || base.label,
    plan: base.plan,
    canLive,
    hasOwnApiKeys,
    needsOwnApiKeys: role === "pro" && !hasOwnApiKeys,
    canUseOwnApi: role === "pro" && hasOwnApiKeys,
    canUseAdminApi: isPrivileged,
    apiSource: isPrivileged ? "platform_keys" : (proLiveReady ? "user_keys" : "none"),
    monthlyGenerations: isPrivileged ? base.monthlyGenerations : Number(profile?.monthly_generation_limit ?? base.monthlyGenerations),
    generationsUsed: Number(profile?.generations_used ?? 0),
    storageProjects: isPrivileged ? base.storageProjects : Number(profile?.cloud_project_limit ?? base.storageProjects),
    cloudProjectsUsed: Number(profile?.cloud_projects_used ?? 0),
    defaultMode: isPrivileged ? "live" : (canLive ? "live" : "demo"),
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
