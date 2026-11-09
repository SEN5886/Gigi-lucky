"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { ServiceWidget } from "@/components/ServiceWidget";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import type { SiteContent } from "@/lib/site-content";

const V2_LINKS = [
  { href: "/", label: "首页" },
  { href: "/store-v2", label: "AI商城" },
  { href: "/redeem", label: "兑换中心" },
  { href: "/order", label: "订单查询" },
  { href: "/faq", label: "教程帮助" },
  { href: "/store-v2/account", label: "账户" },
  { href: "/cart", label: "购物车" },
];

function active(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/store-v2") return pathname === "/store-v2" || (pathname.startsWith("/store-v2/") && !pathname.startsWith("/store-v2/account"));
  return pathname === href || pathname.startsWith(`${href}/`);
}

function StoreV2Chrome({ content, children }: { content: SiteContent; children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="v2-bar">
        <div className="v2-bar-inner">
          <Logo />
          <button className="v2-menu" type="button" aria-expanded={open} aria-controls="v2-nav" onClick={() => setOpen((value) => !value)}>
            <span className="sr-only">{open ? "关闭菜单" : "打开菜单"}</span>
            菜单
          </button>
          <nav id="v2-nav" className={open ? "v2-nav open" : "v2-nav"} aria-label="商城预览导航">
            {V2_LINKS.map((link) => (
              <Link key={link.href} href={link.href} data-active={active(pathname, link.href)} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <div className="v2-announce">{content.banner}</div>
      <main id="content" className="v2-page">
        {children}
      </main>
      <footer className="v2-foot">
        <p>{content.footer.copyright}</p>
        <p>{content.footer.line}</p>
        <p>
          客服：{content.support.email} · {content.support.hours}
        </p>
        <p className="v2-foot-links">
          <Link href="/privacy">隐私</Link>
          <Link href="/support">售后</Link>
          <Link href="/faq">帮助</Link>
          <Link href="/store">当前正式商店</Link>
        </p>
        <p>运营主体和备案号尚未写入站点配置，本预览不展示备案信息。</p>
      </footer>
      <ServiceWidget service={content.service} support={content.support} />
    </>
  );
}

export function SiteChrome({ content, children }: { content: SiteContent; children: React.ReactNode }) {
  const pathname = usePathname() || "";
  if (pathname.startsWith("/store-v2")) {
    return <StoreV2Chrome content={content}>{children}</StoreV2Chrome>;
  }
  if (pathname.startsWith("/admin")) {
    return <main id="content" className="admin-frame">{children}</main>;
  }
  return (
    <>
      <SiteHeader content={content} />
      <main id="content" className="shell">
        {children}
      </main>
      <SiteFooter content={content} />
      <ServiceWidget service={content.service} />
    </>
  );
}
