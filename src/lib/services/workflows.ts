
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { invalidateCache } from "@/lib/db/cache";
import type { Workflow } from "@/lib/types";

// ──────── 工作流查询 ────────

export async function getPublishedWorkflows(options?: {
  categorySlug?: string;
  tagSlug?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ workflows: Workflow[]; total: number }> {
  const { categorySlug, tagSlug, page = 1, pageSize = 12 } = options || {};
  const skip = (page - 1) * pageSize;

  const where: any = { status: "published" };
  if (categorySlug) where.category = { slug: categorySlug };
  if (tagSlug) where.tags = { some: { tag: { slug: tagSlug } } };

  const [workflows, total] = await Promise.all([
    prisma.workflow.findMany({
      where,
      include: { category: true, tags: { include: { tag: true } } },
      orderBy: [{ featured: "desc" }, { published_at: "desc" }],
      skip,
      take: pageSize,
    }),
    prisma.workflow.count({ where }),
  ]);

  return { workflows: workflows.map(formatWorkflow), total };
}

export async function getWorkflowBySlug(slug: string): Promise<Workflow | null> {
  const workflow = await prisma.workflow.findUnique({
    where: { slug, status: "published" },
    include: { category: true, tags: { include: { tag: true } } },
  });
  return workflow ? formatWorkflow(workflow) : null;
}

export async function getFeaturedWorkflows(limit = 6): Promise<Workflow[]> {
  const workflows = await prisma.workflow.findMany({
    where: { status: "published" },
    include: { category: true, tags: { include: { tag: true } } },
    orderBy: [{ featured: "desc" }, { view_count: "desc" }, { published_at: "desc" }],
    take: limit,
  });
  return workflows.map(formatWorkflow);
}

export async function getLatestWorkflows(limit = 6): Promise<Workflow[]> {
  const workflows = await prisma.workflow.findMany({
    where: { status: "published" },
    include: { category: true, tags: { include: { tag: true } } },
    orderBy: { published_at: "desc" },
    take: limit,
  });
  return workflows.map(formatWorkflow);
}

export async function incrementWorkflowView(slug: string): Promise<void> {
  await prisma.workflow.update({
    where: { slug },
    data: { view_count: { increment: 1 } },
  });
}

// ──────── 后台管理 ────────

export async function getAllWorkflows(options?: {
  page?: number;
  pageSize?: number;
  status?: string;
}): Promise<{ workflows: Workflow[]; total: number }> {
  const { page = 1, pageSize = 20, status } = options || {};
  const skip = (page - 1) * pageSize;
  const where: any = {};
  if (status) where.status = status;

  const [workflows, total] = await Promise.all([
    prisma.workflow.findMany({
      where,
      include: { category: true, tags: { include: { tag: true } } },
      orderBy: { updated_at: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.workflow.count({ where }),
  ]);

  return { workflows: workflows.map(formatWorkflow), total };
}

export async function getWorkflowById(id: number) {
  return prisma.workflow.findUnique({
    where: { id },
    include: { category: true, tags: { include: { tag: true } } },
  });
}

export async function createWorkflow(data: {
  title: string;
  slug: string;
  description: string;
  steps: any[];
  tools?: any[];
  status?: string;
  featured?: boolean;
  category_id: number;
  tags?: string[];
}): Promise<Workflow> {
  const { tags, ...wfData } = data;
  const workflow = await prisma.workflow.create({
    data: {
      ...wfData,
      steps: wfData.steps ?? [],
      published_at: wfData.status === "published" ? new Date() : null,
      tags: tags?.length
        ? {
            create: await Promise.all(
              tags.map(async (slug) => {
                const tag = await prisma.tag.findUnique({ where: { slug } });
                if (!tag) throw new Error(`Tag not found: ${slug}`);
                return { tag_id: tag.id };
              })
            ),
          }
        : undefined,
    },
    include: { category: true, tags: { include: { tag: true } } },
  });
  invalidateCache("workflows");
  return formatWorkflow(workflow);
}

export async function updateWorkflow(
  id: number,
  data: {
    title?: string;
    slug?: string;
    description?: string;
    steps?: any[];
    tools?: any[];
    status?: string;
    featured?: boolean;
    category_id?: number;
    tags?: string[];
  }
): Promise<Workflow> {
  const { tags, ...wfData } = data;
  if (wfData.status === "published") {
    const existing = await prisma.workflow.findUnique({ where: { id } });
    if (existing && !existing.published_at) {
      (wfData as any).published_at = new Date();
    }
  }
  if (tags !== undefined) {
    await prisma.workflowTag.deleteMany({ where: { workflow_id: id } });
    if (tags.length > 0) {
      const tagRecords = await Promise.all(
        tags.map(async (slug) => {
          const tag = await prisma.tag.findUnique({ where: { slug } });
          if (!tag) throw new Error(`Tag not found: ${slug}`);
          return { workflow_id: id, tag_id: tag.id };
        })
      );
      await prisma.workflowTag.createMany({ data: tagRecords });
    }
  }
  const workflow = await prisma.workflow.update({
    where: { id },
    data: wfData,
    include: { category: true, tags: { include: { tag: true } } },
  });
  invalidateCache("workflows");
  return formatWorkflow(workflow);
}

export async function deleteWorkflow(id: number): Promise<void> {
  await prisma.workflowTag.deleteMany({ where: { workflow_id: id } });
  await prisma.workflow.delete({ where: { id } });
  invalidateCache("workflows");
}

// ──────── 工具函数 ────────

function parseJson(value: any): any {
  if (value == null) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

function formatWorkflow(wf: any): Workflow {
  return {
    id: wf.id,
    title: wf.title,
    slug: wf.slug,
    description: wf.description,
    steps: parseJson(wf.steps) ?? [],
    tools: parseJson(wf.tools),
    category_id: wf.category_id,
    category: wf.category,
    tags: wf.tags?.map((t: any) => t.tag) ?? [],
    status: wf.status,
    featured: wf.featured,
    view_count: wf.view_count,
    like_count: wf.like_count,
    published_at: wf.published_at?.toISOString() ?? null,
    created_at: wf.created_at.toISOString(),
    updated_at: wf.updated_at.toISOString(),
  };
}
