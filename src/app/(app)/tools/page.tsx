
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/db/db";
import ToolsList from "./tools-list";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return {
    title: "AI工具库 | 工具评测与使用方法",
    description: "发现适合工作、副业和创业的 AI 工具，查看应用场景、教程和相关工作流。",
    keywords: ["AI工具", "AI工具库", "AI工具评测", "AI办公", "AI副业"],
    openGraph: { title: "AI工具库 | alphahole", description: "发现适合工作、副业和创业的 AI 工具。", type: "website" },
  };
}

interface Props {
  searchParams: Promise<{ page?: string; category?: string; q?: string }>;
}

export default async function ToolsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const categorySlug = params.category;
  const query = params.q?.trim();
  const pageSize = 18;

  const where: any = { status: "approved" };
  if (categorySlug) where.category = { slug: categorySlug };
  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ];
  }

  const [websites, total, categories] = await Promise.all([
    prisma.website.findMany({
      where,
      include: { category: true },
      orderBy: [{ visits: "desc" }, { likes: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.website.count({ where }),
    prisma.category.findMany({ where: { type: "website" }, orderBy: { id: "asc" } }),
  ]);

  const formatWebsite = (w: any) => ({
    id: w.id,
    title: w.title,
    url: w.url,
    description: w.description,
    category_id: w.category_id,
    thumbnail: w.thumbnail,
    thumbnail_base64: w.thumbnail_base64,
    active: w.active,
    status: w.status,
    visits: w.visits,
    likes: w.likes,
    metadata: w.metadata,
  });

  return (
    <ToolsList
      websites={websites.map(formatWebsite)}
      total={total}
      page={page}
      pageSize={pageSize}
      categories={categories}
      currentCategory={categorySlug}
      searchQuery={query}
    />
  );
}
