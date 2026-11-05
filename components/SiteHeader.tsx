"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "首页" },
  { href: "/redeem", label: "兑换" },
  { href: "/order", label: "订单" },
  { href: "/faq", label: "问答" },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="site-header">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="seal compact" aria-hidden>
            礼
          </span>
          <span>
            <span className="latin block text-xl leading-none text-gold">Gigi</span>
            <span className="serif block text-sm tracking-[0.22em]">礼品店</span>
          </span>
        </Link>
        <nav className="flex items-center gap-5" aria-label="主导航">
          {LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href} className="nav-link" data-active={active}>
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
