
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/db/db";

export async function getPosts(options?: {
  page?: number;
  pageSize?: number;
  status?: string;
}) {
  const { page = 1, pageSize = 20, status } = options || {};
  const skip = (page - 1) * pageSize;

  try {
    const where: any = {};
    if (status) where.status = status;

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: { category: true, tags: { include: { tag: true } } },
        orderBy: { updated_at: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.post.count({ where }),
    ]);

    return { posts, total };
  } catch (error) {
    console.error("Error fetching posts:", error);
    return { posts: [], total: 0 };
  }
}

export async function getPostById(id: number) {
  try {
    return await prisma.post.findUnique({
      where: { id },
      include: { category: true, tags: { include: { tag: true } } },
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    return null;
  }
}

export async function getCategories() {
  try {
    return await prisma.category.findMany({ orderBy: { id: "asc" } });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function getAllTags() {
  try {
    return await prisma.tag.findMany({ orderBy: { name: "asc" } });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return [];
  }
}
