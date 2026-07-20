import { prisma } from "@/lib/db/db";
import HomePageClient from "@/app/home-page";
import { cachedPrismaQuery } from "@/lib/db/cache";

export const dynamic = "force-dynamic";

export default async function Home() {
  // 分类（含文章数）
  const categories = await cachedPrismaQuery(
    "categories-with-counts",
    () =>
      prisma.category.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          _count: { select: { posts: true } },
        },
        orderBy: { name: "asc" },
      }),
    { ttl: 3600 }
  );

  // 精选文章（按浏览量排序）
  const featuredPosts = await prisma.post.findMany({
    where: { status: "published" },
    include: {
      category: true,
      tags: { include: { tag: true } },
    },
    orderBy: [{ view_count: "desc" }, { published_at: "desc" }],
    take: 5,
  });

  // 最新文章
  const latestPosts = await prisma.post.findMany({
    where: { status: "published" },
    include: {
      category: true,
      tags: { include: { tag: true } },
    },
    orderBy: { published_at: "desc" },
    take: 12,
  });

  const formatPost = (p: any) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    content: p.content,
    excerpt: p.excerpt,
    featured_image: p.featured_image,
    status: p.status,
    view_count: p.view_count,
    like_count: p.like_count,
    published_at: p.published_at?.toISOString() ?? null,
    created_at: p.created_at.toISOString(),
    updated_at: p.updated_at.toISOString(),
    category_id: p.category_id,
    category: p.category,
    tags: p.tags?.map((pt: any) => pt.tag) ?? [],
  });

  const categoriesData = categories.map((c: any) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    postCount: c._count.posts,
  }));

  return (
    <HomePageClient
      categories={categoriesData}
      featuredPosts={featuredPosts.map(formatPost)}
      latestPosts={latestPosts.map(formatPost)}
    />
  );
}
