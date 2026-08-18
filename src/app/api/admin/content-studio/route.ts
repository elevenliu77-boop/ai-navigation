import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/db";
import { serializeStudioAsset } from "@/lib/services/content-studio";
import { requireAdminApi } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const batchId = Number(url.searchParams.get("batchId")) || undefined;
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);
  const assets = await prisma.contentStudioAsset.findMany({ where: { ...(status ? { status } : {}), ...(batchId ? { batch_id: batchId } : {}) }, include: { outputs: { orderBy: { platform: "asc" } }, batch: true, relations: true }, orderBy: { updated_at: "desc" }, take: limit });
  const batches = await prisma.contentStudioBatch.findMany({ orderBy: { created_at: "desc" }, take: 30 });
  const counts = await prisma.contentStudioAsset.groupBy({ by: ["status"], _count: { _all: true } });
  return NextResponse.json({ success: true, data: await Promise.all(assets.map(serializeStudioAsset)), batches, counts });
}
