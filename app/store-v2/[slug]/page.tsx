import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/AddToCart";
import { ProductGallery } from "@/components/store-v2/ProductGallery";
import { findProduct } from "@/lib/mall-catalog";
import { soldMap } from "@/lib/mall-db";
import { availableStock, badgeLabel, canPurchase, categoryLabels, formatYuan } from "@/lib/mall-logic";

export const dynamic = "force-dynamic";

function coverClass(category: string) {
  return ["chatgpt", "grok", "claude", "codex", "other"].includes(category) ? category : "other";
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = findProduct(slug);
  return { title: product ? `${product.title} · 预览` : "商品" };
}

export default async function StoreV2ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product || product.published === false) notFound();
  const sold = await soldMap();
  const left = availableStock(product, sold[product.id] ?? 0);
  const open = canPurchase(product, sold[product.id] ?? 0);

  return (
    <article className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="grid gap-3">
        <Link className="text-sm font-medium text-primary" href="/store-v2">
          返回 AI商城
        </Link>
        {product.images.length ? (
          <ProductGallery images={product.images} title={product.title} />
        ) : (
          <div className={`cover cover-lg cover-${coverClass(product.category)}`} aria-hidden>
            <span>{product.title.slice(0, 1)}</span>
          </div>
        )}
      </div>
      <div className="card card-pad grid content-start gap-4">
        <div className="product-top">
          <p className="eyebrow">{categoryLabels[product.category]}</p>
          <span className={open ? "badge" : "badge wait"}>{badgeLabel(product.badge, left)}</span>
        </div>
        <h1 className="text-3xl font-bold leading-tight">{product.title}</h1>
        <p className="price">{formatYuan(product.priceCents)}</p>
        <p className="lede text-sm">{product.description}</p>
        <ul className="grid gap-2 text-sm text-[var(--muted)]">
          <li>库存 {left}，单次最多 5 件。结算仍走现有购物车和模拟支付。</li>
          <li>金额由服务端按目录单价计算。</li>
          <li>数字商品，不收集收货地址。</li>
        </ul>
        <div className="buy-panel">
          <AddToCart productId={product.id} disabled={!open} />
        </div>
      </div>
    </article>
  );
}
