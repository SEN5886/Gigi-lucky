import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultContent, siteContentSchema } from "./site-content.ts";
import { hashOtp, normalizePhone, resendBlocked } from "./otp-code.ts";
import { otpSender } from "./otp-sender.ts";

test("otp hash is not the code itself", () => {
  const hash = hashOtp("123456", "pepper-pepper-pepper");
  assert.notEqual(hash, "123456");
  assert.equal(hash, hashOtp("123456", "pepper-pepper-pepper"));
  assert.notEqual(hash, hashOtp("123456", "other-pepper-value"));
});

test("normalizes mainland phone numbers", () => {
  assert.equal(normalizePhone("+86 138-0013-8000"), "13800138000");
  assert.equal(normalizePhone("12345"), null);
  assert.equal(resendBlocked(Date.now() - 10_000), true);
  assert.equal(resendBlocked(Date.now() - 70_000), false);
});

test("default site copy is valid and the otp sender is not a cloud client", async () => {
  assert.equal(siteContentSchema.parse(defaultContent).nav.store, "商店");
  const sender = otpSender();
  if (sender.name === "mock") await sender.send({ channel: "email", target: "a@example.com", code: "000000" });
  else await assert.rejects(() => sender.send({ channel: "email", target: "a@example.com", code: "000000" }));
});
