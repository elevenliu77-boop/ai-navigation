/* eslint-disable @typescript-eslint/no-unused-vars, @next/next/no-assign-module-variable, no-var */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { cachedPrismaQuery, invalidateCache } from "@/lib/db/cache";
import type { Post, Tag } from "@/lib/types";

// ─────────── 文章查询 ───────────

export async function getPublishedPosts(options?: {
  categorySlug?: string;
  tagSlug?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ posts: Post[]; total: number }> {
  const { categorySlug, tagSlug, page = 1, pageSize = 12 } = options || {};
  const skip = (page - 1) * pageSize;

  const where: any = { status: "published" };

  if (categorySlug) {
    where.category = { slug: categorySlug };
  }
  if (tagSlug) {
    where.tags = { some: { tag: { slug: tagSlug } } };
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
      orderBy: { published_at: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.post.count({ where }),
  ]);

  return {
    posts: posts.map(formatPost),
    total,
  };
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const post = await prisma.post.findUnique({
    where: { slug, status: "published" },
    include: {
      category: true,
      tags: { include: { tag: true } },
    },
  });

  return post ? formatPost(post) : null;
}

export async function getFeaturedPosts(limit = 5): Promise<Post[]> {
  const posts = await prisma.post.findMany({
    where: { status: "published" },
    include: {
      category: true,
      tags: { include: { tag: true } },
    },
    orderBy: [{ view_count: "desc" }, { published_at: "desc" }],
    take: limit,
  });

  return posts.map(formatPost);
}

export async function getLatestPosts(limit = 10): Promise<Post[]> {
  const posts = await prisma.post.findMany({
    where: { status: "published" },
    include: {
      category: true,
      tags: { include: { tag: true } },
    },
    orderBy: { published_at: "desc" },
    take: limit,
  });

  return posts.map(formatPost);
}

export async function getRelatedPosts(
  postId: number,
  categoryId: number,
  limit = 4
): Promise<Post[]> {
  const posts = await prisma.post.findMany({
    where: {
      status: "published",
      id: { not: postId },
      category_id: categoryId,
    },
    include: {
      category: true,
      tags: { include: { tag: true } },
    },
    orderBy: { published_at: "desc" },
    take: limit,
  });

  return posts.map(formatPost);
}

export async function incrementPostView(slug: string): Promise<void> {
  await prisma.post.update({
    where: { slug },
    data: { view_count: { increment: 1 } },
  });
}

// ─────────── 标签查询 ───────────

export async function getAllTags(): Promise<Tag[]> {
  const tags = await prisma.tag.findMany({
    include: {
      _count: { select: { posts: true } },
    },
    orderBy: { name: "asc" },
  });

  return tags.map((t) => ({ id: t.id, name: t.name, slug: t.slug }));
}

export async function getPopularTags(limit = 10): Promise<(Tag & { count: number })[]> {
  const tags = await prisma.tag.findMany({
    include: {
      _count: { select: { posts: true } },
    },
    orderBy: { posts: { _count: "desc" } },
    take: limit,
  });

  return tags.map((t) => ({ id: t.id, name: t.name, slug: t.slug, count: t._count.posts }));
}

// ─────────── 后台管理查询 ───────────

export async function getAllPosts(options?: {
  page?: number;
  pageSize?: number;
  status?: string;
}): Promise<{ posts: Post[]; total: number }> {
  const { page = 1, pageSize = 20, status } = options || {};
  const skip = (page - 1) * pageSize;

  const where: any = {};
  if (status) where.status = status;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
      orderBy: { updated_at: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.post.count({ where }),
  ]);

  return {
    posts: posts.map(formatPost),
    total,
  };
}

export async function createPost(data: {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  status?: string;
  category_id: number;
  tags?: string[];
}): Promise<Post> {
  const { tags, ...postData } = data;

  const post = await prisma.post.create({
    data: {
      ...postData,
      published_at: postData.status === "published" ? new Date() : null,
      tags: tags?.length
        ? {
            create: await Promise.all(
              tags.map(async (slug) => {
                const tag = await prisma.tag.findUnique({ where: { slug } });
                if (!tag) throw new Error(`Tag not found: ${slug}`);
                return { tag_id: tag.id };
              })
            ),
          }
        : undefined,
    },
    include: {
      category: true,
      tags: { include: { tag: true } },
    },
  });

  invalidateCache("posts");
  return formatPost(post);
}

export async function updatePost(
  id: number,
  data: {
    title?: string;
    slug?: string;
    content?: string;
    excerpt?: string;
    featured_image?: string;
    status?: string;
    category_id?: number;
    tags?: string[];
  }
): Promise<Post> {
  const { tags, ...postData } = data;

  // If publishing, set published_at if not already set
  if (postData.status === "published") {
    const existing = await prisma.post.findUnique({ where: { id } });
    if (existing && !existing.published_at) {
      (postData as any).published_at = new Date();
    }
  }

  // Update tags if provided
  if (tags !== undefined) {
    await prisma.postTag.deleteMany({ where: { post_id: id } });

    if (tags.length > 0) {
      const tagRecords = await Promise.all(
        tags.map(async (slug) => {
          const tag = await prisma.tag.findUnique({ where: { slug } });
          if (!tag) throw new Error(`Tag not found: ${slug}`);
          return { post_id: id, tag_id: tag.id };
        })
      );
      await prisma.postTag.createMany({ data: tagRecords });
    }
  }

  const post = await prisma.post.update({
    where: { id },
    data: postData,
    include: {
      category: true,
      tags: { include: { tag: true } },
    },
  });

  invalidateCache("posts");
  return formatPost(post);
}

export async function deletePost(id: number): Promise<void> {
  await prisma.postTag.deleteMany({ where: { post_id: id } });
  await prisma.post.delete({ where: { id } });
  invalidateCache("posts");
}

// ─────────── 工具函数 ───────────

function formatPost(post: any): Post {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    content: post.content,
    excerpt: post.excerpt,
    featured_image: post.featured_image,
    status: post.status,
    view_count: post.view_count,
    like_count: post.like_count,
    published_at: post.published_at?.toISOString() ?? null,
    created_at: post.created_at.toISOString(),
    updated_at: post.updated_at.toISOString(),
    category_id: post.category_id,
    category: post.category,
    tags: post.tags?.map((pt: any) => pt.tag) ?? [],
  };
}
