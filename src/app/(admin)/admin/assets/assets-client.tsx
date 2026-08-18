"use client";
/* eslint-disable @typescript-eslint/no-unused-vars, @next/next/no-assign-module-variable, no-var */
 

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, FileUp, RefreshCw, Search, Upload } from "lucide-react";
import { Badge } from "@/ui/common/badge";
import { Button } from "@/ui/common/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/common/card";
import { Input } from "@/ui/common/input";
import { Textarea } from "@/ui/common/textarea";

type Asset = { id: number; assetCode: string; sourceUrl: string; sourceType: string; title: string; author?: string | null; category: string; status: string; priority: string; score: number; updatedAt: string };
const categories = ["AI工具库", "AI发现", "AI知识库", "AI赚钱案例", "AI工作流", "提示词库", "资源中心", "方法论", "商业机会"];
const statuses = ["NEW", "ANALYZING", "RESEARCHING", "VERIFIED", "CONTENT_READY", "PUBLISHED", "METHOD_LIBRARY", "BUSINESS_OPPORTUNITY", "OBSERVATION", "REJECTED"];
const sourceTypes = ["X", "GITHUB", "WEBSITE", "YOUTUBE", "OTHER"];
const priorities = ["S", "A", "B", "C", "D"];

export default function AssetsClient() {
  const [items, setItems] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [priority, setPriority] = useState("");
  const [sort, setSort] = useState("updated");
  const [urls, setUrls] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const query = new URLSearchParams({ pageSize: "50", ...(search ? { search } : {}), ...(category ? { category } : {}), ...(status ? { status } : {}), ...(sourceType ? { sourceType } : {}), ...(priority ? { priority } : {}), sort });
    const response = await fetch(`/api/admin/assets?${query}`, { cache: "no-store" });
    const result = await response.json();
    if (result.success) { setItems(result.data.items); setTotal(result.data.total); }
  };
  useEffect(() => { void load(); }, [category, status, sourceType, priority, sort]);

  const importText = async () => {
    if (!urls.trim()) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/assets/import", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ urls }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "导入失败");
      setMessage(`已导入 ${result.data.imported} 条，重复 ${result.data.duplicates.length} 条，无效 ${result.data.invalid.length} 条`); setUrls(""); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "导入失败"); }
    finally { setBusy(false); }
  };

  const importCsv = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setBusy(true); setMessage("");
    try {
      const form = new FormData(); form.append("file", file);
      const response = await fetch("/api/admin/assets/import", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "CSV 导入失败");
      setMessage(`CSV 已导入 ${result.data.imported} 条，重复 ${result.data.duplicates.length} 条，无效 ${result.data.invalid.length} 条`); if (fileRef.current) fileRef.current.value = ""; await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "CSV 导入失败"); }
    finally { setBusy(false); }
  };

  return <main className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><Link href="/admin" className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="mr-1 h-4 w-4" />返回后台</Link><h1 className="text-2xl font-bold">AI素材资产库</h1><p className="mt-1 text-sm text-muted-foreground">管理 X 收藏、GitHub 项目、工具链接、教程和商业机会。这里不生成文章，也不自动发布。</p></div><Button variant="outline" onClick={() => load()}><RefreshCw className="mr-2 h-4 w-4" />刷新</Button></div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5 text-primary" />批量导入 URL</CardTitle></CardHeader><CardContent className="space-y-3"><Textarea value={urls} onChange={(event) => setUrls(event.target.value)} placeholder="每行一个 URL，支持 X、GitHub、网站、YouTube" className="min-h-32 font-mono text-sm" /><div className="flex flex-wrap items-center gap-2"><Button onClick={importText} disabled={busy || !urls.trim()}><Upload className="mr-2 h-4 w-4" />导入文本 URL</Button><input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={() => void importCsv()} /><Button variant="outline" onClick={() => fileRef.current?.click()} disabled={busy}><FileUp className="mr-2 h-4 w-4" />导入 CSV</Button><span className="text-xs text-muted-foreground">单次最多 1000 条，重复链接会自动跳过。</span></div>{message && <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">{message}</div>}</CardContent></Card>
    <Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>素材列表（{total}）</CardTitle><div className="flex w-full max-w-sm gap-2"><Input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void load(); }} placeholder="搜索编号、标题、链接、作者" /><Button variant="outline" onClick={() => load()}><Search className="h-4 w-4" /></Button></div></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5"><select value={category} onChange={(event) => setCategory(event.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm"><option value="">全部分类</option>{categories.map((value) => <option key={value}>{value}</option>)}</select><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm"><option value="">全部状态</option>{statuses.map((value) => <option key={value}>{value}</option>)}</select><select value={sourceType} onChange={(event) => setSourceType(event.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm"><option value="">全部来源</option>{sourceTypes.map((value) => <option key={value}>{value}</option>)}</select><select value={priority} onChange={(event) => setPriority(event.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm"><option value="">全部优先级</option>{priorities.map((value) => <option key={value}>{value}</option>)}</select><select value={sort} onChange={(event) => setSort(event.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm"><option value="updated">最近更新</option><option value="score">评分最高</option><option value="assetCode">编号</option></select></div></CardHeader><CardContent>{items.length === 0 ? <div className="py-12 text-center text-muted-foreground">暂无素材</div> : <div className="space-y-2">{items.map((item) => <div key={item.id} className="grid gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/30 lg:grid-cols-[110px_minmax(0,1fr)_120px_120px_80px_100px]"><div className="font-mono text-sm font-semibold text-primary">{item.assetCode}</div><div className="min-w-0"><Link href={`/admin/assets/${item.id}`} className="font-medium hover:text-primary">{item.title || "未命名素材"}</Link><a href={item.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground hover:text-primary">{item.sourceUrl}<ExternalLink className="h-3 w-3 shrink-0" /></a></div><Badge variant="outline" className="w-fit">{item.category}</Badge><Badge variant="secondary" className="w-fit">{item.status}</Badge><span className="text-sm">{item.priority} / {item.score}</span><span className="text-xs text-muted-foreground">{new Date(item.updatedAt).toLocaleDateString("zh-CN")}</span></div>)}</div>}</CardContent></Card>
  </main>;
}
