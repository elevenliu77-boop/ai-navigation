import { NextResponse } from "next/server";
import { AjaxResponse } from "@/lib/utils";
import { PrismaClient } from "@prisma/client";
import { invalidateCache } from "@/lib/db/cache";

const prisma = new PrismaClient();

// POST /api/websites/[id]/like - Add like
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const websiteId = Number((await params).id);
    if (!Number.isInteger(websiteId) || websiteId < 1) return NextResponse.json(AjaxResponse.fail("Invalid website ID"), { status: 400 });
    const updatedWebsite = await prisma.website.update({
      where: { id: websiteId },
      data: { likes: { increment: 1 } },
    });

    // 清除网站列表缓存
    invalidateCache("approved-websites");

    return NextResponse.json(AjaxResponse.ok({ likes: updatedWebsite.likes }));
  } catch (error) {
    console.error("Failed to like website:", error);
    return NextResponse.json(AjaxResponse.fail("Failed to like website"), {
      status: 500,
    });
  }
}

// DELETE /api/websites/[id]/like - Remove like
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const websiteId = Number((await params).id);
    if (!Number.isInteger(websiteId) || websiteId < 1) return NextResponse.json(AjaxResponse.fail("Invalid website ID"), { status: 400 });
    const updated = await prisma.website.updateMany({ where: { id: websiteId, likes: { gt: 0 } }, data: { likes: { decrement: 1 } } });
    if (!updated.count) {
      const website = await prisma.website.findUnique({ where: { id: websiteId }, select: { likes: true } });
      if (!website) return NextResponse.json(AjaxResponse.fail("Website not found"), { status: 404 });
      return NextResponse.json(AjaxResponse.ok({ likes: website.likes }));
    }
    const updatedWebsite = await prisma.website.findUniqueOrThrow({ where: { id: websiteId }, select: { likes: true } });

    return NextResponse.json(AjaxResponse.ok({ likes: updatedWebsite.likes }));
  } catch (error) {
    console.error("Failed to unlike website:", error);
    return NextResponse.json(AjaxResponse.fail("Failed to unlike website"), {
      status: 500,
    });
  }
}
