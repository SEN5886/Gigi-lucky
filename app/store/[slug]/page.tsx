import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/AddToCart";
import { findProduct } from "@/lib/mall-catalog";
import { soldMap } from "@/lib/mall-db";
import { availableStock, badgeLabel, canPurchase, categoryLabels, formatYuan } from "@/lib/mall-logic";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = findProduct(slug);
  return { title: product?.title ?? "商品" };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) notFound();
  const sold = await soldMap();
  const left = availableStock(product, sold[product.id] ?? 0);
  const open = canPurchase(product, sold[product.id] ?? 0);

  return (
    <article className="card card-pad mx-auto grid max-w-3xl gap-4">
      <Link className="text-sm text-primary" href="/store">
        ← 返回商店
      </Link>
      <div className="product-top">
        <span className="text-sm text-[var(--muted)]">{categoryLabels[product.category]}</span>
        <span className={open ? "badge" : "badge wait"}>{badgeLabel(product.badge, left)}</span>
      </div>
      <h1 className="text-3xl font-bold">{product.title}</h1>
      <p className="price">{formatYuan(product.priceCents)}</p>
      <p className="lede">{product.description}</p>
      <p className="text-sm text-[var(--muted)]">可售数量 {left}。单次最多 5 件，结算时会再次核对库存和单价。</p>
      <AddToCart productId={product.id} disabled={!open} />
    </article>
  );
}
