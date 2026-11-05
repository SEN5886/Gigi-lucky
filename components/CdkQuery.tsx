"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { postJson, readLocalBinding } from "@/lib/browser";
import type { CdkStatusView } from "@/lib/types";

export function CdkQuery({ title = "查询卡密" }: { title?: string }) {
  const [cdk, setCdk] = useState("");
  const [status, setStatus] = useState<CdkStatusView | null>(null);
  const [orderId, setOrderId] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setStatus(null);
    try {
      const payload = await postJson<{ status: CdkStatusView }>("/api/station/cdk-status", { cdk });
      const localId = readLocalBinding(cdk);
      setStatus(payload.status);
      setOrderId(payload.status.orderId || localId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "查询没有完成。");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div>
        <p className="kicker">Query</p>
        <h2 className="display mt-2 text-2xl">{title}</h2>
        <p className="lede mt-2 text-sm">输入原来的卡密。若这笔兑换留下了订单号，可以直接继续查看进度。</p>
      </div>
      <label className="grid gap-2 text-sm">
        卡密
        <input
          className="field"
          value={cdk}
          autoComplete="off"
          spellCheck={false}
          placeholder="xiaojiu- 开头，不要留空格"
          onChange={(event) => setCdk(event.target.value)}
        />
      </label>
      <button className="ghost-button w-fit" type="submit" disabled={pending || cdk.trim().length < 8}>
        {pending ? "查询中" : "查询状态"}
      </button>
      {message ? <p className="alert bad">{message}</p> : null}
      {status ? (
        <div className="alert">
          <p>
            {status.tierLabel} · {status.statusLabel}
          </p>
          {status.note ? <p className="mt-1 text-sm">{status.note}</p> : null}
          {status.email ? <p className="mt-1 text-sm">账号 {status.email}</p> : null}
          {orderId ? (
            <Link className="mt-3 inline-flex text-gold" href={`/order/${orderId}`}>
              查看订单 {orderId}
            </Link>
          ) : (
            <p className="mt-2 text-sm">这次查询没有附带订单号。若兑换是在这台设备提交的，请再试一次，或从兑换记录进入。</p>
          )}
        </div>
      ) : null}
    </form>
  );
}
