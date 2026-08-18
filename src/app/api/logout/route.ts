import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/auth/admin";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, expires: new Date(0), path: "/" });
  return response;
}
