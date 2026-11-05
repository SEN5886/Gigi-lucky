"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";

const LINKS = [
  { href: "/store", label: "商店" },
  { href: "/redeem", label: "兑换" },
  { href: "/order", label: "订单" },
  { href: "/cart", label: "购物车" },
  { href: "/account/orders", label: "我的" },
  { href: "/login", label: "登录" },
  { href: "/faq", label: "问答" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark");
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    if (next) document.documentElement.dataset.theme = "dark";
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem("gigi-theme", next ? "dark" : "light");
    } catch {
      /* 主题只影响这一台浏览器的显示。 */
    }
  }

  return (
    <header>
      <div className="topbar">Gigi Ai 商店与兑换台 · 请通过 HTTPS 访问正式站点</div>
      <div className="nav-float">
        <Logo />
        <div className="nav-tools">
          <button className="icon-btn" type="button" onClick={toggleTheme} aria-label={dark ? "切换浅色" : "切换深色"}>
            {dark ? "浅" : "深"}
          </button>
          <button
            className="menu-btn"
            type="button"
            aria-expanded={open}
            aria-controls="site-nav"
            onClick={() => setOpen((value) => !value)}
          >
            <i className="burger" />
            <span className="sr-only">{open ? "关闭菜单" : "打开菜单"}</span>
          </button>
        </div>
        <nav id="site-nav" className={open ? "nav-links open" : "nav-links"} aria-label="主导航">
          {LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link key={link.href} href={link.href} className="pill" data-active={active}>
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
