
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/db/db";
import WorkflowsList from "./workflows-list";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return {
    title: "AI工作流 | 可复制的自动化流程",
    description: "可直接复制的 AI 自动化工作流，把工具、提示词和步骤串成高效流程。",
    keywords: ["AI工作流", "AI自动化", "工作流模板", "AI流程", "n8n"],
    openGraph: { title: "AI工作流 | alphahole", description: "可复制的 AI 自动化流程。", type: "website" },
  };
}

interface Props {
  searchParams: Promise<{ page?: string; category?: string; tag?: string; q?: string }>;
}

export default async function WorkflowsPage({ searchParams }: Props) {
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
      { description: { contains: query, mode: "insensitive" } },
    ];
  }

  const [workflows, total, categories] = await Promise.all([
    prisma.workflow.findMany({
      where,
      include: { category: true, tags: { include: { tag: true } } },
      orderBy: [{ featured: "desc" }, { published_at: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.workflow.count({ where }),
    prisma.category.findMany({ where: { type: "workflow" }, orderBy: { id: "asc" } }),
  ]);

  const formatWorkflow = (w: any) => ({
    id: w.id,
    title: w.title,
    slug: w.slug,
    description: w.description,
    steps: w.steps,
    tools: w.tools,
    category_id: w.category_id,
    category: w.category,
    tags: w.tags?.map((t: any) => t.tag) ?? [],
    status: w.status,
    featured: w.featured,
    view_count: w.view_count,
    like_count: w.like_count,
    published_at: w.published_at?.toISOString() ?? null,
    created_at: w.created_at.toISOString(),
    updated_at: w.updated_at.toISOString(),
  });

  return (
    <WorkflowsList
      workflows={workflows.map(formatWorkflow)}
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
