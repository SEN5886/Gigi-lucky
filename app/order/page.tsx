import type { Metadata } from "next";
import { CdkQuery } from "@/components/CdkQuery";

export const metadata: Metadata = { title: "订单" };

export default function OrderIndexPage() {
  return (
    <section className="panel mx-auto max-w-2xl">
      <div className="panel-body">
        <CdkQuery title="回到一笔订单" />
        <p className="lede mt-6 text-sm">如果您保存了订单号，也可以直接打开 /order/订单号。页面会大约每 5 秒向原订单核对进度。</p>
      </div>
    </section>
  );
}
