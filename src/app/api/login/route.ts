import { NextResponse } from "next/server";
import { ADMIN_COOKIE, createAdminToken } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/db";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const stored = await prisma.setting.findUnique({ where: { key: "adminPassword" }, select: { value: true } });
    const adminPassword = stored?.value?.trim() || process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json(
        { message: "管理员密码未配置" },
        { status: 500 }
      );
    }

    if (typeof password !== "string" || password !== adminPassword) {
      return NextResponse.json({ message: "密码错误" }, { status: 401 });
    }

    const response = NextResponse.json({ message: "登录成功" }, { status: 200 });
    response.cookies.set(ADMIN_COOKIE, createAdminToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ message: "登录失败，请重试" }, { status: 500 });
  }
}
