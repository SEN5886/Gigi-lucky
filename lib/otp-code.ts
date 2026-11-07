import { createHmac, randomInt } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const TTL_MS = 5 * 60 * 1000;
const RESEND_MS = 60 * 1000;

export function normalizePhone(input: string): string | null {
  const local = input.replace(/[\s-]/g, "").replace(/^\+?86/, "");
  return /^1[3-9]\d{9}$/.test(local) ? local : null;
}

export function createOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function pepper(): string {
  if (process.env.OTP_PEPPER && process.env.OTP_PEPPER.length >= 16) return process.env.OTP_PEPPER;
  const file = path.join(process.cwd(), ".data", "otp-pepper");
  try {
    const existing = readFileSync(file, "utf8").trim();
    if (existing.length >= 32) return existing;
  } catch {
    /* 第一次签发时生成，不写进仓库。 */
  }
  const created = createHmac("sha256", "gigi-otp").update(`${Date.now()}:${Math.random()}`).digest("hex");
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, created, { mode: 0o600 });
  return created;
}

export function hashOtp(code: string, secret = pepper()): string {
  return createHmac("sha256", secret).update(code).digest("hex");
}

export function otpExpiry(now = Date.now()): number {
  return now + TTL_MS;
}

export function resendBlocked(sentAt: number, now = Date.now()): boolean {
  return now - sentAt < RESEND_MS;
}

export function otpMatches(code: string, hash: string, expiresAt: number, now = Date.now()): boolean {
  return now <= expiresAt && hashOtp(code) === hash;
}
