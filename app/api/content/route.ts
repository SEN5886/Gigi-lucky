import { json, limited } from "@/lib/http";
import { readContent } from "@/lib/site-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  limited(request, 120, "content");
  return json({ content: readContent() });
}
