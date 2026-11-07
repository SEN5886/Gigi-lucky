import { maskEmail } from "./credentials.ts";
import { classifyCdk } from "./products.ts";
import type {
  CdkStatusView,
  CustomerActionView,
  OrderView,
  RedeemView,
  StripeChallenge,
  VerifyView,
} from "./types.ts";

const STATUS_LABELS: Record<string, string> = {
  valid: "可兑换",
  unused: "未使用",
  used: "已提交",
  invalid: "无效",
  disabled: "已停用",
  replaced: "已更换",
  void: "已作废",
  pending: "已受理",
  submitted: "已提交",
  queued: "排队中",
  running: "处理中",
  processing: "处理中",
  manual_review: "人工复核",
  awaiting_3ds: "等待银行验证",
  awaiting_captcha: "等待验证",
  requires_action: "等待银行验证",
  done: "已完成",
  success: "已完成",
  failed: "未完成",
  error: "出现异常",
  not_found: "没有这条记录",
  cancelled: "已取消",
  canceled: "已取消",
  expired: "已过期",
};

const TERMINAL = new Set([
  "done",
  "success",
  "failed",
  "error",
  "not_found",
  "cancelled",
  "canceled",
  "expired",
  "invalid",
  "void",
  "disabled",
]);

const BANK = new Set(["awaiting_3ds", "requires_action", "payment_requires_action", "payment_intent_pending"]);

export function statusLabel(status: string): string {
  const key = status.trim().toLowerCase();
  return STATUS_LABELS[key] ?? (status ? "处理中" : "等待返回");
}

export function isTerminalStatus(status: string): boolean {
  return TERMINAL.has(status.trim().toLowerCase());
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    const found = text(value);
    if (found) return found;
  }
  return "";
}

export function unwrapPayload(raw: unknown): Record<string, unknown> {
  let root = asRecord(raw) ?? {};
  const data = asRecord(root.data);
  if (data && (text(data.status) || text(data.state) || text(data.id) || text(data.orderId))) {
    root = data;
  }
  const nested = asRecord(root.order) ?? asRecord(root.result);
  const status = root.status;
  const statusRecord = asRecord(status);
  if (nested && (text(nested.status) || text(nested.state) || text(nested.id) || text(nested.orderId))) {
    return {
      ...nested,
      customerAction: nested.customerAction ?? root.customerAction,
      sdk: nested.sdk ?? root.sdk,
      stripe: nested.stripe ?? root.stripe,
    };
  }
  if (statusRecord && (text(statusRecord.status) || text(statusRecord.state) || text(statusRecord.id))) {
    return {
      ...statusRecord,
      customerAction: statusRecord.customerAction ?? root.customerAction,
      sdk: statusRecord.sdk ?? root.sdk,
      stripe: statusRecord.stripe ?? root.stripe,
    };
  }
  return root;
}

function readAction(raw: Record<string, unknown>): CustomerActionView | null {
  const action = asRecord(raw.customerAction);
  if (!action) return null;
  const type = text(action.type);
  if (!type) return null;
  const expires = action.expiresAt;
  return {
    type,
    actionId: text(action.actionId),
    actionKey: text(action.actionKey),
    expiresAt: typeof expires === "number" && Number.isFinite(expires) ? expires : null,
    fields: Array.isArray(action.fields) ? action.fields.filter((item): item is string => typeof item === "string") : [],
  };
}

function publishableKeyOf(record: Record<string, unknown> | null): string {
  if (!record) return "";
  return firstText(record.publishableKey, record.publishable_key, record.stripePublishableKey);
}

function clientSecretOf(record: Record<string, unknown> | null): string {
  if (!record) return "";
  return firstText(record.clientSecret, record.client_secret);
}

