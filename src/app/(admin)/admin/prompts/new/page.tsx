
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getCategoriesByType } from "@/lib/services/categories";
import { getAllTags } from "@/lib/services/posts";
import PromptEditor from "../prompt-editor";

export const dynamic = "force-dynamic";

export default async function NewPromptPage() {
  const categories = await getCategoriesByType("prompt");
  const tags = await getAllTags();
  return <PromptEditor categories={categories as any} tags={tags as any} />;
}
