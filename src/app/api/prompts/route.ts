import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { sanitizeContentFields } from "@/lib/utils/sanitize";

export async function POST(req: Request) {
  const unauthorized = requireAdminApi(req);
  if (unauthorized) return unauthorized;
  try {
    const data = await req.json();
    sanitizeContentFields(data, ["content"], ["title", "excerpt"]);
    const existing = await prisma.prompt.findUnique({ where: { slug: data.slug } });
    if (existing) {
      return NextResponse.json({ success: false, error: "Slug 已被使用" }, { status: 400 });
    }

    const { tags, ...promptData } = data;
    const prompt = await prisma.prompt.create({
      data: {
        ...promptData,
        published_at: promptData.status === "published" ? new Date() : null,
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
    return NextResponse.json({ success: true, data: prompt });
  } catch (e) {
    console.error("Create prompt error:", e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
