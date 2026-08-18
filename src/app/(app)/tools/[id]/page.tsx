import { prisma } from "@/lib/db/db";
import { notFound } from "next/navigation";
import ToolDetail from "./tool-detail";
import { getImportRelationIds } from "@/lib/services/content-import";

export const dynamic = "force-dynamic";
interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const tool = await prisma.website.findUnique({ where: { id: Number(id) }, include: { category: true } });
  const metadata = tool?.metadata && typeof tool.metadata === "object" && !Array.isArray(tool.metadata) ? tool.metadata as Record<string, unknown> : {};
  const keywords = [tool?.title, tool?.category?.name, ...(Array.isArray(metadata.tags) ? metadata.tags.filter((item): item is string => typeof item === "string") : [])].filter(Boolean) as string[];
  return { title: tool ? `${tool.title} | AI工具库` : "AI工具详情", description: tool?.description || "AI工具使用方法和应用场景。", keywords, openGraph: { title: tool?.title || "AI工具详情", description: tool?.description || "AI工具使用方法和应用场景。", type: "website" } };
}

export default async function ToolPage({ params }: Props) {
  const { id } = await params;
  const tool = await prisma.website.findUnique({ where: { id: Number(id), status: "approved" }, include: { category: true } });
  if (!tool) notFound();
  const metadata = tool.metadata && typeof tool.metadata === "object" && !Array.isArray(tool.metadata) ? tool.metadata as Record<string, unknown> : {};
  const promptSlugs = Array.isArray(metadata.promptSlugs) ? metadata.promptSlugs.filter((v): v is string => typeof v === "string") : [];
  const workflowSlugs = Array.isArray(metadata.workflowSlugs) ? metadata.workflowSlugs.filter((v): v is string => typeof v === "string") : [];
  const caseSlugs = Array.isArray(metadata.caseSlugs) ? metadata.caseSlugs.filter((v): v is string => typeof v === "string") : [];
  const importRelations = await getImportRelationIds("WEBSITE", tool.id);
  const relatedIds = (type: string) => importRelations[type] || [];
  const terms = [tool.title, ...(Array.isArray(metadata.tags) ? metadata.tags.filter((v): v is string => typeof v === "string") : [])];
  const [promptsByRule, workflowsByRule, casesByRule] = await Promise.all([
    prisma.prompt.findMany({ where: { status: "published", ...(relatedIds("PROMPT").length ? { id: { in: relatedIds("PROMPT") } } : promptSlugs.length ? { slug: { in: promptSlugs } } : { category_id: tool.category_id }) }, include: { category: true }, orderBy: { view_count: "desc" }, take: 4 }),
    prisma.workflow.findMany({ where: { status: "published", ...(relatedIds("WORKFLOW").length ? { id: { in: relatedIds("WORKFLOW") } } : workflowSlugs.length ? { slug: { in: workflowSlugs } } : { category_id: tool.category_id }) }, include: { category: true }, orderBy: { view_count: "desc" }, take: 4 }),
    prisma.caseStudy.findMany({ where: { status: "published", ...(relatedIds("CASE").length ? { id: { in: relatedIds("CASE") } } : caseSlugs.length ? { slug: { in: caseSlugs } } : { category_id: tool.category_id }) }, include: { category: true }, orderBy: { view_count: "desc" }, take: 4 }),
  ]);
  const [prompts, workflows, cases] = await Promise.all([
    promptsByRule.length ? promptsByRule : prisma.prompt.findMany({ where: { status: "published" }, include: { category: true }, orderBy: [{ featured: "desc" }, { view_count: "desc" }], take: 4 }),
    workflowsByRule.length ? workflowsByRule : prisma.workflow.findMany({ where: { status: "published" }, include: { category: true }, orderBy: [{ featured: "desc" }, { view_count: "desc" }], take: 4 }),
    casesByRule.length ? casesByRule : prisma.caseStudy.findMany({ where: { status: "published" }, include: { category: true }, orderBy: [{ featured: "desc" }, { view_count: "desc" }], take: 4 }),
  ]);
  let relatedDiscoveries = await prisma.post.findMany({
    where: relatedIds("POST").length ? { status: "published", category: { slug: "ai-discovery" }, id: { in: relatedIds("POST") } } : { status: "published", category: { slug: "ai-discovery" }, OR: terms.map((term) => ({ content: { contains: term, mode: "insensitive" } })) },
    select: { id: true, title: true, slug: true, excerpt: true },
    orderBy: { updated_at: "desc" },
    take: 4,
  });
  if (!relatedDiscoveries.length) {
    relatedDiscoveries = await prisma.post.findMany({ where: { status: "published", category: { slug: "ai-discovery" }, ...(relatedIds("POST").length ? { id: { in: relatedIds("POST") } } : {}) }, select: { id: true, title: true, slug: true, excerpt: true }, orderBy: [{ updated_at: "desc" }, { view_count: "desc" }], take: 4 });
  }

  return <ToolDetail tool={{ id: tool.id, title: tool.title, url: tool.url, description: tool.description, category: tool.category, visits: tool.visits, likes: tool.likes, metadata }} relatedDiscoveries={relatedDiscoveries} relatedPrompts={prompts} relatedWorkflows={workflows} relatedCases={cases} />;
}
