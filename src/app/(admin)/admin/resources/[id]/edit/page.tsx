
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getResourceById } from "@/lib/services/resources";
import { getCategoriesByType } from "@/lib/services/categories";
import { notFound } from "next/navigation";
import ResourceEditor from "../../resource-editor";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditResourcePage({ params }: Props) {
  const { id } = await params;
  const resource = await getResourceById(Number(id));
  if (!resource) notFound();

  const categories = await getCategoriesByType("resource");

  return (
    <ResourceEditor
      initialData={{
        id: resource.id,
        title: resource.title,
        slug: resource.slug,
        type: resource.type,
        description: resource.description || "",
        url: resource.url,
        category_id: resource.category_id,
        permission: resource.permission,
        status: resource.status,
      }}
      categories={categories as any}
    />
  );
}
