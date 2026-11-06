import type { Metadata } from "next";
import Link from "next/link";
import { paymentMode } from "@/lib/env";
import { publicCatalog } from "@/lib/mall-catalog";
import { soldMap } from "@/lib/mall-db";
import { availableStock, badgeLabel, canPurchase, categories, categoryLabels, formatYuan, type MallProduct } from "@/lib/mall-logic";

export const metadata: Metadata = { title: "商店" };
export const dynamic = "force-dynamic";

function isCategory(value: string | undefined): value is MallProduct["category"] {
  return categories.some((item) => item === value);
}

export default async function StorePage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const selected = isCategory(category) ? category : "all";
  const sold = await soldMap();
  const products = publicCatalog().filter((item) => selected === "all" || item.category === selected);

  return (
    <div className="grid gap-4">
      <header className="card card-pad">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Gigi Ai · 商店</p>
        <h1 className="mt-2 text-3xl font-bold">数字商品</h1>
        <p className="lede mt-2 text-sm">
          选择商品后加入购物车再结算。已有卡密请使用兑换台。
          {paymentMode() === "mock" ? " 当前价格与库存是演示数据，模拟支付不会扣款。" : " 真实支付尚未开通。"}
        </p>
        <div className="filters mt-4" aria-label="商品分类">
          <Link className="pill" data-active={selected === "all"} href="/store">
            全部
          </Link>
          {categories.map((item) => (
            <Link key={item} className="pill" data-active={selected === item} href={`/store?category=${item}`}>
              {categoryLabels[item]}
            </Link>
          ))}
        </div>
      </header>
      <div className="product-grid">
        {products.map((product) => {
          const left = availableStock(product, sold[product.id] ?? 0);
          const open = canPurchase(product, sold[product.id] ?? 0);
          return (
            <article key={product.id} className="card card-pad product-card">
              <div className="product-top">
                <span className="cat-icon">{categoryLabels[product.category].slice(0, 2)}</span>
                <span className={open ? "badge" : "badge wait"}>{badgeLabel(product.badge, left)}</span>
              </div>
              <h2 className="text-lg font-semibold">
                <Link href={`/store/${product.slug}`}>{product.title}</Link>
              </h2>
              <p className="lede text-sm">{product.summary}</p>
              <div className="row-between">
                <span className="price text-lg">{formatYuan(product.priceCents)}</span>
                <Link className={open ? "btn-primary" : "btn-ghost"} href={`/store/${product.slug}`}>
                  {open ? "选购" : "查看"}
                </Link>
              </div>
            </article>
          );
        })}
      </div>
      {products.length === 0 ? <p className="card card-pad lede">这个分类里还没有商品。</p> : null}
    </div>
  );
}
