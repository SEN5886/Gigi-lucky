import type { Metadata } from "next";
import { OrderTracker } from "@/components/OrderTracker";

export const metadata: Metadata = { title: "订单进度" };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <section className="card card-pad">
      <OrderTracker orderId={id} />
    </section>
  );
}
