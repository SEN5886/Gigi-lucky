export const SID_COOKIE = "gigi_sid";
export const CSRF_COOKIE = "gigi_csrf";

export const SESSION_COOKIE = {
  name: SID_COOKIE,
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

export const CSRF_COOKIE_POLICY = {
  name: CSRF_COOKIE,
  httpOnly: false,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

export const ADMIN_COOKIE = "gigi_admin";

export type SessionRecord = {
  id: string;
  csrf: string;
  userId: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
};

export function tokensMatch(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function originMatches(host: string | null, origin: string | null): boolean {
  if (!host || !origin) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
