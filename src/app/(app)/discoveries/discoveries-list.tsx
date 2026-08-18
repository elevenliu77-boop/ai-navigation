import Link from "next/link";
import { ArrowUpRight, CalendarDays, Flame, Search } from "lucide-react";
import { Badge } from "@/ui/common/badge";
import { Button } from "@/ui/common/button";
import { Input } from "@/ui/common/input";

interface Discovery {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  view_count: number;
  updated_at: string;
  tags: { id: number; name: string; slug: string }[];
}

interface Props {
  discoveries: Discovery[];
  total: number;
  page: number;
  pageSize: number;
  query?: string;
  sort: "hot" | "latest";
}

export function DiscoveryList({ discoveries, total, page, pageSize, query, sort }: Props) {
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const buildUrl = (nextPage: number, nextSort = sort) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (nextPage > 1) params.set("page", String(nextPage));
    if (nextSort !== "hot") params.set("sort", nextSort);
    const value = params.toString();
    return value ? `/discoveries?${value}` : "/discoveries";
  };

  return (
    <main className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4">
        <header className="mb-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-primary text-sm font-medium mb-3"><Flame className="h-4 w-4" />每天发现值得关注的 AI 项目</div>
              <h1 className="text-3xl sm:text-4xl font-bold">AI发现</h1>
              <p className="text-muted-foreground mt-2 max-w-2xl">发现值得关注的 AI 工具、GitHub 项目和开源项目，把新技术变成可执行的应用方案。</p>
            </div>
            <div className="flex gap-2">
              <Link href={buildUrl(1, "hot")}><Button variant={sort === "hot" ? "default" : "outline"} size="sm">热门</Button></Link>
              <Link href={buildUrl(1, "latest")}><Button variant={sort === "latest" ? "default" : "outline"} size="sm">最新</Button></Link>
            </div>
          </div>
          <form action="/discoveries" className="mt-6 flex max-w-xl gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input name="q" defaultValue={query} placeholder="搜索项目、工具或关键词" className="pl-9" /></div><Button type="submit">搜索</Button></form>
        </header>

        {discoveries.length === 0 ? <div className="rounded-2xl border border-dashed border-border/50 py-20 text-center text-muted-foreground">暂无匹配的 AI发现内容，先换个关键词试试。</div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">{discoveries.map((item) => <Link key={item.id} href={`/discoveries/${item.slug}`} className="group"><article className="post-card h-full p-5 transition-transform group-hover:-translate-y-1"><div className="flex items-start justify-between gap-3"><h2 className="text-lg font-semibold leading-snug group-hover:text-primary transition-colors">{item.title}</h2><ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" /></div><p className="mt-3 text-sm leading-6 text-muted-foreground line-clamp-3">{item.excerpt || "查看项目介绍、核心功能和实际使用方法。"}</p><div className="mt-5 flex flex-wrap gap-1.5">{item.tags.slice(0, 4).map((tag) => <Badge key={tag.id} variant="outline" className="text-[10px]">#{tag.name}</Badge>)}</div><div className="mt-5 flex items-center justify-between border-t border-border/20 pt-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />更新于 {new Date(item.updated_at).toLocaleDateString("zh-CN")}</span><span>{item.view_count} 热度</span></div></article></Link>)}</div>}

        {totalPages > 1 && <div className="mt-10 flex items-center justify-center gap-3">{page > 1 && <Link href={buildUrl(page - 1)}><Button variant="outline">上一页</Button></Link>}<span className="text-sm text-muted-foreground">第 {page} / {totalPages} 页</span>{page < totalPages && <Link href={buildUrl(page + 1)}><Button variant="outline">下一页</Button></Link>}</div>}
      </div>
    </main>
  );
}
