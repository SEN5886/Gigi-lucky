import { json, jsonError, limited, readJson } from "@/lib/http";
import { loadCatalog } from "@/lib/mall-catalog";
import { ensureSession, findOrderByKey, newIntentId, newOrderId, putPendingOrder, readCart, soldMap, type MallOrder } from "@/lib/mall-db";
import { checkoutSchema, quoteCart } from "@/lib/mall-logic";
import { paymentProvider } from "@/lib/payment-provider";
import { ShopError } from "@/lib/shop-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function publicOrder(order: MallOrder) {
  return {
    id: order.id,
    email: order.email,
    name: order.name,
    items: order.items,
    totalCents: order.totalCents,
    status: order.status,
    createdAt: order.createdAt,
  };
}

export async function POST(request: Request) {
  try {
    limited(request, 8, "checkout");
    const session = await ensureSession();
    const parsed = checkoutSchema.safeParse(await readJson(request, 8_000));
    if (!parsed.success) throw new ShopError(400, "INVALID_CHECKOUT", "请填写有效的邮箱，并重新打开结算页。");
    const existing = await findOrderByKey(session.id, parsed.data.idempotencyKey);
    if (existing) {
      return json({
        order: publicOrder(existing),
        intent: { id: existing.paymentIntentId, mode: "mock", status: existing.status === "paid" ? "paid" : "requires_confirmation", message: "这是同一次结算。" },
      });
    }
    const [lines, sold] = await Promise.all([readCart(session.id), soldMap()]);
    if (!lines.length) throw new ShopError(400, "EMPTY_CART", "购物车是空的。");
    let quoted;
    try {
      quoted = quoteCart(lines, loadCatalog(), sold);
    } catch (error) {
      throw new ShopError(409, "STOCK", error instanceof Error ? error.message : "库存已变化，请回到购物车。");
    }
    if (!quoted.items.length || quoted.totalCents <= 0) throw new ShopError(400, "EMPTY_CART", "没有可结算的商品。");
    const provider = paymentProvider();
    const orderId = newOrderId();
    const intentId = newIntentId();
    const order: MallOrder = {
      id: orderId,
      ownerSid: session.id,
      userId: session.userId,
      email: parsed.data.email.toLowerCase(),
      name: parsed.data.name,
      items: quoted.items,
      totalCents: quoted.totalCents,
      status: "pending",
      paymentIntentId: intentId,
      idempotencyKey: parsed.data.idempotencyKey,
      createdAt: new Date().toISOString(),
    };
    const intent = await provider.createIntent({ orderId, amountCents: order.totalCents, currency: "CNY", intentId });
    await putPendingOrder(order, intent.id);
    return json({ order: publicOrder(order), intent });
  } catch (error) {
    return jsonError(error);
  }
}
