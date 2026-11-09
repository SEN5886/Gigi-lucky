import { limited, json, jsonError, readJson } from "@/lib/http";
import { loadCatalog } from "@/lib/mall-catalog";
import { ensureSession, readCart, setCartLine, soldMap } from "@/lib/mall-db";
import { availableStock, canPurchase, cartWriteSchema, formatYuan } from "@/lib/mall-logic";
import { ShopError } from "@/lib/shop-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function present(lines: { productId: string; qty: number }[], sold: Record<string, number>) {
  const products = loadCatalog();
  const view = lines.flatMap((line) => {
    const product = products.find((item) => item.id === line.productId);
    if (!product) return [];
    const left = availableStock(product, sold[product.id] ?? 0);
    return [{
      productId: product.id,
      slug: product.slug,
      title: product.title,
      qty: line.qty,
      unitCents: product.priceCents,
      lineCents: product.priceCents * line.qty,
      priceLabel: formatYuan(product.priceCents),
      available: left,
      purchasable: canPurchase(product, sold[product.id] ?? 0) && line.qty <= left,
    }];
  });
  const totalCents = view.reduce((sum, line) => sum + (line.purchasable ? line.lineCents : 0), 0);
  return { lines: view, totalCents, count: view.reduce((sum, line) => sum + line.qty, 0) };
}

export async function GET(request: Request) {
  try {
    limited(request, 120, "mall");
    const session = await ensureSession();
    const [lines, sold] = await Promise.all([readCart(session.id), soldMap()]);
    return json(present(lines, sold));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    limited(request, 40, "mall");
    const session = await ensureSession();
    const parsed = cartWriteSchema.safeParse(await readJson(request, 4_000));
    if (!parsed.success) throw new ShopError(400, "INVALID_CART", "商品或数量不正确。");
    const products = loadCatalog();
    const product = products.find((item) => item.id === parsed.data.productId);
    if (!product) throw new ShopError(404, "UNKNOWN_PRODUCT", "没有这件商品。");
    const sold = await soldMap();
    if (parsed.data.qty > 0 && !canPurchase(product, sold[product.id] ?? 0)) {
      throw new ShopError(409, "OUT_OF_STOCK", "这件商品现在不能购买。");
    }
    if (parsed.data.qty > availableStock(product, sold[product.id] ?? 0)) {
      throw new ShopError(409, "OUT_OF_STOCK", "库存不足。");
    }
    const next = await setCartLine(session.id, product.id, parsed.data.qty);
    return json(present(next, sold));
  } catch (error) {
    return jsonError(error);
  }
}
