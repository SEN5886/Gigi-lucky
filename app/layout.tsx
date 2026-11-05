import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Gigi礼品店",
    template: "%s · Gigi礼品店",
  },
  description: "珍珠白与浅金的礼品卡兑换台，办理 ChatGPT、Grok 与 Codex。Claude 与 Team 尚未开放。",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Noto+Serif+SC:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <a className="sr-only focus:not-sr-only" href="#content">
          跳到内容
        </a>
        <SiteHeader />
        <main id="content" className="mx-auto min-h-[70vh] max-w-6xl px-5 py-10">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
