"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CalendarDays, Copy, Eye, ExternalLink, GitBranch, Trophy, Workflow, Wrench } from "lucide-react";
import { Badge } from "@/ui/common/badge";
import { Button } from "@/ui/common/button";
import { MarkdownContent } from "@/components/markdown-content";
import { FavoriteButton, ShareButton } from "@/components/content-actions/content-actions";
import type { DiscoveryMetadata } from "@/lib/types";

interface RelatedItem { id: number; title: string; slug?: string; category?: { name: string } | null; url?: string | null; description?: string | null }
interface Props {
  post: { id: number; title: string; slug: string; content: string; excerpt: string | null; metadata?: DiscoveryMetadata | null; view_count: number; updated_at: string; tags: { id: number; name: string; slug: string }[] };
  relatedPosts: RelatedItem[];
  relatedTools: RelatedItem[];
  relatedPrompts: RelatedItem[];
  relatedWorkflows: RelatedItem[];
  relatedCases: RelatedItem[];
}

export default function DiscoveryDetail({ post, relatedPosts, relatedTools, relatedPrompts, relatedWorkflows, relatedCases }: Props) {
  const metadata = post.metadata || {};
  const audience = metadata.audience?.length ? metadata.audience : ["AI学习者", "效率用户", "开发者"];
  const scenarios = metadata.scenarios?.length ? metadata.scenarios : ["工具试用", "自动化实践", "项目原型"];
  return <main className="min-h-screen py-10 sm:py-12"><div className="mx-auto max-w-4xl px-4">
    <Link href="/discoveries"><Button variant="ghost" size="sm" className="mb-6 gap-1"><ArrowLeft className="h-4 w-4" /> 返回 AI发现</Button></Link>
    <article><header className="mb-8"><div className="mb-4 flex flex-wrap items-center gap-2"><Badge variant="secondary">AI发现</Badge>{metadata.recommended !== false && <Badge className="bg-amber-500 text-white hover:bg-amber-500">🔥 推荐关注</Badge>}<GitBranch className="h-4 w-4 text-muted-foreground" />{post.tags.map((tag) => <Badge key={tag.id} variant="outline" className="text-[10px]">#{tag.name}</Badge>)}</div><h1 className="text-3xl font-bold leading-tight sm:text-4xl">{post.title}</h1>{post.excerpt && <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>}<div className="mt-5 flex flex-wrap gap-4 text-sm text-muted-foreground"><span className="flex items-center gap-1"><CalendarDays className="h-4 w-4" />更新于 {new Date(post.updated_at).toLocaleDateString("zh-CN")}</span><span className="flex items-center gap-1"><Eye className="h-4 w-4" />{post.view_count} 热度</span></div><div className="mt-5 flex flex-wrap gap-2"><FavoriteButton targetType="discovery" targetId={post.id} /><ShareButton title={post.title} /></div></header>
      <section className="mb-10 grid gap-3 sm:grid-cols-2"><InfoCard title="项目简介" value={metadata.intro || post.excerpt || "一个值得关注的 AI 工具或开源项目。"} /><InfoCard title="为什么值得关注" value={metadata.why || "从解决的问题、上手成本和可复用性判断它是否值得进入你的工具箱。"} /><InfoCard title="适合谁" items={audience} /><InfoCard title="使用场景" items={scenarios} /></section>
      <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-primary prose-img:rounded-xl"><MarkdownContent content={post.content} /></div>
    </article>
    {(relatedTools.length || relatedPrompts.length || relatedWorkflows.length || relatedCases.length) > 0 && <section className="mt-14"><h2 className="mb-6 text-2xl font-bold">知识关联</h2><div className="space-y-6"><RelatedGroup title="相关 AI工具" icon={<Wrench className="h-3.5 w-3.5" />} items={relatedTools} external /><RelatedGroup title="相关提示词库" icon={<Copy className="h-3.5 w-3.5" />} items={relatedPrompts} basePath="/prompts" /><RelatedGroup title="相关 AI工作流" icon={<Workflow className="h-3.5 w-3.5" />} items={relatedWorkflows} basePath="/workflows" /><RelatedGroup title="相关 AI赚钱案例" icon={<Trophy className="h-3.5 w-3.5" />} items={relatedCases} basePath="/cases" /></div></section>}
    {relatedPosts.length > 0 && <section className="mt-14"><h2 className="mb-6 text-2xl font-bold">更多 AI发现</h2><div className="grid gap-4 sm:grid-cols-2">{relatedPosts.map((item) => <Link key={item.id} href={`/discoveries/${item.slug}`} className="post-card group p-4"><h3 className="font-semibold group-hover:text-primary">{item.title}</h3><ArrowUpRight className="mt-3 h-4 w-4 text-muted-foreground" /></Link>)}</div></section>}
  </div></main>;
}

function InfoCard({ title, value, items }: { title: string; value?: string; items?: string[] }) {
  return <div className="post-card p-4"><h2 className="text-sm font-semibold">{title}</h2>{value && <p className="mt-2 text-sm leading-6 text-muted-foreground">{value}</p>}{items && <div className="mt-3 flex flex-wrap gap-2">{items.map((item) => <Badge key={item} variant="outline">{item}</Badge>)}</div>}</div>;
}

function RelatedGroup({ title, icon, items, basePath = "", external = false }: { title: string; icon: React.ReactNode; items: RelatedItem[]; basePath?: string; external?: boolean }) {
  if (!items.length) return null;
  return <div><h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">{icon}</span>{title}</h3><div className="grid gap-3 sm:grid-cols-2">{items.map((item) => { const content = <div className="post-card group h-full p-4"><div className="flex items-start justify-between gap-2"><Badge variant="secondary" className="text-[10px]">{item.category?.name || title}</Badge>{external ? <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" /> : <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />}</div><h4 className="mt-3 text-sm font-semibold group-hover:text-primary">{item.title}</h4>{item.description && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>}</div>; return external ? <a key={item.id} href={item.url || "#"} target="_blank" rel="noopener noreferrer">{content}</a> : <Link key={item.id} href={`${basePath}/${item.slug}`}>{content}</Link>; })}</div></div>;
}
