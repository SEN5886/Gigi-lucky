"use client";

import { useEffect, useState } from "react";
import { getJson } from "@/lib/browser";
import { formatYuan } from "@/lib/mall-logic";

type Overview = {
  users: number;
  orders: number;
  pendingOrders: number;
  paidOrders: number;
  failedOrders: number;
  paidCents: number;
  redemptions: number;
  products: number;
  publishedProducts: number;
  soldUnits: number;
};

export function OverviewPanel() {
  const [data, setData] = useState<Overview | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void getJson<{ overview: Overview }>("/api/admin/overview")
      .then((payload) => setData(payload.overview))
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : "总览没有打开。"));
  }, []);

  if (message) return <p className="alert">{message}</p>;
  if (!data) return <p className="lede">正在读取总览。</p>;

  const cards = [
    ["注册用户", String(data.users)],
    ["商城订单", String(data.orders)],
    ["已支付金额", formatYuan(data.paidCents)],
    ["兑换记录", String(data.redemptions)],
    ["在售商品", `${data.publishedProducts} / ${data.products}`],
    ["已售件数", String(data.soldUnits)],
  ];

  return (
    <section className="grid gap-4">
      <h1 className="text-2xl font-bold">数据总览</h1>
      <p className="lede text-sm">数字来自本机商品目录、商城订单和兑换记录。未支付金额不计入已支付。</p>
      <div className="admin-stats">
        {cards.map(([label, value]) => (
          <article key={label} className="admin-stat">
            <span>{label}</span>
            <b>{value}</b>
          </article>
        ))}
      </div>
      <p className="text-sm text-[var(--muted)]">
        待支付 {data.pendingOrders} · 已支付 {data.paidOrders} · 未成功 {data.failedOrders}
      </p>
    </section>
  );
}
