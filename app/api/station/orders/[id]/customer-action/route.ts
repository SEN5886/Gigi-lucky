import type { CustomerActionName } from "@/lib/types";
import { assertOrderId, json, jsonError, limited, readJson } from "@/lib/http";
import { normalizeOrder, readStripeChallenge } from "@/lib/normalize";
import { PartnerError, postCustomerAction } from "@/lib/partner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIONS = new Set<CustomerActionName>(["start", "complete", "recheck"]);

function optionalText(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    limited(request, 20);
    const { id } = await context.params;
    const orderId = assertOrderId(id);
    const body = (await readJson(request, 12_000)) as Record<string, unknown>;
    const action = body.action;
    if (typeof action !== "string" || !ACTIONS.has(action as CustomerActionName)) {
      throw new PartnerError(400, "INVALID_ACTION", "客户动作只接受 start、complete 或 recheck。");
    }

    const upstream: Record<string, unknown> = {
      action,
      actionId: optionalText(body.actionId, 2048),
      actionKey: optionalText(body.actionKey, 128),
      paymentIntentId: optionalText(body.paymentIntentId, 120),
      paymentIntentStatus: optionalText(body.paymentIntentStatus, 64),
      errorCode: optionalText(body.errorCode, 80),
      errorMessage: optionalText(body.errorMessage, 300),
    };
    if (typeof body.cancelled === "boolean") upstream.cancelled = body.cancelled;
    for (const [key, value] of Object.entries(upstream)) {
      if (value === undefined) delete upstream[key];
    }

    const raw = await postCustomerAction(orderId, upstream);
    return json({
      order: normalizeOrder(raw, orderId),
      stripe: action === "start" ? readStripeChallenge(raw) : null,
    });
  } catch (error) {
    return jsonError(error);
  }
}
