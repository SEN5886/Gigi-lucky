"use client";

import { useEffect, useState } from "react";
import { when } from "@/components/admin/format";
import type { PublicOrder, PublicRedemption } from "@/lib/admin-ops";
import { orderStatusLabel } from "@/lib/admin-ops";
import { getJson } from "@/lib/browser";
import { formatYuan } from "@/lib/mall-logic";

export function OrdersPanel() {
  const [orders, setOrders] = useState<PublicOrder[]>([]);
  const [redemptions, setRedemptions] = useState<PublicRedemption[]>([]);
  const [status, setStatus] = useState<"all" | PublicOrder["status"]>("all");
  const [tab, setTab] = useState<"mall" | "redeem">("mall");
  const [message, setMessage] = useState("");

  useEffect(() => {
    void getJson<{ orders: PublicOrder[]; redemptions: PublicRedemption[] }>("/api/admin/orders")
      .then((payload) => {
        setOrders(payload.orders);
        setRedemptions(payload.redemptions);
      })
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : "订单没有打开。"));
  }, []);

  const visible = orders.filter((order) => status === "all" || order.status === status);

  return (
    <section className="grid gap-4">
      <h1 className="text-2xl font-bold">订单管理</h1>
      <p className="lede text-sm">商城订单来自本站结算档案。兑换记录只显示已打码的卡密，不能在这里退款或补发卡密。</p>
      <div className="admin-filters">
        <button className="btn-ghost" type="button" data-active={tab === "mall"} onClick={() => setTab("mall")}>商城订单</button>
        <button className="btn-ghost" type="button" data-active={tab === "redeem"} onClick={() => setTab("redeem")}>兑换记录</button>
      </div>
      {message ? <p className="alert">{message}</p> : null}
      {tab === "mall" ? (
        <>
          <label className="grid w-fit gap-1 text-sm">
            状态
            <select className="field" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
              <option value="all">全部</option>
              <option value="pending">待支付</option>
              <option value="paid">已支付</option>
              <option value="failed">未成功</option>
            </select>
          </label>
          {visible.length === 0 ? <p className="text-sm text-[var(--muted)]">没有符合条件的商城订单。</p> : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>订单</th><th>顾客</th><th>金额</th><th>状态</th><th>时间</th></tr></thead>
                <tbody>
                  {visible.map((order) => (
                    <tr key={order.id}>
                      <td>{order.id}<div className="text-sm text-[var(--muted)]">{order.items.map((item) => `${item.title} × ${item.qty}`).join("、")}</div></td>
                      <td>{order.email || "未留邮箱"}<div className="text-sm text-[var(--muted)]">{order.userId || "未登录访客"}</div></td>
                      <td>{formatYuan(order.totalCents)}</td>
                      <td>{orderStatusLabel(order.status)}</td>
                      <td>{when(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : redemptions.length === 0 ? <p className="text-sm text-[var(--muted)]">还没有兑换记录。</p> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>项目</th><th>卡密</th><th>订单号</th><th>账户</th><th>时间</th></tr></thead>
            <tbody>
              {redemptions.map((row) => (
                <tr key={row.id}>
                  <td>{row.label}</td>
                  <td>{row.maskedCode}</td>
                  <td>{row.orderId}</td>
                  <td>{row.userId || "未登录访客"}</td>
                  <td>{when(row.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
