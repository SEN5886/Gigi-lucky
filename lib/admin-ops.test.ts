import assert from "node:assert/strict";
import { test } from "node:test";
import { buildOverview, buildUserRows, cleanNote, searchUsers, toPublicOrder, toPublicRedemption } from "./admin-ops.ts";

test("user search matches phone, email, and note", () => {
  const rows = buildUserRows(
    [
      { id: "user_aaaaaaaaaaaaaaaa", phone: "13800001111", email: "a@example.com", createdAt: "2026-11-01T00:00:00.000Z", note: "老顾客" },
      { id: "user_bbbbbbbbbbbbbbbb", phone: null, email: "b@example.com", createdAt: "2026-11-02T00:00:00.000Z" },
    ],
    [{ userId: "user_aaaaaaaaaaaaaaaa" }, { userId: null }],
    [{ userId: "user_aaaaaaaaaaaaaaaa" }],
  );
  assert.equal(rows[0]?.id, "user_bbbbbbbbbbbbbbbb");
  assert.equal(rows[1]?.orderCount, 1);
  assert.equal(rows[1]?.redemptionCount, 1);
  assert.equal(searchUsers(rows, "1380000").length, 1);
  assert.equal(searchUsers(rows, "老顾客")[0]?.email, "a@example.com");
  assert.equal(searchUsers(rows, "missing").length, 0);
});

test("overview sums paid orders once", () => {
  const overview = buildOverview({
    users: 2,
    orders: [
      { status: "paid", totalCents: 1000 },
      { status: "paid", totalCents: 250 },
      { status: "pending", totalCents: 9000 },
    ],
    redemptions: 1,
    products: [{ published: true }, { published: false }],
    soldUnits: 3,
  });
  assert.equal(overview.paidCents, 1250);
  assert.equal(overview.paidOrders, 2);
  assert.equal(overview.pendingOrders, 1);
  assert.equal(overview.publishedProducts, 1);
});

test("staff views omit session ids and full card codes", () => {
  const order = toPublicOrder({
    id: "m1",
    userId: "user_aaaaaaaaaaaaaaaa",
    email: "a@example.com",
    name: "访客",
    totalCents: 100,
    status: "paid",
    createdAt: "2026-11-01T00:00:00.000Z",
    items: [{ title: "Plus", qty: 1 }],
    ownerSid: "secret-session",
    paymentIntentId: "mock_secret",
    idempotencyKey: "idem-secret",
  });
  assert.deepEqual(Object.keys(order).sort(), ["createdAt", "email", "id", "items", "name", "status", "totalCents", "userId"]);
  const redemption = toPublicRedemption({
    id: "r1",
    userId: null,
    orderId: "upstream",
    label: "ChatGPT",
    maskedCode: "ABCD····WXYZ",
    createdAt: "2026-11-01T00:00:00.000Z",
    ownerSid: "secret-session",
  });
  assert.equal("ownerSid" in redemption, false);
  assert.equal(redemption.maskedCode, "ABCD····WXYZ");
  assert.equal(cleanNote("  备注  "), "备注");
  assert.equal(cleanNote("x".repeat(501)), null);
});
