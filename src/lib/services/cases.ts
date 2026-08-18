
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { invalidateCache } from "@/lib/db/cache";
import type { CaseStudy } from "@/lib/types";

// ──────── 案例查询 ────────

export async function getPublishedCases(options?: {
  categorySlug?: string;
  tagSlug?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ cases: CaseStudy[]; total: number }> {
  const { categorySlug, tagSlug, page = 1, pageSize = 12 } = options || {};
  const skip = (page - 1) * pageSize;

  const where: any = { status: "published" };
  if (categorySlug) where.category = { slug: categorySlug };
  if (tagSlug) where.tags = { some: { tag: { slug: tagSlug } } };

  const [cases, total] = await Promise.all([
    prisma.caseStudy.findMany({
      where,
      include: { category: true, tags: { include: { tag: true } } },
      orderBy: [{ featured: "desc" }, { published_at: "desc" }],
      skip,
      take: pageSize,
    }),
    prisma.caseStudy.count({ where }),
  ]);

  return { cases: cases.map(formatCase), total };
}

export async function getCaseBySlug(slug: string): Promise<CaseStudy | null> {
  const cs = await prisma.caseStudy.findUnique({
    where: { slug, status: "published" },
    include: { category: true, tags: { include: { tag: true } } },
  });
  return cs ? formatCase(cs) : null;
}

export async function getFeaturedCases(limit = 6): Promise<CaseStudy[]> {
  const cases = await prisma.caseStudy.findMany({
    where: { status: "published" },
    include: { category: true, tags: { include: { tag: true } } },
    orderBy: [{ featured: "desc" }, { view_count: "desc" }, { published_at: "desc" }],
    take: limit,
  });
  return cases.map(formatCase);
}

export async function getLatestCases(limit = 6): Promise<CaseStudy[]> {
  const cases = await prisma.caseStudy.findMany({
    where: { status: "published" },
    include: { category: true, tags: { include: { tag: true } } },
    orderBy: { published_at: "desc" },
    take: limit,
  });
  return cases.map(formatCase);
}

export async function incrementCaseView(slug: string): Promise<void> {
  await prisma.caseStudy.update({
    where: { slug },
    data: { view_count: { increment: 1 } },
  });
}

// ──────── 后台管理 ────────

export async function getAllCases(options?: {
  page?: number;
  pageSize?: number;
  status?: string;
}): Promise<{ cases: CaseStudy[]; total: number }> {
  const { page = 1, pageSize = 20, status } = options || {};
  const skip = (page - 1) * pageSize;
  const where: any = {};
  if (status) where.status = status;

  const [cases, total] = await Promise.all([
    prisma.caseStudy.findMany({
      where,
      include: { category: true, tags: { include: { tag: true } } },
      orderBy: { updated_at: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.caseStudy.count({ where }),
  ]);

  return { cases: cases.map(formatCase), total };
}

export async function getCaseById(id: number) {
  return prisma.caseStudy.findUnique({
    where: { id },
    include: { category: true, tags: { include: { tag: true } } },
  });
}

export async function createCase(data: {
  title: string;
  slug: string;
  summary: string;
  content: string;
  cover?: string;
  result?: any[];
  metadata?: any;
  status?: string;
  featured?: boolean;
  category_id: number;
  tags?: string[];
}): Promise<CaseStudy> {
  const { tags, ...caseData } = data;
  const cs = await prisma.caseStudy.create({
    data: {
      ...caseData,
      published_at: caseData.status === "published" ? new Date() : null,
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
  invalidateCache("cases");
  return formatCase(cs);
}

export async function updateCase(
  id: number,
  data: {
    title?: string;
    slug?: string;
    summary?: string;
    content?: string;
    cover?: string;
    result?: any[];
    metadata?: any;
    status?: string;
    featured?: boolean;
    category_id?: number;
    tags?: string[];
  }
): Promise<CaseStudy> {
  const { tags, ...caseData } = data;
  if (caseData.status === "published") {
    const existing = await prisma.caseStudy.findUnique({ where: { id } });
    if (existing && !existing.published_at) {
      (caseData as any).published_at = new Date();
    }
  }
  if (tags !== undefined) {
    await prisma.caseTag.deleteMany({ where: { case_study_id: id } });
    if (tags.length > 0) {
      const tagRecords = await Promise.all(
        tags.map(async (slug) => {
          const tag = await prisma.tag.findUnique({ where: { slug } });
          if (!tag) throw new Error(`Tag not found: ${slug}`);
          return { case_study_id: id, tag_id: tag.id };
        })
      );
      await prisma.caseTag.createMany({ data: tagRecords });
    }
  }
  const cs = await prisma.caseStudy.update({
    where: { id },
    data: caseData,
    include: { category: true, tags: { include: { tag: true } } },
  });
  invalidateCache("cases");
  return formatCase(cs);
}

export async function deleteCase(id: number): Promise<void> {
  await prisma.caseTag.deleteMany({ where: { case_study_id: id } });
  await prisma.caseStudy.delete({ where: { id } });
  invalidateCache("cases");
}

// ──────── 工具函数 ────────

function parseJson(value: any): any {
  if (value == null) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

function formatCase(cs: any): CaseStudy {
  return {
    id: cs.id,
    title: cs.title,
    slug: cs.slug,
    summary: cs.summary,
    content: cs.content,
    cover: cs.cover,
    result: parseJson(cs.result),
    metadata: parseJson(cs.metadata),
    category_id: cs.category_id,
    category: cs.category,
    tags: cs.tags?.map((t: any) => t.tag) ?? [],
    status: cs.status,
    featured: cs.featured,
    view_count: cs.view_count,
    like_count: cs.like_count,
    published_at: cs.published_at?.toISOString() ?? null,
    created_at: cs.created_at.toISOString(),
    updated_at: cs.updated_at.toISOString(),
  };
}
