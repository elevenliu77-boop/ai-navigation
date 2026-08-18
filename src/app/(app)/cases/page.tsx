
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/db/db";
import CasesList from "./cases-list";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return {
    title: "AI赚钱案例 | 真实变现案例拆解",
    description: "拆解普通人利用 AI 创造收入的真实案例：收益模式、投入成本、执行周期和可复制步骤。",
    keywords: ["AI赚钱", "AI副业", "AI变现", "赚钱案例", "AI创业"],
    openGraph: { title: "AI赚钱案例 | alphahole", description: "真实 AI 变现案例拆解。", type: "website" },
  };
}

interface Props {
  searchParams: Promise<{ page?: string; category?: string; tag?: string; q?: string }>;
}

export default async function CasesPage({ searchParams }: Props) {
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
      { summary: { contains: query, mode: "insensitive" } },
      { content: { contains: query, mode: "insensitive" } },
    ];
  }

  const [cases, total, categories] = await Promise.all([
    prisma.caseStudy.findMany({
      where,
      include: { category: true, tags: { include: { tag: true } } },
      orderBy: [{ featured: "desc" }, { published_at: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.caseStudy.count({ where }),
    prisma.category.findMany({ where: { type: "case" }, orderBy: { id: "asc" } }),
  ]);

  const formatCase = (c: any) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    summary: c.summary,
    content: c.content,
    cover: c.cover,
    result: c.result,
    category_id: c.category_id,
    category: c.category,
    tags: c.tags?.map((t: any) => t.tag) ?? [],
    status: c.status,
    featured: c.featured,
    view_count: c.view_count,
    like_count: c.like_count,
    published_at: c.published_at?.toISOString() ?? null,
    created_at: c.created_at.toISOString(),
    updated_at: c.updated_at.toISOString(),
  });

  return (
    <CasesList
      cases={cases.map(formatCase)}
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
