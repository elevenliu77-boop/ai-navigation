import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST /api/admin/batch-publish/publish { ahIds: [] } → FINAL 资产发布 + 关联 Post 发布
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ahIds: string[] = Array.isArray(body.ahIds) ? body.ahIds : [];
    if (!ahIds.length) return NextResponse.json({ success: false, error: "未选择内容" }, { status: 400 });

    let published = 0;
    const now = new Date();
    for (const ahId of ahIds) {
      const asset = await prisma.researchAsset.findUnique({ where: { ahId } });
      if (!asset || asset.terminalState !== "FINAL" || asset.status !== "READY_TO_PUBLISH") continue;
      await prisma.researchAsset.update({ where: { ahId }, data: { status: "PUBLISHED" } });
      if (asset.siteContentId) {
        const post = await prisma.post.findUnique({ where: { id: asset.siteContentId } });
        if (post && post.status !== "published") {
          await prisma.post.update({
            where: { id: post.id },
            data: { status: "published", published_at: post.published_at || now },
          });
        }
      }
      published++;
    }
    return NextResponse.json({ success: true, published });
  } catch (e) {
    console.error("batch publish error:", e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
