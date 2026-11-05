import type { Metadata } from "next";
import { OrderTracker } from "@/components/OrderTracker";

export const metadata: Metadata = { title: "订单进度" };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <section className="panel">
      <div className="panel-body">
        <OrderTracker orderId={id} />
      </div>
    </section>
  );
}
