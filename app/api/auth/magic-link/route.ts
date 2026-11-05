import { authProvider } from "@/lib/auth-provider";
import { json, jsonError, limited, readJson } from "@/lib/http";
import { ensureSession, updateSession } from "@/lib/mall-db";
import { authSchema } from "@/lib/mall-logic";
import { ShopError } from "@/lib/shop-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    limited(request, 6, "auth");
    const parsed = authSchema.safeParse(await readJson(request, 2_000));
    if (!parsed.success) throw new ShopError(400, "INVALID_AUTH", "请填写有效的邮箱。");
    const result = await authProvider().requestMagicLink({ email: parsed.data.email });
    if (result.user) {
      const session = await ensureSession();
      await updateSession({ ...session, userId: result.user.id, email: result.user.email });
    }
    return json({ ok: result.ok, code: result.code, message: result.message, user: result.user });
  } catch (error) {
    return jsonError(error);
  }
}
