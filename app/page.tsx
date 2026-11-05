import Link from "next/link";
import { OFFERINGS } from "@/lib/catalog";

const STEPS = [
  { title: "核验卡密", copy: "系统认出卡种，并确认这张卡是否还能办理。" },
  { title: "提交账号", copy: "只使用您自己的登录信息。会话不写入订单档案。" },
  { title: "银行验证", copy: "若原订单需要 3DS，本页用 Stripe 完成下一步，不经过本店收卡。" },
  { title: "查看订单", copy: "订单大约每 5 秒核对一次，直到完成或明确停止。" },
];

export default function HomePage() {
  return (
    <div className="grid gap-8">
      <section className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="kicker">Pearl & Gold</p>
          <h1 className="display mt-4 text-5xl sm:text-6xl">
            Gigi礼品店
            <span className="mt-3 block text-2xl font-medium text-[var(--muted)]">礼品卡兑换台</span>
          </h1>
          <p className="lede mt-6 max-w-xl text-lg">
            以珍珠白为底、浅金为线。在这里核验并兑换 ChatGPT、Grok 与 Codex 礼品卡。每张卡对应一笔可查询的订单，过程清楚，没有抽奖。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="gold-button" href="/redeem">
              开始兑换
            </Link>
            <Link className="ghost-button" href="/faq">
              先看问答
            </Link>
          </div>
        </div>
        <aside className="panel">
          <div className="panel-body">
            <div className="seal" aria-hidden>
              礼
            </div>
            <p className="latin mt-6 text-3xl text-gold">One card, one order.</p>
            <p className="lede mt-3 text-sm">登录信息只为这一单转发。卡密与订单号会留下对应关系，方便您回来继续查看。</p>
          </div>
        </aside>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {OFFERINGS.map((item) => (
          <article key={item.id} className="offer" data-ready={item.ready}>
            <p className="pill">{item.kicker}</p>
            <h2 className="display mt-4 text-3xl">{item.title}</h2>
            <p className="lede mt-3 text-sm">{item.summary}</p>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="panel-body grid gap-6 md:grid-cols-4">
          {STEPS.map((step, index) => (
            <div key={step.title}>
              <p className="step-no">0{index + 1}</p>
              <h2 className="display mt-2 text-xl">{step.title}</h2>
              <p className="lede mt-2 text-sm">{step.copy}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
