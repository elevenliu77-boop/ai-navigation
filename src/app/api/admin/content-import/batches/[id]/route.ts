import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/db";
import { requireAdminApi } from "@/lib/auth/admin";

const allowed = new Set(["PREVIEW", "OPEN", "PAUSED", "COMPLETED"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  try {
    const id = Number((await params).id);
    const status = String((await request.json()).status || "");
    if (!Number.isInteger(id) || !allowed.has(status)) return NextResponse.json({ success: false, error: "批次状态无效" }, { status: 400 });
    const batch = await prisma.contentImportBatch.update({ where: { id }, data: { status } });
    return NextResponse.json({ success: true, data: batch });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "批次更新失败" }, { status: 400 });
  }
}
