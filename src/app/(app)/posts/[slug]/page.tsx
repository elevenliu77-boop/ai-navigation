import { prisma } from "@/lib/db/db";
import { notFound } from "next/navigation";
import PostDetail from "./post-detail";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;

  const post = await prisma.post.findUnique({
    where: { slug, status: "published" },
    include: {
      category: true,
      tags: { include: { tag: true } },
    },
  });

  if (!post) {
    notFound();
  }

  // 获取相关文章
  const relatedPosts = await prisma.post.findMany({
    where: {
      status: "published",
      id: { not: post.id },
      category_id: post.category_id,
    },
    include: { category: true, tags: { include: { tag: true } } },
    orderBy: { published_at: "desc" },
    take: 4,
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

  return (
    <PostDetail
      post={formatPost(post)}
      relatedPosts={relatedPosts.map(formatPost)}
    />
  );
}
