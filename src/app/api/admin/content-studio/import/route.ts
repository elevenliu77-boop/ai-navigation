
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/db";
import { assertPublicSourceUrl, detectSourcePlatform, normalizeSourceUrl } from "@/lib/services/content-studio";
import { requireAdminApi } from "@/lib/auth/admin";
import { syncUrlsToResearchAssets } from "@/lib/services/research";

export async function POST(request: Request) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  try {
    const payload = await request.json();
    const rawUrls = String(payload.urls || "");
    const urls = Array.from(new Set(rawUrls.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)));
    if (!urls.length) return NextResponse.json({ success: false, error: "请至少粘贴一条 URL" }, { status: 400 });
    if (urls.length > 500) return NextResponse.json({ success: false, error: "单批最多导入 500 条 URL" }, { status: 400 });

    const valid: string[] = [];
    const invalid: string[] = [];
    for (const item of urls) {
      try {
        const normalized = normalizeSourceUrl(item);
        await assertPublicSourceUrl(normalized);
        valid.push(normalized);
      } catch {
        invalid.push(item);
      }
    }

    const existing = valid.length ? await prisma.contentStudioAsset.findMany({ where: { raw_url: { in: valid } }, select: { raw_url: true } }) : [];
    const duplicateSet = new Set(existing.map((item) => item.raw_url));
    const duplicates = valid.filter((item) => duplicateSet.has(item));
    const newUrls = valid.filter((item) => !duplicateSet.has(item));
    if (!newUrls.length) return NextResponse.json({ success: true, batchId: null, imported: 0, duplicates, invalid, total: urls.length });

    const imported: string[] = [];
    const batchId = await prisma.$transaction(async (tx) => {
      const batch = await tx.contentStudioBatch.create({ data: { name: String(payload.name || `批次 ${new Date().toLocaleString("zh-CN")}`).slice(0, 200) } });
      for (const rawUrl of newUrls) {
        try {
          await tx.contentStudioAsset.create({ data: { raw_url: rawUrl, source_platform: detectSourcePlatform(rawUrl), batch_id: batch.id } });
          imported.push(rawUrl);
        } catch (error: any) {
          if (error?.code === "P2002") duplicates.push(rawUrl);
          else throw error;
        }
      }
      if (!imported.length) {
        await tx.contentStudioBatch.delete({ where: { id: batch.id } });
        return null;
      }
      await tx.contentStudioBatch.update({ where: { id: batch.id }, data: { total_count: imported.length, pending_count: imported.length, status: "OPEN" } });
      return batch.id;
    });
    let researchSync: unknown = null;
    let researchSyncError: string | null = null;
    try {
      researchSync = await syncUrlsToResearchAssets(imported);
    } catch (error) {
      researchSyncError = error instanceof Error ? error.message : "研究资产同步失败";
    }
    return NextResponse.json({ success: true, batchId, imported: imported.length, duplicates, invalid, total: urls.length, researchSync, researchSyncError });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
