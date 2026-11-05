"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getJson } from "@/lib/browser";
import { formatYuan } from "@/lib/mall-logic";

type Order = {
  id: string;
  email: string;
  name: string;
  items: Array<{ title: string; qty: number; unitCents: number }>;
  totalCents: number;
  status: string;
  createdAt: string;
};

export function Receipt({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!orderId) {
      setMessage("没有订单号。");
      return;
    }
    void getJson<{ order: Order }>(`/api/mall/orders/${orderId}`)
      .then((payload) => setOrder(payload.order))
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : "没有找到这笔订单。"));
  }, [orderId]);

  if (message) {
    return (
      <div className="grid gap-3">
        <p className="alert bad">{message}</p>
        <Link className="btn-ghost w-fit" href="/account/orders">
          返回订单列表
        </Link>
      </div>
    );
  }
  if (!order) return <p className="lede">正在读取订单。</p>;

  return (
    <div className="grid gap-3">
      <p className="badge">{order.status === "paid" ? "已支付" : "待支付"}</p>
      <h1 className="text-3xl font-bold">订单 {order.id}</h1>
      <p className="lede text-sm">
        {order.email}
        {order.name ? ` · ${order.name}` : ""} · {order.createdAt}
      </p>
      {order.status === "paid" ? <p className="notice">演示订单已在本地标记为已支付。没有真实扣款，也没有自动发放卡密。</p> : <p className="notice">这笔订单还没有完成支付。</p>}
      <div className="grid gap-2">
        {order.items.map((item) => (
          <div key={item.title} className="row-between text-sm">
            <span>
              {item.title} × {item.qty}
            </span>
            <span>{formatYuan(item.unitCents * item.qty)}</span>
          </div>
        ))}
      </div>
      <strong className="price">{formatYuan(order.totalCents)}</strong>
      <div className="actions">
        <Link className="btn-primary" href="/store">
          继续选购
        </Link>
        <Link className="btn-ghost" href="/redeem">
          去兑换
        </Link>
      </div>
    </div>
  );
}
