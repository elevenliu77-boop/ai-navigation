
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/db";
import { requireAdminApi } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  const [studioOutputs, importOutputs] = await Promise.all([
    prisma.contentStudioOutput.findMany({ include: { asset: { select: { id: true, raw_url: true, source_platform: true, fetched_title: true, status: true, value_score: true, official_url: true } } }, orderBy: { updated_at: "desc" }, take: 200 }),
    prisma.contentImportOutput.findMany({ include: { package: { select: { id: true, original_url: true, source_type: true, source_title: true, verification: true, website: true } } }, orderBy: { updated_at: "desc" }, take: 200 }),
  ]);
  const imported = importOutputs.map((output) => {
    const website = output.package.website && typeof output.package.website === "object" ? output.package.website as Record<string, any> : {};
    const verification = output.package.verification && typeof output.package.verification === "object" ? output.package.verification as Record<string, any> : {};
    return {
      ...output,
      id: `import:${output.id}`,
      source: "CONTENT_IMPORT",
      asset_id: output.package.id,
      asset: { id: output.package.id, raw_url: output.package.original_url, source_platform: output.package.source_type, fetched_title: output.package.source_title || website.title || null, status: "SITE_PUBLISHED", value_score: 0, official_url: verification.official_urls?.[0] || null },
    };
  });
  return NextResponse.json({ success: true, data: [...studioOutputs, ...imported].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()) });
}
