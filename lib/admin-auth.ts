import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { adminSessionValid, createAdminSession, dropAdminSession } from "./mall-db.ts";
import { ADMIN_COOKIE } from "./shop-contract.ts";
import { ShopError } from "./shop-error.ts";

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

export function adminTokenMatches(given: string): boolean {
  const expected = process.env.ADMIN_TOKEN?.trim() ?? "";
  if (!expected || !given) return false;
  return timingSafeEqual(digest(given), digest(expected));
}

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.COOKIE_SECURE === "true",
  path: "/",
  maxAge: 60 * 60 * 12,
};

export async function startAdminSession() {
  const id = await createAdminSession();
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, id, cookieBase);
}

export async function clearAdminSession() {
  const jar = await cookies();
  const id = jar.get(ADMIN_COOKIE)?.value ?? "";
  if (id) await dropAdminSession(id);
  jar.set(ADMIN_COOKIE, "", { ...cookieBase, maxAge: 0 });
}

export async function requireAdmin() {
  if (!process.env.ADMIN_TOKEN?.trim()) throw new ShopError(503, "ADMIN_NOT_CONFIGURED", "请先配置 ADMIN_TOKEN。");
  const jar = await cookies();
  const id = jar.get(ADMIN_COOKIE)?.value ?? "";
  if (!(await adminSessionValid(id))) throw new ShopError(401, "ADMIN_REQUIRED", "请先登录后台。");
}
