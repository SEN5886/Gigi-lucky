import { otpDeliveryMode, revealOtpCode } from "@/lib/env";
import { json, jsonError, limited, readJson } from "@/lib/http";
import { readOtp, saveOtp } from "@/lib/mall-db";
import { createOtpCode, hashOtp, normalizePhone, otpExpiry, resendBlocked } from "@/lib/otp-code";
import { otpSender } from "@/lib/otp-sender";
import { ShopError } from "@/lib/shop-error";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  channel: z.enum(["phone", "email"]),
  target: z.string().trim().max(120),
});

export async function POST(request: Request) {
  try {
    limited(request, 5, "otp");
    const parsed = schema.safeParse(await readJson(request, 2_000));
    if (!parsed.success) throw new ShopError(400, "INVALID_OTP", "请填写手机号或邮箱。");
    const mode = otpDeliveryMode();
    if (mode === "stub") {
      return json({
        ok: false,
        code: "AUTH_NOT_READY",
        message: "验证码登录接口已留好。当前 AUTH_MODE=stub，不会发送短信或邮件。",
      });
    }
    const target = parsed.data.channel === "phone" ? normalizePhone(parsed.data.target) : parsed.data.target.toLowerCase();
    if (!target || (parsed.data.channel === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target))) {
      throw new ShopError(400, "INVALID_TARGET", parsed.data.channel === "phone" ? "请填写中国大陆手机号。" : "请填写有效的邮箱。");
    }
    const key = `${parsed.data.channel}:${target}`;
    const previous = await readOtp(key);
    if (previous && resendBlocked(previous.sentAt)) throw new ShopError(429, "OTP_COOLDOWN", "验证码刚刚发过，请稍后再试。");
    const code = createOtpCode();
    await otpSender().send({ channel: parsed.data.channel, target, code });
    await saveOtp(key, { hash: hashOtp(code), expiresAt: otpExpiry(), attempts: 0, sentAt: Date.now() });
    return json({
      ok: true,
      message: mode === "mock" ? "已生成验证码。没有调用短信或邮件服务。" : "验证码已记录。",
      ...(revealOtpCode() ? { devCode: code } : {}),
    });
  } catch (error) {
    return jsonError(error);
  }
}
