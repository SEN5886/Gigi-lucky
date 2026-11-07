import { requireAdmin } from "@/lib/admin-auth";
import { json, limited } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  limited(request, 60, "admin");
  try {
    await requireAdmin();
    return json({ ok: true });
  } catch {
    return json({ ok: false });
  }
}
