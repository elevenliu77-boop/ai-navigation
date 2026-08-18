import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { backfillContentStudioAssetsToResearch } from "@/lib/services/research";

export async function POST(request: Request) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  try {
    return NextResponse.json({ success: true, data: await backfillContentStudioAssetsToResearch() });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "历史素材回填失败" }, { status: 500 });
  }
}
