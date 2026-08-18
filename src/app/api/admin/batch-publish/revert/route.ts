import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST /api/admin/batch-publish/revert { ahIds: [] } → 退回 DRAFT（资产+关联 Post）
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ahIds: string[] = Array.isArray(body.ahIds) ? body.ahIds : [];
    if (!ahIds.length) return NextResponse.json({ success: false, error: "未选择内容" }, { status: 400 });

    let reverted = 0;
    for (const ahId of ahIds) {
      const asset = await prisma.researchAsset.findUnique({ where: { ahId } });
      if (!asset) continue;
      await prisma.researchAsset.update({ where: { ahId }, data: { status: "DRAFT" } });
      if (asset.siteContentId) {
        await prisma.post.updateMany({
          where: { id: asset.siteContentId, status: "published" },
          data: { status: "draft" },
        });
      }
      reverted++;
    }
    return NextResponse.json({ success: true, reverted });
  } catch (e) {
    console.error("batch revert error:", e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
