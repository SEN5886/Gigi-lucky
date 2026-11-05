import assert from "node:assert/strict";
import { test } from "node:test";
import { loadCatalog } from "./mall-catalog.ts";
import { canPurchase, formatYuan, ownsOrder, quoteCart } from "./mall-logic.ts";
import { originMatches, tokensMatch } from "./shop-contract.ts";

test("formats cents as yuan", () => {
  assert.equal(formatYuan(16800), "¥168.00");
  assert.equal(formatYuan(5), "¥0.05");
});

test("quotes from the catalog price instead of a client price", () => {
  const products = loadCatalog();
  const plus = products.find((item) => item.id === "chatgpt-plus");
  assert.ok(plus);
  const quote = quoteCart([{ productId: "chatgpt-plus", qty: 2 }], products, {});
  assert.equal(quote.totalCents, (plus?.priceCents ?? 0) * 2);
  assert.equal(quote.items[0]?.unitCents, plus?.priceCents);
});

test("refuses a restocking product", () => {
  const products = loadCatalog();
  const claude = products.find((item) => item.id === "claude-pro");
  assert.ok(claude);
  assert.equal(canPurchase(claude, 0), false);
  assert.throws(() => quoteCart([{ productId: "claude-pro", qty: 1 }], products, {}));
});

test("order ownership stays with the session or the same user", () => {
  const order = { ownerSid: "sid-a", userId: "user_1" };
  assert.equal(ownsOrder(order, { id: "sid-a", userId: null }), true);
  assert.equal(ownsOrder(order, { id: "sid-b", userId: "user_1" }), true);
  assert.equal(ownsOrder(order, { id: "sid-b", userId: "user_2" }), false);
  assert.equal(ownsOrder(order, { id: "sid-b", userId: null }), false);
});

test("csrf tokens must match exactly", () => {
  assert.equal(tokensMatch("abc", "abc"), true);
  assert.equal(tokensMatch("abc", "abd"), false);
  assert.equal(tokensMatch("abc", "abcd"), false);
  assert.equal(originMatches("shop.example", "https://shop.example"), true);
  assert.equal(originMatches("shop.example", "https://evil.example"), false);
});
