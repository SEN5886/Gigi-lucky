import assert from "node:assert/strict";
import { test } from "node:test";
import { parseChatSession, parseGrokLogin } from "./credentials.ts";
import { normalizeOrder, normalizeRedeem, readStripeChallenge } from "./normalize.ts";
import { classifyCdk } from "./products.ts";

test("classifies open products and leaves Claude and Team closed", () => {
  assert.equal(classifyCdk("xiaojiu-plus-ABCD-EFGH").id, "chatgpt");
  assert.equal(classifyCdk("xiaojiu-plus-ABCD-EFGH").ready, true);
  assert.equal(classifyCdk("xiaojiu-pro5xcl-ABCD").tierLabel, "ChatGPT Pro 100");
  assert.equal(classifyCdk("xiaojiu-codex1000-ABCD").tierLabel, "Codex Credits 1000");
  assert.equal(classifyCdk("xiaojiu-groky-ABCD").id, "grok");
  assert.equal(classifyCdk("xiaojiu-claude-pro-ABCD").ready, false);
  assert.equal(classifyCdk("xiaojiu-teammix-ABCD").id, "team");
  assert.equal(classifyCdk("not-a-card").id, "unknown");
});

test("extracts a grok sso cookie from a curl paste", () => {
  const parsed = parseGrokLogin(`curl 'https://grok.com/' -H 'cookie: sso=eyJabc.def.ghi; other=1'`);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const body = JSON.parse(parsed.sessionJson) as { platform: string; cookies: Array<{ name: string }> };
  assert.equal(body.platform, "grok");
  assert.ok(body.cookies.some((cookie) => cookie.name === "sso"));
  assert.ok(body.cookies.some((cookie) => cookie.name === "sso-rw"));
});

test("rejects a bare chatgpt access token", () => {
  const parsed = parseChatSession("eyJabc.def.ghi");
  assert.equal(parsed.ok, false);
});

test("accepts a chatgpt session with sessionToken", () => {
  const parsed = parseChatSession(JSON.stringify({ sessionToken: "st", accessToken: "at", user: { email: "a@example.com" } }));
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.email, "a@example.com");
});

test("normalizes a nested order and a stripe challenge", () => {
  const raw = {
    status: {
      id: "ord_1234",
      status: "awaiting_3ds",
      note: "请完成银行验证",
      user_email: "person@example.com",
      customerAction: { type: "stripe_next_action", actionId: "act", actionKey: "abc" },
    },
    sdk: { publishableKey: "pk_test_abc", clientSecret: "pi_123_secret_456" },
  };
  const order = normalizeOrder(raw, "fallback");
  assert.equal(order.id, "ord_1234");
  assert.equal(order.needsBankCheck, true);
  assert.equal(order.email, "p***@example.com");
  assert.equal(order.terminal, false);
  const stripe = readStripeChallenge(raw);
  assert.equal(stripe?.publishableKey, "pk_test_abc");
});

test("reads the redeem order id", () => {
  const redeem = normalizeRedeem({ data: { id: "ord_9999", status: "pending" } });
  assert.equal(redeem.orderId, "ord_9999");
  assert.equal(redeem.statusLabel, "已受理");
});
