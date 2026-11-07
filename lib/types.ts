export type ProductId = "chatgpt" | "grok" | "codex" | "claude" | "team" | "unknown";

export type CustomerActionName = "start" | "complete" | "recheck";

export type ProductInfo = {
  id: ProductId;
  name: string;
  tier: string;
  tierLabel: string;
  ready: boolean;
};

export type Offering = {
  id: ProductId;
  title: string;
  kicker: string;
  summary: string;
  ready: boolean;
};

export type VerifyView = {
  status: string;
  statusLabel: string;
  product: ProductId;
  tier: string;
  tierLabel: string;
  ready: boolean;
  note: string;
  message: string;
};

export type CustomerActionView = {
  type: string;
  actionId: string;
  actionKey: string;
  expiresAt: number | null;
  fields: string[];
};

export type StripeChallenge = {
  publishableKey: string;
  clientSecret: string;
};

export type OrderView = {
  id: string;
  status: string;
  statusLabel: string;
  note: string;
  product: string;
  tier: string;
  email: string;
  terminal: boolean;
  needsBankCheck: boolean;
  customerAction: CustomerActionView | null;
  createdAt: string;
  updatedAt: string;
};

export type CdkStatusView = {
  state: string;
  statusLabel: string;
  note: string;
  product: ProductId;
  tier: string;
  tierLabel: string;
  orderId: string;
  email: string;
  ready: boolean;
};

export type RedeemView = {
  orderId: string;
  status: string;
  statusLabel: string;
  message: string;
};

export type CustomerActionInput = {
  action: CustomerActionName;
  actionId?: string;
  actionKey?: string;
  paymentIntentId?: string;
  paymentIntentStatus?: string;
  cancelled?: boolean;
  errorCode?: string;
  errorMessage?: string;
};
