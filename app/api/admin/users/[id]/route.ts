import { adminUserId, cleanNote, sortNewest, toPublicOrder, toPublicRedemption } from "@/lib/admin-ops";
import { requireAdmin } from "@/lib/admin-auth";
import { json, jsonError, limited, readJson } from "@/lib/http";
import { getShopUser, listAllOrders, listAllRedemptions, saveUserNote } from "@/lib/mall-db";
import { ShopError } from "@/lib/shop-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadUser(id: string) {
  if (!adminUserId.test(id)) throw new ShopError(404, "NOT_FOUND", "没有这个用户。");
  const user = await getShopUser(id);
  if (!user) throw new ShopError(404, "NOT_FOUND", "没有这个用户。");
  const [orders, redemptions] = await Promise.all([listAllOrders(), listAllRedemptions()]);
  return {
    user: { id: user.id, phone: user.phone, email: user.email, createdAt: user.createdAt, note: user.note },
    orders: sortNewest(orders.filter((order) => order.userId === id).map(toPublicOrder)),
    redemptions: sortNewest(redemptions.filter((row) => row.userId === id).map(toPublicRedemption)),
  };
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    limited(request, 60, "admin");
    await requireAdmin();
    const { id } = await context.params;
    return json(await loadUser(id));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    limited(request, 20, "admin");
    await requireAdmin();
    const { id } = await context.params;
    if (!adminUserId.test(id)) throw new ShopError(404, "NOT_FOUND", "没有这个用户。");
    const body = (await readJson(request, 4_000)) as { note?: unknown };
    const note = cleanNote(body.note);
    if (note === null) throw new ShopError(400, "INVALID_NOTE", "备注请控制在 500 字以内。");
    const saved = await saveUserNote(id, note);
    if (!saved) throw new ShopError(404, "NOT_FOUND", "没有这个用户。");
    return json(await loadUser(id));
  } catch (error) {
    return jsonError(error);
  }
}
