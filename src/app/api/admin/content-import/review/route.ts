import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/db";
import { requireAdminApi } from "@/lib/auth/admin";
import { recalculateBatch, reviewImportPackage } from "@/lib/services/content-import";

export async function POST(request: Request) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  try {
    const body = await request.json() as { packageIds?: unknown; batchId?: unknown; limit?: unknown; retry?: unknown };
    const ids = Array.isArray(body.packageIds) ? body.packageIds.map(Number).filter(Number.isInteger) : [];
    const batchId = Number(body.batchId || 0);
    const limit = Math.min(Math.max(Number(body.limit || 10), 1), 50);
    if (batchId) {
      const batch = await prisma.contentImportBatch.findUnique({ where: { id: batchId }, select: { status: true } });
      if (batch?.status === "PAUSED") return NextResponse.json({ success: false, error: "批次已暂停" }, { status: 409 });
    }
    const retry = body.retry === true;
    const reviewStatuses = retry ? ["CONFIRMED", "TECH_REVIEW_FAILED", "SOURCE_UNAVAILABLE"] : ["CONFIRMED"];
    const records = await prisma.contentImportPackage.findMany({ where: ids.length ? { id: { in: ids }, status: { in: reviewStatuses } } : batchId ? { batch_id: batchId, status: { in: reviewStatuses } } : { status: { in: reviewStatuses } }, select: { id: true }, take: limit });
    const results: unknown[] = [];
    for (const record of records) {
      try { results.push(await reviewImportPackage(record.id)); } catch (error) { results.push({ id: record.id, status: "TECH_REVIEW_FAILED", error: error instanceof Error ? error.message : "核验失败" }); }
    }
    if (batchId) await recalculateBatch(batchId);
    return NextResponse.json({ success: true, data: { processed: results.length, results } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "技术核验失败" }, { status: 400 });
  }
}
