
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getPromptById } from "@/lib/services/prompts";
import { getCategoriesByType } from "@/lib/services/categories";
import { getAllTags } from "@/lib/services/posts";
import { notFound } from "next/navigation";
import PromptEditor from "../../prompt-editor";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPromptPage({ params }: Props) {
  const { id } = await params;
  const prompt = await getPromptById(Number(id));
  if (!prompt) notFound();

  const categories = await getCategoriesByType("prompt");
  const tags = await getAllTags();

  return (
    <PromptEditor
      initialData={{
        id: prompt.id,
        title: prompt.title,
        slug: prompt.slug,
        content: prompt.content,
        excerpt: prompt.excerpt || "",
        status: prompt.status,
        featured: prompt.featured,
        category_id: prompt.category_id,
        tags: prompt.tags?.map((pt: any) => pt.tag) || [],
        metadata: prompt.metadata as any,
      }}
      categories={categories as any}
      tags={tags as any}
    />
  );
}
