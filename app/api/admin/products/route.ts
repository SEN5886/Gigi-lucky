import { requireAdmin } from "@/lib/admin-auth";
import { json, jsonError, limited, readJson } from "@/lib/http";
import { loadCatalog, saveCatalog } from "@/lib/mall-catalog";
import { productSchema } from "@/lib/mall-logic";
import { ShopError } from "@/lib/shop-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    limited(request, 60, "admin");
    await requireAdmin();
    return json({ products: loadCatalog() });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    limited(request, 30, "admin");
    await requireAdmin();
    const body = (await readJson(request, 80_000)) as { product?: unknown; previousId?: unknown };
    const parsed = productSchema.safeParse(body.product);
    if (!parsed.success) throw new ShopError(400, "INVALID_PRODUCT", "商品字段不完整，或图片地址不是 https / 站内路径。");
    const previousId = typeof body.previousId === "string" ? body.previousId : parsed.data.id;
    const next = loadCatalog().filter((item) => item.id !== previousId && item.id !== parsed.data.slug);
    next.push({ ...parsed.data, id: parsed.data.slug });
    try {
      saveCatalog(next);
    } catch (error) {
      throw new ShopError(400, "INVALID_PRODUCT", error instanceof Error ? error.message : "商品没有保存。");
    }
    return json({ ok: true, products: loadCatalog() });
  } catch (error) {
    return jsonError(error);
  }
}
