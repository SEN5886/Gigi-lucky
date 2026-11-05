"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";

const LINKS = [
  { href: "/", label: "首页" },
  { href: "/redeem", label: "兑换" },
  { href: "/order", label: "订单" },
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
      <div className="topbar">ChatGPT、Grok、Codex 自助兑换已开放 · Claude 与 Team 暂未开通</div>
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
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
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
