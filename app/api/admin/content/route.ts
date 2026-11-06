import { requireAdmin } from "@/lib/admin-auth";
import { json, jsonError, limited, readJson } from "@/lib/http";
import { readContent, writeContent } from "@/lib/site-content";
import { ShopError } from "@/lib/shop-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    limited(request, 60, "admin");
    await requireAdmin();
    return json({ content: readContent() });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    limited(request, 30, "admin");
    await requireAdmin();
    try {
      const saved = writeContent(await readJson(request, 40_000));
      return json({ ok: true, content: saved });
    } catch {
      throw new ShopError(400, "INVALID_CONTENT", "文案超出长度，或客服链接不是 https / 站内路径。");
    }
  } catch (error) {
    return jsonError(error);
  }
}
