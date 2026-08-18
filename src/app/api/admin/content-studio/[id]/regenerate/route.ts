import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/db";
import { requireAdminApi } from "@/lib/auth/admin";
import { processAsset } from "@/lib/services/content-studio";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  try {
    const assetId = Number((await params).id);
    if (!Number.isInteger(assetId) || assetId < 1) return NextResponse.json({ success: false, error: "Invalid asset ID" }, { status: 400 });
    const asset = await prisma.contentStudioAsset.findUnique({ where: { id: assetId }, select: { site_content_id: true, locked_at: true } });
    if (!asset) return NextResponse.json({ success: false, error: "素材不存在" }, { status: 404 });
    if (asset.site_content_id) return NextResponse.json({ success: false, error: "已发布内容请先取消发布，再重新生成" }, { status: 409 });
    if (asset.locked_at && asset.locked_at.getTime() > Date.now() - 20 * 60 * 1000) return NextResponse.json({ success: false, error: "该素材正在处理中" }, { status: 409 });
    await prisma.contentStudioAsset.update({ where: { id: assetId }, data: { status: "NEEDS_REVIEW", locked_at: null, locked_by: null } });
    const result = await processAsset(assetId);
    return NextResponse.json({ success: Boolean(result), data: result });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
