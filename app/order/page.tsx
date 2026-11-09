import type { Metadata } from "next";
import { CdkQuery } from "@/components/CdkQuery";

export const metadata: Metadata = { title: "订单" };

export default function OrderIndexPage() {
  return (
    <section className="card card-pad mx-auto max-w-2xl">
      <CdkQuery title="回到一笔订单" />
      <p className="lede mt-5 text-sm">如果您保存了订单号，也可以直接打开 /order/订单号。页面会大约每 5 秒核对进度。</p>
    </section>
  );
}
