import { classifyCdk } from "@/lib/products";
import { assertCdk, json, jsonError, limited, readJson } from "@/lib/http";
import { ensureSession, recordRedemption } from "@/lib/mall-db";
import { normalizeRedeem } from "@/lib/normalize";
import { PartnerError, redeemCdk } from "@/lib/partner";
import { rememberBinding } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    limited(request, 8, "redeem");
    const body = (await readJson(request)) as { cdk?: unknown; sessionJson?: unknown };
    const cdk = assertCdk(body.cdk);
    const product = classifyCdk(cdk);
    if (!product.ready) {
      throw new PartnerError(409, "PRODUCT_NOT_OPEN", `${product.tierLabel} 还没有在本店开放，请不要重复提交。`);
    }
    if (typeof body.sessionJson !== "string" || body.sessionJson.length < 2 || body.sessionJson.length > 150_000) {
      throw new PartnerError(400, "MISSING_SESSION", "请先填写有效的账号登录信息。");
    }
    const raw = await redeemCdk(cdk, body.sessionJson);
    const redeem = normalizeRedeem(raw);
    if (redeem.orderId) {
      await rememberBinding(cdk, redeem.orderId, product.id);
      const session = await ensureSession();
      const masked = cdk.length > 12 ? `${cdk.slice(0, 8)}…${cdk.slice(-4)}` : "已隐藏";
      await recordRedemption({
        userId: session.userId,
        ownerSid: session.id,
        orderId: redeem.orderId,
        label: product.tierLabel,
        maskedCode: masked,
      });
    }
    return json({ redeem });
  } catch (error) {
    return jsonError(error);
  }
}
