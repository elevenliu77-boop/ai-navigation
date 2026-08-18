"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ExternalLink, Heart, Minus, Plus, Target, Users, Wrench } from "lucide-react";
import { useEffect } from "react";
import { Badge } from "@/ui/common/badge";
import { Button } from "@/ui/common/button";
import { MarkdownContent } from "@/components/markdown-content";
import type { ToolMetadata } from "@/lib/types";
import { FavoriteButton, ShareButton } from "@/components/content-actions/content-actions";

interface Item { id: number; title: string; slug: string; category?: { name: string } | null }
interface Props { tool: { id: number; title: string; url: string; description: string; category?: { name: string } | null; visits: number; likes: number; metadata: unknown }; relatedDiscoveries: Item[]; relatedPrompts: Item[]; relatedWorkflows: Item[]; relatedCases: Item[] }

export default function ToolDetail({ tool, relatedDiscoveries, relatedPrompts, relatedWorkflows, relatedCases }: Props) {
  useEffect(() => { fetch(`/api/websites/${tool.id}/visit`, { method: "POST" }).catch(() => {}); }, [tool.id]);
  const metadata = (tool.metadata && typeof tool.metadata === "object" && !Array.isArray(tool.metadata) ? tool.metadata : {}) as ToolMetadata;
  const audience = metadata.audience?.length ? metadata.audience : ["普通用户", "创业者"];
  const scenarios = metadata.scenarios?.length ? metadata.scenarios : ["办公", "内容创作"];
  const tags = metadata.tags?.length ? metadata.tags : [tool.category?.name || "AI工具"];
  const facts = [["评分", metadata.rating || "待体验"], ["使用难度", metadata.difficulty || "入门"], ["费用", metadata.pricing || "免费/付费"]];
  return <main className="min-h-screen py-10 sm:py-12"><div className="mx-auto max-w-4xl px-4"><Link href="/tools"><Button variant="ghost" size="sm" className="mb-6 gap-1"><ArrowLeft className="h-4 w-4" />返回 AI工具库</Button></Link><article><header className="mb-8"><div className="mb-4 flex flex-wrap items-center gap-2"><Badge variant="secondary">{tool.category?.name || "AI工具"}</Badge>{tags.map((tag) => <Badge key={tag} variant="outline">#{tag}</Badge>)}</div><h1 className="text-3xl font-bold sm:text-4xl">{tool.title}</h1><p className="mt-4 text-lg text-muted-foreground">{tool.description}</p><div className="mt-5 flex flex-wrap gap-3"><a href={tool.url} target="_blank" rel="noopener noreferrer"><Button className="gap-2">立即开始使用<ExternalLink className="h-4 w-4" /></Button></a><Link href="#related-workflows"><Button variant="outline">查看相关工作流</Button></Link><Link href="#related-cases"><Button variant="outline">查看成功案例</Button></Link></div><div className="mt-3 flex flex-wrap gap-2"><FavoriteButton targetType="tool" targetId={tool.id} /><ShareButton title={tool.title} />{tool.likes > 0 && <span className="inline-flex items-center gap-1.5 rounded-md border border-border/40 px-3 text-sm text-muted-foreground"><Heart className="h-4 w-4" />{tool.likes} 喜欢</span>}</div></header>
      <div className="mb-8 grid grid-cols-3 gap-3">{facts.map(([label, value]) => <div key={label} className="post-card p-4 text-center"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-2 text-sm font-semibold text-primary">{value}</div></div>)}</div>
      <div className="mb-10 grid gap-4 sm:grid-cols-2"><InfoCard icon={<Users className="h-4 w-4" />} title="适合谁" items={audience} /><InfoCard icon={<Target className="h-4 w-4" />} title="应用场景" items={scenarios} /></div>
      {(metadata.pros?.length || metadata.cons?.length) ? <div className="mb-10 grid gap-4 sm:grid-cols-2"><ListCard title="优点" icon={<Plus className="h-4 w-4 text-emerald-500" />} items={metadata.pros || []} /><ListCard title="注意事项" icon={<Minus className="h-4 w-4 text-amber-500" />} items={metadata.cons || []} /></div> : null}
      <section className="post-card mb-10 p-6"><h2 className="mb-4 flex items-center gap-2 text-xl font-bold"><Wrench className="h-5 w-5 text-primary" />如何使用</h2>{metadata.tutorial ? <div className="prose prose-sm max-w-none dark:prose-invert"><MarkdownContent content={metadata.tutorial} /></div> : <p className="text-sm leading-7 text-muted-foreground">打开官网注册或登录后，从上面的应用场景开始尝试。建议先用一个明确的小任务验证效果，再把它接入工作流。</p>}</section></article><section className="space-y-8"><RelatedGroup title="相关 AI发现" items={relatedDiscoveries} basePath="/discoveries" /><RelatedGroup id="related-prompts" title="关联提示词库" items={relatedPrompts} basePath="/prompts" /><RelatedGroup id="related-workflows" title="推荐工作流" items={relatedWorkflows} basePath="/workflows" /><RelatedGroup id="related-cases" title="成功案例" items={relatedCases} basePath="/cases" /></section></div></main>;
}

function InfoCard({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) { return <div className="post-card p-5"><h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">{icon}{title}</h2><div className="mt-3 flex flex-wrap gap-2">{items.map((item) => <Badge key={item} variant="outline">{item}</Badge>)}</div></div>; }
function ListCard({ title, icon, items }: { title: string; icon: React.ReactNode; items: string[] }) { return <div className="post-card p-5"><h2 className="flex items-center gap-2 text-sm font-semibold">{icon}{title}</h2><ul className="mt-3 space-y-2 text-sm text-muted-foreground">{items.map((item) => <li key={item}>· {item}</li>)}</ul></div>; }
function RelatedGroup({ id, title, items, basePath }: { id?: string; title: string; items: Item[]; basePath: string }) { if (!items.length) return null; return <div id={id}><h2 className="mb-4 text-xl font-bold">{title}</h2><div className="grid gap-3 sm:grid-cols-2">{items.map((item) => <Link key={item.id} href={`${basePath}/${item.slug}`} className="post-card group p-4"><div className="flex items-start justify-between gap-2"><Badge variant="secondary" className="text-[10px]">{item.category?.name || title}</Badge><ArrowUpRight className="h-4 w-4 text-muted-foreground" /></div><h3 className="mt-3 font-semibold group-hover:text-primary">{item.title}</h3></Link>)}</div></div>; }
