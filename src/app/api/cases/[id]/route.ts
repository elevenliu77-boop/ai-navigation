import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { sanitizeContentFields } from "@/lib/utils/sanitize";

interface Props {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: Request, { params }: Props) {
  const unauthorized = requireAdminApi(_req);
  if (unauthorized) return unauthorized;
  const { id } = await params;
  try {
    await prisma.caseTag.deleteMany({ where: { case_study_id: Number(id) } });
    await prisma.caseStudy.delete({ where: { id: Number(id) } });
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
    sanitizeContentFields(data, ["content"], ["title", "summary", "excerpt"]);
    if (data.status === "published") {
      const existing = await prisma.caseStudy.findUnique({ where: { id: Number(id) } });
      if (existing && !existing.published_at) {
        data.published_at = new Date();
      }
    }
    if (data.tags) {
      await prisma.caseTag.deleteMany({ where: { case_study_id: Number(id) } });
      if (data.tags.length > 0) {
        const tagRecords = await Promise.all(
          data.tags.map(async (slug: string) => {
            const tag = await prisma.tag.findUnique({ where: { slug } });
            if (!tag) throw new Error("Tag not found: " + slug);
            return { case_study_id: Number(id), tag_id: tag.id };
          })
        );
        await prisma.caseTag.createMany({ data: tagRecords });
      }
      delete data.tags;
    }
    const cs = await prisma.caseStudy.update({ where: { id: Number(id) }, data });
    return NextResponse.json({ success: true, data: cs });
  } catch (e) {
    console.error("Update case error:", e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
