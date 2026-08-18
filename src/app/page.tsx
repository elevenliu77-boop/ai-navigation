
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/db/db";
import HomePageClient from "@/app/home-page";
import { cachedPrismaQuery } from "@/lib/db/cache";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "alphahole - AI效率与赚钱知识库",
  description:
    "探索AI工具、自动化工作流、提示词模板和真实AI应用案例。",
};

export default async function Home() {
  // 分类（含文章数）
  const categories = await cachedPrismaQuery(
    "categories-with-counts",
    () =>
      prisma.category.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          _count: { select: { posts: true } },
        },
        orderBy: { name: "asc" },
      }),
    { ttl: 3600 }
  );

  // 精选文章（按浏览量排序）
  const featuredPosts = await prisma.post.findMany({
    where: { status: "published", category: { slug: { not: "ai-discovery" } } },
    include: {
      category: true,
      tags: { include: { tag: true } },
    },
    orderBy: [{ view_count: "desc" }, { published_at: "desc" }],
    take: 5,
  });

  // 最新文章
  const latestPosts = await prisma.post.findMany({
    where: { status: "published", category: { slug: { not: "ai-discovery" } } },
    include: {
      category: true,
      tags: { include: { tag: true } },
    },
    orderBy: { published_at: "desc" },
    take: 12,
  });

  const latestDiscoveries = await prisma.post.findMany({
    where: { status: "published", category: { slug: "ai-discovery" } },
    include: { tags: { include: { tag: true } } },
    orderBy: [{ updated_at: "desc" }, { view_count: "desc" }],
    take: 3,
  });

  // 热门工具：优先展示生产力工具，避免首页被聊天机器人占满
  const productivityToolNames = ["Cursor", "Claude Code", "n8n", "Midjourney", "Perplexity AI", "ElevenLabs"];
  const [priorityTools, otherTools] = await Promise.all([
    prisma.website.findMany({
      where: { status: "approved", title: { in: productivityToolNames } },
      include: { category: true },
      orderBy: [{ visits: "desc" }, { likes: "desc" }],
    }),
    prisma.website.findMany({
      where: { status: "approved", title: { notIn: productivityToolNames } },
      include: { category: true },
      orderBy: [{ visits: "desc" }, { likes: "desc" }],
      take: 4,
    }),
  ]);
  const hotTools = [...priorityTools, ...otherTools].slice(0, 10);

  // 热门 Prompt
  const hotPrompts = await prisma.prompt.findMany({
    where: { status: "published" },
    include: { category: true, tags: { include: { tag: true } } },
    orderBy: [{ featured: "desc" }, { view_count: "desc" }, { published_at: "desc" }],
    take: 4,
  });

  // 精选工作流
  const featuredWorkflows = await prisma.workflow.findMany({
    where: { status: "published" },
    include: { category: true, tags: { include: { tag: true } } },
    orderBy: [{ featured: "desc" }, { view_count: "desc" }, { published_at: "desc" }],
    take: 3,
  });

  // 最新案例
  const latestCases = await prisma.caseStudy.findMany({
    where: { status: "published" },
    include: { category: true, tags: { include: { tag: true } } },
    orderBy: [{ featured: "desc" }, { published_at: "desc" }],
    take: 3,
  });

  // 最新资料
  const latestResources = await prisma.resource.findMany({
    where: { status: "published" },
    include: { category: true },
    orderBy: { created_at: "desc" },
    take: 4,
  });

  const formatPost = (p: any) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    content: p.content,
    excerpt: p.excerpt,
    metadata: p.metadata,
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

  const formatPrompt = (p: any) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    metadata: p.metadata,
    category_id: p.category_id,
    category: p.category,
    view_count: p.view_count,
    copy_count: p.copy_count,
    published_at: p.published_at?.toISOString() ?? null,
  });

  const formatWorkflow = (w: any) => ({
    id: w.id,
    title: w.title,
    slug: w.slug,
    description: w.description,
    steps: w.steps,
    category_id: w.category_id,
    category: w.category,
    view_count: w.view_count,
    published_at: w.published_at?.toISOString() ?? null,
    metadata: w.metadata,
  });

  const formatCase = (c: any) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    summary: c.summary,
    result: c.result,
    metadata: c.metadata,
    category_id: c.category_id,
    category: c.category,
    view_count: c.view_count,
    published_at: c.published_at?.toISOString() ?? null,
  });

  const formatTool = (w: any) => ({
    id: w.id,
    title: w.title,
    url: w.url,
    description: w.description,
    thumbnail: w.thumbnail,
    thumbnail_base64: w.thumbnail_base64,
    category: w.category,
    visits: w.visits,
    likes: w.likes,
    metadata: w.metadata,
  });

  const formatDiscovery = (p: any) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    view_count: p.view_count,
    updated_at: p.updated_at.toISOString(),
    metadata: p.metadata,
    tags: p.tags?.map((pt: any) => pt.tag) ?? [],
  });

  const formatResource = (r: any) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    description: r.description,
    url: r.url,
    category: r.category,
    downloads: r.downloads,
  });

  const categoriesData = categories.map((c: any) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    postCount: c._count.posts,
  }));

  return (
    <HomePageClient
      categories={categoriesData}
      featuredPosts={featuredPosts.map(formatPost)}
      latestPosts={latestPosts.map(formatPost)}
      latestDiscoveries={latestDiscoveries.map(formatDiscovery)}
      hotTools={hotTools.map(formatTool)}
      hotPrompts={hotPrompts.map(formatPrompt)}
      featuredWorkflows={featuredWorkflows.map(formatWorkflow)}
      latestCases={latestCases.map(formatCase)}
      latestResources={latestResources.map(formatResource)}
    />
  );
}
