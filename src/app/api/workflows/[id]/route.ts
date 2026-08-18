import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { sanitizeContentFields, sanitizeText } from "@/lib/utils/sanitize";

interface Props {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: Request, { params }: Props) {
  const unauthorized = requireAdminApi(_req);
  if (unauthorized) return unauthorized;
  const { id } = await params;
  try {
    await prisma.workflowTag.deleteMany({ where: { workflow_id: Number(id) } });
    await prisma.workflow.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 404 });
  }
}

export async function PUT(req: Request, { params }: Props) {
  const unauthorized = requireAdminApi(req);
  if (unauthorized) return unauthorized;
  const { id } = await params;
  try {
    const data = await req.json();
    sanitizeContentFields(data, [], ["title", "description"]);
    if (Array.isArray(data.steps)) {
      data.steps = data.steps.map((step: Record<string, unknown>) => {
        const cleaned: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(step || {})) {
          cleaned[key] = typeof value === "string" ? sanitizeText(value, 2000) : value;
        }
        return cleaned;
      });
    }
    if (data.status === "published") {
      const existing = await prisma.workflow.findUnique({ where: { id: Number(id) } });
      if (existing && !existing.published_at) {
        data.published_at = new Date();
      }
    }
    if (data.tags) {
      await prisma.workflowTag.deleteMany({ where: { workflow_id: Number(id) } });
      if (data.tags.length > 0) {
        const tagRecords = await Promise.all(
          data.tags.map(async (slug: string) => {
            const tag = await prisma.tag.findUnique({ where: { slug } });
            if (!tag) throw new Error("Tag not found: " + slug);
            return { workflow_id: Number(id), tag_id: tag.id };
          })
        );
        await prisma.workflowTag.createMany({ data: tagRecords });
      }
      delete data.tags;
    }
    const workflow = await prisma.workflow.update({ where: { id: Number(id) }, data });
    return NextResponse.json({ success: true, data: workflow });
  } catch (e) {
    console.error("Update workflow error:", e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
