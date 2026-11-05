import { readEnv } from "@/lib/env";
import { json, jsonError, readJson } from "@/lib/http";
import { markPaidByWebhook } from "@/lib/mall-db";
import { tokensMatch } from "@/lib/shop-contract";
import { ShopError } from "@/lib/shop-error";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  intentId: z.string().regex(/^mock_[a-f0-9]{16}$/),
  status: z.literal("paid"),
});

export async function POST(request: Request) {
  try {
    const secret = readEnv().PAYMENT_WEBHOOK_SECRET ?? "";
    const given = request.headers.get("x-gigi-webhook-secret") ?? "";
    if (secret.length < 16 || !tokensMatch(secret, given)) {
      throw new ShopError(401, "WEBHOOK_UNAUTHORIZED", "回调密钥未配置或不匹配，订单不会被改成已支付。");
    }
    const parsed = bodySchema.safeParse(await readJson(request, 2_000));
    if (!parsed.success) throw new ShopError(400, "INVALID_WEBHOOK", "回调内容不正确。");
    const updated = await markPaidByWebhook(parsed.data.intentId);
    return json({ received: true, updated });
  } catch (error) {
    return jsonError(error);
  }
}
