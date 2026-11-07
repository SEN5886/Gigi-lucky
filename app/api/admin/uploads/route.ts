import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { requireAdmin } from "@/lib/admin-auth";
import { json, jsonError, limited, readJson } from "@/lib/http";
import { extensionForImage, uploadPathFor } from "@/lib/product-images";
import { ShopError } from "@/lib/shop-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 2_000_000;

function uploadDir(): string {
  return path.join(process.cwd(), "public", "uploads", "products");
}

export async function POST(request: Request) {
  try {
    limited(request, 20, "admin");
    await requireAdmin();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new ShopError(400, "INVALID_IMAGE", "请选择一张图片。");
    if (file.size <= 0 || file.size > MAX_BYTES) throw new ShopError(400, "INVALID_IMAGE", "图片需要小于 2MB。");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const ext = extensionForImage(bytes, file.type);
    if (!ext) throw new ShopError(400, "INVALID_IMAGE", "只接受 JPG、PNG、WEBP 或 GIF。");
    const name = `${randomBytes(16).toString("hex")}.${ext}`;
    const dir = uploadDir();
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), bytes);
    return json({ url: `/uploads/products/${name}` });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    limited(request, 30, "admin");
    await requireAdmin();
    const body = (await readJson(request, 1_000)) as { url?: unknown };
    if (typeof body.url !== "string" || !body.url.startsWith("/uploads/products/")) {
      throw new ShopError(400, "INVALID_IMAGE", "只能删除本站上传的商品图。");
    }
    const name = body.url.slice("/uploads/products/".length);
    const url = uploadPathFor(name);
    if (!url) throw new ShopError(400, "INVALID_IMAGE", "图片路径不正确。");
    const target = path.resolve(uploadDir(), name);
    if (!target.startsWith(path.resolve(uploadDir()) + path.sep)) {
      throw new ShopError(400, "INVALID_IMAGE", "图片路径不正确。");
    }
    await unlink(target).catch(() => undefined);
    return json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
