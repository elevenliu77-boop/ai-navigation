import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/db";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://alphahole.xyz";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = ["", "/tools", "/discoveries", "/posts", "/cases", "/workflows", "/prompts", "/resources", "/about", "/assistant", "/membership"];
  const [posts, websites, cases, workflows, prompts, resources] = await Promise.all([
    prisma.post.findMany({ where: { status: "published" }, select: { slug: true, updated_at: true, category: { select: { slug: true } } } }),
    prisma.website.findMany({ where: { status: "approved" }, select: { id: true, updated_at: true } }),
    prisma.caseStudy.findMany({ where: { status: "published" }, select: { slug: true, updated_at: true } }),
    prisma.workflow.findMany({ where: { status: "published" }, select: { slug: true, updated_at: true } }),
    prisma.prompt.findMany({ where: { status: "published" }, select: { slug: true, updated_at: true } }),
    prisma.resource.findMany({ where: { status: "published" }, select: { slug: true, updated_at: true } }),
  ]);
  const pageEntries = paths.map((path) => ({ url: siteUrl + path, lastModified: new Date(), changeFrequency: (path === "" ? "daily" : "weekly") as "daily" | "weekly", priority: path === "" ? 1 : 0.7 }));
  const postEntries = posts.map((post) => ({ url: `${siteUrl}/${post.category?.slug === "ai-discovery" ? "discoveries" : "posts"}/${post.slug}`, lastModified: post.updated_at, changeFrequency: "weekly" as const, priority: 0.6 }));
  return [
    ...pageEntries,
    ...postEntries,
    ...websites.map((item) => ({ url: `${siteUrl}/tools/${item.id}`, lastModified: item.updated_at, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...cases.map((item) => ({ url: `${siteUrl}/cases/${item.slug}`, lastModified: item.updated_at, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...workflows.map((item) => ({ url: `${siteUrl}/workflows/${item.slug}`, lastModified: item.updated_at, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...prompts.map((item) => ({ url: `${siteUrl}/prompts/${item.slug}`, lastModified: item.updated_at, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...resources.map((item) => ({ url: `${siteUrl}/resources/${item.slug}`, lastModified: item.updated_at, changeFrequency: "weekly" as const, priority: 0.5 })),
  ];
}
