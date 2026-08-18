import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/db";
import { requireAdminApi } from "@/lib/auth/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  try {
    const id = Number((await params).id);
    if (!Number.isInteger(id) || id < 1) return NextResponse.json({ success: false, error: "Invalid batch ID" }, { status: 400 });
    const payload = await request.json();
    const status = String(payload.status || "");
    if (!["OPEN", "PAUSED", "COMPLETED"].includes(status)) return NextResponse.json({ success: false, error: "不支持的批次状态" }, { status: 400 });
    const batch = await prisma.contentStudioBatch.update({ where: { id }, data: { status } });
    return NextResponse.json({ success: true, data: batch });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
