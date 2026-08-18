
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/db/db";
import ResourcesList from "./resources-list";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return {
    title: "资源中心 | AI 资料、模板与工具合集",
    description: "精选 AI 报告、模板、课程和工具合集，会员资源与免费资源统一入口。",
    keywords: ["AI资源", "AI资料", "AI模板", "AI报告", "资源下载"],
    openGraph: { title: "资源中心 | alphahole", description: "AI 资料、模板与工具合集。", type: "website" },
  };
}

interface Props {
  searchParams: Promise<{ page?: string; category?: string }>;
}

export default async function ResourcesPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const categorySlug = params.category;
  const pageSize = 12;

  const where: any = { status: "published" };
  if (categorySlug) where.category = { slug: categorySlug };

  const [resources, total, categories] = await Promise.all([
    prisma.resource.findMany({
      where,
      include: { category: true },
      orderBy: { created_at: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.resource.count({ where }),
    prisma.category.findMany({ where: { type: "resource" }, orderBy: { id: "asc" } }),
  ]);

  const formatResource = (r: any) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    type: r.type,
    description: r.description,
    url: r.url,
    category_id: r.category_id,
    category: r.category,
    permission: r.permission,
    downloads: r.downloads,
    status: r.status,
    created_at: r.created_at.toISOString(),
    updated_at: r.updated_at.toISOString(),
  });

  return (
    <ResourcesList
      resources={resources.map(formatResource)}
      total={total}
      page={page}
      pageSize={pageSize}
      categories={categories}
      currentCategory={categorySlug}
    />
  );
}
