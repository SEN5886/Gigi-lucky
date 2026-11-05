import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "售后" };

export default function SupportPage() {
  return (
    <article className="card card-pad mx-auto grid max-w-3xl gap-3">
      <h1 className="text-3xl font-bold">售后</h1>
      <p className="lede">未完成的兑换先用原卡密查询，不要重复提交。商城演示订单不会自动退款，因为没有真实扣款。</p>
      <h2 className="text-lg font-semibold">联系</h2>
      <p className="lede text-sm">邮箱：support@example.com（占位，接入前请换成店铺邮箱）</p>
      <p className="lede text-sm">工作时间：每天 12:00–02:00（占位）</p>
      <div className="actions">
        <Link className="btn-ghost" href="/order">
          查询兑换
        </Link>
        <Link className="btn-ghost" href="/account/orders">
          商城订单
        </Link>
        <Link className="btn-ghost" href="/faq">
          问答
        </Link>
      </div>
    </article>
  );
}
