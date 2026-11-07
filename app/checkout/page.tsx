import type { Metadata } from "next";
import { CheckoutForm } from "@/components/CheckoutForm";

export const metadata: Metadata = { title: "结算" };

export default function CheckoutPage() {
  return (
    <section className="card card-pad">
      <h1 className="text-3xl font-bold">结算</h1>
      <p className="lede mt-2 text-sm">客人可以不注册直接下单。请使用您自己的邮箱接收回执。</p>
      <div className="mt-5">
        <CheckoutForm />
      </div>
    </section>
  );
}
