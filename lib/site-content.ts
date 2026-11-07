import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";

const text = (max: number) => z.string().trim().min(1).max(max);

export const siteContentSchema = z.object({
  banner: text(120),
  heroTitle: text(80),
  heroBody: text(400),
  brandBlurb: text(200),
  nav: z.object({
    store: text(8),
    redeem: text(8),
    orders: text(8),
    cart: text(8),
    account: text(8),
    login: text(8),
    faq: text(8),
  }),
  footer: z.object({
    copyright: text(80),
    line: text(160),
  }),
  support: z.object({
    title: text(40),
    body: text(2000),
    email: text(120),
    hours: text(80),
  }),
  service: z.object({
    enabled: z.boolean(),
    title: text(40),
    text: text(400),
    wechatQr: z.string().max(300).default("").refine((value) => value === "" || value.startsWith("https://") || value.startsWith("/")),
    qq: z.string().max(40).default(""),
    link: z.string().max(300).default("").refine((value) => value === "" || value.startsWith("https://") || value.startsWith("/")),
    linkLabel: z.string().max(20).default(""),
  }),
});

export type SiteContent = z.infer<typeof siteContentSchema>;

export const defaultContent: SiteContent = {
  banner: "Gigi Ai 商店与兑换台 · 请通过 HTTPS 访问正式站点",
  heroTitle: "选购数字商品，或核销已有卡密",
  heroBody: "商店负责下单，兑换台负责已购卡密。ChatGPT、Grok、Codex 可以兑换；Claude 与 Team 仍只识别。",
  brandBlurb: "先在商店选购，或在兑换台核销已有卡密。一张订单对应一次清楚的结果。",
  nav: { store: "商店", redeem: "兑换", orders: "订单", cart: "购物车", account: "我的", login: "登录", faq: "问答" },
  footer: { copyright: "© 2026 Gigi Ai", line: "数字商品与礼品卡兑换。演示结算不会真实扣款。" },
  support: {
    title: "售后",
    body: "未完成的兑换先用原卡密查询，不要重复提交。商城演示订单不会自动退款，因为没有真实扣款。",
    email: "support@example.com",
    hours: "每天 12:00–02:00",
  },
  service: {
    enabled: true,
    title: "联系客服",
    text: "客服方式尚未填写。后台配置微信二维码、QQ 或链接后，这里会显示给顾客。",
    wechatQr: "",
    qq: "",
    link: "",
    linkLabel: "打开客服",
  },
};

function contentPath(): string {
  return path.resolve(process.cwd(), process.env.CONTENT_DATA_PATH || path.join(".data", "content.json"));
}

export function readContent(): SiteContent {
  try {
    const parsed = siteContentSchema.safeParse(JSON.parse(readFileSync(contentPath(), "utf8")));
    if (parsed.success) return parsed.data;
  } catch {
    /* 使用内置文案，直到后台第一次保存。 */
  }
  return defaultContent;
}

export function writeContent(input: unknown): SiteContent {
  const parsed = siteContentSchema.parse(input);
  const file = contentPath();
  mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.tmp`;
  writeFileSync(temp, JSON.stringify(parsed, null, 2), "utf8");
  renameSync(temp, file);
  return parsed;
}
