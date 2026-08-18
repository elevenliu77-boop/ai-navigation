import Link from "next/link";
import { Search, ArrowUpRight, Sparkles } from "lucide-react";
import { Badge } from "@/ui/common/badge";
import { Button } from "@/ui/common/button";
import { unifiedSearch, searchTypes, type SearchType } from "@/lib/services/unified-search";

export const dynamic = "force-dynamic";

interface Props { searchParams: Promise<{ q?: string; type?: string }> }

const filters: { value: SearchType; label: string }[] = [
  { value: "all", label: "全部" }, { value: "tools", label: "工具" }, { value: "discoveries", label: "发现" }, { value: "posts", label: "知识" }, { value: "cases", label: "案例" }, { value: "workflows", label: "工作流" }, { value: "prompts", label: "提示词" }, { value: "resources", label: "资源" },
];

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  const q = params.q?.trim();
  return { title: q ? `搜索“${q}”` : "全站搜索", description: "跨 AI工具、AI发现、AI知识库、AI赚钱案例、AI工作流和提示词库搜索。", keywords: ["AI搜索", "AI工具", "AI案例", "提示词库"], openGraph: { title: q ? `搜索“${q}”` : "全站搜索", description: "跨类型搜索 alphahole 的 AI 实用内容。" } };
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const type = searchTypes.includes(params.type as SearchType) ? (params.type as SearchType) : "all";
  const results = await unifiedSearch(q, type);

  return <main className="min-h-screen py-10 sm:py-14"><div className="mx-auto max-w-6xl px-4"><div className="mx-auto max-w-3xl"><div className="mb-8"><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"><Sparkles className="h-3.5 w-3.5" />跨类型搜索</div><h1 className="text-3xl font-bold sm:text-4xl">{q ? `搜索“${q}”` : "找到下一步要做的事"}</h1><p className="mt-2 text-muted-foreground">一次搜索，连接工具、发现、教程、工作流、案例和提示词。</p></div><form className="flex gap-2 rounded-2xl border border-border/60 bg-card p-2 shadow-sm"><Search className="ml-2 mt-2.5 h-5 w-5 shrink-0 text-muted-foreground" /><input name="q" defaultValue={q} placeholder="例如：赚钱、n8n、写小红书..." className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm outline-none" /><input type="hidden" name="type" value={type} /><Button type="submit" className="rounded-xl">搜索</Button></form></div><div className="mt-8 flex flex-wrap gap-2">{filters.map((filter) => <Link key={filter.value} href={`/search?${new URLSearchParams({ ...(q ? { q } : {}), ...(filter.value !== "all" ? { type: filter.value } : {}) })}`}><Badge variant={type === filter.value ? "default" : "outline"} className="cursor-pointer px-3 py-1.5 text-sm">{filter.label}</Badge></Link>)}</div>{q && <div className="mt-8 flex items-center justify-between"><p className="text-sm text-muted-foreground">找到 {results.length} 条相关内容</p><Link href="/assistant" className="text-sm text-primary hover:underline">不知道怎么选？让 AI助手帮你规划</Link></div>}{!q ? <div className="py-24 text-center text-muted-foreground"><Search className="mx-auto h-12 w-12 opacity-30" /><p className="mt-4">输入关键词，开始探索 alphahole 的内容闭环。</p></div> : !results.length ? <div className="py-24 text-center text-muted-foreground"><p>没有找到匹配内容</p><p className="mt-2 text-sm">试试“赚钱”“自动化”“小红书”或“Cursor”。</p></div> : <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{results.map((item) => <Link key={`${item.type}-${item.id}`} href={item.href} className="group"><div className="post-card h-full p-5"><div className="flex items-center justify-between gap-2"><Badge variant="secondary" className="text-[10px]">[{item.typeLabel}]</Badge><ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" /></div><h2 className="mt-4 line-clamp-2 font-semibold group-hover:text-primary">{item.title}</h2><p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{item.description}</p><div className="mt-4 flex items-center justify-between gap-2 border-t border-border/30 pt-3 text-[10px] text-muted-foreground"><span className="truncate">{item.category || item.typeLabel}</span><span className="shrink-0">{item.meta}</span></div></div></Link>)}</div>}</div></main>;
}
