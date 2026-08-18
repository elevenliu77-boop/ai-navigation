
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { invalidateCache } from "@/lib/db/cache";
import type { Prompt } from "@/lib/types";

// ──────── Prompt 查询 ────────

export async function getPublishedPrompts(options?: {
  categorySlug?: string;
  tagSlug?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ prompts: Prompt[]; total: number }> {
  const { categorySlug, tagSlug, page = 1, pageSize = 12 } = options || {};
  const skip = (page - 1) * pageSize;

  const where: any = { status: "published" };
  if (categorySlug) where.category = { slug: categorySlug };
  if (tagSlug) where.tags = { some: { tag: { slug: tagSlug } } };

  const [prompts, total] = await Promise.all([
    prisma.prompt.findMany({
      where,
      include: { category: true, tags: { include: { tag: true } } },
      orderBy: [{ featured: "desc" }, { published_at: "desc" }],
      skip,
      take: pageSize,
    }),
    prisma.prompt.count({ where }),
  ]);

  return { prompts: prompts.map(formatPrompt), total };
}

export async function getPromptBySlug(slug: string): Promise<Prompt | null> {
  const prompt = await prisma.prompt.findUnique({
    where: { slug, status: "published" },
    include: { category: true, tags: { include: { tag: true } } },
  });
  return prompt ? formatPrompt(prompt) : null;
}

export async function getFeaturedPrompts(limit = 6): Promise<Prompt[]> {
  const prompts = await prisma.prompt.findMany({
    where: { status: "published" },
    include: { category: true, tags: { include: { tag: true } } },
    orderBy: [{ featured: "desc" }, { view_count: "desc" }, { published_at: "desc" }],
    take: limit,
  });
  return prompts.map(formatPrompt);
}

export async function getLatestPrompts(limit = 6): Promise<Prompt[]> {
  const prompts = await prisma.prompt.findMany({
    where: { status: "published" },
    include: { category: true, tags: { include: { tag: true } } },
    orderBy: { published_at: "desc" },
    take: limit,
  });
  return prompts.map(formatPrompt);
}

export async function incrementPromptView(slug: string): Promise<void> {
  await prisma.prompt.update({
    where: { slug },
    data: { view_count: { increment: 1 } },
  });
}

export async function incrementPromptCopy(slug: string): Promise<void> {
  await prisma.prompt.update({
    where: { slug },
    data: { copy_count: { increment: 1 } },
  });
}

// ──────── 后台管理 ────────

export async function getAllPrompts(options?: {
  page?: number;
  pageSize?: number;
  status?: string;
}): Promise<{ prompts: Prompt[]; total: number }> {
  const { page = 1, pageSize = 20, status } = options || {};
  const skip = (page - 1) * pageSize;
  const where: any = {};
  if (status) where.status = status;

  const [prompts, total] = await Promise.all([
    prisma.prompt.findMany({
      where,
      include: { category: true, tags: { include: { tag: true } } },
      orderBy: { updated_at: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.prompt.count({ where }),
  ]);

  return { prompts: prompts.map(formatPrompt), total };
}

export async function getPromptById(id: number) {
  return prisma.prompt.findUnique({
    where: { id },
    include: { category: true, tags: { include: { tag: true } } },
  });
}

export async function createPrompt(data: {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status?: string;
  featured?: boolean;
  category_id: number;
  tags?: string[];
}): Promise<Prompt> {
  const { tags, ...promptData } = data;
  const prompt = await prisma.prompt.create({
    data: {
      ...promptData,
      published_at: promptData.status === "published" ? new Date() : null,
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
    include: { category: true, tags: { include: { tag: true } } },
  });
  invalidateCache("prompts");
  return formatPrompt(prompt);
}

export async function updatePrompt(
  id: number,
  data: {
    title?: string;
    slug?: string;
    content?: string;
    excerpt?: string;
    status?: string;
    featured?: boolean;
    category_id?: number;
    tags?: string[];
  }
): Promise<Prompt> {
  const { tags, ...promptData } = data;
  if (promptData.status === "published") {
    const existing = await prisma.prompt.findUnique({ where: { id } });
    if (existing && !existing.published_at) {
      (promptData as any).published_at = new Date();
    }
  }
  if (tags !== undefined) {
    await prisma.promptTag.deleteMany({ where: { prompt_id: id } });
    if (tags.length > 0) {
      const tagRecords = await Promise.all(
        tags.map(async (slug) => {
          const tag = await prisma.tag.findUnique({ where: { slug } });
          if (!tag) throw new Error(`Tag not found: ${slug}`);
          return { prompt_id: id, tag_id: tag.id };
        })
      );
      await prisma.promptTag.createMany({ data: tagRecords });
    }
  }
  const prompt = await prisma.prompt.update({
    where: { id },
    data: promptData,
    include: { category: true, tags: { include: { tag: true } } },
  });
  invalidateCache("prompts");
  return formatPrompt(prompt);
}

export async function deletePrompt(id: number): Promise<void> {
  await prisma.promptTag.deleteMany({ where: { prompt_id: id } });
  await prisma.prompt.delete({ where: { id } });
  invalidateCache("prompts");
}

// ──────── 工具函数 ────────

function formatPrompt(prompt: any): Prompt {
  return {
    id: prompt.id,
    title: prompt.title,
    slug: prompt.slug,
    content: prompt.content,
    excerpt: prompt.excerpt,
    category_id: prompt.category_id,
    category: prompt.category,
    tags: prompt.tags?.map((pt: any) => pt.tag) ?? [],
    status: prompt.status,
    featured: prompt.featured,
    view_count: prompt.view_count,
    like_count: prompt.like_count,
    copy_count: prompt.copy_count,
    published_at: prompt.published_at?.toISOString() ?? null,
    created_at: prompt.created_at.toISOString(),
    updated_at: prompt.updated_at.toISOString(),
  };
}
