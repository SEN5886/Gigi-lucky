import { paymentMode } from "./env.ts";

export type IntentResult = {
  id: string;
  mode: "mock" | "live";
  status: "requires_confirmation" | "unavailable";
  message: string;
};

export interface PaymentProvider {
  readonly mode: "mock" | "live";
  createIntent(input: { orderId: string; amountCents: number; currency: "CNY"; intentId: string }): Promise<IntentResult>;
  confirm(input: { intentId: string }): Promise<{ status: "paid" | "unavailable"; message: string }>;
}

const mockProvider: PaymentProvider = {
  mode: "mock",
  async createIntent({ intentId }) {
    return {
      id: intentId,
      mode: "mock",
      status: "requires_confirmation",
      message: "模拟支付已建立，确认后只在本地把订单标为已支付。",
    };
  },
  async confirm() {
    return { status: "paid", message: "模拟支付已完成，没有发生真实扣款。" };
  },
};

const liveProvider: PaymentProvider = {
  mode: "live",
  async createIntent({ intentId }) {
    return {
      id: intentId,
      mode: "live",
      status: "unavailable",
      message: "Stripe、支付宝与微信支付尚未接入。订单保持待支付。",
    };
  },
  async confirm() {
    return { status: "unavailable", message: "支付通道即将接入，这次确认没有入账。" };
  },
};

export function paymentProvider(): PaymentProvider {
  return paymentMode() === "live" ? liveProvider : mockProvider;
}
