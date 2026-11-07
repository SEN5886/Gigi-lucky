import type { Metadata } from "next";
import Link from "next/link";
import { CatalogView } from "@/components/store-v2/CatalogView";
import { paymentMode } from "@/lib/env";
import { publicCatalog } from "@/lib/mall-catalog";
import { soldMap } from "@/lib/mall-db";
import { categories, type MallProduct } from "@/lib/mall-logic";
import { readContent } from "@/lib/site-content";

export const metadata: Metadata = { title: "AI商城预览" };
export const dynamic = "force-dynamic";

function isCategory(value: string | undefined): value is MallProduct["category"] {
  return categories.some((item) => item === value);
}

export default async function StoreV2Page({ searchParams }: { searchParams: Promise<{ category?: string; q?: string }> }) {
  const params = await searchParams;
  const selected = isCategory(params.category) ? params.category : "all";
  const query = (params.q ?? "").trim().slice(0, 40);
  const sold = await soldMap();
  const content = readContent();
  const needle = query.toLowerCase();
  const products = publicCatalog().filter((item) => {
    if (selected !== "all" && item.category !== selected) return false;
    if (!needle) return true;
    return `${item.title} ${item.summary} ${item.description}`.toLowerCase().includes(needle);
  });

  return (
    <div className="grid gap-4">
      <section className="v2-intro card">
        <p className="eyebrow">预览 · 正式商店仍是 /store</p>
        <h1 className="mt-2 text-3xl font-bold">{content.heroTitle}</h1>
        <p className="lede mt-2 max-w-2xl">{content.heroBody}</p>
        <form className="v2-search" action="/store-v2" method="get">
          {selected !== "all" ? <input type="hidden" name="category" value={selected} /> : null}
          <label className="sr-only" htmlFor="store-v2-q">
            搜索商品
          </label>
          <input id="store-v2-q" className="field" name="q" defaultValue={query} placeholder="搜索商品名称" maxLength={40} />
          <button className="btn-primary" type="submit">
            搜索
          </button>
        </form>
        <p className="mt-3 text-sm text-[var(--muted)]">
          {paymentMode() === "mock" ? "演示目录，模拟支付不会扣款。" : "真实支付尚未开通。"}
          已有卡密请走 <Link href="/redeem">兑换中心</Link>。
        </p>
      </section>
      <CatalogView products={products} sold={sold} selected={selected} query={query} />
    </div>
  );
}
