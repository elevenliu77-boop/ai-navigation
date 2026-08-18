
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { importResearchResults, promoteResearchToContentImport } from "@/lib/services/research";
import { prisma } from "@/lib/db/db";

async function readResearchPayload(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) return request.json();
  const form = await request.formData();
  const entries = [...form.getAll("files"), ...form.getAll("file")];
  const files = entries.filter((entry): entry is File => entry instanceof File);
  if (!files.length) throw new Error("请上传 JSON 文件");
  let totalBytes = 0;
  const items: unknown[] = [];
  for (const file of files) {
    totalBytes += file.size;
    if (totalBytes > 20_000_000) throw new Error("JSON 文件总大小不能超过 20MB");
    const parsed = JSON.parse(await file.text()) as any;
    if (Array.isArray(parsed)) items.push(...parsed);
    else if (Array.isArray(parsed?.items)) items.push(...parsed.items);
    else items.push(parsed);
  }
  if (!items.length) throw new Error("JSON 文件中没有研究结果");
  return { items };
}

export async function POST(request: Request) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  try {
    const result = await importResearchResults(await readResearchPayload(request));
    const drafts: unknown[] = [];
    const draftErrors: unknown[] = [];
    for (const item of result.imported) {
      try {
        const task = await prisma.researchTask.findUnique({ where: { taskCode: item.taskCode }, select: { id: true } });
        if (!task) throw new Error("对应研究任务不存在");
        drafts.push(await promoteResearchToContentImport(task.id));
      } catch (error) {
        draftErrors.push({ assetCode: item.assetCode, error: error instanceof Error ? error.message : "网站草稿创建失败" });
      }
    }
    return NextResponse.json({ success: true, data: { ...result, drafts, draftErrors } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "研究结果导入失败" }, { status: 400 });
  }
}
