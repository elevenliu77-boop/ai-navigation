import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST /api/posts — 创建新文章
export async function POST(req: Request) {
  try {
    const data = await req.json();

    // Check slug uniqueness
    const existing = await prisma.post.findUnique({ where: { slug: data.slug } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Slug 已被使用" },
        { status: 400 }
      );
    }

    const { tags, ...postData } = data;

    const post = await prisma.post.create({
      data: {
        ...postData,
        published_at: postData.status === "published" ? new Date() : null,
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

    return NextResponse.json({ success: true, data: post });
  } catch (e) {
    console.error("Create post error:", e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
