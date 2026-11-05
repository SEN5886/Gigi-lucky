import Link from "next/link";

export default function NotFound() {
  return (
    <section className="panel mx-auto max-w-2xl">
      <div className="panel-body">
        <p className="kicker">404</p>
        <h1 className="display mt-3 text-4xl">这一页不在店里</h1>
        <p className="lede mt-3">地址可能写错了。您可以回到兑换台，或用原来的卡密查询订单。</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="gold-button" href="/redeem">
            去兑换
          </Link>
          <Link className="ghost-button" href="/order">
            查询订单
          </Link>
        </div>
      </div>
    </section>
  );
}
