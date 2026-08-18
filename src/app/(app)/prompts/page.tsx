
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/db/db";
import PromptsList from "./prompts-list";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return {
    title: "提示词库 | 经过验证的 AI 提示词模板",
    description: "覆盖写作、营销、编程、数据分析等场景的 AI 提示词模板，复制即可使用。",
    keywords: ["提示词", "Prompt", "提示词模板", "AI提示词", "Prompt工程"],
    openGraph: { title: "提示词库 | alphahole", description: "经过验证的 AI 提示词模板。", type: "website" },
  };
}

interface Props {
  searchParams: Promise<{ page?: string; category?: string; tag?: string; q?: string }>;
}

export default async function PromptsPage({ searchParams }: Props) {
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

  const [prompts, total, categories] = await Promise.all([
    prisma.prompt.findMany({
      where,
      include: { category: true, tags: { include: { tag: true } } },
      orderBy: [{ featured: "desc" }, { published_at: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.prompt.count({ where }),
    prisma.category.findMany({ where: { type: "prompt" }, orderBy: { id: "asc" } }),
  ]);

  const formatPrompt = (p: any) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    content: p.content,
    excerpt: p.excerpt,
    category_id: p.category_id,
    category: p.category,
    tags: p.tags?.map((pt: any) => pt.tag) ?? [],
    status: p.status,
    featured: p.featured,
    view_count: p.view_count,
    like_count: p.like_count,
    copy_count: p.copy_count,
    published_at: p.published_at?.toISOString() ?? null,
    created_at: p.created_at.toISOString(),
    updated_at: p.updated_at.toISOString(),
  });

  return (
    <PromptsList
      prompts={prompts.map(formatPrompt)}
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
