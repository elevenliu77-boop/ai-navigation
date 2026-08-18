
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/db/db";
import { notFound } from "next/navigation";
import CaseDetail from "./case-detail";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const item = await prisma.caseStudy.findUnique({ where: { slug, status: "published" }, include: { tags: { include: { tag: true } } } });
  const keywords = item?.tags.map(({ tag }) => tag.name) || [];
  return { title: item ? `${item.title} | AI赚钱案例` : "AI赚钱案例", description: item?.summary || "真实 AI 赚钱案例拆解，关注收益模式、投入成本和执行周期。", keywords, openGraph: { title: item?.title || "AI赚钱案例", description: item?.summary || "真实 AI 赚钱案例拆解。", type: "article" } };
}

export default async function CasePage({ params }: Props) {
  const { slug } = await params;

  const cs = await prisma.caseStudy.findUnique({
    where: { slug, status: "published" },
    include: { category: true, tags: { include: { tag: true } } },
  });

  if (!cs) {
    notFound();
  }

  const relatedCases = await prisma.caseStudy.findMany({
    where: {
      status: "published",
      id: { not: cs.id },
      category_id: cs.category_id,
    },
    include: { category: true, tags: { include: { tag: true } } },
    orderBy: { published_at: "desc" },
    take: 4,
  });

  const formatCase = (c: any) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    summary: c.summary,
    content: c.content,
    cover: c.cover,
    result: c.result,
    metadata: c.metadata,
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
    <CaseDetail
      caseData={formatCase(cs)}
      relatedCases={relatedCases.map(formatCase)}
    />
  );
}
