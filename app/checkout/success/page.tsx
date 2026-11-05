import type { Metadata } from "next";
import { Receipt } from "@/components/Receipt";

export const metadata: Metadata = { title: "订单回执" };

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  return (
    <section className="card card-pad mx-auto max-w-3xl">
      <Receipt orderId={order ?? ""} />
    </section>
  );
}
