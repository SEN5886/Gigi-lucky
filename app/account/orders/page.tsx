import type { Metadata } from "next";
import { OrderHistory } from "@/components/OrderHistory";

export const metadata: Metadata = { title: "我的订单" };

export default function AccountOrdersPage() {
  return (
    <section className="mx-auto grid max-w-3xl gap-4">
      <header className="card card-pad">
        <h1 className="text-3xl font-bold">我的订单</h1>
        <p className="lede mt-2 text-sm">账户订单与兑换台的卡密进度是两套记录。兑换进度仍在「订单」页用卡密查询。</p>
      </header>
      <OrderHistory />
    </section>
  );
}
