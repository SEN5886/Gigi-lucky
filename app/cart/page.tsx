import type { Metadata } from "next";
import { CartEditor } from "@/components/CartEditor";

export const metadata: Metadata = { title: "购物车" };

export default function CartPage() {
  return (
    <section className="card card-pad mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">购物车</h1>
      <p className="lede mt-2 text-sm">数量和金额以服务端目录为准。移除后会立刻更新。</p>
      <div className="mt-5">
        <CartEditor />
      </div>
    </section>
  );
}
