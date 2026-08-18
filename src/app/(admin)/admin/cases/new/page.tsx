
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getCategoriesByType } from "@/lib/services/categories";
import { getAllTags } from "@/lib/services/posts";
import CaseEditor from "../case-editor";

export const dynamic = "force-dynamic";

export default async function NewCasePage() {
  const categories = await getCategoriesByType("case");
  const tags = await getAllTags();
  return <CaseEditor categories={categories as any} tags={tags as any} />;
}
