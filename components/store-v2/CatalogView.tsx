import Link from "next/link";
import { availableStock, badgeLabel, canPurchase, categories, categoryLabels, formatYuan, type MallProduct } from "@/lib/mall-logic";

function coverClass(category: string) {
  return ["chatgpt", "grok", "claude", "codex", "other"].includes(category) ? category : "other";
}

export function CatalogView({
  products,
  sold,
  selected,
  query,
}: {
  products: MallProduct[];
  sold: Record<string, number>;
  selected: MallProduct["category"] | "all";
  query: string;
}) {
  return (
    <div className="v2-layout">
      <aside className="v2-side card">
        <p className="eyebrow">分类</p>
        <nav className="v2-cats" aria-label="商品分类">
          <Link href={query ? `/store-v2?q=${encodeURIComponent(query)}` : "/store-v2"} data-active={selected === "all"}>
            全部
          </Link>
          {categories.map((item) => (
            <Link
              key={item}
              href={`/store-v2?category=${item}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
              data-active={selected === item}
            >
              {categoryLabels[item]}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="v2-results">
        {products.length === 0 ? <p className="card card-pad lede">没有符合条件的在售商品。</p> : null}
        <div className="product-grid">
          {products.map((product) => {
            const left = availableStock(product, sold[product.id] ?? 0);
            const open = canPurchase(product, sold[product.id] ?? 0);
            return (
              <article key={product.id} className="shop-card card">
                <Link href={`/store-v2/${product.slug}`}>
                  <div className={`cover cover-${coverClass(product.category)}`} aria-hidden>
                    <span>{product.title.slice(0, 1)}</span>
                  </div>
                </Link>
                <div className="shop-body">
                  <div className="product-top">
                    <p className="eyebrow">{categoryLabels[product.category]}</p>
                    <span className={open ? "badge" : "badge wait"}>{badgeLabel(product.badge, left)}</span>
                  </div>
                  <h2 className="text-lg font-semibold leading-snug">
                    <Link href={`/store-v2/${product.slug}`}>{product.title}</Link>
                  </h2>
                  <p className="lede clamp text-sm">{product.summary}</p>
                  <div className="row-between mt-auto">
                    <span className="price text-xl">{formatYuan(product.priceCents)}</span>
                    <Link className="btn-primary" href={`/store-v2/${product.slug}`}>
                      查看详情
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
