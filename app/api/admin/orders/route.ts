import { sortNewest, toPublicOrder, toPublicRedemption } from "@/lib/admin-ops";
import { requireAdmin } from "@/lib/admin-auth";
import { json, jsonError, limited } from "@/lib/http";
import { listAllOrders, listAllRedemptions } from "@/lib/mall-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    limited(request, 60, "admin");
    await requireAdmin();
    const [orders, redemptions] = await Promise.all([listAllOrders(), listAllRedemptions()]);
    return json({
      orders: sortNewest(orders.map(toPublicOrder)),
      redemptions: sortNewest(redemptions.map(toPublicRedemption)),
    });
  } catch (error) {
    return jsonError(error);
  }
}
