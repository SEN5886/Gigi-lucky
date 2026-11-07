import { authProvider } from "@/lib/auth-provider";
import { json, jsonError, limited, readJson } from "@/lib/http";
import { ensureSession, updateSession } from "@/lib/mall-db";
import { authSchema } from "@/lib/mall-logic";
import { ShopError } from "@/lib/shop-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(request: Request, kind: "login" | "register" | "magic") {
  limited(request, 6, "auth");
  const parsed = authSchema.safeParse(await readJson(request, 4_000));
  if (!parsed.success) throw new ShopError(400, "INVALID_AUTH", "请填写有效的邮箱。密码至少 8 位。");
  const provider = authProvider();
  const email = parsed.data.email;
  const password = parsed.data.password ?? "";
  const result = kind === "magic"
    ? await provider.requestMagicLink({ email })
    : kind === "register"
      ? await provider.register({ email, password })
      : await provider.login({ email, password });
  if (result.user) {
    const session = await ensureSession();
    await updateSession({ ...session, userId: result.user.id, email: result.user.email });
  }
  return json({ ok: result.ok, code: result.code, message: result.message, user: result.user });
}

export async function POST(request: Request) {
  try {
    return await handle(request, "login");
  } catch (error) {
    return jsonError(error);
  }
}
