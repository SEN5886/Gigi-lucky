# Gigi Ai

礼品卡兑换台。顾客在这里核验并兑换小久合作方的卡密，查看订单，并在需要时于本页完成银行验证。

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
| `PAYMENT_MODE` | `mock`（默认）本地完成订单；`live` 时支付接口返回尚未接入。 |
| `AUTH_MODE` | `stub`（默认）登录只返回即将接入。`dev` 仅在非生产环境建立模拟会话。 |
| `MALL_DATA_PATH` | 可选。商城会话、购物车和订单，默认 `.data/mall.json`。 |
| `PAYMENT_WEBHOOK_SECRET` | 可选，至少 16 位。不配置时回调一律拒绝。 |
| `COOKIE_SECURE` | 可选。仅在 HTTPS 后设为 `true`。 |

```bash
npm install
npm test
npm run build
npm run dev
```

开发地址为 `http://localhost:3000`。

## 页面

- `/` 首页：进入商店或兑换台
- `/store` 商品目录，可按 ChatGPT / Grok / Claude / Codex / 其他 筛选
- `/store/[slug]` 商品详情
- `/cart` 购物车：改数量、移除
- `/checkout` 客人也可结算；`PAYMENT_MODE=mock` 时本地完成订单
- `/checkout/success` 订单回执，只对下单的浏览器或同一登录用户可见
- `/account/orders` 登录用户的订单列表，以及本机订单。商店预览里的同一份记录在 `/store-v2/account`
- `/login`、`/register` 登录与注册界面，调用尚未接入的账户接口
- `/redeem` 兑换：核验卡密、填写登录信息、提交
- `/order` 用卡密找回兑换进度
- `/order/[id]` 兑换订单进度，大约每 5 秒核对一次
- `/faq` 问答，`/privacy` 隐私，`/support` 售后
- 未知地址使用中文 404

目录数据在 `data/catalog.json`。单价和库存以这份文件为准，浏览器不能改价。

## 账户、后台与支付

账户和支付都先留接口。手机短信和邮箱验证码有 `OtpSender`，目前只有 `mock` 和 `unwired` 两种实现，不会请求阿里云或腾讯云。`.env.example` 里的云密钥是接通时再用的占位。

- `AUTH_MODE=stub`：发送接口直接说明尚未启用。
- `AUTH_MODE=mock`，或非生产环境的 `dev`：本地生成 6 位验证码，5 分钟过期，60 秒内不能重发，错 5 次作废。验证码只存哈希。非生产环境的响应会带上 `devCode`，方便联调。
- `AUTH_MODE=otp`：走正式发送接口，但实现仍会返回「尚未接通」，不会发出短信或邮件。
- 验证通过后建立账户，并把这台浏览器上尚未归属的商城订单和兑换记录记到该账户。消费记录在 `/account/orders`。
- 后台地址是 `/admin`，口令为 `ADMIN_TOKEN`。客服可以查看总览、注册用户、商城订单和已打码的兑换记录，也可以改商品（名称、标识、价格、图片、分类、库存、上下架）和用户端文案（顶栏、首页、导航、页脚、售后、客服浮窗）。支付、退款、卡密库存没有可操作入口。
- 商品写在 `CATALOG_DATA_PATH`，文案写在 `CONTENT_DATA_PATH`。第一次读取会从 `data/catalog.json` 复制出可编辑副本。
- `PaymentProvider` 仍是 `createIntent` / `confirm`。`PAYMENT_MODE=mock` 只在本地完成订单。

下一步支付接入的顺序是 Stripe、支付宝、微信支付。密钥只放服务端。

界面结构参考了 [Your Next Store](https://github.com/yournextstore/yournextstore)（MIT）的商品 slug 页、购物车数量和结算摘要，以及 [Medusa](https://github.com/medusajs/medusa)（核心 MIT）后台里「已发布才在店面可买、图片用 URL、handle 作为标识」的商品字段。没有把这两个项目整份搬进来。

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

完整说明在 [docs/SECURITY.md](docs/SECURITY.md)。当前包括：安全响应头、同源与 CSRF 双提交、分接口限流、zod 校验、订单归属检查、回调密钥，以及兑换会话不落盘。

生产环境请把 `ORDER_STORE_PATH` 和 `MALL_DATA_PATH` 放在持久磁盘上，并在 HTTPS 后设置 `COOKIE_SECURE=true`。多实例部署时需要换成共享存储。
