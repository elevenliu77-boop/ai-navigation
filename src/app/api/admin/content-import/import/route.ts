import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/db";
import { requireAdminApi } from "@/lib/auth/admin";
import { importPackage, recalculateBatch } from "@/lib/services/content-import";

export async function POST(request: Request) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  try {
    const body = await request.json() as { packageIds?: unknown; batchId?: unknown; limit?: unknown; force?: unknown };
    const ids = Array.isArray(body.packageIds) ? body.packageIds.map(Number).filter(Number.isInteger) : [];
    const batchId = Number(body.batchId || 0);
    const limit = Math.min(Math.max(Number(body.limit || 10), 1), 50);
    if (batchId) {
      const batch = await prisma.contentImportBatch.findUnique({ where: { id: batchId }, select: { status: true } });
      if (batch?.status === "PAUSED") return NextResponse.json({ success: false, error: "批次已暂停" }, { status: 409 });
    }
    const statuses = ["TECH_REVIEWED", "READY_TO_PUBLISH", "READY_TO_IMPORT"];
    const records = await prisma.contentImportPackage.findMany({ where: ids.length ? { id: { in: ids }, status: { in: statuses } } : batchId ? { batch_id: batchId, status: { in: statuses } } : { status: { in: statuses } }, select: { id: true }, take: limit });
    const results: unknown[] = [];
    for (const record of records) {
      try { results.push(await importPackage(record.id, body.force === true)); } catch (error) { results.push({ id: record.id, status: "IMPORT_FAILED", error: error instanceof Error ? error.message : "导入失败" }); }
    }
    if (batchId) await recalculateBatch(batchId);
    return NextResponse.json({ success: true, data: { processed: results.length, results } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "网站导入失败" }, { status: 400 });
  }
}
