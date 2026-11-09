import { buildUserRows, searchUsers } from "@/lib/admin-ops";
import { requireAdmin } from "@/lib/admin-auth";
import { json, jsonError, limited } from "@/lib/http";
import { listAllOrders, listAllRedemptions, listShopUsers } from "@/lib/mall-db";
import { ShopError } from "@/lib/shop-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    limited(request, 60, "admin");
    await requireAdmin();
    const query = new URL(request.url).searchParams.get("q") ?? "";
    if (query.length > 80) throw new ShopError(400, "INVALID_QUERY", "搜索词过长。");
    const [users, orders, redemptions] = await Promise.all([listShopUsers(), listAllOrders(), listAllRedemptions()]);
    return json({ users: searchUsers(buildUserRows(users, orders, redemptions), query) });
  } catch (error) {
    return jsonError(error);
  }
}
