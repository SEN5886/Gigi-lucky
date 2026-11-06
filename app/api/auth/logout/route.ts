import { randomBytes } from "node:crypto";
import { json, jsonError, limited } from "@/lib/http";
import { ensureSession, updateSession } from "@/lib/mall-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    limited(request, 20, "auth");
    const session = await ensureSession();
    await updateSession({
      ...session,
      userId: null,
      email: null,
      phone: null,
      csrf: randomBytes(16).toString("hex"),
    });
    return json({ ok: true, message: "已退出本机会话。" });
  } catch (error) {
    return jsonError(error);
  }
}
