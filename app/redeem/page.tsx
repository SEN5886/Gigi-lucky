import type { Metadata } from "next";
import { CdkQuery } from "@/components/CdkQuery";
import { RedeemStation } from "@/components/RedeemStation";
import { OFFERINGS } from "@/lib/catalog";

export const metadata: Metadata = { title: "兑换" };

export default function RedeemPage() {
  return (
    <div className="grid gap-4">
      <div className="store-grid">
        <aside className="card card-pad">
          <h2 className="text-sm font-semibold">商品分类</h2>
          <div className="cat-list">
            {OFFERINGS.map((item) => (
              <a key={item.id} className="cat" href="#redeem-form" data-ready={item.ready}>
                <span>{item.title}</span>
                <small>{item.ready ? "可兑" : "未开通"}</small>
              </a>
            ))}
          </div>
        </aside>
        <section className="card card-pad" id="redeem-form">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Gigi Ai · 兑换台</p>
          <h1 className="mt-2 text-3xl font-bold">礼品卡兑换</h1>
          <p className="lede mt-2 text-sm">ChatGPT、Grok、Codex 可以在这里办理。Claude 与 Team 只做识别。</p>
          <p className="notice mt-4">先核验卡密，再提交账号。一张卡对应一笔订单。</p>
          <div className="mt-5">
            <RedeemStation />
          </div>
        </section>
      </div>
      <section className="card card-pad">
        <CdkQuery />
      </section>
    </div>
  );
}
