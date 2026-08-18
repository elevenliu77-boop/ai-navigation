
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/db/db";
import { notFound } from "next/navigation";
import WorkflowDetail from "./workflow-detail";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const item = await prisma.workflow.findUnique({ where: { slug, status: "published" }, include: { tags: { include: { tag: true } } } });
  const keywords = item?.tags.map(({ tag }) => tag.name) || [];
  return { title: item ? `${item.title} | AI工作流` : "AI工作流", description: item?.description || "可直接复制的 AI 自动化流程。", keywords, openGraph: { title: item?.title || "AI工作流", description: item?.description || "可直接复制的 AI 自动化流程。", type: "article" } };
}

export default async function WorkflowPage({ params }: Props) {
  const { slug } = await params;

  const workflow = await prisma.workflow.findUnique({
    where: { slug, status: "published" },
    include: { category: true, tags: { include: { tag: true } } },
  });

  if (!workflow) {
    notFound();
  }

  const relatedWorkflows = await prisma.workflow.findMany({
    where: {
      status: "published",
      id: { not: workflow.id },
      category_id: workflow.category_id,
    },
    include: { category: true, tags: { include: { tag: true } } },
    orderBy: { published_at: "desc" },
    take: 4,
  });

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
    metadata: w.metadata,
  });

  return (
    <WorkflowDetail
      workflow={formatWorkflow(workflow)}
      relatedWorkflows={relatedWorkflows.map(formatWorkflow)}
    />
  );
}
