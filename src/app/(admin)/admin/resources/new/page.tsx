
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getCategoriesByType } from "@/lib/services/categories";
import ResourceEditor from "../resource-editor";

export const dynamic = "force-dynamic";

export default async function NewResourcePage() {
  const categories = await getCategoriesByType("resource");
  return <ResourceEditor categories={categories as any} />;
}
