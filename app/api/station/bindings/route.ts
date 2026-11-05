import { assertCdk, json, jsonError, limited, readJson } from "@/lib/http";
import { findBinding } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    limited(request, 30);
    const body = (await readJson(request, 4_000)) as { cdk?: unknown };
    const cdk = assertCdk(body.cdk);
    const binding = await findBinding(cdk);
    return json({ orderId: binding?.orderId ?? "", product: binding?.product ?? "" });
  } catch (error) {
    return jsonError(error);
  }
}
