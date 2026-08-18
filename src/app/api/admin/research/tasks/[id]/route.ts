import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { getResearchTask, updateResearchTask } from "@/lib/services/research";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  const task = await getResearchTask(Number((await params).id));
  if (!task) return NextResponse.json({ success: false, error: "研究任务不存在" }, { status: 404 });
  return NextResponse.json({ success: true, data: task });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  try {
    const body = await request.json() as { status?: unknown; progress?: unknown; notes?: unknown; errorMessage?: unknown };
    const task = await updateResearchTask(Number((await params).id), {
      status: typeof body.status === "string" ? body.status : undefined,
      progress: body.progress,
      notes: body.notes,
      errorMessage: body.errorMessage,
    });
    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "研究任务更新失败" }, { status: 400 });
  }
}
