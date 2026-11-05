import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "隐私" };

export default function PrivacyPage() {
  return (
    <article className="card card-pad mx-auto grid max-w-3xl gap-3">
      <h1 className="text-3xl font-bold">隐私说明</h1>
      <p className="lede">这是一份简版说明，用来交代现在实际收集了什么。正式上线前会换成完整文本。</p>
      <h2 className="text-lg font-semibold">商城</h2>
      <p className="lede text-sm">结算邮箱、可选称呼和订单内容保存在服务端档案里，用来显示回执和防止串单。浏览器只保存会话编号，不保存卡密。</p>
      <h2 className="text-lg font-semibold">兑换</h2>
      <p className="lede text-sm">登录会话只在提交当时转交给兑换服务，不写入商城档案，也不进日志。卡密与兑换订单号的对应关系会保留，方便查询进度。</p>
      <h2 className="text-lg font-semibold">传输</h2>
      <p className="lede text-sm">请只通过 HTTPS 访问正式站点。本地演示地址除外。</p>
      <Link className="text-sm text-primary" href="/support">
        售后与联系
      </Link>
    </article>
  );
}
