import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { createAssets, parseAssetCsv, parseAssetUrls, serializeAsset } from "@/lib/services/assets";
import { syncUrlsToContentStudio } from "@/lib/services/content-studio";

export async function POST(request: Request) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  try {
    const contentType = request.headers.get("content-type") || "";
    let raw = "";
    let format = "text";
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) return NextResponse.json({ success: false, error: "请上传 CSV 文件" }, { status: 400 });
      if (file.size > 2_000_000) return NextResponse.json({ success: false, error: "CSV 文件不能超过 2MB" }, { status: 400 });
      raw = await file.text();
      format = "csv";
    } else {
      const body = await request.json() as { urls?: unknown; csv?: unknown; format?: unknown };
      if (typeof body.csv === "string") { raw = body.csv; format = "csv"; }
      else if (typeof body.urls === "string") { raw = body.urls; format = body.format === "csv" ? "csv" : "text"; }
      else return NextResponse.json({ success: false, error: "请提供 urls 或 csv" }, { status: 400 });
    }
    const parsed = format === "csv" ? parseAssetCsv(raw) : parseAssetUrls(raw);
    if (!parsed.urls.length) return NextResponse.json({ success: false, error: "没有发现有效 URL", invalid: parsed.invalid }, { status: 400 });
    if (parsed.urls.length > 1000) return NextResponse.json({ success: false, error: "单次最多导入 1000 条" }, { status: 400 });
    const result = await createAssets(parsed.urls.map((sourceUrl) => ({ sourceUrl })));
    let contentStudioSync: unknown = null;
    let contentStudioSyncError: string | null = null;
    try { contentStudioSync = await syncUrlsToContentStudio(parsed.urls); } catch (error) { contentStudioSyncError = error instanceof Error ? error.message : "内容工作台同步失败"; }
    return NextResponse.json({ success: true, data: { imported: result.created.length, duplicates: [...parsed.duplicates, ...result.duplicates], invalid: parsed.invalid, items: result.created.map(serializeAsset), contentStudioSync, contentStudioSyncError } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "批量导入失败" }, { status: 400 });
  }
}
