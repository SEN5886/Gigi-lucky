import type { Offering } from "./types.ts";

export const OFFERINGS: Offering[] = [
  {
    id: "chatgpt",
    title: "ChatGPT",
    kicker: "已开放",
    summary: "Plus、Go 与 Pro 礼品卡。兑换使用您自己的 ChatGPT 登录会话，支付在原订单完成。",
    ready: true,
  },
  {
    id: "grok",
    title: "Grok",
    kicker: "已开放",
    summary: "月付与年付礼品卡。粘贴 grok.com 的登录信息，由原订单核对账号并完成支付。",
    ready: true,
  },
  {
    id: "codex",
    title: "Codex",
    kicker: "已开放",
    summary: "Codex 点数卡。点数记入您提交的 ChatGPT 账号，不另开一套登录。",
    ready: true,
  },
  {
    id: "claude",
    title: "Claude",
    kicker: "尚未开放",
    summary: "Claude 通道还在准备。本店可以识别这类卡密，但不会代为提交。",
    ready: false,
  },
  {
    id: "team",
    title: "Team",
    kicker: "尚未开放",
    summary: "Team 与混合席位尚未开放。请先不要在本店提交，以免卡密被占用。",
    ready: false,
  },
];

export const POLL_MS = 5000;
