
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/db";
import { requireAdminApi } from "@/lib/auth/admin";
import { ASSET_CATEGORIES, ASSET_PRIORITIES, ASSET_SOURCE_TYPES, ASSET_STATUSES, createAssets, serializeAsset } from "@/lib/services/assets";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  const params = new URL(request.url).searchParams;
  const page = Math.max(1, Number(params.get("page") || 1));
  const pageSize = Math.min(100, Math.max(1, Number(params.get("pageSize") || 30)));
  const search = params.get("search")?.trim() || "";
  const category = params.get("category") || "";
  const status = params.get("status") || "";
  const sourceType = params.get("sourceType") || "";
  const priority = params.get("priority") || "";
  const sort = params.get("sort") || "updated";
  const where = {
    ...(category && ASSET_CATEGORIES.includes(category as any) ? { category } : {}),
    ...(status && ASSET_STATUSES.includes(status as any) ? { status } : {}),
    ...(sourceType && ASSET_SOURCE_TYPES.includes(sourceType as any) ? { sourceType } : {}),
    ...(priority && ASSET_PRIORITIES.includes(priority as any) ? { priority } : {}),
    ...(search ? { OR: [{ assetCode: { contains: search, mode: "insensitive" as const } }, { title: { contains: search, mode: "insensitive" as const } }, { sourceUrl: { contains: search, mode: "insensitive" as const } }, { author: { contains: search, mode: "insensitive" as const } }] } : {}),
  };
  const orderBy = sort === "score" ? [{ score: "desc" as const }, { updatedAt: "desc" as const }] : sort === "assetCode" ? { assetCode: "asc" as const } : { updatedAt: "desc" as const };
  const [items, total] = await Promise.all([
    prisma.asset.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.asset.count({ where }),
  ]);
  return NextResponse.json({ success: true, data: { items: items.map(serializeAsset), total, page, pageSize, pages: Math.ceil(total / pageSize) } });
}

export async function POST(request: Request) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  try {
    const body = await request.json() as { sourceUrl?: unknown; title?: unknown; sourceType?: unknown; author?: unknown };
    if (typeof body.sourceUrl !== "string") return NextResponse.json({ success: false, error: "sourceUrl 必填" }, { status: 400 });
    const result = await createAssets([{ sourceUrl: body.sourceUrl, title: typeof body.title === "string" ? body.title : undefined, sourceType: typeof body.sourceType === "string" && ASSET_SOURCE_TYPES.includes(body.sourceType as any) ? body.sourceType as any : undefined, author: typeof body.author === "string" ? body.author : undefined }]);
    return NextResponse.json({ success: true, data: { created: result.created.map(serializeAsset), duplicates: result.duplicates } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "素材创建失败" }, { status: 400 });
  }
}
