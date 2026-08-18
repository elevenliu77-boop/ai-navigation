/* eslint-disable @typescript-eslint/no-unused-vars, @next/next/no-assign-module-variable, no-var */

 
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/db";
import { requireAdminApi } from "@/lib/auth/admin";
import { contentPackageSchema, packageToRawJson, parseContentPackages } from "@/lib/content-import/schema";
import { contentPackageFingerprint, packagePreview } from "@/lib/services/content-import";

export const dynamic = "force-dynamic";

const MAX_PACKAGES = 200;
const MAX_FILE_BYTES = 750_000;

async function readPayload(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const files = [...form.getAll("file"), ...form.getAll("files")].filter((item): item is File => item instanceof File);
    if (!files.length) throw new Error("请上传 JSON 文件");
    const values: unknown[] = [];
    for (const file of files) {
      if (file.size > MAX_FILE_BYTES) throw new Error(`文件过大：${file.name}`);
      const text = await file.text();
      try { values.push(JSON.parse(text)); } catch { throw new Error(`JSON 格式错误：${file.name}`); }
    }
    return values.flatMap((value) => Array.isArray(value) ? value : value && typeof value === "object" && Array.isArray((value as { packages?: unknown }).packages) ? (value as { packages: unknown[] }).packages : [value]);
  }
  const body = await request.json();
  if (body && typeof body === "object" && !Array.isArray(body)) {
    if (Array.isArray(body.packages)) return body.packages;
    if (body.package) return body.package;
  }
  return body;
}

export async function POST(request: Request) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  try {
    const parsed = parseContentPackages(await readPayload(request));
    if (parsed.issues.length || !parsed.packages.length) {
      return NextResponse.json({ success: false, error: "内容包校验失败", issues: parsed.issues }, { status: 400 });
    }
    if (parsed.packages.length > MAX_PACKAGES) return NextResponse.json({ success: false, error: `单批最多 ${MAX_PACKAGES} 条` }, { status: 400 });

    const batch = await prisma.$transaction(async (tx) => {
      const createdBatch = await tx.contentImportBatch.create({ data: { name: `ChatGPT 内容包 ${new Date().toLocaleString("zh-CN")}`, total_count: parsed.packages.length, pending_count: parsed.packages.length, status: "PREVIEW" } });
      await tx.contentImportPackage.createMany({ data: parsed.packages.map((pkg) => ({
        batch_id: createdBatch.id,
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
      })) });
      return createdBatch;
    });
    return NextResponse.json({ success: true, data: { batch_id: batch.id, count: parsed.packages.length, items: parsed.packages.map(packagePreview) } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "导入预览失败" }, { status: 400 });
  }
}
