import type { Metadata } from "next";

export const metadata: Metadata = { title: "问答" };

const ITEMS = [
  {
    q: "哪些卡可以在这里兑换？",
    a: "ChatGPT、Grok 与 Codex 的 v1 卡密可以核验并提交。Claude 与 Team 能被识别，但通道尚未开放，页面不会把它们提交出去。",
  },
  {
    q: "卡密应该怎样粘贴？",
    a: "以 xiaojiu 开头，去掉前后空格。一张卡只办理一次。已经提交过的卡，请用查询查看原订单，不要重复兑换。",
  },
  {
    q: "ChatGPT 和 Codex 要准备什么？",
    a: "登录 chatgpt.com 后打开 /api/auth/session，复制完整 JSON。里面需要有 sessionToken。Codex 点数会记入这个 ChatGPT 账号。",
  },
  {
    q: "Grok 要准备什么？",
    a: "登录 grok.com，粘贴 Cookie-Editor 导出的 JSON，或浏览器里复制的 cURL。页面会抽出这一单所需的登录 cookie。",
  },
  {
    q: "为什么会出现银行验证？",
    a: "原订单有时需要 3DS。本页通过 Stripe.js 的 handleNextAction 完成验证，不收集卡号。验证后会提交 complete，并再做一次 recheck。",
  },
  {
    q: "订单多久核对一次？",
    a: "订单页大约每 5 秒读取一次，直到完成、失败或明确结束。切到后台后会放慢，回到页面再继续。",
  },
  {
    q: "登录信息和密钥会保存吗？",
    a: "合作方密钥只在服务端使用。登录会话只在提交当时转发给兑换服务，不写入卡密档案。档案里只保留卡密与订单号的对应关系。",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto grid max-w-3xl gap-4">
      <header className="card card-pad">
        <h1 className="text-3xl font-bold">兑换问答</h1>
        <p className="lede mt-2 text-sm">办理前先看这几件事。订单还没结束时，先查询原来的卡密。</p>
      </header>
      <div className="faq-list">
        {ITEMS.map((item) => (
          <article key={item.q} className="card card-pad">
            <h2 className="text-lg font-semibold">{item.q}</h2>
            <p className="lede mt-2 text-sm">{item.a}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
