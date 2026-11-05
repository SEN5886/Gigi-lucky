"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getJson } from "@/lib/browser";
import { formatYuan } from "@/lib/mall-logic";

type Row = { id: string; email: string; totalCents: number; status: string; createdAt: string; items: Array<{ title: string; qty: number }> };
type Payload = { signedIn: boolean; account: Row[]; browser: Row[] };

const statusText: Record<string, string> = { pending: "待支付", paid: "已支付", failed: "未完成" };

function List({ rows }: { rows: Row[] }) {
  if (!rows.length) return <p className="lede text-sm">这里还没有订单。</p>;
  return (
    <div className="grid gap-3">
      {rows.map((order) => (
        <Link key={order.id} href={`/checkout/success?order=${order.id}`} className="card card-pad">
          <div className="row-between">
            <strong>{order.items.map((item) => `${item.title} × ${item.qty}`).join("、")}</strong>
            <span>{formatYuan(order.totalCents)}</span>
          </div>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {statusText[order.status] ?? order.status} · {order.email}
          </p>
        </Link>
      ))}
    </div>
  );
}

export function OrderHistory() {
  const [data, setData] = useState<Payload | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void getJson<Payload>("/api/mall/orders")
      .then(setData)
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : "订单没有载入。"));
  }, []);

  if (message) return <p className="alert bad">{message}</p>;
  if (!data) return <p className="lede">正在读取订单。</p>;

  return (
    <div className="grid gap-5">
      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">账户订单</h2>
        {data.signedIn ? <List rows={data.account} /> : <p className="lede text-sm">登录即将接入。登录后，这里只显示属于该账户的订单。</p>}
        {!data.signedIn ? (
          <Link className="btn-ghost w-fit" href="/login">
            查看登录
          </Link>
        ) : null}
      </section>
      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">这台浏览器的订单</h2>
        <p className="lede text-sm">未登录时，只能看到本机 cookie 对应的结算记录，看不到别人的订单。</p>
        <List rows={data.browser} />
      </section>
    </div>
  );
}
