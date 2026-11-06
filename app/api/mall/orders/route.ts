import { json, jsonError, limited } from "@/lib/http";
import { ensureSession, listBrowserOrders, listOrdersFor, listRedemptions } from "@/lib/mall-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function view(order: { id: string; email: string; name: string; items: unknown; totalCents: number; status: string; createdAt: string }) {
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

export async function GET(request: Request) {
  try {
    limited(request, 60, "mall");
    const session = await ensureSession();
    const account = session.userId ? await listOrdersFor(session) : [];
    const browser = await listBrowserOrders(session.id);
    const redemptions = await listRedemptions(session);
    return json({
      signedIn: Boolean(session.userId),
      account: account.map(view),
      browser: browser.map(view),
      redemptions,
    });
  } catch (error) {
    return jsonError(error);
  }
}
