import { prisma } from "@/lib/db/db";

export const searchTypes = ["all", "tools", "discoveries", "posts", "cases", "workflows", "prompts", "resources"] as const;
export type SearchType = (typeof searchTypes)[number];

export interface UnifiedSearchResult {
  id: number;
  title: string;
  description: string;
  type: Exclude<SearchType, "all">;
  typeLabel: string;
  href: string;
  category?: string | null;
  tags?: string[];
  meta?: string;
}

const contains = (q: string) => ({ contains: q, mode: "insensitive" as const });

function searchNeedles(query: string) {
  const aliases: Record<string, string[]> = {
    赚钱: ["赚钱", "变现", "副业", "收益", "收入", "广告"],
    效率: ["效率", "自动化", "工作流", "提效"],
    自动化: ["自动化", "工作流", "n8n", "流程"],
  };
  return aliases[query] || [query];
}

export async function unifiedSearch(query: string, type: SearchType = "all", limit = 10): Promise<UnifiedSearchResult[]> {
  const q = query.trim();
  if (!q) return [];
  const needles = searchNeedles(q);
  const matches = (...fields: string[]) => fields.flatMap((field) => needles.map((term) => ({ [field]: contains(term) })));
  const results: UnifiedSearchResult[] = [];
  const includeTools = type === "all" || type === "tools";
  const includeDiscoveries = type === "all" || type === "discoveries";
  const includePosts = type === "all" || type === "posts";
  const includeCases = type === "all" || type === "cases";
  const includeWorkflows = type === "all" || type === "workflows";
  const includePrompts = type === "all" || type === "prompts";
  const includeResources = type === "all" || type === "resources";

  const [tools, discoveries, posts, cases, workflows, prompts, resources] = await Promise.all([
    includeTools ? prisma.website.findMany({ where: { status: "approved", OR: [...matches("title", "description"), { category: { name: contains(q) } }] }, include: { category: true }, orderBy: [{ visits: "desc" }, { likes: "desc" }], take: limit }) : [],
    includeDiscoveries ? prisma.post.findMany({ where: { status: "published", category: { slug: "ai-discovery" }, OR: [...matches("title", "excerpt", "content")] }, include: { category: true, tags: { include: { tag: true } } }, orderBy: [{ updated_at: "desc" }, { view_count: "desc" }], take: limit }) : [],
    includePosts ? prisma.post.findMany({ where: { status: "published", category: { slug: { not: "ai-discovery" } }, OR: [...matches("title", "excerpt", "content")] }, include: { category: true, tags: { include: { tag: true } } }, orderBy: [{ published_at: "desc" }, { view_count: "desc" }], take: limit }) : [],
    includeCases ? prisma.caseStudy.findMany({ where: { status: "published", OR: [...matches("title", "summary", "content"), { category: { name: contains(q) } }] }, include: { category: true, tags: { include: { tag: true } } }, orderBy: [{ featured: "desc" }, { published_at: "desc" }], take: limit }) : [],
    includeWorkflows ? prisma.workflow.findMany({ where: { status: "published", OR: [...matches("title", "description"), { category: { name: contains(q) } }] }, include: { category: true, tags: { include: { tag: true } } }, orderBy: [{ featured: "desc" }, { published_at: "desc" }], take: limit }) : [],
    includePrompts ? prisma.prompt.findMany({ where: { status: "published", OR: [...matches("title", "excerpt", "content"), { category: { name: contains(q) } }] }, include: { category: true, tags: { include: { tag: true } } }, orderBy: [{ featured: "desc" }, { view_count: "desc" }], take: limit }) : [],
    includeResources ? prisma.resource.findMany({ where: { status: "published", permission: "FREE", OR: [...matches("title", "description", "url"), { category: { name: contains(q) } }] }, include: { category: true }, orderBy: { downloads: "desc" }, take: limit }) : [],
  ]);

  results.push(...tools.map((item) => ({ id: item.id, title: item.title, description: item.description, type: "tools" as const, typeLabel: "工具", href: `/tools/${item.id}`, category: item.category?.name, meta: `${item.visits} 次访问` })));
  results.push(...discoveries.map((item) => ({ id: item.id, title: item.title, description: item.excerpt || "AI项目介绍、使用方法和关联内容", type: "discoveries" as const, typeLabel: "发现", href: `/discoveries/${item.slug}`, category: "AI发现", tags: item.tags.map(({ tag }) => tag.name), meta: `${item.view_count} 热度` })));
  results.push(...posts.map((item) => ({ id: item.id, title: item.title, description: item.excerpt || "AI教程、方法论和实战经验", type: "posts" as const, typeLabel: "知识", href: `/posts/${item.slug}`, category: item.category?.name, tags: item.tags.map(({ tag }) => tag.name), meta: `${item.view_count} 阅读` })));
  results.push(...cases.map((item) => ({ id: item.id, title: item.title, description: item.summary, type: "cases" as const, typeLabel: "案例", href: `/cases/${item.slug}`, category: item.category?.name, tags: item.tags.map(({ tag }) => tag.name), meta: `${item.view_count} 浏览` })));
  results.push(...workflows.map((item) => ({ id: item.id, title: item.title, description: item.description, type: "workflows" as const, typeLabel: "工作流", href: `/workflows/${item.slug}`, category: item.category?.name, tags: item.tags.map(({ tag }) => tag.name), meta: `${Array.isArray(item.steps) ? item.steps.length : 0} 个步骤` })));
  results.push(...prompts.map((item) => ({ id: item.id, title: item.title, description: item.excerpt || "可直接复制使用的提示词模板", type: "prompts" as const, typeLabel: "提示词", href: `/prompts/${item.slug}`, category: item.category?.name, tags: item.tags.map(({ tag }) => tag.name), meta: `${item.copy_count} 次复制` })));
  results.push(...resources.map((item) => ({ id: item.id, title: item.title, description: item.description || "AI资料、模板与工具合集", type: "resources" as const, typeLabel: "资源", href: item.category?.slug ? `/resources?category=${item.category.slug}` : "/resources", category: item.category?.name, tags: [], meta: `${item.downloads} 次下载` })));

  return results.slice(0, type === "all" ? 60 : 30);
}
