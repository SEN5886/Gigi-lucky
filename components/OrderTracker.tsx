"use client";

import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useRef, useState } from "react";
import { ClientError, getJson, postJson } from "@/lib/browser";
import { POLL_MS } from "@/lib/catalog";
import type { CustomerActionView, OrderView, StripeChallenge } from "@/lib/types";

const stripeCache = new Map<string, ReturnType<typeof loadStripe>>();

const STAGES = ["受理", "处理", "银行验证", "完成"];

function stageIndex(order: OrderView): number {
  if (order.status === "done" || order.status === "success") return 3;
  if (order.needsBankCheck) return 2;
  if (["processing", "running", "queued", "manual_review"].includes(order.status)) return 1;
  return 0;
}

async function stripeFor(publishableKey: string) {
  const cached = stripeCache.get(publishableKey);
  if (cached) return cached;
  const created = loadStripe(publishableKey, { locale: "zh" });
  stripeCache.set(publishableKey, created);
  return created;
}

export function OrderTracker({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<OrderView | null>(null);
  const [message, setMessage] = useState("正在读取订单。");
  const [tone, setTone] = useState<"neutral" | "ok" | "bad">("neutral");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const acting = useRef(false);
  const attempted = useRef(new Set<string>());
  const orderRef = useRef<OrderView | null>(null);

  useEffect(() => {
    orderRef.current = order;
  }, [order]);

  useEffect(() => {
    let timer = 0;
    let stopped = false;

    async function tick() {
      if (stopped) return;
      if (acting.current) {
        timer = window.setTimeout(tick, POLL_MS);
        return;
      }
      try {
        const payload = await getJson<{ order: OrderView }>(`/api/station/orders/${encodeURIComponent(orderId)}`);
        if (stopped) return;
        setOrder(payload.order);
        setTone(payload.order.status === "failed" || payload.order.status === "error" ? "bad" : payload.order.terminal ? "ok" : "neutral");
        setMessage(payload.order.note || `订单${payload.order.statusLabel}。页面大约每 5 秒核对一次。`);
        if (payload.order.terminal) return;
      } catch (error) {
        if (stopped) return;
        setTone("bad");
        setMessage(error instanceof Error ? error.message : "订单暂时没有读到。");
        const status = error instanceof ClientError ? error.status : 0;
        if (status === 400 || status === 401 || status === 403 || status === 404 || status === 503) return;
      }
      timer = window.setTimeout(tick, document.hidden ? 30_000 : POLL_MS);
    }

    function onVisible() {
      if (document.hidden || stopped || orderRef.current?.terminal) return;
      window.clearTimeout(timer);
      void tick();
    }

    void tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [orderId]);

  async function postAction(body: Record<string, unknown>) {
    const payload = await postJson<{ order: OrderView; stripe: StripeChallenge | null }>(
      `/api/station/orders/${encodeURIComponent(orderId)}/customer-action`,
      body,
    );
    setOrder(payload.order);
    return payload;
  }

  async function runStripe(action: CustomerActionView) {
    if (acting.current) return;
    acting.current = true;
    setBusy(true);
    setTone("neutral");
    setMessage("正在连接银行验证。");
    try {
      const started = await postAction({
        action: "start",
        actionId: action.actionId,
        actionKey: action.actionKey,
      });
      if (!started.stripe) {
        setMessage(started.order.note || "原订单没有要求新的银行验证，已按最新状态更新。");
        setTone(started.order.terminal ? "ok" : "neutral");
        return;
      }
      const stripe = await stripeFor(started.stripe.publishableKey);
      if (!stripe) throw new Error("银行验证组件没有载入，请刷新页面后再试。");
      const result = await stripe.handleNextAction({ clientSecret: started.stripe.clientSecret });
      if (result.error) {
        setTone("bad");
        setMessage(result.error.message || "银行验证没有完成，可以重新发起。");
        await postAction({ action: "recheck", actionId: action.actionId, actionKey: action.actionKey });
        return;
      }
      const completed = await postAction({
        action: "complete",
        actionId: action.actionId,
        actionKey: action.actionKey,
        paymentIntentId: result.paymentIntent?.id,
        paymentIntentStatus: result.paymentIntent?.status,
        cancelled: false,
      });
      const refreshed = await postAction({
        action: "recheck",
        actionId: completed.order.customerAction?.actionId || action.actionId,
        actionKey: completed.order.customerAction?.actionKey || action.actionKey,
      });
      setTone(refreshed.order.terminal ? "ok" : "neutral");
      setMessage(refreshed.order.note || "银行验证已提交，正在等待原订单确认。");
    } catch (error) {
      setTone("bad");
      setMessage(error instanceof Error ? error.message : "银行验证没有完成。");
    } finally {
      acting.current = false;
      setBusy(false);
    }
  }

  useEffect(() => {
    const action = order?.customerAction;
    if (!order?.needsBankCheck || !action || action.type !== "stripe_next_action") return;
    if (!action.actionKey || attempted.current.has(action.actionKey)) return;
    if (action.expiresAt && action.expiresAt <= Date.now()) return;
    attempted.current.add(action.actionKey);
    void runStripe(action);
    // 同一 actionKey 只自动发起一次，避免轮询把银行弹窗重复打开。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  async function recheck() {
    const action = order?.customerAction;
    setBusy(true);
    try {
      const payload = await postAction({
        action: "recheck",
        actionId: action?.actionId,
        actionKey: action?.actionKey,
      });
      setMessage(payload.order.note || "已重新核查原订单。");
      setTone(payload.order.terminal ? "ok" : "neutral");
    } catch (error) {
      setTone("bad");
      setMessage(error instanceof Error ? error.message : "重新核查没有完成。");
    } finally {
      setBusy(false);
    }
  }

  function retryBank() {
    const action = order?.customerAction;
    if (!action) return;
    if (action.actionKey) attempted.current.delete(action.actionKey);
    void runStripe(action);
  }

  const current = order ? stageIndex(order) : -1;

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Order</p>
          <h1 className="display mt-2 text-3xl">{order?.statusLabel ?? "读取订单"}</h1>
        </div>
        <button
          className="ghost-button"
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(orderId);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1600);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? "已复制" : "复制订单号"}
        </button>
      </div>
      <p className="text-sm tracking-wide text-[var(--muted)]">订单号 {orderId}</p>
      <div className="timeline" aria-label="订单阶段">
        {STAGES.map((label, index) => (
          <span key={label} data-on={index <= current}>
            <i />
            {label}
          </span>
        ))}
      </div>
      <p className={tone === "neutral" ? "alert" : `alert ${tone}`} role="status">
        {message}
      </p>
      {order ? (
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[var(--muted)]">卡种</dt>
            <dd>{order.tier || order.product || "以原订单为准"}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">账号</dt>
            <dd>{order.email || "原订单未返回"}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">更新时间</dt>
            <dd>{order.updatedAt || "等待下一次核对"}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">轮询</dt>
            <dd>{order.terminal ? "已停止" : "约每 5 秒"}</dd>
          </div>
        </dl>
      ) : null}
      {order?.needsBankCheck ? (
        <div className="grid gap-3">
          <p className="lede text-sm">
            {order.customerAction?.type === "stripe_next_action"
              ? "这笔订单需要在本页完成银行验证。验证由 Stripe 弹出，本店不接收卡号。"
              : "原订单还停在验证步骤。可以重新核查；若需要其他验证方式，请按页面提示联系店主。"}
          </p>
          <div className="flex flex-wrap gap-3">
            {order.customerAction?.type === "stripe_next_action" ? (
              <button className="gold-button" type="button" disabled={busy} onClick={retryBank}>
                {busy ? "验证中" : "继续银行验证"}
              </button>
            ) : null}
            <button className="ghost-button" type="button" disabled={busy} onClick={() => void recheck()}>
              重新核查
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