export function readStripeChallenge(...payloads: unknown[]): StripeChallenge | null {
  const bags: Array<Record<string, unknown> | null> = [];
  for (const payload of payloads) {
    const root = asRecord(payload);
    if (!root) continue;
    bags.push(root, asRecord(root.sdk), asRecord(root.stripe), asRecord(root.customerAction), asRecord(root.nextAction));
  }
  for (const bag of bags) {
    const publishableKey = publishableKeyOf(bag);
    const clientSecret = clientSecretOf(bag);
    if (/^pk_(live|test)_[A-Za-z0-9]+$/.test(publishableKey) && clientSecret.includes("_secret_")) {
      return { publishableKey, clientSecret };
    }
  }
  return null;
}

export function normalizeOrder(raw: unknown, fallbackId: string): OrderView {
  const record = unwrapPayload(raw);
  const status = firstText(record.status, record.state) || "pending";
  const lowered = status.toLowerCase();
  const action = readAction(record);
  const email = maskEmail(firstText(record.email, record.userEmail, record.user_email, asRecord(record.account)?.email));
  return {
    id: firstText(record.id, record.orderId, record.submissionId, fallbackId),
    status: lowered,
    statusLabel: statusLabel(lowered),
    note: firstText(record.note, record.message, record.result),
    product: firstText(record.product, record.platform, record.plan, record.planType),
    tier: firstText(record.tierLabel, record.planLabel, record.tier, record.kind),
    email,
    terminal: isTerminalStatus(lowered),
    needsBankCheck: BANK.has(lowered) || action?.type === "stripe_next_action",
    customerAction: action,
    createdAt: firstText(record.createdAt, record.created_at),
    updatedAt: firstText(record.updatedAt, record.lastUpdated, record.updated_at),
  };
}

export function normalizeVerify(raw: unknown, cdk: string): VerifyView {
  const record = unwrapPayload(raw);
  const local = classifyCdk(cdk);
  const status = (firstText(record.status, record.state) || "invalid").toLowerCase();
  const tierLabel = firstText(record.planLabel, record.tierLabel, record.label) || local.tierLabel;
  let message = firstText(record.message, record.note);
  if (!message) {
    if (status === "valid") message = local.ready ? "卡密有效，请继续填写账号信息。" : "卡密已识别，但这个通道还没有在本店开放。";
    else if (status === "used") message = "这张卡已经提交过。可以查询原订单，请不要重复兑换。";
    else if (status === "invalid") message = "没有找到这张卡，或卡密已作废。请去掉空格后再试。";
    else message = "核验已返回，请按页面提示继续。";
  }
  return {
    status,
    statusLabel: statusLabel(status),
    product: local.id,
    tier: firstText(record.tier, record.plan, record.kind) || local.tier,
    tierLabel,
    ready: local.ready && status === "valid",
    note: firstText(record.note),
    message,
  };
}

export function normalizeCdkStatus(raw: unknown, cdk: string, knownOrderId = ""): CdkStatusView {
  const record = unwrapPayload(raw);
  const local = classifyCdk(cdk);
  const state = (firstText(record.state, record.status) || "invalid").toLowerCase();
  const orderId = firstText(record.orderId, record.id, record.submissionId, knownOrderId);
  const safeOrderId = /^[A-Za-z0-9_-]{4,200}$/.test(orderId) ? orderId : "";
  return {
    state,
    statusLabel: statusLabel(state),
    note: firstText(record.note, record.message),
    product: local.id,
    tier: firstText(record.tier, record.plan) || local.tier,
    tierLabel: firstText(record.tierLabel, record.planLabel) || local.tierLabel,
    orderId: safeOrderId,
    email: maskEmail(firstText(record.email, record.userEmail)),
    ready: local.ready,
  };
}

export function normalizeRedeem(raw: unknown): RedeemView {
  const record = unwrapPayload(raw);
  const orderId = firstText(record.orderId, record.id, record.submissionId);
  const status = (firstText(record.status, record.state) || "pending").toLowerCase();
  const safeOrderId = /^[A-Za-z0-9_-]{4,200}$/.test(orderId) ? orderId : "";
  const message = firstText(record.message, record.note) || (safeOrderId ? "兑换已受理，正在跟踪这笔订单。" : "兑换已受理，但没有返回订单号。请用原卡密查询。");
  return {
    orderId: safeOrderId,
    status,
    statusLabel: statusLabel(status),
    message,
  };
}
