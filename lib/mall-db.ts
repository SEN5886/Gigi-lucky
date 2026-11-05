import "server-only";

import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import { readEnv } from "./env.ts";
import { CSRF_COOKIE, SID_COOKIE, type SessionRecord } from "./shop-contract.ts";
import type { CartLine, QuotedItem } from "./mall-logic.ts";

export type MallOrder = {
  id: string;
  ownerSid: string;
  userId: string | null;
  email: string;
  name: string;
  items: QuotedItem[];
  totalCents: number;
  status: "pending" | "paid" | "failed";
  paymentIntentId: string | null;
  idempotencyKey: string;
  createdAt: string;
};

type IntentRecord = { orderId: string; status: "requires_confirmation" | "paid" | "failed" };

type Database = {
  sessions: Record<string, SessionRecord>;
  carts: Record<string, CartLine[]>;
  orders: Record<string, MallOrder>;
  sold: Record<string, number>;
  intents: Record<string, IntentRecord>;
};

const empty = (): Database => ({ sessions: {}, carts: {}, orders: {}, sold: {}, intents: {} });
let chain: Promise<unknown> = Promise.resolve();

function filePath(): string {
  return path.resolve(process.cwd(), readEnv().MALL_DATA_PATH);
}

async function readDb(): Promise<Database> {
  try {
    const parsed = JSON.parse(await fs.readFile(filePath(), "utf8")) as Partial<Database>;
    return { ...empty(), ...parsed };
  } catch {
    return empty();
  }
}

function mutate<T>(fn: (db: Database) => T | Promise<T>): Promise<T> {
  const run = chain.then(async () => {
    const db = await readDb();
    const result = await fn(db);
    const target = filePath();
    await fs.mkdir(path.dirname(target), { recursive: true });
    const temp = `${target}.${process.pid}.tmp`;
    await fs.writeFile(temp, JSON.stringify(db), "utf8");
    await fs.rename(temp, target);
    return result;
  });
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

const cookieBase = {
  sameSite: "lax" as const,
  secure: process.env.COOKIE_SECURE === "true",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

async function persistSession(session: SessionRecord) {
  const jar = await cookies();
  jar.set(SID_COOKIE, session.id, { ...cookieBase, httpOnly: true });
  jar.set(CSRF_COOKIE, session.csrf, { ...cookieBase, httpOnly: false });
}

export async function ensureSession(): Promise<SessionRecord> {
  const jar = await cookies();
  const sid = jar.get(SID_COOKIE)?.value ?? "";
  const session = await mutate((db) => {
    const existing = sid ? db.sessions[sid] : undefined;
    if (existing) return existing;
    const created: SessionRecord = {
      id: randomBytes(16).toString("hex"),
      csrf: randomBytes(16).toString("hex"),
      userId: null,
      email: null,
      createdAt: new Date().toISOString(),
    };
    db.sessions[created.id] = created;
    return created;
  });
  if (session.id !== sid || jar.get(CSRF_COOKIE)?.value !== session.csrf) await persistSession(session);
  return session;
}

export async function updateSession(session: SessionRecord) {
  await mutate((db) => {
    db.sessions[session.id] = session;
  });
  await persistSession(session);
}

export async function readCart(sid: string): Promise<CartLine[]> {
  return mutate((db) => db.carts[sid] ?? []);
}

export async function writeCart(sid: string, lines: CartLine[]) {
  await mutate((db) => {
    db.carts[sid] = lines.filter((line) => line.qty > 0);
  });
}

export async function setCartLine(sid: string, productId: string, qty: number): Promise<CartLine[]> {
  return mutate((db) => {
    const lines = (db.carts[sid] ?? []).filter((line) => line.productId !== productId);
    if (qty > 0) lines.push({ productId, qty });
    db.carts[sid] = lines;
    return lines;
  });
}

export async function soldMap(): Promise<Record<string, number>> {
  return mutate((db) => db.sold);
}

export async function findOrderByKey(sid: string, key: string): Promise<MallOrder | null> {
  return mutate((db) => Object.values(db.orders).find((order) => order.ownerSid === sid && order.idempotencyKey === key) ?? null);
}

export async function putPendingOrder(order: MallOrder, intentId: string) {
  await mutate((db) => {
    db.orders[order.id] = order;
    db.intents[intentId] = { orderId: order.id, status: "requires_confirmation" };
  });
}

export async function getOrder(id: string): Promise<MallOrder | null> {
  return mutate((db) => db.orders[id] ?? null);
}

export async function listOrdersFor(session: SessionRecord): Promise<MallOrder[]> {
  return mutate((db) =>
    Object.values(db.orders)
      .filter((order) => (session.userId ? order.userId === session.userId : false))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
  );
}

export async function listBrowserOrders(sid: string): Promise<MallOrder[]> {
  return mutate((db) =>
    Object.values(db.orders)
      .filter((order) => order.ownerSid === sid)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
  );
}

function pay(db: Database, order: MallOrder, intentId: string) {
  if (order.status === "paid") return order;
  if (order.status !== "pending") return order;
  for (const item of order.items) db.sold[item.productId] = (db.sold[item.productId] ?? 0) + item.qty;
  order.status = "paid";
  order.paymentIntentId = intentId;
  const intent = db.intents[intentId];
  if (intent) intent.status = "paid";
  db.carts[order.ownerSid] = [];
  return order;
}

export async function markPaid(intentId: string, sid: string): Promise<MallOrder | null> {
  return mutate((db) => {
    const intent = db.intents[intentId];
    if (!intent) return null;
    const order = db.orders[intent.orderId];
    if (!order || order.ownerSid !== sid) return null;
    return pay(db, order, intentId);
  });
}

export async function markPaidByWebhook(intentId: string): Promise<boolean> {
  return mutate((db) => {
    const intent = db.intents[intentId];
    if (!intent) return false;
    const order = db.orders[intent.orderId];
    if (!order) return false;
    pay(db, order, intentId);
    return true;
  });
}

export function newOrderId(): string {
  return `m${randomBytes(8).toString("hex")}`;
}

export function newIntentId(): string {
  return `mock_${randomBytes(8).toString("hex")}`;
}
