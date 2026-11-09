import "server-only";

const DEFAULT_BASE = "https://982xj.xyz/api/partner/v1/xiaojiu";

export class PartnerError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "PartnerError";
    this.status = status;
    this.code = code;
  }
}

function baseUrl(): string {
  return (process.env.XIAOJIU_API_BASE_URL || DEFAULT_BASE).replace(/\/$/, "");
}

function friendly(code: string, fallback: string): string {
  const known: Record<string, string> = {
    PARTNER_API_KEY_REQUIRED: "兑换服务未授权。",
    INVALID_PARTNER_API_KEY: "兑换服务密钥无效，请店主更新配置。",
    API_KEY_MISSING: "店铺尚未配置兑换密钥。",
    UPSTREAM_UNREACHABLE: "暂时联系不上兑换服务，请稍后再试。",
  };
  return known[code] || fallback || "兑换服务暂时没有完成这个请求。";
}

export async function partnerRequest(path: string, init?: RequestInit): Promise<unknown> {
  const key = process.env.XIAOJIU_API_KEY?.trim();
  if (!key) throw new PartnerError(503, "API_KEY_MISSING", friendly("API_KEY_MISSING", ""));

  let response: Response;
  try {
    response = await fetch(`${baseUrl()}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${key}`,
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(25_000),
    });
  } catch {
    throw new PartnerError(502, "UPSTREAM_UNREACHABLE", friendly("UPSTREAM_UNREACHABLE", ""));
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: "兑换服务返回了无法识别的内容。" };
    }
  }

  if (!response.ok) {
    const record = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
    const nested = record.error && typeof record.error === "object" ? (record.error as Record<string, unknown>) : {};
    const code = String(record.code || nested.code || "UPSTREAM_ERROR");
    const upstreamMessage = String(record.message || nested.message || "");
    throw new PartnerError(response.status, code, friendly(code, upstreamMessage));
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    const data = (payload as { data?: unknown }).data;
    if (data && typeof data === "object") return data;
  }
  return payload;
}

export function getConfig() {
  return partnerRequest("/config", { method: "GET" });
}

export function verifyCdk(cdk: string) {
  return partnerRequest("/verify", { method: "POST", body: JSON.stringify({ cdk }) });
}

export function redeemCdk(cdk: string, sessionJson: string) {
  return partnerRequest("/redeem", {
    method: "POST",
    body: JSON.stringify({ cdk, sessionJson }),
  });
}

export function getOrder(orderId: string) {
  return partnerRequest(`/orders/${encodeURIComponent(orderId)}`, { method: "GET" });
}

export function postCustomerAction(orderId: string, body: Record<string, unknown>) {
  return partnerRequest(`/orders/${encodeURIComponent(orderId)}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function cdkStatus(cdk: string) {
  return partnerRequest("/cdk-status", { method: "POST", body: JSON.stringify({ cdk }) });
}

export function apiConfigured(): boolean {
  return Boolean(process.env.XIAOJIU_API_KEY?.trim());
}
