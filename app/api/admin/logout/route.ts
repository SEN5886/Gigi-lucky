import { clearAdminSession } from "@/lib/admin-auth";
import { json, jsonError, limited } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    limited(request, 20, "admin");
    await clearAdminSession();
    return json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
