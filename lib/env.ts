import { z } from "zod";

const schema = z.object({
  XIAOJIU_API_BASE_URL: z.string().url().default("https://982xj.xyz/api/partner/v1/xiaojiu"),
  PAYMENT_MODE: z.enum(["mock", "live"]).default("mock"),
  AUTH_MODE: z.enum(["stub", "dev"]).default("stub"),
  MALL_DATA_PATH: z.string().min(1).max(200).default(".data/mall.json"),
  PAYMENT_WEBHOOK_SECRET: z.string().max(200).optional(),
});

export type ShopEnv = z.infer<typeof schema>;

export function readEnv(): ShopEnv {
  const parsed = schema.safeParse({
    XIAOJIU_API_BASE_URL: process.env.XIAOJIU_API_BASE_URL || undefined,
    PAYMENT_MODE: process.env.PAYMENT_MODE || undefined,
    AUTH_MODE: process.env.AUTH_MODE || undefined,
    MALL_DATA_PATH: process.env.MALL_DATA_PATH || undefined,
    PAYMENT_WEBHOOK_SECRET: process.env.PAYMENT_WEBHOOK_SECRET || undefined,
  });
  return parsed.success ? parsed.data : schema.parse({});
}

export function paymentMode(): "mock" | "live" {
  return readEnv().PAYMENT_MODE;
}

export function devAuthEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && readEnv().AUTH_MODE === "dev";
}
