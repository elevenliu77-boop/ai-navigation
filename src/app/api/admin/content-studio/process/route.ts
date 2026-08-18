import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/db";
import { processAsset, serializeStudioAsset } from "@/lib/services/content-studio";
import { requireAdminApi } from "@/lib/auth/admin";

export async function POST(request: Request) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  try {
    const payload = await request.json().catch(() => ({}));
    const parsedAssetId = Number(payload.assetId);
    const parsedBatchId = Number(payload.batchId);
    const assetId = Number.isInteger(parsedAssetId) && parsedAssetId > 0 ? parsedAssetId : undefined;
    const batchId = Number.isInteger(parsedBatchId) && parsedBatchId > 0 ? parsedBatchId : undefined;
    const limit = Math.min(Math.max(Number(payload.limit) || 5, 1), 10);
    if (batchId) {
      const batch = await prisma.contentStudioBatch.findUnique({ where: { id: batchId }, select: { status: true } });
      if (batch?.status === "PAUSED") return NextResponse.json({ success: false, error: "该批次已暂停" }, { status: 409 });
    }
    const staleBefore = new Date(Date.now() - 20 * 60 * 1000);
    let assets;
    if (assetId) {
      const asset = await prisma.contentStudioAsset.findUnique({ where: { id: assetId }, include: { batch: { select: { status: true } } } });
      if (asset?.batch?.status === "PAUSED") return NextResponse.json({ success: false, error: "该批次已暂停" }, { status: 409 });
      assets = asset ? [asset] : [];
    } else {
      assets = await prisma.contentStudioAsset.findMany({ where: { ...(batchId ? { batch_id: batchId } : {}), OR: [{ status: { in: payload.retry ? ["NEW", "FETCH_FAILED", "NEEDS_REVIEW"] : ["NEW"] } }, ...(payload.retry ? [{ status: "FETCHING", OR: [{ locked_at: null }, { locked_at: { lt: staleBefore } }] }] : [])] }, orderBy: { created_at: "asc" }, take: limit });
    }
    const results = [];
    for (const asset of assets) {
      const processed = await processAsset(asset.id);
      if (processed) results.push(processed);
    }
    return NextResponse.json({ success: true, processed: results.length, data: await Promise.all(results.map(serializeStudioAsset)) });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
