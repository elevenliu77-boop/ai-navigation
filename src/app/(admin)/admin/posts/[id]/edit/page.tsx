
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getPostById, getCategories, getAllTags } from "../../../actions-posts";
import { notFound } from "next/navigation";
import PostEditor from "../../post-editor";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;
  const post = await getPostById(Number(id));
  if (!post) notFound();

  const categories = await getCategories();
  const tags = await getAllTags();

  return (
    <PostEditor
      initialData={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt || "",
        metadata: post.metadata,
        status: post.status,
        category_id: post.category_id,
        tags: post.tags?.map((pt: any) => pt.tag) || [],
      }}
      categories={categories as any}
      tags={tags as any}
    />
  );
}
