/* eslint-disable @typescript-eslint/no-unused-vars, @next/next/no-assign-module-variable, no-var */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/db";
import { invalidateCache } from "@/lib/db/cache";
import { AjaxResponse } from "@/lib/utils";

function safeLink(value: unknown) {
  const raw = String(value || "").trim();
  try {
    const parsed = new URL(raw);
    if (!["http:", "https:", "mailto:"].includes(parsed.protocol)) return null;
    return raw;
  } catch {
    return null;
  }
}

// 获取所有页脚链接
export async function GET() {
  try {
    const links = await prisma.footerLink.findMany({
      select: {
        id: true,
        title: true,
        url: true,
      },
      orderBy: {
        created_at: "asc",
      },
    });
    return NextResponse.json(AjaxResponse.ok(links));
  } catch (error) {
    return NextResponse.json(AjaxResponse.fail("获取页脚链接失败"));
  }
}

// 创建新的页脚链接
export async function POST(request: Request) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  try {
    const { title, url } = await request.json();

    if (!String(title || "").trim() || !safeLink(url)) {
      return NextResponse.json(AjaxResponse.fail("标题和 URL 必须有效"), { status: 400 });
    }

    const link = await prisma.footerLink.create({
      data: {
        title: String(title).trim().slice(0, 120),
        url: safeLink(url)!,
      },
    });
    invalidateCache("footer-links");

    return NextResponse.json(AjaxResponse.ok(link));
  } catch (error) {
    if ((error as any).code === "P2002") {
      return NextResponse.json(AjaxResponse.fail("该URL已存在"));
    }
    return NextResponse.json(AjaxResponse.fail("创建页脚链接失败"));
  }
}

// 更新页脚链接
export async function PUT(request: Request) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  try {
    const { id, title, url } = await request.json();

    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId < 1 || !String(title || "").trim() || !safeLink(url)) {
      return NextResponse.json(AjaxResponse.fail("ID、标题和 URL 必须有效"), { status: 400 });
    }

    const link = await prisma.footerLink.update({
      where: { id: numericId },
      data: {
        title: String(title).trim().slice(0, 120),
        url: safeLink(url)!,
      },
    });
    invalidateCache("footer-links");

    return NextResponse.json(AjaxResponse.ok(link));
  } catch (error) {
    if ((error as any).code === "P2025") {
      return NextResponse.json(AjaxResponse.fail("链接不存在"));
    }
    return NextResponse.json(AjaxResponse.fail("更新页脚链接失败"));
  }
}

// 删除页脚链接
export async function DELETE(request: Request) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId < 1) {
      return NextResponse.json(AjaxResponse.fail("缺少ID参数"));
    }

    await prisma.footerLink.delete({
      where: { id: numericId },
    });
    invalidateCache("footer-links");

    return NextResponse.json(AjaxResponse.ok("success"));
  } catch (error) {
    if ((error as any).code === "P2025") {
      return NextResponse.json(AjaxResponse.fail("链接不存在"));
    }
    return NextResponse.json(AjaxResponse.fail("删除页脚链接失败"));
  }
}
