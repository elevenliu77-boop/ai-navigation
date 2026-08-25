import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const posts = await prisma.post.findMany({
    where: { status: "published" },
    orderBy: { id: "asc" },
    include: { category: true },
  });

  const data = posts.flatMap((post) => {
    const metadata = post.metadata && typeof post.metadata === "object" && !Array.isArray(post.metadata)
      ? post.metadata as Record<string, unknown>
      : null;
    const ahId = typeof metadata?.ahId === "string" ? metadata.ahId : null;
    const terminalState = typeof metadata?.terminalState === "string" ? metadata.terminalState : null;
    if (!ahId || terminalState !== "FINAL") return [];

    return [{
      id: post.id,
      ahId,
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      metadata,
      category: { name: post.category.name, slug: post.category.slug },
      publishedAt: post.published_at?.toISOString() ?? null,
      updatedAt: post.updated_at.toISOString(),
    }];
  });

  return NextResponse.json(
    { schemaVersion: 1, source: "legacy-alphahole-published-final-ah", count: data.length, data },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
