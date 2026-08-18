import { prisma } from "@/lib/prisma";
import { classifyContent } from "@/lib/utils/content-category";
import { NextResponse } from "next/server";

// GET /api/admin/batch-publish?status=READY_TO_PUBLISH&category=tools&q=...
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "READY_TO_PUBLISH";
    const category = url.searchParams.get("category");
    const q = url.searchParams.get("q")?.trim();
    const where: Record<string, unknown> = { terminalState: "FINAL", status };
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { summary: { contains: q, mode: "insensitive" } },
        { ahId: { contains: q, mode: "insensitive" } },
      ];
    }

    const assets = await prisma.researchAsset.findMany({
      where,
      select: {
        ahId: true,
        title: true,
        status: true,
        sourceBatch: true,
        importedFromZip: true,
        summary: true,
        research: true,
        sources: true,
        mediaManifest: true,
        platformVariants: true,
        relations: true,
        method: true,
        siteContentId: true,
      },
      orderBy: { ahId: "asc" },
      take: 500,
    });

    // 风险标签 + 栏目归类
    const items = assets.map((a) => {
      const variants = (a.platformVariants || {}) as Record<string, unknown>;
      const websiteText = typeof variants.website === "string" ? variants.website : "";
      const research = (a.research || {}) as Record<string, unknown>;
      const sources = (a.sources || {}) as Record<string, unknown>;
      const hay = `${a.title} ${websiteText} ${JSON.stringify(a.summary || "")}`;
      const risks: string[] = [];
      if (/股票|基金|期权|期货|交易|投资|理财|保险|证券|医疗|治疗|疾病|药物|收益承诺|月入|稳赚|净赚|躺赚|绕过|破解|薅羊毛|刷单|多账号|规避|灰产|黑产/.test(hay)) risks.push("敏感领域");
      const vat = research.verified_at || sources.verified_at;
      if (typeof vat === "string") {
        const d = new Date(vat);
        if (!isNaN(d.getTime()) && (Date.now() - d.getTime()) / 86400000 > 180) risks.push("时效风险");
      } else {
        risks.push("时效未知");
      }
      const mediaCount = Array.isArray(a.mediaManifest) ? a.mediaManifest.length : 0;
      if (mediaCount === 0) risks.push("无媒体");
      const evidenceInfo =
        Array.isArray(research.fact_layers) && research.fact_layers.length
          ? research.fact_layers.join("/")
          : typeof sources._md === "string"
          ? "有来源"
          : "";
      const cat = classifyContent(hay);
      return {
        ahId: a.ahId,
        title: a.title,
        status: a.status,
        sourceBatch: a.sourceBatch,
        importedFromZip: a.importedFromZip,
        category: cat,
        evidenceInfo,
        risks,
        mediaCount,
        siteContentId: a.siteContentId,
        hasContent: websiteText.length > 500,
      };
    });

    const filtered = category && category !== "all" ? items.filter((i) => i.category.key === category) : items;
    return NextResponse.json({ success: true, data: { items: filtered, total: filtered.length } });
  } catch (e) {
    console.error("batch-publish list error:", e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
