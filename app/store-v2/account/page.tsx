import type { Metadata } from "next";
import { AccountPanel } from "@/components/store-v2/AccountPanel";

export const metadata: Metadata = { title: "消费记录" };

export default function StoreV2AccountPage() {
  return <AccountPanel />;
}
