"use client";

import { useCallback, useEffect, useState } from "react";
import { OrderHistory } from "@/components/OrderHistory";
import { OtpForm } from "@/components/OtpForm";
import { getJson, postJson } from "@/lib/browser";

type User = { id: string; email: string | null; phone: string | null };

export function AccountPanel() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    const payload = await getJson<{ user: User | null }>("/api/mall/session");
    setUser(payload.user);
  }, []);

  useEffect(() => {
    void refresh().catch((error: unknown) => setMessage(error instanceof Error ? error.message : "登录状态没有读取。"));
  }, [refresh]);

  async function logout() {
    setMessage("");
    try {
      await postJson("/api/auth/logout");
      setUser(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "没有退出。");
    }
  }

  return (
    <section className="mx-auto grid max-w-3xl gap-4">
      <header className="card card-pad">
        <p className="eyebrow">预览账户</p>
        <h1 className="mt-2 text-3xl font-bold">消费记录</h1>
        <p className="lede mt-2 text-sm">登录后显示这个账户的商城订单和已打码的兑换记录。验证码只在本地模拟，不会发送短信或邮件。</p>
      </header>
      {message ? <p className="alert">{message}</p> : null}
      {user === undefined ? <p className="lede">正在确认登录状态。</p> : null}
      {user === null ? (
        <div className="card card-pad">
          <OtpForm next="/store-v2/account" onSuccess={() => void refresh()} />
        </div>
      ) : null}
      {user ? (
        <div className="grid gap-4">
          <div className="card card-pad row-between flex-wrap gap-3">
            <p className="min-w-0 text-sm">已登录 · {user.phone || user.email || user.id}</p>
            <button className="btn-ghost" type="button" onClick={() => void logout()}>
              退出
            </button>
          </div>
          <OrderHistory />
        </div>
      ) : null}
    </section>
  );
}
