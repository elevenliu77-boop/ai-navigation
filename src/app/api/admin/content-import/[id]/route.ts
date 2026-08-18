import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/db";
import { requireAdminApi } from "@/lib/auth/admin";
import { contentPackageSchema, packageToRawJson } from "@/lib/content-import/schema";
import { contentPackageFingerprint } from "@/lib/services/content-import";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  try {
    const id = Number((await params).id);
    const body = await request.json() as { package?: unknown; raw_json?: unknown };
    const candidate = body.package ?? (typeof body.raw_json === "string" ? JSON.parse(body.raw_json) : body.raw_json);
    const parsed = contentPackageSchema.safeParse(candidate);
    if (!parsed.success) return NextResponse.json({ success: false, error: "编辑后的内容包校验失败", issues: parsed.error.issues }, { status: 400 });
    const pkg = parsed.data;
    const item = await prisma.contentImportPackage.update({ where: { id }, data: {
      package_id: pkg.package_id,
      package_version: pkg.package_version,
      raw_json: packageToRawJson(pkg),
      content_fingerprint: contentPackageFingerprint(pkg),
      original_url: pkg.source.original_url,
      source_type: pkg.source.source_type,
      source_author: pkg.source.source_author || null,
      source_title: pkg.source.source_title || null,
      source_date: pkg.source.source_date || null,
      verification: JSON.parse(JSON.stringify(pkg.verification)),
      classification: JSON.parse(JSON.stringify(pkg.classification)),
      website: JSON.parse(JSON.stringify(pkg.website)),
      social: JSON.parse(JSON.stringify(pkg.social)),
      editorial_review: JSON.parse(JSON.stringify(pkg.editorial_review)),
      technical_review: Prisma.JsonNull,
      status: "PREVIEW",
      duplicate_reason: null,
      duplicate_target_type: null,
      duplicate_target_id: null,
      error_message: null,
    } });
    return NextResponse.json({ success: true, data: { id: item.id, status: item.status, package_id: item.package_id } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "编辑失败，未写入内容包" }, { status: 400 });
  }
}
