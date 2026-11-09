import type { Metadata } from "next";
import { OrderHistory } from "@/components/OrderHistory";

export const metadata: Metadata = { title: "我的订单" };

export default function AccountOrdersPage() {
  return (
    <section className="mx-auto grid max-w-3xl gap-4">
      <header className="card card-pad">
        <h1 className="text-3xl font-bold">消费记录</h1>
        <p className="lede mt-2 text-sm">这里汇总已登录账户的商城订单，以及挂到该账户的兑换记录。卡密正文不会显示。</p>
      </header>
      <OrderHistory />
    </section>
  );
}
