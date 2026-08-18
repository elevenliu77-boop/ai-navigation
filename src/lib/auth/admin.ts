import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

export const ADMIN_COOKIE = "alphahole_admin";
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

function secret() {
  const value = process.env.JWT_SECRET || process.env.ADMIN_PASSWORD;
  if (!value) throw new Error("JWT_SECRET or ADMIN_PASSWORD is required");
  return value;
}

function encode(value: string) { return Buffer.from(value, "utf8").toString("base64url"); }
function decode(value: string) { return Buffer.from(value, "base64url").toString("utf8"); }

export function createAdminToken() {
  const payload = encode(JSON.stringify({ sub: "admin", exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS }));
  const signature = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyAdminToken(token: string | null | undefined) {
  if (!token) return false;
  try {
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return false;
    const expected = createHmac("sha256", secret()).update(payload).digest();
    const received = Buffer.from(signature, "base64url");
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return false;
    const data = JSON.parse(decode(payload));
    return data.sub === "admin" && Number(data.exp) > Math.floor(Date.now() / 1000);
  } catch { return false; }
}

export function tokenFromRequest(request: Request) {
  const header = request.headers.get("cookie") || "";
  return header.match(new RegExp(`${ADMIN_COOKIE}=([^;]+)`))?.[1] || null;
}

export function requireAdminApi(request: Request) {
  if (verifyAdminToken(tokenFromRequest(request))) return null;
  return NextResponse.json({ success: false, error: "未登录或登录已过期" }, { status: 401 });
}

export async function requireAdminPage() {
  const store = await cookies();
  if (!verifyAdminToken(store.get(ADMIN_COOKIE)?.value)) redirect("/admin/login");
}
