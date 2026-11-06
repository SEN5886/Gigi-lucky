import type { Metadata } from "next";
import Link from "next/link";
import { readContent } from "@/lib/site-content";

export const metadata: Metadata = { title: "售后" };

export default function SupportPage() {
  const support = readContent().support;
  return (
    <article className="card card-pad mx-auto grid max-w-3xl gap-3">
      <h1 className="text-3xl font-bold">{support.title}</h1>
      <p className="lede">{support.body}</p>
      <h2 className="text-lg font-semibold">联系</h2>
      <p className="lede text-sm">邮箱：{support.email}</p>
      <p className="lede text-sm">工作时间：{support.hours}</p>
      <div className="actions">
        <Link className="btn-ghost" href="/order">
          查询兑换
        </Link>
        <Link className="btn-ghost" href="/account/orders">
          消费记录
        </Link>
        <Link className="btn-ghost" href="/faq">
          问答
        </Link>
      </div>
    </article>
  );
}
