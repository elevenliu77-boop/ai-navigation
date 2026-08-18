import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/db";
import { requireAdminApi } from "@/lib/auth/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  try {
    const { id: rawId } = await params;
    const payload = await request.json();
    const status = String(payload.status || "");
    if (!["NOT_GENERATED", "GENERATING", "NEEDS_REVIEW", "READY", "MANUALLY_PUBLISHED"].includes(status)) return NextResponse.json({ success: false, error: "不支持的社媒状态" }, { status: 400 });
    const isImport = payload.source === "CONTENT_IMPORT" || rawId.startsWith("import:");
    const numericId = Number(rawId.replace(/^import:/, ""));
    const output = isImport
      ? await prisma.contentImportOutput.update({ where: { id: numericId }, data: { status } })
      : await prisma.contentStudioOutput.update({ where: { id: numericId }, data: { status } });
    return NextResponse.json({ success: true, data: output });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
