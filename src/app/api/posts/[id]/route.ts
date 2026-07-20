import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface Props {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: Request, { params }: Props) {
  const { id } = await params;
  try {
    await prisma.postTag.deleteMany({ where: { post_id: Number(id) } });
    await prisma.post.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 404 });
  }
}

export async function PUT(req: Request, { params }: Props) {
  const { id } = await params;
  try {
    const data = await req.json();

    // Handle publishing
    if (data.status === "published") {
      const existing = await prisma.post.findUnique({ where: { id: Number(id) } });
      if (existing && !existing.published_at) {
        data.published_at = new Date();
      }
    }

    // Handle tags
    if (data.tags) {
      await prisma.postTag.deleteMany({ where: { post_id: Number(id) } });
      if (data.tags.length > 0) {
        const tagRecords = await Promise.all(
          data.tags.map(async (slug: string) => {
            const tag = await prisma.tag.findUnique({ where: { slug } });
            if (!tag) throw new Error("Tag not found: " + slug);
            return { post_id: Number(id), tag_id: tag.id };
          })
        );
        await prisma.postTag.createMany({ data: tagRecords });
      }
      delete data.tags;
    }

    const post = await prisma.post.update({
      where: { id: Number(id) },
      data,
    });

    return NextResponse.json({ success: true, data: post });
  } catch (e) {
    console.error("Update post error:", e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
