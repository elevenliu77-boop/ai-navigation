
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getWorkflowById } from "@/lib/services/workflows";
import { getCategoriesByType } from "@/lib/services/categories";
import { getAllTags } from "@/lib/services/posts";
import { notFound } from "next/navigation";
import WorkflowEditor from "../../workflow-editor";

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

export default async function EditWorkflowPage({ params }: Props) {
  const { id } = await params;
  const workflow = await getWorkflowById(Number(id));
  if (!workflow) notFound();

  const categories = await getCategoriesByType("workflow");
  const tags = await getAllTags();

  return (
    <WorkflowEditor
      initialData={{
        id: workflow.id,
        title: workflow.title,
        slug: workflow.slug,
        description: workflow.description,
        steps: parseJson(workflow.steps),
        tools: parseJson(workflow.tools),
        status: workflow.status,
        featured: workflow.featured,
        category_id: workflow.category_id,
        tags: workflow.tags?.map((t: any) => t.tag) || [],
        metadata: workflow.metadata as any,
      }}
      categories={categories as any}
      tags={tags as any}
    />
  );
}
