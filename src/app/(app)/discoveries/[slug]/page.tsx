
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/db/db";
import { notFound } from "next/navigation";
import DiscoveryDetail from "./discovery-detail";
import { getImportRelationIds } from "@/lib/services/content-import";

export const dynamic = "force-dynamic";

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug, status: "published" }, include: { tags: { include: { tag: true } } } });
  const keywords = post?.tags.map((item) => item.tag.name) || [];
  return { title: post ? `${post.title} | AI发现` : "AI发现", description: post?.excerpt || "AI工具、GitHub项目和开源项目发现。", keywords, openGraph: { title: post?.title || "AI发现", description: post?.excerpt || "AI工具、GitHub项目和开源项目发现。", type: "article" } };
}

export default async function DiscoveryPage({ params }: Props) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug, status: "published" }, include: { category: true, tags: { include: { tag: true } } } });
  if (!post || post.category.slug !== "ai-discovery") notFound();

  const tagIds = post.tags.map((item) => item.tag_id);
  const terms = post.tags.map((item) => item.tag.name).slice(0, 8);
  const importRelations = await getImportRelationIds("POST", post.id);
  const importedIds = (type: string) => importRelations[type] || [];
  const sharedTags = tagIds.length ? { tags: { some: { tag_id: { in: tagIds } } } } : {};
  const [relatedPosts, relatedTools, relatedPrompts, relatedWorkflows, relatedCases] = await Promise.all([
    prisma.post.findMany({ where: { status: "published", category: { slug: "ai-discovery" }, id: importedIds("POST").length ? { in: importedIds("POST"), not: post.id } : { not: post.id } }, include: { tags: { include: { tag: true } } }, orderBy: { updated_at: "desc" }, take: 4 }),
    prisma.website.findMany({ where: importedIds("WEBSITE").length ? { status: "approved", id: { in: importedIds("WEBSITE") } } : terms.length ? { status: "approved", OR: terms.flatMap((term) => [{ title: { contains: term, mode: "insensitive" } }, { description: { contains: term, mode: "insensitive" } }]) } : { id: -1 }, select: { id: true, title: true, url: true, description: true }, orderBy: [{ visits: "desc" }, { likes: "desc" }], take: 4 }),
    prisma.prompt.findMany({ where: { status: "published", ...(importedIds("PROMPT").length ? { id: { in: importedIds("PROMPT") } } : sharedTags) }, include: { category: true }, orderBy: { view_count: "desc" }, take: 4 }),
    prisma.workflow.findMany({ where: { status: "published", ...(importedIds("WORKFLOW").length ? { id: { in: importedIds("WORKFLOW") } } : sharedTags) }, include: { category: true }, orderBy: { view_count: "desc" }, take: 4 }),
    prisma.caseStudy.findMany({ where: { status: "published", ...(importedIds("CASE").length ? { id: { in: importedIds("CASE") } } : sharedTags) }, include: { category: true }, orderBy: { view_count: "desc" }, take: 4 }),
  ]);

  return <DiscoveryDetail post={{ id: post.id, title: post.title, slug: post.slug, content: post.content, excerpt: post.excerpt, metadata: post.metadata as any, view_count: post.view_count, updated_at: post.updated_at.toISOString(), tags: post.tags.map(({ tag }) => tag) }} relatedPosts={relatedPosts.map((item) => ({ id: item.id, title: item.title, slug: item.slug }))} relatedTools={relatedTools} relatedPrompts={relatedPrompts.map((item) => ({ id: item.id, title: item.title, slug: item.slug, category: item.category }))} relatedWorkflows={relatedWorkflows.map((item) => ({ id: item.id, title: item.title, slug: item.slug, category: item.category }))} relatedCases={relatedCases.map((item) => ({ id: item.id, title: item.title, slug: item.slug, category: item.category }))} />;
}
