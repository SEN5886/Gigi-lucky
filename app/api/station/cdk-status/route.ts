import { assertCdk, json, jsonError, limited, readJson } from "@/lib/http";
import { normalizeCdkStatus } from "@/lib/normalize";
import { cdkStatus } from "@/lib/partner";
import { findBinding, rememberBinding } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    limited(request, 20, "redeem");
    const body = (await readJson(request, 8_000)) as { cdk?: unknown };
    const cdk = assertCdk(body.cdk);
    const known = await findBinding(cdk);
    const raw = await cdkStatus(cdk);
    const status = normalizeCdkStatus(raw, cdk, known?.orderId ?? "");
    if (status.orderId) await rememberBinding(cdk, status.orderId, status.product);
    return json({ status });
  } catch (error) {
    return jsonError(error);
  }
}
