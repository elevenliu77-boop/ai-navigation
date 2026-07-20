import { prisma } from "@/lib/db/db";
import PostsList from "./posts-list";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ page?: string; category?: string; tag?: string; q?: string }>;
}

export default async function PostsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const categorySlug = params.category;
  const tagSlug = params.tag;
  const query = params.q?.trim();
  const pageSize = 12;

  const where: any = { status: "published" };
  if (categorySlug) where.category = { slug: categorySlug };
  if (tagSlug) where.tags = { some: { tag: { slug: tagSlug } } };
  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { content: { contains: query, mode: "insensitive" } },
      { excerpt: { contains: query, mode: "insensitive" } },
    ];
  }

  const [posts, total, categories] = await Promise.all([
    prisma.post.findMany({
      where,
      include: { category: true, tags: { include: { tag: true } } },
      orderBy: { published_at: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.post.count({ where }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

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

  return (
    <PostsList
      posts={posts.map(formatPost)}
      total={total}
      page={page}
      pageSize={pageSize}
      categories={categories}
      currentCategory={categorySlug}
      currentTag={tagSlug}
      searchQuery={query}
    />
  );
}
