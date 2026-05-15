export const AUTH_RETURN_TO_KEY = "neurocine.auth.returnTo";

export function getSafeReturnTo(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "/storyboard";
  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      return `${url.pathname || "/storyboard"}${url.search || ""}${url.hash || ""}`;
    } catch {
      return "/storyboard";
    }
  }
  if (!raw.startsWith("/")) return "/storyboard";
  if (raw.startsWith("//")) return "/storyboard";
  return raw;
}

export function getCurrentReturnTo(fallback = "/storyboard") {
  if (typeof window === "undefined") return fallback;
  const path = `${window.location.pathname || fallback}${window.location.search || ""}${window.location.hash || ""}`;
  return getSafeReturnTo(path || fallback);
}

export function saveAuthReturnTo(returnTo = "/storyboard") {
  const safe = getSafeReturnTo(returnTo);
  try { window.localStorage.setItem(AUTH_RETURN_TO_KEY, safe); } catch {}
  return safe;
}

export function readAuthReturnTo(fallback = "/storyboard") {
  try {
    const saved = window.localStorage.getItem(AUTH_RETURN_TO_KEY);
    return getSafeReturnTo(saved || fallback);
  } catch {
    return getSafeReturnTo(fallback);
  }
}

export function clearAuthReturnTo() {
  try { window.localStorage.removeItem(AUTH_RETURN_TO_KEY); } catch {}
}

export function buildAuthCallbackRedirect(returnTo = "/storyboard") {
  if (typeof window === "undefined") return undefined;
  const safe = saveAuthReturnTo(returnTo);
  const next = encodeURIComponent(safe);
  return `${window.location.origin}/auth/callback?next=${next}`;
}
