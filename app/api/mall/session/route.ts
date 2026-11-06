import { devAuthEnabled, paymentMode } from "@/lib/env";
import { json, jsonError, limited } from "@/lib/http";
import { ensureSession } from "@/lib/mall-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    limited(request, 60, "mall");
    const session = await ensureSession();
    return json({
      user: session.userId ? { id: session.userId, email: session.email, phone: session.phone } : null,
      paymentMode: paymentMode(),
      authMode: devAuthEnabled() ? "dev" : "stub",
    });
  } catch (error) {
    return jsonError(error);
  }
}
