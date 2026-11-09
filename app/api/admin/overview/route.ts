import { buildOverview } from "@/lib/admin-ops";
import { requireAdmin } from "@/lib/admin-auth";
import { json, jsonError, limited } from "@/lib/http";
import { loadCatalog } from "@/lib/mall-catalog";
import { listAllOrders, listAllRedemptions, listShopUsers, soldMap } from "@/lib/mall-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    limited(request, 60, "admin");
    await requireAdmin();
    const [users, orders, redemptions, sold] = await Promise.all([listShopUsers(), listAllOrders(), listAllRedemptions(), soldMap()]);
    const products = loadCatalog();
    return json({
      overview: buildOverview({
        users: users.length,
        orders,
        redemptions: redemptions.length,
        products,
        soldUnits: Object.values(sold).reduce((sum, qty) => sum + qty, 0),
      }),
    });
  } catch (error) {
    return jsonError(error);
  }
}
