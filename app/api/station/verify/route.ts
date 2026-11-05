import { assertCdk, json, jsonError, limited, readJson } from "@/lib/http";
import { normalizeVerify } from "@/lib/normalize";
import { verifyCdk } from "@/lib/partner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    limited(request, 20);
    const body = (await readJson(request, 8_000)) as { cdk?: unknown };
    const cdk = assertCdk(body.cdk);
    const raw = await verifyCdk(cdk);
    return json({ verify: normalizeVerify(raw, cdk) });
  } catch (error) {
    return jsonError(error);
  }
}
