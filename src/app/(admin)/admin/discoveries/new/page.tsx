
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/db/db";
import { getAllTags } from "../../actions-posts";
import PostEditor from "../../posts/post-editor";

export const dynamic = "force-dynamic";
export default async function NewDiscoveryPage() {
  const category = await prisma.category.findUnique({ where: { slug: "ai-discovery" } });
  const tags = await getAllTags();
  return <PostEditor categories={category ? [category] : []} tags={tags as any} backHref="/admin/discoveries" />;
}
