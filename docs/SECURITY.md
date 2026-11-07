# 安全说明

本文描述 Gigi Ai 现在已经做的限制，以及还没有接入的部分。它不是渗透测试报告。

## 已实现

### 响应头

全站响应带有：

- `Content-Security-Policy`
- `Referrer-Policy: no-referrer`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Permissions-Policy` 关闭摄像头、麦克风、定位和 Payment Request
- `Cross-Origin-Opener-Policy: same-origin-allow-popups`，避免把支付弹窗一刀切断
- `Cross-Origin-Resource-Policy: same-site`
- `X-Permitted-Cross-Domain-Policies: none`

生产环境应只通过 HTTPS 提供服务。本地 `http://localhost` 演示不设置 `Secure` cookie，除非显式 `COOKIE_SECURE=true`。

### Cookie

| Cookie | HttpOnly | 内容 |
| --- | --- | --- |
| `gigi_sid` | 是 | 随机会话号。服务端用它查找会话，cookie 里没有邮箱、用户号或卡密。 |
| `gigi_csrf` | 否 | 仅用于双提交校验，不能当作登录凭证。 |

两者都是 `SameSite=Lax`、`Path=/`，30 天。服务端会话记录的形状是：

```json
{ "id": "32位hex", "csrf": "32位hex", "userId": null, "email": null, "createdAt": "ISO时间" }
```

`userId` 只有在开发环境模拟登录成功后才会写入。正式环境的登录接口返回「即将接入」，不写用户。

### CSRF 与同源

除 `GET` / `HEAD` / `OPTIONS` 和 `POST /api/payments/webhook` 外，所有 `/api/*` 变更请求必须同时满足：

1. `Origin` 的主机等于 `Host`
2. 请求头 `x-csrf-token` 与 `gigi_csrf` 完全一致

浏览器脚本在第一次提交前会先请求 `GET /api/mall/session` 来领取 cookie。

### 频率限制

兑换、商城读写、结算和登录使用分开的计数。超限返回 429。这是单进程内存计数，多实例时需要换成共享存储。

### 输入与越权

- 购物车、结算、登录请求用 zod 校验
- 结算金额只按 `data/catalog.json` 的单价计算，忽略浏览器传来的价格
- 库存不足或「即将上架 / 补货中」不能下单
- 同一 `idempotencyKey` 重复结算会返回原订单
- 支付确认只把「待支付」改成「已支付」一次，库存只减一次
- 读取商城订单时，会话号必须是下单时的 `ownerSid`，或登录用户的 `userId` 与订单一致。否则一律回复「没有找到这笔订单」
- 支付回调必须带 `x-gigi-webhook-secret`，且与 `PAYMENT_WEBHOOK_SECRET` 一致。未配置密钥时回调直接拒绝，不会把订单改成已支付

### 日志与密钥

- `XIAOJIU_API_KEY`、webhook 密钥只读环境变量，不加 `NEXT_PUBLIC_`
- 兑换用的 `sessionJson`、卡密正文、密码和 cookie 值不写入日志
- 失败日志只记「request failed」，不打印请求体

## Stripe.js 的 CSP

兑换页的银行验证会加载 Stripe.js。当前策略允许：

- `script-src`：`https://js.stripe.com` 与 `https://*.js.stripe.com`
- `frame-src`：`https://js.stripe.com`、`https://*.js.stripe.com`、`https://hooks.stripe.com`
- `connect-src`：`https://api.stripe.com`、`https://js.stripe.com`、`https://m.stripe.network`、`https://q.stripe.com`
- `img-src`：`https://*.stripe.com`

`unsafe-inline` 与 `unsafe-eval` 是为了 Next.js 运行时和 Stripe.js。接入正式支付时应再收紧，并给脚本加 nonce，而不是继续放宽域名。

商城的模拟支付不加载 Stripe。`PAYMENT_MODE=live` 时接口会明确返回「尚未接入」，不会伪造扣款成功。

## 尚未接入

- 真实账户系统（密码哈希、魔法链接邮件、会话吊销列表）
- Stripe、支付宝、微信支付的正式下单与签名回调
- 多实例共享的会话、库存和频率限制
- 完整的隐私与售后法律文本

验证码只存 HMAC，不写日志，也不在生产响应里回显。`AUTH_MODE=otp` 目前只表示选中了发送接口，`OtpSender` 的正式实现尚未接通，不会把验证码交给阿里云或腾讯云。发送接口每分钟每 IP 最多 5 次，同一号码 60 秒内不能重发。

登录接口约定：

| 方法 | 路径 | 正文 | 现在的行为 |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | `{ email, password }` | 200，`ok: false`，`AUTH_NOT_READY` |
| POST | `/api/auth/register` | `{ email, password }` | 200，不保存密码 |
| POST | `/api/auth/magic-link` | `{ email }` | 200，不发邮件 |
| POST | `/api/auth/logout` | 空 | 清除会话上的用户并轮换 CSRF |
| GET | `/api/auth/session` |  | 返回上述约定和当前用户 |

只有 `NODE_ENV !== production` 且 `AUTH_MODE=dev` 时，登录会建立模拟用户。生产构建忽略 `AUTH_MODE=dev`。

支付接口约定：

| 方法 | 路径 | 作用 |
| --- | --- | --- |
| POST | `/api/payments/intents` | 按购物车创建待支付订单和支付意图 |
| POST | `/api/payments/confirm` | 模拟模式下确认；正式模式返回 501 |
| POST | `/api/payments/webhook` | 校验密钥后把对应意图标为已支付，重复调用不会再次扣库存 |

下一步若接入渠道，实现 `PaymentProvider` 即可：`createIntent`、`confirm`，以及验签后的 webhook。不要在浏览器保存商户密钥。

## 威胁与对应措施

### 兑换时粘贴的登录态被盗用

顾客提交的 ChatGPT session 或 Grok cookie 足以操作对应账号。措施：只在当次请求中转交，不落盘、不写日志；变更请求限制同源和 CSRF；兑换接口单独限流。仍应在页面提示顾客，兑换完成后到原网站退出登录。这不能阻止顾客把会话交给不可信的第三方，只能限制本站自己的保存范围。

### 库存与价格被篡改

浏览器可以修改请求。措施：服务端重新读取目录单价和剩余库存；数量限制在 0 到 5；不能购买的商品直接拒绝；支付成功才增加已售数量，且只增加一次。演示目录本身不是真实仓库。

### 支付重放

重复点击结算或重放确认请求，可能造成重复扣款或重复减库存。措施：结算携带 `idempotencyKey`，同一会话的重复请求返回原订单；确认和回调都只把「待支付」迁移到「已支付」。正式渠道还需要使用渠道自己的幂等键和签名，不能只靠这个本地状态。
