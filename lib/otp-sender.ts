import { otpDeliveryMode } from "./env.ts";
import { ShopError } from "./shop-error.ts";

export type OtpChannel = "phone" | "email";

export interface OtpSender {
  readonly name: "mock" | "unwired";
  send(input: { channel: OtpChannel; target: string; code: string }): Promise<void>;
}

const mockSender: OtpSender = {
  name: "mock",
  async send() {
    /* 不访问阿里云或腾讯云。验证码只以哈希形式留在本地档案。 */
  },
};

const unwiredSender: OtpSender = {
  name: "unwired",
  async send() {
    throw new ShopError(503, "OTP_NOT_WIRED", "手机短信和邮件发送只保留接口，尚未接通阿里云或腾讯云。");
  },
};

export function otpSender(): OtpSender {
  return otpDeliveryMode() === "otp" ? unwiredSender : mockSender;
}
