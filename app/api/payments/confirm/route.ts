import { json, jsonError, limited, readJson } from "@/lib/http";
import { ensureSession, markPaid } from "@/lib/mall-db";
import { confirmSchema } from "@/lib/mall-logic";
import { paymentProvider } from "@/lib/payment-provider";
import { ShopError } from "@/lib/shop-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    limited(request, 12, "checkout");
    const session = await ensureSession();
    const parsed = confirmSchema.safeParse(await readJson(request, 2_000));
    if (!parsed.success) throw new ShopError(400, "INVALID_INTENT", "支付单号不正确。");
    const provider = paymentProvider();
    const result = await provider.confirm({ intentId: parsed.data.intentId });
    if (result.status !== "paid") {
      return json({ code: "PAYMENT_UNAVAILABLE", message: result.message, status: "pending" }, 501);
    }
    const order = await markPaid(parsed.data.intentId, session.id);
    if (!order) throw new ShopError(404, "NOT_FOUND", "没有找到这笔待支付订单。");
    return json({
      message: result.message,
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
