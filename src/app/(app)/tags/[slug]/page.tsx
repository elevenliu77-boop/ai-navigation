import { prisma } from "@/lib/db/db";
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function TagPage({ params }: Props) {
  const { slug } = await params;
  const tag = await prisma.tag.findUnique({ where: { slug } });

  if (!tag) notFound();

  redirect(`/posts?tag=${slug}`);
}
