import { json, jsonError, limited } from "@/lib/http";
import { ensureSession, getOrder } from "@/lib/mall-db";
import { ownsOrder } from "@/lib/mall-logic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    limited(request, 60, "mall");
    const session = await ensureSession();
    const { id } = await context.params;
    const order = await getOrder(id);
    if (!order || !ownsOrder(order, session)) {
      return json({ code: "NOT_FOUND", message: "没有找到这笔订单。" }, 404);
    }
    return json({
      order: {
        id: order.id,
        email: order.email,
        name: order.name,
        items: order.items,
        totalCents: order.totalCents,
        status: order.status,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
