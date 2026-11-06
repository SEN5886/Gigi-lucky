import { otpDeliveryMode } from "@/lib/env";
import { json, jsonError, limited, readJson } from "@/lib/http";
import { clearOtp, ensureSession, failOtp, loginWithIdentity, readOtp } from "@/lib/mall-db";
import { normalizePhone, otpMatches } from "@/lib/otp-code";
import { ShopError } from "@/lib/shop-error";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  channel: z.enum(["phone", "email"]),
  target: z.string().trim().max(120),
  code: z.string().regex(/^\d{6}$/),
});

export async function POST(request: Request) {
  try {
    limited(request, 10, "otp");
    if (otpDeliveryMode() === "stub") {
      return json({ ok: false, code: "AUTH_NOT_READY", message: "验证码登录即将接入。" });
    }
    const parsed = schema.safeParse(await readJson(request, 2_000));
    if (!parsed.success) throw new ShopError(400, "INVALID_OTP", "请填写 6 位验证码。");
    const target = parsed.data.channel === "phone" ? normalizePhone(parsed.data.target) : parsed.data.target.toLowerCase();
    if (!target) throw new ShopError(400, "INVALID_TARGET", "账号格式不正确。");
    const key = `${parsed.data.channel}:${target}`;
    const row = await readOtp(key);
    if (!row || !otpMatches(parsed.data.code, row.hash, row.expiresAt)) {
      const attempts = row ? await failOtp(key) : 0;
      throw new ShopError(400, "OTP_MISMATCH", attempts >= 5 ? "验证码已失效，请重新获取。" : "验证码不正确或已过期。");
    }
    await clearOtp(key);
    const session = await ensureSession();
    const identity = parsed.data.channel === "phone" ? { phone: target, email: null } : { phone: null, email: target };
    const logged = await loginWithIdentity(session.id, identity);
    return json({
      ok: true,
      message: logged.attached ? `登录成功，已关联 ${logged.attached} 条本机记录。` : "登录成功。",
      user: { id: logged.user.id, email: logged.user.email, phone: logged.user.phone },
    });
  } catch (error) {
    return jsonError(error);
  }
}
