/* eslint-disable @typescript-eslint/no-unused-vars, @next/next/no-assign-module-variable, no-var */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/db";
import { requireAdminApi } from "@/lib/auth/admin";
import { ASSET_CATEGORIES, ASSET_DECISIONS, ASSET_PRIORITIES, ASSET_SOURCE_TYPES, ASSET_STATUSES, serializeAsset, sourceTypeForUrl } from "@/lib/services/assets";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  const id = Number((await params).id);
  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset) return NextResponse.json({ success: false, error: "素材不存在" }, { status: 404 });
  return NextResponse.json({ success: true, data: serializeAsset(asset) });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  try {
    const id = Number((await params).id);
    const body = await request.json() as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    const textFields = ["title", "author", "description", "researchNotes", "businessAnalysis", "verificationNotes"];
    for (const field of textFields) if (field in body) data[field] = body[field] === null ? null : String(body[field]).slice(0, 200_000);
    if (typeof body.sourceUrl === "string") { const url = new URL(body.sourceUrl); if (!/^https?:$/.test(url.protocol)) throw new Error("只支持 http/https 链接"); data.sourceUrl = url.toString(); data.sourceType = sourceTypeForUrl(data.sourceUrl as string); }
    if (typeof body.category === "string") { if (!ASSET_CATEGORIES.includes(body.category as any)) throw new Error("分类无效"); data.category = body.category; }
    if (typeof body.status === "string") { if (!ASSET_STATUSES.includes(body.status as any)) throw new Error("状态无效"); data.status = body.status; }
    if (typeof body.priority === "string") { if (!ASSET_PRIORITIES.includes(body.priority as any)) throw new Error("优先级无效"); data.priority = body.priority; }
    if (body.score !== undefined) { const score = Math.round(Number(body.score)); if (!Number.isFinite(score) || score < 0 || score > 100) throw new Error("评分必须是 0-100"); data.score = score; }
    if (body.finalDecision !== undefined) { if (body.finalDecision !== null && !ASSET_DECISIONS.includes(String(body.finalDecision) as any)) throw new Error("最终决定无效"); data.finalDecision = body.finalDecision === null ? null : String(body.finalDecision); }
    const asset = await prisma.asset.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: serializeAsset(asset) });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "素材更新失败" }, { status: 400 });
  }
}
