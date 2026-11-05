import "server-only";

import { NextResponse } from "next/server";
import { PartnerError } from "./partner.ts";

const buckets = new Map<string, { count: number; reset: number }>();

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim().slice(0, 64) || "local";
  return request.headers.get("x-real-ip")?.slice(0, 64) || "local";
}

export function rateLimit(ip: string, limit = 30, windowMs = 60_000): boolean {
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || now > bucket.reset) {
    buckets.set(ip, { count: 1, reset: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export function jsonError(error: unknown) {
  if (error instanceof PartnerError) {
    const status = error.status >= 400 && error.status < 600 ? error.status : 502;
    return json({ code: error.code, message: error.message }, status);
  }
  console.error("station request failed");
  return json({ code: "INTERNAL", message: "店铺暂时无法处理这个请求。" }, 500);
}

export async function readJson(request: Request, max = 200_000): Promise<unknown> {
  const advertised = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(advertised) && advertised > max) {
    throw new PartnerError(413, "PAYLOAD_TOO_LARGE", "提交内容过长。");
  }
  const text = await request.text();
  if (text.length > max) throw new PartnerError(413, "PAYLOAD_TOO_LARGE", "提交内容过长。");
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new PartnerError(400, "INVALID_JSON", "请求格式不正确。");
  }
}

export function assertCdk(value: unknown): string {
  if (typeof value !== "string") throw new PartnerError(400, "MISSING_CDK", "请输入卡密。");
  const cdk = value.trim();
  if (!/^[A-Za-z0-9_-]{8,120}$/.test(cdk)) {
    throw new PartnerError(400, "INVALID_CDK", "卡密格式不正确。请去掉空格后再试。");
  }
  return cdk;
}

export function assertOrderId(value: string): string {
  const id = value.trim();
  if (!/^[A-Za-z0-9_-]{4,200}$/.test(id)) {
    throw new PartnerError(400, "INVALID_ORDER", "订单号不正确。");
  }
  return id;
}

export function limited(request: Request, limit = 30) {
  if (!rateLimit(clientIp(request), limit)) {
    throw new PartnerError(429, "RATE_LIMITED", "操作太频繁，请稍后再试。");
  }
}
