import Link from "next/link";

import type { SiteContent } from "@/lib/site-content";

export function SiteFooter({ content }: { content: SiteContent }) {
  return (
    <footer className="site-footer">
      <p>{content.footer.copyright}</p>
      <p>{content.footer.line}</p>
      <p className="filters" style={{ justifyContent: "center" }}>
        <Link href="/privacy">隐私</Link>
        <Link href="/support">售后</Link>
        <Link href="/store">商店</Link>
        <Link href="/redeem">兑换</Link>
        <Link href="/admin">管理</Link>
      </p>
    </footer>
  );
}
