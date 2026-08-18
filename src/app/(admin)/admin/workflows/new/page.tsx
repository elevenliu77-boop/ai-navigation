
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getCategoriesByType } from "@/lib/services/categories";
import { getAllTags } from "@/lib/services/posts";
import WorkflowEditor from "../workflow-editor";

export const dynamic = "force-dynamic";

export default async function NewWorkflowPage() {
  const categories = await getCategoriesByType("workflow");
  const tags = await getAllTags();
  return <WorkflowEditor categories={categories as any} tags={tags as any} />;
}
