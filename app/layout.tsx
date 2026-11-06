import type { Metadata } from "next";
import { ServiceWidget } from "@/components/ServiceWidget";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { readContent } from "@/lib/site-content";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Gigi Ai",
    template: "%s · Gigi Ai",
  },
  description: "Gigi Ai 礼品卡兑换台，办理 ChatGPT、Grok 与 Codex。Claude 与 Team 暂未开通。",
  icons: { icon: "/favicon.svg" },
};

const themeBoot = `try{if(localStorage.getItem("gigi-theme")==="dark")document.documentElement.dataset.theme="dark"}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const content = readContent();
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body>
        <a className="sr-only focus:not-sr-only" href="#content">
          跳到内容
        </a>
        <SiteHeader content={content} />
        <main id="content" className="shell">
          {children}
        </main>
        <SiteFooter content={content} />
        <ServiceWidget service={content.service} />
      </body>
    </html>
  );
}
