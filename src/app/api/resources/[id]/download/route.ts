import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, { params }: Props) {
  try {
    const { id } = await params;
    const resource = await prisma.resource.findUnique({
      where: { id: Number(id) },
    });

    if (!resource) {
      return NextResponse.json(
        { success: false, message: "资源不存在" },
        { status: 404 }
      );
    }

    if (resource.permission?.toUpperCase() === "VIP") {
      return NextResponse.json(
        {
          success: false,
          requiresMembership: true,
          message: "该资源需要会员权限",
        },
        { status: 403 }
      );
    }

    await prisma.resource.update({
      where: { id: Number(id) },
      data: { downloads: { increment: 1 } },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 404 });
  }
}
