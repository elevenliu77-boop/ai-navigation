
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { invalidateCache } from "@/lib/db/cache";
import type { Resource } from "@/lib/types";

// ──────── 资料查询 ────────

export async function getPublishedResources(options?: {
  categorySlug?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ resources: Resource[]; total: number }> {
  const { categorySlug, page = 1, pageSize = 12 } = options || {};
  const skip = (page - 1) * pageSize;

  const where: any = { status: "published" };
  if (categorySlug) where.category = { slug: categorySlug };

  const [resources, total] = await Promise.all([
    prisma.resource.findMany({
      where,
      include: { category: true },
      orderBy: { created_at: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.resource.count({ where }),
  ]);

  return { resources: resources.map(formatResource), total };
}

export async function getResourceBySlug(slug: string): Promise<Resource | null> {
  const resource = await prisma.resource.findUnique({
    where: { slug, status: "published" },
    include: { category: true },
  });
  return resource ? formatResource(resource) : null;
}

export async function incrementResourceDownload(id: number): Promise<void> {
  await prisma.resource.update({
    where: { id },
    data: { downloads: { increment: 1 } },
  });
}

// ──────── 后台管理 ────────

export async function getAllResources(options?: {
  page?: number;
  pageSize?: number;
  status?: string;
}): Promise<{ resources: Resource[]; total: number }> {
  const { page = 1, pageSize = 20, status } = options || {};
  const skip = (page - 1) * pageSize;
  const where: any = {};
  if (status) where.status = status;

  const [resources, total] = await Promise.all([
    prisma.resource.findMany({
      where,
      include: { category: true },
      orderBy: { created_at: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.resource.count({ where }),
  ]);

  return { resources: resources.map(formatResource), total };
}

export async function getResourceById(id: number) {
  return prisma.resource.findUnique({
    where: { id },
    include: { category: true },
  });
}

export async function createResource(data: {
  title: string;
  slug: string;
  type: string;
  description?: string;
  url: string;
  category_id?: number | null;
  permission?: string;
  status?: string;
}): Promise<Resource> {
  const resource = await prisma.resource.create({
    data: {
      ...data,
      category_id: data.category_id ?? null,
    },
    include: { category: true },
  });
  invalidateCache("resources");
  return formatResource(resource);
}

export async function updateResource(
  id: number,
  data: {
    title?: string;
    slug?: string;
    type?: string;
    description?: string;
    url?: string;
    category_id?: number | null;
    permission?: string;
    status?: string;
  }
): Promise<Resource> {
  const resource = await prisma.resource.update({
    where: { id },
    data: {
      ...data,
      category_id: data.category_id === undefined ? undefined : data.category_id ?? null,
    },
    include: { category: true },
  });
  invalidateCache("resources");
  return formatResource(resource);
}

export async function deleteResource(id: number): Promise<void> {
  await prisma.resource.delete({ where: { id } });
  invalidateCache("resources");
}

// ──────── 工具函数 ────────

function formatResource(r: any): Resource {
  return {
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
  };
}
