const GROK_COOKIE_NAMES = ["sso", "sso-rw", "x-userid", "x-anonuserid", "x-challenge", "x-signature"] as const;
const JWT = /^eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

export type ParsedCredential =
  | { ok: true; sessionJson: string; email: string; detail: string }
  | { ok: false; message: string };

function rememberCookie(jar: Map<string, string>, name: string, value: string) {
  const key = name.trim().toLowerCase();
  const cleaned = value.trim().replace(/^["']|["']$/g, "");
  if ((GROK_COOKIE_NAMES as readonly string[]).includes(key) && cleaned) jar.set(key, cleaned);
}

export function parseGrokLogin(raw: string): ParsedCredential {
  const text = raw.trim();
  if (text.length < 8) {
    return { ok: false, message: "请粘贴 Grok 的登录信息。" };
  }
  if (text.length > 150_000) {
    return { ok: false, message: "粘贴内容过长，请只保留 Cookie JSON 或一条 cURL。" };
  }

  const jar = new Map<string, string>();
  let parsed = false;
  if (text.startsWith("{") || text.startsWith("[")) {
    try {
      const value = JSON.parse(text) as unknown;
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item && typeof item === "object" && "name" in item) {
            const row = item as { name?: unknown; value?: unknown };
            rememberCookie(jar, String(row.name ?? ""), String(row.value ?? ""));
          }
        }
        parsed = true;
      } else if (value && typeof value === "object") {
        const record = value as Record<string, unknown>;
        if (Array.isArray(record.cookies)) {
          for (const item of record.cookies) {
            if (item && typeof item === "object" && "name" in item) {
              const row = item as { name?: unknown; value?: unknown };
              rememberCookie(jar, String(row.name ?? ""), String(row.value ?? ""));
            }
          }
        } else {
          for (const [name, cookieValue] of Object.entries(record)) {
            rememberCookie(jar, name, String(cookieValue ?? ""));
          }
        }
        parsed = true;
      }
    } catch {
      parsed = false;
    }
  }

  if (!parsed) {
    if (!/[=;]/.test(text) && JWT.test(text)) rememberCookie(jar, "sso", text);
    let cookieText = text;
    const marker = text.toLowerCase().indexOf("cookie:");
    if (marker >= 0) {
      cookieText = text.slice(marker + "cookie:".length);
      const quote = cookieText.search(/['"]/);
      if (quote >= 0) cookieText = cookieText.slice(0, quote);
    }
    for (const part of cookieText.split(/;\s*/)) {
      const eq = part.indexOf("=");
      if (eq > 0) rememberCookie(jar, part.slice(0, eq), part.slice(eq + 1));
    }
  }

  if (!jar.has("sso")) {
    return {
      ok: false,
      message: "还没有识别到 Grok 登录信息。请确认已经登录 grok.com，并粘贴完整的 Cookie JSON 或 cURL。",
    };
  }
  if (!jar.has("sso-rw")) jar.set("sso-rw", jar.get("sso") ?? "");

  const cookies = GROK_COOKIE_NAMES.filter((name) => jar.has(name)).map((name) => ({
    name,
    value: jar.get(name) ?? "",
  }));
  return {
    ok: true,
    sessionJson: JSON.stringify({ platform: "grok", cookies }),
    email: "",
    detail: `已识别 ${cookies.map((cookie) => cookie.name).join("、")}`,
  };
}

function emailFromSession(value: Record<string, unknown>): string {
  const user = value.user;
  if (user && typeof user === "object" && "email" in user) {
    const email = (user as { email?: unknown }).email;
    if (typeof email === "string") return email;
  }
  return typeof value.email === "string" ? value.email : "";
}

export function parseChatSession(raw: string): ParsedCredential {
  const text = raw.trim();
  if (!text) return { ok: false, message: "请粘贴 ChatGPT 的 session JSON。" };
  if (text.length > 150_000) return { ok: false, message: "Session 内容过长，请重新从会话页面复制。" };
  if (!text.startsWith("{")) {
    return { ok: false, message: "请粘贴完整 JSON，不要只粘贴 Access Token。" };
  }

  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { ok: false, message: "这段内容不是有效的 JSON。请重新打开 chatgpt.com/api/auth/session 并全选复制。" };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, message: "Session 需要是一个 JSON 对象。" };
  }

  const record = value as Record<string, unknown>;
  const accessToken = typeof record.accessToken === "string" ? record.accessToken : "";
  const sessionToken = typeof record.sessionToken === "string" ? record.sessionToken : "";
  if (!accessToken && !sessionToken) {
    return { ok: false, message: "未识别到 accessToken 或 sessionToken。请复制会话页面的完整 JSON。" };
  }
  if (!sessionToken) {
    return { ok: false, message: "Session 缺少 sessionToken。请复制完整 JSON，不要只粘贴 Access Token。" };
  }

  return {
    ok: true,
    sessionJson: JSON.stringify(record),
    email: emailFromSession(record),
    detail: accessToken ? "已识别 accessToken 与 sessionToken" : "已识别 sessionToken",
  };
}

export function maskEmail(email: string): string {
  const value = email.trim();
  const at = value.indexOf("@");
  if (at <= 0) return "";
  const name = value.slice(0, at);
  const domain = value.slice(at + 1);
  if (!domain || name.length > 80 || domain.length > 120) return "";
  return `${name.slice(0, 1)}***@${domain}`;
}
