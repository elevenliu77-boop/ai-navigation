import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { sanitizeContentFields, sanitizeText } from "@/lib/utils/sanitize";

export async function POST(req: Request) {
  const unauthorized = requireAdminApi(req);
  if (unauthorized) return unauthorized;
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
    const existing = await prisma.workflow.findUnique({ where: { slug: data.slug } });
    if (existing) {
      return NextResponse.json({ success: false, error: "Slug 已被使用" }, { status: 400 });
    }

    const { tags, ...wfData } = data;
    const workflow = await prisma.workflow.create({
      data: {
        ...wfData,
        steps: wfData.steps ?? [],
        published_at: wfData.status === "published" ? new Date() : null,
        tags: tags?.length
          ? {
              create: await Promise.all(
                tags.map(async (slug: string) => {
                  const tag = await prisma.tag.findUnique({ where: { slug } });
                  if (!tag) throw new Error("Tag not found: " + slug);
                  return { tag_id: tag.id };
                })
              ),
            }
          : undefined,
      },
      include: { category: true, tags: { include: { tag: true } } },
    });
    return NextResponse.json({ success: true, data: workflow });
  } catch (e) {
    console.error("Create workflow error:", e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
