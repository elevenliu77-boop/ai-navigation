import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const category = searchParams.get("category");
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = 20;

  if (!q && !category) {
    return NextResponse.json({ posts: [], total: 0 });
  }

  const where: any = { status: "published" };

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { excerpt: { contains: q, mode: "insensitive" } },
    ];
  }
  if (category && category !== "all") {
    where.category = { slug: category };
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: { category: true, tags: { include: { tag: true } } },
      orderBy: { published_at: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    prisma.post.count({ where }),
  ]);

  const formatPost = (p: any) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    view_count: p.view_count,
    published_at: p.published_at?.toISOString() ?? null,
    category: p.category,
    tags: p.tags?.map((pt: any) => pt.tag) ?? [],
  });

  return NextResponse.json({
    posts: posts.map(formatPost),
    total,
    page,
    pageSize,
  });
}
