import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>© 2026 Gigi Ai</p>
      <p>数字商品与礼品卡兑换。演示结算不会真实扣款。</p>
      <p className="filters" style={{ justifyContent: "center" }}>
        <Link href="/privacy">隐私</Link>
        <Link href="/support">售后</Link>
        <Link href="/store">商店</Link>
        <Link href="/redeem">兑换</Link>
      </p>
    </footer>
  );
}
