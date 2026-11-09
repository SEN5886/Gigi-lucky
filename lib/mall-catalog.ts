import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { productSchema, type MallProduct } from "./mall-logic.ts";

function seedPath(): string {
  return path.join(process.cwd(), "data", "catalog.json");
}

export function catalogPath(): string {
  return path.resolve(process.cwd(), process.env.CATALOG_DATA_PATH || path.join(".data", "catalog.json"));
}

export function loadCatalog(): MallProduct[] {
  const file = catalogPath();
  let raw: string;
  try {
    raw = readFileSync(file, "utf8");
  } catch {
    raw = readFileSync(seedPath(), "utf8");
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, raw, "utf8");
  }
  return productSchema.array().parse(JSON.parse(raw));
}

export function saveCatalog(products: MallProduct[]) {
  const parsed = productSchema.array().parse(products);
  const slugs = new Set<string>();
  for (const product of parsed) {
    if (slugs.has(product.slug) || product.id !== product.slug) {
      throw new Error("商品标识需要唯一，且与 slug 相同。");
    }
    slugs.add(product.slug);
  }
  const file = catalogPath();
  mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.tmp`;
  writeFileSync(temp, JSON.stringify(parsed, null, 2), "utf8");
  renameSync(temp, file);
  return parsed;
}

export function findProduct(slug: string): MallProduct | null {
  return loadCatalog().find((item) => item.slug === slug) ?? null;
}

export function publicCatalog(): MallProduct[] {
  return loadCatalog().filter((item) => item.published !== false);
}
