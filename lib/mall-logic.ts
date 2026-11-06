import { z } from "zod";

export const categories = ["chatgpt", "grok", "claude", "codex", "other"] as const;

export const categoryLabels: Record<(typeof categories)[number] | "all", string> = {
  all: "全部",
  chatgpt: "ChatGPT",
  grok: "Grok",
  claude: "Claude",
  codex: "Codex",
  other: "其他",
};

export const productSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{3,40}$/),
  slug: z.string().regex(/^[a-z0-9-]{3,40}$/),
  title: z.string().min(1).max(80),
  category: z.enum(categories),
  summary: z.string().min(1).max(180),
  description: z.string().min(1).max(2000),
  priceCents: z.number().int().min(0).max(5_000_000),
  stock: z.number().int().min(0).max(100_000),
  badge: z.enum(["in_stock", "low", "restocking", "soon"]),
  images: z.array(z.string().max(300).refine((value) => value.startsWith("https://") || value.startsWith("/"))).max(8).default([]),
  published: z.boolean().default(true),
});

export type MallProduct = z.infer<typeof productSchema>;

export const cartWriteSchema = z.object({
  productId: z.string().regex(/^[a-z0-9-]{3,40}$/),
  qty: z.number().int().min(0).max(5),
});

export const checkoutSchema = z.object({
  email: z.string().trim().email().max(120),
  name: z.string().trim().max(40).optional().default(""),
  idempotencyKey: z.string().regex(/^[A-Za-z0-9_-]{8,80}$/),
});

export const authSchema = z.object({
  email: z.string().trim().email().max(120),
  password: z.string().min(8).max(72).optional(),
});

export const confirmSchema = z.object({
  intentId: z.string().regex(/^mock_[a-f0-9]{16}$/),
});

export type CartLine = { productId: string; qty: number };

export type QuotedItem = {
  productId: string;
  title: string;
  qty: number;
  unitCents: number;
};

export function formatYuan(cents: number): string {
  const negative = cents < 0;
  const abs = Math.abs(Math.trunc(cents));
  const yuan = Math.floor(abs / 100);
  const fen = String(abs % 100).padStart(2, "0");
  return `${negative ? "-" : ""}¥${yuan}.${fen}`;
}

export function availableStock(product: MallProduct, sold: number): number {
  return Math.max(0, product.stock - Math.max(0, sold));
}

export function canPurchase(product: MallProduct, sold: number): boolean {
  return product.published !== false && product.badge !== "soon" && product.priceCents > 0 && availableStock(product, sold) > 0;
}

export function badgeLabel(badge: MallProduct["badge"], left: number): string {
  if (badge === "soon") return "即将上架";
  if (badge === "restocking" || left <= 0) return "补货中";
  if (badge === "low" || left < 5) return "库存紧张";
  return "现货";
}

export function quoteCart(lines: CartLine[], products: MallProduct[], sold: Record<string, number>): { items: QuotedItem[]; totalCents: number } {
  const items: QuotedItem[] = [];
  for (const line of lines) {
    const product = products.find((item) => item.id === line.productId);
    if (!product) continue;
    const left = availableStock(product, sold[product.id] ?? 0);
    if (!canPurchase(product, sold[product.id] ?? 0)) {
      throw new Error(`${product.title} 现在不能购买。`);
    }
    if (line.qty > left) throw new Error(`${product.title} 库存不足。`);
    items.push({
      productId: product.id,
      title: product.title,
      qty: line.qty,
      unitCents: product.priceCents,
    });
  }
  const totalCents = items.reduce((sum, item) => sum + item.qty * item.unitCents, 0);
  return { items, totalCents };
}

export function ownsOrder(order: { ownerSid: string; userId: string | null }, session: { id: string; userId: string | null }): boolean {
  if (order.ownerSid === session.id) return true;
  return Boolean(session.userId && order.userId && order.userId === session.userId);
}
