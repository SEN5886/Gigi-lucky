import { adminTokenMatches, startAdminSession } from "@/lib/admin-auth";
import { json, jsonError, limited, readJson } from "@/lib/http";
import { ShopError } from "@/lib/shop-error";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    limited(request, 6, "admin");
    if (!process.env.ADMIN_TOKEN?.trim()) throw new ShopError(503, "ADMIN_NOT_CONFIGURED", "请先配置 ADMIN_TOKEN。");
    const parsed = z.object({ token: z.string().min(8).max(200) }).safeParse(await readJson(request, 1_000));
    if (!parsed.success || !adminTokenMatches(parsed.data.token)) {
      throw new ShopError(401, "ADMIN_DENIED", "后台口令不正确。");
    }
    await startAdminSession();
    return json({ ok: true, message: "已进入后台。" });
  } catch (error) {
    return jsonError(error);
  }
}
