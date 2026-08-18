
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/db/db";
import { notFound } from "next/navigation";
import PostDetail from "./post-detail";
import { getImportRelationIds } from "@/lib/services/content-import";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug, status: "published" }, include: { tags: { include: { tag: true } } } });
  const keywords = post?.tags.map((item) => item.tag.name) || [];
  return { title: post ? `${post.title} | AI知识库` : "AI知识库", description: post?.excerpt || "AI教程、应用方法和实践经验。", keywords, openGraph: { title: post?.title || "AI知识库", description: post?.excerpt || "AI教程、应用方法和实践经验。", type: "article" } };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;

  const post = await prisma.post.findUnique({
    where: { slug, status: "published" },
    include: {
      category: true,
      tags: { include: { tag: true } },
    },
  });

  if (!post) {
    notFound();
  }

  // 获取相关文章
  const relatedPosts = await prisma.post.findMany({
    where: {
      status: "published",
      id: { not: post.id },
      category_id: post.category_id,
    },
    include: { category: true, tags: { include: { tag: true } } },
    orderBy: { published_at: "desc" },
    take: 4,
  });

  // ── 知识关联（V2.1 预留实现）──────────────────────────────
  // 关联机制：复用全站共享标签体系（Tag 同时挂载在文章/提示词/
  // 工作流/案例上），通过"共享标签"建立跨内容类型的知识关联，
  // 无需新增数据表、零数据库迁移。
  // 未来扩展方向（显式关联表 KnowledgeRelation、工具关联、
  // AI 助手/RAG 入口）见 docs/knowledge-association-design.md
  const tagIds = post.tags.map((pt: any) => pt.tag_id);
  const articleTerms = post.tags
    .map((pt: any) => pt.tag.name)
    .filter(Boolean)
    .slice(0, 8);
  const relatedItemsWhere = tagIds.length
    ? { tags: { some: { tag_id: { in: tagIds } } } }
    : { id: -1 };

  let relatedDiscoveries = await prisma.post.findMany({
    where: {
      status: "published",
      id: { not: post.id },
      category: { slug: "ai-discovery" },
      ...(tagIds.length ? { tags: { some: { tag_id: { in: tagIds } } } } : {}),
    },
    include: { category: true },
    orderBy: [{ updated_at: "desc" }, { view_count: "desc" }],
    take: 3,
  });
  if (!relatedDiscoveries.length) {
    relatedDiscoveries = await prisma.post.findMany({
      where: { status: "published", id: { not: post.id }, category: { slug: "ai-discovery" } },
      include: { category: true },
      orderBy: [{ updated_at: "desc" }, { view_count: "desc" }],
      take: 3,
    });
  }

  const [relatedTools, relatedPrompts, relatedWorkflows, relatedCases] =
    tagIds.length > 0
      ? await Promise.all([
          prisma.website.findMany({
            where: {
              status: "approved",
              OR: articleTerms.flatMap((term: string) => [
                { title: { contains: term, mode: "insensitive" } },
                { description: { contains: term, mode: "insensitive" } },
              ]),
            },
            select: { id: true, title: true, url: true, description: true },
            orderBy: [{ visits: "desc" }, { likes: "desc" }],
            take: 3,
          }),
          prisma.prompt.findMany({
            where: { status: "published", ...relatedItemsWhere },
            include: { category: true },
            orderBy: { view_count: "desc" },
            take: 3,
          }),
          prisma.workflow.findMany({
            where: { status: "published", ...relatedItemsWhere },
            include: { category: true },
            orderBy: { view_count: "desc" },
            take: 3,
          }),
          prisma.caseStudy.findMany({
            where: { status: "published", ...relatedItemsWhere },
            include: { category: true },
            orderBy: { view_count: "desc" },
            take: 3,
          }),
        ])
      : [[], [], [], []];

  const studioAssets = await prisma.contentStudioAsset.findMany({ where: { site_content_id: post.id }, include: { relations: true } });
  const importRelations = await getImportRelationIds("POST", post.id);
  const relationIds = (type: string) => Array.from(new Set([...studioAssets.flatMap((asset) => asset.relations.filter((relation) => relation.target_type === type).map((relation) => relation.target_id)), ...(importRelations[type] || [])]));
  const [studioDiscoveries, studioTools, studioPrompts, studioWorkflows, studioCases] = await Promise.all([
    prisma.post.findMany({ where: { id: { in: relationIds("POST"), not: post.id }, status: "published" }, include: { category: true }, take: 3 }),
    prisma.website.findMany({ where: { id: { in: relationIds("WEBSITE") }, status: "approved" }, select: { id: true, title: true, url: true, description: true }, take: 3 }),
    prisma.prompt.findMany({ where: { id: { in: relationIds("PROMPT") }, status: "published" }, include: { category: true }, take: 3 }),
    prisma.workflow.findMany({ where: { id: { in: relationIds("WORKFLOW") }, status: "published" }, include: { category: true }, take: 3 }),
    prisma.caseStudy.findMany({ where: { id: { in: relationIds("CASE") }, status: "published" }, include: { category: true }, take: 3 }),
  ]);
  const mergeRelated = (items: any[], extras: any[]) => Array.from(new Map([...items, ...extras].map((item) => [item.id, item])).values()).slice(0, 3);

  const formatPost = (p: any) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    content: p.content,
    excerpt: p.excerpt,
    featured_image: p.featured_image,
    status: p.status,
    view_count: p.view_count,
    like_count: p.like_count,
    published_at: p.published_at?.toISOString() ?? null,
    created_at: p.created_at.toISOString(),
    updated_at: p.updated_at.toISOString(),
    category_id: p.category_id,
    category: p.category,
    tags: p.tags?.map((pt: any) => pt.tag) ?? [],
  });

  const formatRelated = (item: any) => ({
    id: item.id,
    title: item.title,
    slug: item.slug,
    category: item.category,
    view_count: item.view_count,
    url: item.url,
    description: item.description,
  });

  return (
    <PostDetail
      post={formatPost(post)}
      relatedPosts={relatedPosts.map(formatPost)}
      relatedDiscoveries={mergeRelated(relatedDiscoveries, studioDiscoveries).map(formatRelated)}
      relatedTools={mergeRelated(relatedTools, studioTools).map(formatRelated)}
      relatedPrompts={mergeRelated(relatedPrompts, studioPrompts).map(formatRelated)}
      relatedWorkflows={mergeRelated(relatedWorkflows, studioWorkflows).map(formatRelated)}
      relatedCases={mergeRelated(relatedCases, studioCases).map(formatRelated)}
    />
  );
}
