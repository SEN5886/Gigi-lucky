import Link from "next/link";
import { OFFERINGS } from "@/lib/catalog";

const TILES = [
  { title: "卡密核验", copy: "认出卡种，并确认这张卡还能不能办理。" },
  { title: "账号提交", copy: "使用您自己的登录信息，会话不写入订单档案。" },
  { title: "银行验证", copy: "需要 3DS 时，在本页用 Stripe 完成下一步。" },
  { title: "订单可查", copy: "大约每 5 秒核对一次，直到完成或停止。" },
];

export default function HomePage() {
  return (
    <div className="grid gap-4">
      <section className="home-grid">
        <aside className="card card-pad brand-card">
          <div className="brand" aria-hidden>
            <span className="brand-mark">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 1.5l1.7 4.8L15.5 8l-4.8 1.7L9 14.5 7.3 9.7 2.5 8l4.8-1.7L9 1.5z" fill="white" />
              </svg>
            </span>
          </div>
          <h2>Gigi Ai</h2>
          <p className="lede mt-2 text-sm">先在商店选购，或在兑换台核销已有卡密。一张订单对应一次清楚的结果。</p>
          <div className="actions mt-4 justify-center">
            <Link className="btn-primary" href="/store">
              进入商店
            </Link>
            <Link className="btn-ghost" href="/redeem">
              去兑换
            </Link>
          </div>
        </aside>
        <div className="card card-pad">
          <h1 className="text-[28px] font-bold leading-tight sm:text-4xl">选购数字商品，或核销已有卡密</h1>
          <p className="lede mt-3">
            商店负责下单，兑换台负责已购卡密。ChatGPT、Grok、Codex 可以兑换；Claude 与 Team 仍只识别。
          </p>
          <div className="tile-grid mt-5">
            {TILES.map((tile) => (
              <article key={tile.title} className="tile">
                <div className="tile-icon" aria-hidden>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M5 8.2l2 2 4-4.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </div>
                <h2 className="text-sm font-semibold">{tile.title}</h2>
                <p className="lede mt-1 text-xs">{tile.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-xl font-bold">可兑换卡种</h2>
          <Link className="text-sm font-medium text-primary" href="/redeem">
            进入兑换 →
          </Link>
        </div>
        <div className="product-grid">
          {OFFERINGS.map((item) => (
            <article key={item.id} className="card card-pad product-card">
              <div className="product-top">
                <span className="cat-icon" aria-hidden>
                  {{ chatgpt: "GPT", grok: "Gk", codex: "Cx", claude: "Cl", team: "Tm", unknown: "·" }[item.id]}
                </span>
                <span className={item.ready ? "badge" : "badge wait"}>{item.ready ? "现货可兑" : "尚未开放"}</span>
              </div>
              <h3>{item.title}</h3>
              <p className="lede text-sm">{item.summary}</p>
              {item.ready ? (
                <Link className="btn-primary" href="/redeem">
                  兑换
                </Link>
              ) : (
                <span className="btn-muted">暂未开通</span>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
