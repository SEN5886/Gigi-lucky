import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer mt-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="serif tracking-[0.18em]">Gigi礼品店</p>
        <p>卡密兑换台。ChatGPT、Grok、Codex 已开放；Claude 与 Team 尚未开放。本店不设抽奖。</p>
        <Link href="/faq" className="tracking-[0.12em] text-gold">
          兑换问答
        </Link>
      </div>
    </footer>
  );
}
