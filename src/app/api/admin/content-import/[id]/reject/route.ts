import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/db";
import { requireAdminApi } from "@/lib/auth/admin";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  try {
    const id = Number((await params).id);
    const body = await request.json().catch(() => ({})) as { reason?: unknown };
    const item = await prisma.contentImportPackage.update({ where: { id }, data: { status: "REJECTED", error_message: String(body.reason || "人工拒绝") } });
    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "拒绝失败" }, { status: 400 });
  }
}
