"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { postJson } from "@/lib/browser";

export function AddToCart({ productId, disabled }: { productId: string; disabled: boolean }) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function add() {
    setPending(true);
    setMessage("");
    try {
      await postJson("/api/mall/cart", { productId, qty });
      router.push("/cart");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "没有加入购物车。");
      setPending(false);
    }
  }

  return (
    <div className="grid gap-3">
      <div className="qty" aria-label="数量">
        <button type="button" onClick={() => setQty((value) => Math.max(1, value - 1))} aria-label="减少数量">
          −
        </button>
        <span>{qty}</span>
        <button type="button" onClick={() => setQty((value) => Math.min(5, value + 1))} aria-label="增加数量">
          +
        </button>
      </div>
      <button className="btn-primary w-fit" type="button" disabled={disabled || pending} onClick={() => void add()}>
        {disabled ? "暂时不能购买" : pending ? "加入中" : "加入购物车"}
      </button>
      {message ? <p className="alert bad">{message}</p> : null}
    </div>
  );
}
