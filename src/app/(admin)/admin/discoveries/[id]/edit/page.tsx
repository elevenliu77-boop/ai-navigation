
/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/db";
import { getAllTags } from "../../../actions-posts";
import PostEditor from "../../../posts/post-editor";

export const dynamic = "force-dynamic";
interface Props { params: Promise<{ id: string }> }
export default async function EditDiscoveryPage({ params }: Props) {
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id: Number(id) }, include: { category: true, tags: { include: { tag: true } } } });
  const category = await prisma.category.findUnique({ where: { slug: "ai-discovery" } });
  if (!post || !category || post.category_id !== category.id) notFound();
  const tags = await getAllTags();
  return <PostEditor initialData={{ id: post.id, title: post.title, slug: post.slug, content: post.content, excerpt: post.excerpt || "", metadata: post.metadata, status: post.status, category_id: post.category_id, tags: post.tags.map((item) => item.tag) }} categories={[category]} tags={tags as any} backHref="/admin/discoveries" />;
}
