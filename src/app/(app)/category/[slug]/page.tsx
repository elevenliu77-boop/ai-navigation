import { prisma } from "@/lib/db/db";
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });

  if (!category) notFound();

  redirect(`/posts?category=${slug}`);
}
