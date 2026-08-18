import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/db";
import { requireAdminApi } from "@/lib/auth/admin";
import { recalculateBatch } from "@/lib/services/content-import";

export async function POST(request: Request) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  try {
    const body = await request.json() as { packageIds?: unknown; batchId?: unknown };
    const packageIds = Array.isArray(body.packageIds) ? body.packageIds.map(Number).filter(Number.isInteger) : [];
    const batchId = Number(body.batchId || 0);
    const where = packageIds.length ? { id: { in: packageIds.slice(0, 200) }, status: "PREVIEW" } : batchId ? { batch_id: batchId, status: "PREVIEW" } : null;
    if (!where) return NextResponse.json({ success: false, error: "缺少 packageIds 或 batchId" }, { status: 400 });
    const result = await prisma.contentImportPackage.updateMany({ where, data: { status: "CONFIRMED" } });
    if (batchId) {
      await prisma.contentImportBatch.update({ where: { id: batchId }, data: { status: "OPEN" } });
      await recalculateBatch(batchId);
    }
    return NextResponse.json({ success: true, data: { updated: result.count } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "确认失败" }, { status: 400 });
  }
}
