import { readFileSync } from "node:fs";
import path from "node:path";
import { productSchema, type MallProduct } from "./mall-logic.ts";

let cached: MallProduct[] | null = null;

export function loadCatalog(): MallProduct[] {
  if (cached) return cached;
  const file = path.join(process.cwd(), "data", "catalog.json");
  const parsed = JSON.parse(readFileSync(file, "utf8")) as unknown;
  cached = productSchema.array().parse(parsed);
  return cached;
}

export function findProduct(slug: string): MallProduct | null {
  return loadCatalog().find((item) => item.slug === slug) ?? null;
}
