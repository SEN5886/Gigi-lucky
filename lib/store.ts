import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

export type Binding = {
  cdk: string;
  orderId: string;
  product: string;
  updatedAt: string;
};

const memory = new Map<string, Binding>();
let queue: Promise<void> = Promise.resolve();

function storePath(): string {
  return process.env.ORDER_STORE_PATH || path.join(process.cwd(), ".data", "cdk-orders.json");
}

async function readAll(): Promise<Record<string, Binding>> {
  try {
    const raw = await fs.readFile(storePath(), "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as Record<string, Binding>;
  } catch {
    return {};
  }
}

export function rememberBinding(cdk: string, orderId: string, product: string): Promise<void> {
  const key = cdk.trim().toLowerCase();
  if (!key || !/^[A-Za-z0-9_-]{4,200}$/.test(orderId)) return Promise.resolve();
  const binding: Binding = {
    cdk: key,
    orderId,
    product,
    updatedAt: new Date().toISOString(),
  };
  memory.set(key, binding);
  const run = queue.then(async () => {
    const all = await readAll();
    all[key] = binding;
    const target = storePath();
    await fs.mkdir(path.dirname(target), { recursive: true });
    const temp = `${target}.${process.pid}.tmp`;
    await fs.writeFile(temp, JSON.stringify(all), "utf8");
    await fs.rename(temp, target);
  });
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run.catch(() => undefined);
}

export async function findBinding(cdk: string): Promise<Binding | null> {
  const key = cdk.trim().toLowerCase();
  const cached = memory.get(key);
  if (cached) return cached;
  const all = await readAll();
  const found = all[key];
  if (!found || typeof found.orderId !== "string") return null;
  memory.set(key, found);
  return found;
}
