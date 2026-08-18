import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/db";
import { requireAdminApi } from "@/lib/auth/admin";
import { serializeContentImportPackage } from "@/lib/services/content-import";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  const url = new URL(request.url);
  const batchId = Number(url.searchParams.get("batchId") || 0);
  const status = url.searchParams.get("status") || undefined;
  const [batches, packages] = await Promise.all([
    prisma.contentImportBatch.findMany({ orderBy: { created_at: "desc" }, take: 30 }),
    prisma.contentImportPackage.findMany({ where: { ...(batchId ? { batch_id: batchId } : {}), ...(status ? { status } : {}) }, include: { outputs: true, relations: true }, orderBy: { updated_at: "desc" }, take: 200 }),
  ]);
  return NextResponse.json({ success: true, data: { batches, packages: packages.map(serializeContentImportPackage) } });
}
