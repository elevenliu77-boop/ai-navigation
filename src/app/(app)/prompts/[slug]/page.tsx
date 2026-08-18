
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/db/db";
import { notFound } from "next/navigation";
import PromptDetail from "./prompt-detail";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const item = await prisma.prompt.findUnique({ where: { slug, status: "published" }, include: { tags: { include: { tag: true } } } });
  const keywords = item?.tags.map(({ tag }) => tag.name) || [];
  return { title: item ? `${item.title} | 提示词库` : "提示词库", description: item?.excerpt || "经过验证的 AI 提示词模板，复制即可使用。", keywords, openGraph: { title: item?.title || "提示词库", description: item?.excerpt || "经过验证的 AI 提示词模板。", type: "article" } };
}

export default async function PromptPage({ params }: Props) {
  const { slug } = await params;

  const prompt = await prisma.prompt.findUnique({
    where: { slug, status: "published" },
    include: { category: true, tags: { include: { tag: true } } },
  });

  if (!prompt) {
    notFound();
  }

  const relatedPrompts = await prisma.prompt.findMany({
    where: {
      status: "published",
      id: { not: prompt.id },
      category_id: prompt.category_id,
    },
    include: { category: true, tags: { include: { tag: true } } },
    orderBy: { published_at: "desc" },
    take: 4,
  });

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
    metadata: p.metadata,
  });

  return (
    <PromptDetail
      prompt={formatPrompt(prompt)}
      relatedPrompts={relatedPrompts.map(formatPrompt)}
    />
  );
}
