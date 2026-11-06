import type { Metadata } from "next";
import { AdminConsole } from "@/components/AdminConsole";

export const metadata: Metadata = { title: "后台" };

export default function AdminPage() {
  return (
    <section className="card card-pad">
      <AdminConsole />
    </section>
  );
}
