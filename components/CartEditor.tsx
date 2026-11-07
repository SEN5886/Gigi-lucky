"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getJson, postJson } from "@/lib/browser";
import { formatYuan } from "@/lib/mall-logic";

type Line = {
  productId: string;
  slug: string;
  title: string;
  qty: number;
  unitCents: number;
  lineCents: number;
  available: number;
  purchasable: boolean;
};

type Cart = { lines: Line[]; totalCents: number; count: number };

export function CartEditor() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    const next = await getJson<Cart>("/api/mall/cart");
    setCart(next);
  }

  useEffect(() => {
    void load().catch((error: unknown) => setMessage(error instanceof Error ? error.message : "购物车没有载入。"));
  }, []);

  async function update(productId: string, qty: number) {
    setMessage("");
    try {
      setCart(await postJson<Cart>("/api/mall/cart", { productId, qty }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "数量没有更新。");
    }
  }

  if (!cart) return <p className="lede">正在读取购物车。</p>;
  if (!cart.lines.length) {
    return (
      <div className="grid gap-3">
        <p className="lede">购物车还是空的。可以从商店挑选数字商品，已有卡密请走兑换台。</p>
        <div className="actions">
          <Link className="btn-primary" href="/store">
            去商店
          </Link>
          <Link className="btn-ghost" href="/redeem">
            去兑换
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {cart.lines.map((line) => (
        <div key={line.productId} className="grid gap-2 border-b border-[var(--line)] pb-4">
          <div className="row-between">
            <Link href={`/store/${line.slug}`} className="font-semibold">
              {line.title}
            </Link>
            <span>{formatYuan(line.lineCents)}</span>
          </div>
          <p className="text-sm text-[var(--muted)]">单价 {formatYuan(line.unitCents)}</p>
          {!line.purchasable ? <p className="text-sm text-[var(--danger)]">这件商品当前不能结算，请移除。</p> : null}
          <div className="actions">
            <div className="qty">
              <button type="button" aria-label={`减少${line.title}`} onClick={() => void update(line.productId, line.qty - 1)}>
                −
              </button>
              <span>{line.qty}</span>
              <button type="button" aria-label={`增加${line.title}`} onClick={() => void update(line.productId, Math.min(5, line.qty + 1))}>
                +
              </button>
            </div>
            <button className="btn-ghost" type="button" onClick={() => void update(line.productId, 0)}>
              移除
            </button>
          </div>
        </div>
      ))}
      {message ? <p className="alert bad">{message}</p> : null}
      <div className="row-between">
        <span className="text-[var(--muted)]">合计</span>
        <strong className="price">{formatYuan(cart.totalCents)}</strong>
      </div>
      <Link className="btn-primary w-fit" href="/checkout">
        去结算
      </Link>
    </div>
  );
}
