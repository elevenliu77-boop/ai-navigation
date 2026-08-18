import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { promoteResearchToContentImport } from "@/lib/services/research";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  try {
    const result = await promoteResearchToContentImport(Number((await params).id));
    return NextResponse.json({ success: true, data: { ...result, reviewUrl: "/admin/content-import" } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "网站草稿创建失败" }, { status: 400 });
  }
}
