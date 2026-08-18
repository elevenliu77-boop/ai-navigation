import { prisma } from "@/lib/db/db";
import AdminDiscoveriesClient from "./admin-discoveries-client";

export const dynamic = "force-dynamic";

export default async function AdminDiscoveriesPage() {
  const category = await prisma.category.findUnique({ where: { slug: "ai-discovery" } });
  const posts = category ? await prisma.post.findMany({ where: { category_id: category.id }, include: { tags: { include: { tag: true } } }, orderBy: { updated_at: "desc" } }) : [];
  return <AdminDiscoveriesClient posts={posts.map((post) => ({ id: post.id, title: post.title, slug: post.slug, status: post.status, view_count: post.view_count, updated_at: post.updated_at.toISOString() }))} />;
}
