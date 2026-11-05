export class ClientError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ClientError";
    this.status = status;
  }
}

async function parse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as { message?: unknown };
  if (!response.ok) {
    throw new ClientError(response.status, typeof payload.message === "string" ? payload.message : "请求没有完成，请稍后再试。");
  }
  return payload as T;
}

function readCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const prefix = `${name}=`;
  const found = document.cookie.split("; ").find((part) => part.startsWith(prefix));
  return found ? decodeURIComponent(found.slice(prefix.length)) : "";
}

async function csrfToken(): Promise<string> {
  let token = readCookie("gigi_csrf");
  if (token) return token;
  await fetch("/api/mall/session", { cache: "no-store", headers: { Accept: "application/json" } });
  token = readCookie("gigi_csrf");
  if (!token) throw new ClientError(403, "页面会话没有建立，请刷新后再试。");
  return token;
}

export async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-csrf-token": await csrfToken(),
    },
    body: JSON.stringify(body ?? {}),
    cache: "no-store",
  });
  return parse<T>(response);
}

export async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
  return parse<T>(response);
}

const LOCAL_KEY = "gigi.cdk-order.v1";

export function saveLocalBinding(cdk: string, orderId: string) {
  if (typeof window === "undefined" || !orderId) return;
  try {
    const all = JSON.parse(window.localStorage.getItem(LOCAL_KEY) || "{}") as Record<string, unknown>;
    all[cdk.trim().toLowerCase()] = orderId;
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
  } catch {
    /* 浏览器拒绝存储时，服务端档案仍然保留对应关系。 */
  }
}

export function readLocalBinding(cdk: string): string {
  if (typeof window === "undefined") return "";
  try {
    const all = JSON.parse(window.localStorage.getItem(LOCAL_KEY) || "{}") as Record<string, unknown>;
    const value = all[cdk.trim().toLowerCase()];
    return typeof value === "string" ? value : "";
  } catch {
    return "";
  }
}
