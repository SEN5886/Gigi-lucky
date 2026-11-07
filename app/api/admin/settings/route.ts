import { requireAdmin } from "@/lib/admin-auth";
import { authMode, otpDeliveryMode, paymentMode } from "@/lib/env";
import { json, jsonError, limited } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const authLabels = {
  stub: "顾客登录仍是占位，验证码不会发送。",
  dev: "仅非生产环境可用的开发登录。",
  mock: "本地验证码，不发送短信或邮件。",
  otp: "已选择验证码登录，发送通道尚未接通。",
} as const;

export async function GET(request: Request) {
  try {
    limited(request, 30, "admin");
    await requireAdmin();
    const auth = authMode();
    const otp = otpDeliveryMode();
    const payment = paymentMode();
    return json({
      settings: {
        paymentMode: payment,
        paymentLabel: payment === "mock" ? "演示结算，不会真实扣款。" : "已选择正式支付，收款通道尚未接通。",
        authMode: auth,
        authLabel: authLabels[auth],
        otpLabel: otp === "otp" ? "短信和邮件接口未接通。" : otp === "mock" ? "本地模拟，不向外发送。" : "未启用。",
        cookieSecure: process.env.COOKIE_SECURE === "true",
        adminConfigured: Boolean(process.env.ADMIN_TOKEN?.trim()),
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
