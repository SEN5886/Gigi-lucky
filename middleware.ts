import { NextResponse, type NextRequest } from "next/server";
import { originMatches, tokensMatch } from "@/lib/shop-contract";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/api/")) return NextResponse.next();
  if (request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS") return NextResponse.next();
  if (pathname === "/api/payments/webhook") return NextResponse.next();

  const host = request.headers.get("host");
  const origin = request.headers.get("origin");
  if (!originMatches(host, origin)) {
    return NextResponse.json({ code: "CSRF", message: "请从本站页面提交。" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const cookie = request.cookies.get("gigi_csrf")?.value ?? "";
  const header = request.headers.get("x-csrf-token") ?? "";
  if (!tokensMatch(cookie, header)) {
    return NextResponse.json({ code: "CSRF", message: "页面已过期，请刷新后再试。" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.next();
}

export const config = { matcher: ["/api/:path*"] };
