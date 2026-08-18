
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getCaseById } from "@/lib/services/cases";
import { getCategoriesByType } from "@/lib/services/categories";
import { getAllTags } from "@/lib/services/posts";
import { notFound } from "next/navigation";
import CaseEditor from "../../case-editor";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

function parseJson(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return [];
}

export default async function EditCasePage({ params }: Props) {
  const { id } = await params;
  const cs = await getCaseById(Number(id));
  if (!cs) notFound();

  const categories = await getCategoriesByType("case");
  const tags = await getAllTags();

  return (
    <CaseEditor
      initialData={{
        id: cs.id,
        title: cs.title,
        slug: cs.slug,
        summary: cs.summary,
        content: cs.content,
        cover: cs.cover || "",
        result: parseJson(cs.result),
        metadata: cs.metadata,
        status: cs.status,
        featured: cs.featured,
        category_id: cs.category_id,
        tags: cs.tags?.map((t: any) => t.tag) || [],
      }}
      categories={categories as any}
      tags={tags as any}
    />
  );
}
