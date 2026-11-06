import type { Metadata } from "next";
import { OtpForm } from "@/components/OtpForm";

export const metadata: Metadata = { title: "注册" };

export default function RegisterPage() {
  return (
    <section className="card card-pad mx-auto max-w-lg">
      <h1 className="text-3xl font-bold">注册</h1>
      <p className="lede mt-2 text-sm">第一次验证通过就会建立账户，并带走这台浏览器上尚未归属的订单和兑换记录。</p>
      <div className="mt-5">
        <OtpForm />
      </div>
    </section>
  );
}
