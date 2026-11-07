import type { Metadata } from "next";
import { AdminConsole } from "@/components/AdminConsole";

export const metadata: Metadata = { title: "运营后台" };

export default function AdminPage() {
  return <AdminConsole />;
}
