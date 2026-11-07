"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getJson, postJson } from "@/lib/browser";
import { formatYuan } from "@/lib/mall-logic";

type Line = { productId: string; title: string; qty: number; lineCents: number; purchasable: boolean };
type Cart = { lines: Line[]; totalCents: number };
type IntentResponse = {
  order: { id: string; status: string };
  intent: { id: string; mode: "mock" | "live"; status: string; message: string };
};

export function CheckoutForm() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [paymentMode, setPaymentMode] = useState<"mock" | "live">("mock");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [key] = useState(() => `chk_${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`);

  useEffect(() => {
    void (async () => {
      const [nextCart, session] = await Promise.all([
        getJson<Cart>("/api/mall/cart"),
        getJson<{ paymentMode: "mock" | "live" }>("/api/mall/session"),
      ]);
      setCart(nextCart);
      setPaymentMode(session.paymentMode);
    })().catch((error: unknown) => setMessage(error instanceof Error ? error.message : "结算信息没有载入。"));
  }, []);

  async function submit() {
    if (!cart?.lines.length) return;
    setPending(true);
    setMessage("");
    try {
      const created = await postJson<IntentResponse>("/api/payments/intents", { email, name, idempotencyKey: key });
      if (created.order.status === "paid") {
        router.push(`/checkout/success?order=${created.order.id}`);
        return;
      }
      if (created.intent.mode === "mock" && created.intent.status === "requires_confirmation") {
        const confirmed = await postJson<{ order: { id: string } }>("/api/payments/confirm", { intentId: created.intent.id });
        router.push(`/checkout/success?order=${confirmed.order.id}`);
        return;
      }
      setMessage(created.intent.message);
      setPending(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "结算没有完成。");
      setPending(false);
    }
  }

  if (!cart) return <p className="lede">正在准备结算。</p>;
  if (!cart.lines.length) {
    return (
      <div className="grid gap-3">
        <p className="lede">购物车是空的，还不能结算。</p>
        <Link className="btn-primary w-fit" href="/store">
          返回商店
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <h2 className="text-lg font-semibold">联系方式</h2>
        <p className="lede text-sm">可以不登录直接结算。邮箱只用于这笔订单的回执，不会拿去注册账号。</p>
        {paymentMode === "mock" ? <p className="notice">当前是模拟支付，确认后不会产生真实扣款。</p> : <p className="notice">真实支付尚未接入，订单会停在待支付。</p>}
        <label className="grid gap-2 text-sm">
          邮箱
          <input className="field" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="grid gap-2 text-sm">
          称呼（可选）
          <input className="field" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <button className="btn-primary w-fit" type="submit" disabled={pending}>
          {pending ? "提交中" : "提交订单"}
        </button>
        {message ? <p className="alert">{message}</p> : null}
      </form>
      <aside className="card card-pad h-fit">
        <h2 className="text-lg font-semibold">订单摘要</h2>
        <div className="mt-3 grid gap-2 text-sm">
          {cart.lines.map((line) => (
            <div key={line.productId} className="row-between">
              <span>
                {line.title} × {line.qty}
              </span>
              <span>{formatYuan(line.lineCents)}</span>
            </div>
          ))}
        </div>
        <div className="row-between mt-4">
          <span>应付</span>
          <strong className="price">{formatYuan(cart.totalCents)}</strong>
        </div>
      </aside>
    </div>
  );
}
