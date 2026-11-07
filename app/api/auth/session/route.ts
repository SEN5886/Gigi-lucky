import { devAuthEnabled } from "@/lib/env";
import { json, jsonError, limited } from "@/lib/http";
import { ensureSession } from "@/lib/mall-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    limited(request, 60, "auth");
    const session = await ensureSession();
    return json({
      ready: false,
      mode: devAuthEnabled() ? "dev" : "stub",
      user: session.userId && session.email ? { id: session.userId, email: session.email } : null,
      contract: {
        login: "POST /api/auth/login { email, password }",
        register: "POST /api/auth/register { email, password }",
        magicLink: "POST /api/auth/magic-link { email }",
        logout: "POST /api/auth/logout",
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
