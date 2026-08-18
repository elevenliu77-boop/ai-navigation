import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/db";
import ToolEditor from "../../tool-editor";

export const dynamic = "force-dynamic";
interface Props { params: Promise<{ id: string }> }

export default async function EditToolPage({ params }: Props) {
  const { id } = await params;
  const tool = await prisma.website.findUnique({ where: { id: Number(id) } });
  if (!tool) notFound();
  const categories = await prisma.category.findMany({ where: { type: "website" }, orderBy: { name: "asc" } });
  return <ToolEditor initialData={{ id: tool.id, title: tool.title, url: tool.url, description: tool.description, category_id: tool.category_id, status: tool.status, metadata: tool.metadata }} categories={categories} />;
}
