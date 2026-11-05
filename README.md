# Gigi礼品店

珍珠白与浅金的礼品卡兑换台。顾客在这里核验并兑换小久合作方的卡密，查看订单，并在需要时于本页完成银行验证。

本店办理 **ChatGPT、Grok、Codex**。**Claude 与 Team** 只做识别，不提交兑换。没有抽奖、转盘或随机赠送。

## 环境

需要 Node.js 22。密钥只放在服务端。

```bash
cp .env.example .env.local
```

`.env.local`：

| 变量 | 说明 |
| --- | --- |
| `XIAOJIU_API_KEY` | 合作方密钥。请求使用 `Authorization: Bearer`。不要加 `NEXT_PUBLIC_` 前缀。 |
| `XIAOJIU_API_BASE_URL` | 可选。默认 `https://982xj.xyz/api/partner/v1/xiaojiu`。 |
| `ORDER_STORE_PATH` | 可选。卡密到订单号的档案，默认 `.data/cdk-orders.json`。 |

```bash
npm install
npm test
npm run build
npm run dev
```

开发地址为 `http://localhost:3000`。

## 页面

- `/` 首页：开放的卡种与兑换步骤
- `/redeem` 兑换：核验卡密、填写登录信息、提交
- `/order` 用卡密找回订单
- `/order/[id]` 订单进度，大约每 5 秒核对一次
- `/faq` 问答
- 未知地址使用中文 404

## 与合作方的对应关系

浏览器只访问本站的 `/api/station/*`。这些路由在服务端带上密钥，再请求合作方：

| 本站 | 合作方 |
| --- | --- |
| `GET /api/station/config` | `GET /config` |
| `POST /api/station/verify` | `POST /verify`，正文 `{ cdk }` |
| `POST /api/station/redeem` | `POST /redeem`，正文 `{ cdk, sessionJson }` |
| `GET /api/station/orders/:id` | `GET /orders/:id` |
| `POST /api/station/orders/:id/customer-action` | `POST /orders/:id`，正文 `action` 为 `start`、`complete` 或 `recheck` |
| `POST /api/station/cdk-status` | `POST /cdk-status`，正文 `{ cdk }` |

`sessionJson` 的形状：

- ChatGPT 与 Codex：`chatgpt.com/api/auth/session` 的完整 JSON，须含 `sessionToken`
- Grok：`{ platform: "grok", cookies }`，至少包含 `sso`

银行验证由浏览器加载 Stripe.js，调用 `stripe.handleNextAction({ clientSecret })`。公钥和 client secret 来自 `start` 的返回，不写进仓库。完成后提交 `complete`，再提交 `recheck`。订单页大约每 5 秒轮询，直到状态结束；页面隐藏时放慢到约 30 秒。

## 卡密与订单号

兑换成功或状态查询带回订单号时，服务端把「卡密 → 订单号」写入本地档案。浏览器也会在本机记住这对关系，方便回到订单页。档案不保存登录会话。

Claude、Team 以及无法识别的卡密会被拒绝提交。

## 安全

- 密钥只出现在服务端环境变量中
- 登录会话不落盘、不写进日志
- 页面不接收银行卡号
- 接口有基本频率限制，订单号与卡密都做了格式校验

生产环境请把 `ORDER_STORE_PATH` 放在持久磁盘上。多实例部署时需要换成共享存储，否则各实例看到的对应关系会不一致。
