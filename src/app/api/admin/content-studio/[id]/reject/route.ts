import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/db";
import { requireAdminApi } from "@/lib/auth/admin";
import { updateBatchCounters } from "@/lib/services/content-studio";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  try {
    const assetId = Number((await params).id);
    if (!Number.isInteger(assetId) || assetId < 1) return NextResponse.json({ success: false, error: "Invalid asset ID" }, { status: 400 });
    const asset = await prisma.contentStudioAsset.findUnique({ where: { id: assetId }, select: { batch_id: true, site_content_id: true } });
    if (!asset) return NextResponse.json({ success: false, error: "素材不存在" }, { status: 404 });
    await prisma.$transaction(async (tx) => {
      if (asset.site_content_id) await tx.post.update({ where: { id: asset.site_content_id }, data: { status: "archived", published_at: null } });
      await tx.contentStudioAsset.update({ where: { id: assetId }, data: { status: "REJECTED", manual_notes: "人工拒绝", site_content_id: null, locked_at: null, locked_by: null } });
      await tx.contentStudioOutput.updateMany({ where: { asset_id: assetId }, data: { status: "REJECTED" } });
    });
    await updateBatchCounters(asset.batch_id || null);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
