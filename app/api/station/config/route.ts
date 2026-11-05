import { OFFERINGS } from "@/lib/catalog";
import { json, jsonError, limited } from "@/lib/http";
import { apiConfigured, getConfig } from "@/lib/partner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    limited(request, 60);
    let notice = "";
    if (apiConfigured()) {
      try {
        const config = await getConfig();
        if (config && typeof config === "object") {
          const record = config as Record<string, unknown>;
          if (typeof record.notice === "string") notice = record.notice.slice(0, 240);
          else if (typeof record.message === "string") notice = record.message.slice(0, 240);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        notice = message || "兑换服务暂时没有返回配置。";
      }
    } else {
      notice = "店铺尚未配置兑换密钥，页面可以浏览，提交时会暂停。";
    }
    return json({
      configured: apiConfigured(),
      products: OFFERINGS,
      notice,
    });
  } catch (error) {
    return jsonError(error);
  }
}
