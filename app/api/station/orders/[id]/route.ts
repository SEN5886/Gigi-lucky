import { assertOrderId, json, jsonError, limited } from "@/lib/http";
import { normalizeOrder } from "@/lib/normalize";
import { getOrder } from "@/lib/partner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    limited(request, 120, "redeem");
    const { id } = await context.params;
    const orderId = assertOrderId(id);
    const raw = await getOrder(orderId);
    return json({ order: normalizeOrder(raw, orderId) });
  } catch (error) {
    return jsonError(error);
  }
}
