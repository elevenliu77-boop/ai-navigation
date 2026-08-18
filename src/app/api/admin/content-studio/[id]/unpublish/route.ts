import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/db";
import { requireAdminApi } from "@/lib/auth/admin";
import { updateBatchCounters } from "@/lib/services/content-studio";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  const { id } = await params;
  const assetId = Number(id);
  if (!Number.isInteger(assetId) || assetId < 1) return NextResponse.json({ success: false, error: "Invalid asset ID" }, { status: 400 });
  try {
    const asset = await prisma.contentStudioAsset.findUnique({ where: { id: assetId } });
    if (!asset?.site_content_id) return NextResponse.json({ success: false, error: "该素材没有已发布网站内容" }, { status: 400 });
    await prisma.$transaction([
      prisma.post.update({ where: { id: asset.site_content_id }, data: { status: "archived", published_at: null } }),
      prisma.contentStudioAsset.update({ where: { id: asset.id }, data: { status: "READY_FOR_SITE", site_content_id: null } }),
      prisma.contentStudioOutput.updateMany({ where: { asset_id: asset.id, platform: "WEBSITE" }, data: { status: "READY" } }),
    ]);
    await updateBatchCounters(asset.batch_id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
