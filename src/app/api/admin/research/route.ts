import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { getResearchStats, listResearchTasks } from "@/lib/services/research";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  const params = new URL(request.url).searchParams;
  try {
    const [stats, tasks] = await Promise.all([
      getResearchStats(),
      listResearchTasks({
        status: params.get("status") || undefined,
        priority: params.get("priority") || undefined,
        sourceType: params.get("sourceType") || undefined,
        search: params.get("search")?.trim() || undefined,
        sort: params.get("sort") || "updated",
        page: Number(params.get("page") || 1),
        pageSize: Number(params.get("pageSize") || 50),
      }),
    ]);
    return NextResponse.json({ success: true, data: { stats, ...tasks } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "研究数据加载失败" }, { status: 500 });
  }
}
