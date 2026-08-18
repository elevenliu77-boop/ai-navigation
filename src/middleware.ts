import { NextRequest, NextResponse } from "next/server";

/**
 * 全局安全中间件（Edge Runtime）：
 * - /admin/* 页面：未登录重定向到登录页
 * - /api/admin/* 全部方法：未登录返回 401
 * 与 src/lib/auth/admin.ts（Node 运行时）使用同一 HMAC-SHA256 令牌格式，
 * 作为每路由 requireAdminApi 之外的第二道防线。
 */

export const ADMIN_COOKIE = "alphahole_admin";
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

async function secretBytes(): Promise<Uint8Array> {
  const value = process.env.JWT_SECRET || process.env.ADMIN_PASSWORD;
  if (!value) return new TextEncoder().encode("alphahole-insecure-fallback");
  return new TextEncoder().encode(value);
}

function base64UrlDecode(input: string): Uint8Array {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function verifyToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      await secretBytes(),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const expected = new Uint8Array(
      await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(payload)
      )
    );
    const received = base64UrlDecode(signature);
    if (expected.length !== received.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i += 1) {
      diff |= expected[i] ^ received[i];
    }
    if (diff !== 0) return false;
    const data = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload)));
    return (
      data.sub === "admin" &&
      Number(data.exp) > Math.floor(Date.now() / 1000) &&
      Number(data.exp) <= Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS + 60
    );
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  const authed = await verifyToken(token);

  if (pathname.startsWith("/api/admin")) {
    if (authed) return NextResponse.next();
    return NextResponse.json(
      { success: false, error: "未登录或登录已过期" },
      { status: 401 }
    );
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (authed) return NextResponse.next();
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
