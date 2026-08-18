
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/db/db";
import { DiscoveryList } from "./discoveries-list";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ page?: string; q?: string; sort?: string }>;
}

export async function generateMetadata() {
  return {
    title: "AI发现 | 值得关注的AI工具与开源项目",
    description: "每天发现值得关注的AI工具、GitHub项目和开源项目。",
    keywords: ["AI发现", "AI工具日报", "GitHub项目", "开源项目", "AI工具"],
    openGraph: { title: "AI发现 | alphahole", description: "每天发现值得关注的AI工具、GitHub项目和开源项目。", type: "website" },
  };
}

export default async function DiscoveriesPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(Number(params.page) || 1, 1);
  const query = params.q?.trim();
  const sort = params.sort === "latest" ? "latest" : "hot";
  const pageSize = 12;
  const category = await prisma.category.findUnique({ where: { slug: "ai-discovery" } });

  if (!category) {
    return <DiscoveryList discoveries={[]} total={0} page={1} pageSize={pageSize} query={query} sort={sort} />;
  }

  const where: any = { status: "published", category_id: category.id };
  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { excerpt: { contains: query, mode: "insensitive" } },
      { content: { contains: query, mode: "insensitive" } },
    ];
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: { tags: { include: { tag: true } } },
      orderBy: sort === "latest" ? [{ updated_at: "desc" }, { view_count: "desc" }] : [{ view_count: "desc" }, { updated_at: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.post.count({ where }),
  ]);

  return <DiscoveryList discoveries={posts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    view_count: post.view_count,
    updated_at: post.updated_at.toISOString(),
    tags: post.tags.map(({ tag }) => tag),
  }))} total={total} page={page} pageSize={pageSize} query={query} sort={sort} />;
}
