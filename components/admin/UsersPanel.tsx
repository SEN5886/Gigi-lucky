"use client";

import { FormEvent, useEffect, useState } from "react";
import { when } from "@/components/admin/format";
import type { AdminUserRow, PublicOrder, PublicRedemption } from "@/lib/admin-ops";
import { orderStatusLabel } from "@/lib/admin-ops";
import { getJson, postJson } from "@/lib/browser";
import { formatYuan } from "@/lib/mall-logic";

type Account = { id: string; phone: string | null; email: string | null; createdAt: string; note: string };
type Detail = { user: Account; orders: PublicOrder[]; redemptions: PublicRedemption[] };

export function UsersPanel() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");

  async function load(q: string) {
    const payload = await getJson<{ users: AdminUserRow[] }>(`/api/admin/users?q=${encodeURIComponent(q)}`);
    setRows(payload.users);
  }

  useEffect(() => {
    void load("").catch((error: unknown) => setMessage(error instanceof Error ? error.message : "用户列表没有打开。"));
  }, []);

  async function search(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      await load(query);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "没有搜到。");
    }
  }

  async function openUser(id: string) {
    setMessage("");
    try {
      const payload = await getJson<Detail>(`/api/admin/users/${id}`);
      setDetail(payload);
      setNote(payload.user.note);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "没有打开这个用户。");
    }
  }

  async function saveNote(event: FormEvent) {
    event.preventDefault();
    if (!detail) return;
    setMessage("");
    try {
      const payload = await postJson<Detail>(`/api/admin/users/${detail.user.id}`, { note });
      setDetail(payload);
      setNote(payload.user.note);
      setMessage("备注已保存。");
      await load(query);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "备注没有保存。");
    }
  }

  return (
    <section className="grid gap-4">
      <h1 className="text-2xl font-bold">用户管理</h1>
      <p className="lede text-sm">这里是验证通过后写入本地档案的账户。可以按手机号、邮箱、用户编号或备注查找，并查看该账户的订单和兑换记录。</p>
      <form className="admin-filters" onSubmit={search}>
        <input className="field" value={query} placeholder="手机号、邮箱或备注" onChange={(event) => setQuery(event.target.value)} />
        <button className="btn-primary" type="submit">搜索</button>
        <button className="btn-ghost" type="button" onClick={() => { setQuery(""); void load("").catch(() => setMessage("用户列表没有打开。")); }}>
          全部
        </button>
      </form>
      {message ? <p className="alert" role="status">{message}</p> : null}
      {rows.length === 0 ? <p className="lede text-sm">还没有符合条件的注册用户。</p> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>账户</th>
                <th>注册时间</th>
                <th>订单</th>
                <th>兑换</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div>{row.phone || "未留手机"}</div>
                    <div className="text-sm text-[var(--muted)]">{row.email || "未留邮箱"}</div>
                  </td>
                  <td>{when(row.createdAt)}</td>
                  <td>{row.orderCount}</td>
                  <td>{row.redemptionCount}</td>
                  <td><button className="btn-ghost" type="button" onClick={() => void openUser(row.id)}>查看</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {detail ? (
        <div className="grid gap-3">
          <h2 className="text-xl font-semibold">账户详情</h2>
          <p className="text-sm">编号 {detail.user.id}</p>
          <p className="text-sm">手机 {detail.user.phone || "未留"} · 邮箱 {detail.user.email || "未留"} · 注册于 {when(detail.user.createdAt)}</p>
          <form className="grid gap-2" onSubmit={saveNote}>
            <label className="grid gap-1 text-sm">
              客服备注
              <textarea className="field" value={note} maxLength={500} onChange={(event) => setNote(event.target.value)} />
            </label>
            <button className="btn-primary w-fit" type="submit">保存备注</button>
          </form>
          <h3 className="font-semibold">商城订单</h3>
          {detail.orders.length === 0 ? <p className="text-sm text-[var(--muted)]">这个账户还没有商城订单。</p> : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>订单</th><th>金额</th><th>状态</th><th>时间</th></tr></thead>
                <tbody>
                  {detail.orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.id}<div className="text-sm text-[var(--muted)]">{order.items.map((item) => `${item.title} × ${item.qty}`).join("、")}</div></td>
                      <td>{formatYuan(order.totalCents)}</td>
                      <td>{orderStatusLabel(order.status)}</td>
                      <td>{when(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <h3 className="font-semibold">兑换记录</h3>
          {detail.redemptions.length === 0 ? <p className="text-sm text-[var(--muted)]">这个账户还没有兑换记录。完整卡密不会显示在后台。</p> : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>项目</th><th>卡密</th><th>订单号</th><th>时间</th></tr></thead>
                <tbody>
                  {detail.redemptions.map((row) => (
                    <tr key={row.id}>
                      <td>{row.label}</td>
                      <td>{row.maskedCode}</td>
                      <td>{row.orderId}</td>
                      <td>{when(row.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
