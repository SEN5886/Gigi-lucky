import Link from "next/link";

export default function NotFound() {
  return (
    <section className="card card-pad mx-auto max-w-2xl">
      <p className="text-sm font-medium text-[var(--muted)]">404</p>
      <h1 className="mt-2 text-3xl font-bold">这一页不存在</h1>
      <p className="lede mt-2">地址可能写错了。您可以回到兑换台，或用原来的卡密查询订单。</p>
      <div className="actions mt-5">
        <Link className="btn-primary" href="/redeem">
          去兑换
        </Link>
        <Link className="btn-ghost" href="/order">
          查询订单
        </Link>
      </div>
    </section>
  );
}
