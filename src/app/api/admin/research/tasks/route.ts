
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { enqueueResearchTasks, RESEARCH_PRIORITIES, RESEARCH_STATUSES } from "@/lib/services/research";

export async function POST(request: Request) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  try {
    const body = await request.json().catch(() => ({})) as { assetIds?: unknown; all?: unknown; force?: unknown };
    const assetIds = Array.isArray(body.assetIds) ? body.assetIds.map(Number).filter(Number.isInteger) : undefined;
    const result = await enqueueResearchTasks({ assetIds, all: body.all === true, force: body.force === true });
    return NextResponse.json({ success: true, data: { created: result.created.map((task: any) => ({ id: task.id, taskCode: task.taskCode, assetId: task.assetId, status: task.status })), skipped: result.skipped } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "创建研究任务失败" }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  return NextResponse.json({ success: true, data: { statuses: RESEARCH_STATUSES, priorities: RESEARCH_PRIORITIES } });
}
