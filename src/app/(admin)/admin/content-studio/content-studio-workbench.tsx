"use client";
/* eslint-disable @typescript-eslint/no-unused-vars, @next/next/no-assign-module-variable, no-var */
 

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FileCheck2, Loader2, Pause, Play, RefreshCw, Send, Upload, XCircle } from "lucide-react";
import { Badge } from "@/ui/common/badge";
import { Button } from "@/ui/common/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/common/card";
import { Input } from "@/ui/common/input";
import { Textarea } from "@/ui/common/textarea";

type Output = { id: number; platform: string; status: string; review_result?: { suggestions?: string[]; factScore?: number; copyrightRisk?: string; violationRisk?: string } | null };
type Asset = { id: number; raw_url: string; source_platform: string; fetched_title?: string | null; status: string; value_score: number; manual_notes?: string | null; source_body_override?: string | null; screenshot_url?: string | null; attachment_url?: string | null; relations?: Array<{ target_type: string; target_id: number; relation_type: string }>; outputs?: Output[] };
type Batch = { id: number; name: string; total_count: number; pending_count: number; processing_count: number; success_count: number; failed_count: number; review_count: number; status: string };

const statuses: Record<string, string> = { NEW: "素材池", FETCHING: "抓取中", FETCH_FAILED: "抓取失败", GENERATING: "生成中", REVIEWING: "审核中", READY_FOR_SITE: "网站待审核", SITE_PUBLISHED: "网站已发布", NEEDS_REVIEW: "人工审核", REJECTED: "已拒绝" };
const platforms: Record<string, string> = { X: "X / Twitter", GITHUB: "GitHub", WEBSITE: "网站", BLOG: "博客", YOUTUBE: "YouTube", OTHER: "其他" };

export default function ContentStudioWorkbench() {
  const [urls, setUrls] = useState("");
  const [batchName, setBatchName] = useState("");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    const response = await fetch(`/api/admin/content-studio${filter === "ALL" ? "" : `?status=${filter}`}`, { cache: "no-store" });
    const json = await response.json();
    if (json.success) { setAssets(json.data); setBatches(json.batches); }
  };
  useEffect(() => { void load(); }, [filter]);
  const counts = useMemo(() => assets.reduce((acc, item) => { acc[item.status] = (acc[item.status] || 0) + 1; return acc; }, {} as Record<string, number>), [assets]);

  const run = async (url: string, body: Record<string, unknown> = {}) => {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || "操作失败");
      setMessage("操作已完成");
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : String(error)); }
    finally { setBusy(false); }
  };
  const importUrls = async () => {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/content-studio/import", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ urls, name: batchName }) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "导入失败");
      setMessage(`已导入 ${json.imported} 条；重复 ${json.duplicates?.length || 0} 条；无效 ${json.invalid?.length || 0} 条`);
      setUrls(""); setBatchName(""); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : String(error)); }
    finally { setBusy(false); }
  };
  const process = (body: Record<string, unknown>) => run("/api/admin/content-studio/process", body);
  const saveNotes = async (asset: Asset) => {
    setBusy(true);
    try { const sourceBody = notes[asset.id] ?? asset.manual_notes ?? ""; await fetch(`/api/admin/content-studio/${asset.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ manualNotes: sourceBody, sourceBody }) }); await load(); setMessage("补充内容已保存，重新生成时会使用该正文"); }
    finally { setBusy(false); }
  };
  const toggleBatch = (batch: Batch) => fetch(`/api/admin/content-studio/batches/${batch.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: batch.status === "PAUSED" ? "OPEN" : "PAUSED" }) }).then(load);
  const websiteOutput = (asset: Asset) => asset.outputs?.find((item) => item.platform === "WEBSITE");

  return <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-bold">内容工作台</h1><p className="mt-1 text-sm text-muted-foreground">批量导入素材，经过抓取、分类、生成和独立审核后，分别进入网站或社媒人工发布流程。</p></div><Button asChild variant="outline"><Link href="/admin/publish-center"><Send className="mr-2 h-4 w-4" />社媒待发布中心</Link></Button></div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5 text-primary" />批量导入 URL</CardTitle></CardHeader><CardContent className="space-y-3"><Input value={batchName} onChange={(event) => setBatchName(event.target.value)} placeholder="批次名称（可选）" /><Textarea value={urls} onChange={(event) => setUrls(event.target.value)} placeholder={"每行一条 URL\nhttps://x.com/...\nhttps://github.com/...\nhttps://example.com/..."} className="min-h-40 font-mono text-sm" /><div className="flex flex-wrap items-center gap-3"><Button onClick={importUrls} disabled={busy || !urls.trim()}><Upload className="mr-2 h-4 w-4" />批量导入</Button><span className="text-xs text-muted-foreground">单条失败不会阻塞同批次其他链接；社媒只生成草稿，不自动发布。</span></div>{message && <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">{message}</div>}</CardContent></Card>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["素材池", counts.NEW || 0], ["处理中", (counts.FETCHING || 0) + (counts.GENERATING || 0) + (counts.REVIEWING || 0)], ["待审核", counts.NEEDS_REVIEW || 0], ["抓取失败", counts.FETCH_FAILED || 0]].map(([label, value]) => <Card key={String(label)}><CardContent className="p-4"><div className="text-sm text-muted-foreground">{label}</div><div className="mt-1 text-2xl font-bold">{value}</div></CardContent></Card>)}</div>
    <Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>处理队列</CardTitle><div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => process({ limit: 5 })} disabled={busy}><Play className="mr-1 h-4 w-4" />处理下一批</Button><Button size="sm" variant="outline" onClick={() => process({ retry: true, limit: 5 })} disabled={busy}><RefreshCw className="mr-1 h-4 w-4" />重试失败/待审核</Button></div></div><div className="flex flex-wrap gap-2 pt-2">{[["ALL", "全部"], ["NEW", "素材池"], ["NEEDS_REVIEW", "人工审核"], ["READY_FOR_SITE", "网站待发布"], ["SITE_PUBLISHED", "网站已发布"], ["FETCH_FAILED", "抓取失败"]].map(([value, label]) => <Button key={value} size="sm" variant={filter === value ? "default" : "outline"} onClick={() => setFilter(value)}>{label}</Button>)}</div></CardHeader><CardContent className="space-y-3">{assets.length === 0 ? <div className="py-12 text-center text-muted-foreground">当前筛选没有素材</div> : assets.map((asset) => { const output = websiteOutput(asset); const review = output?.review_result; return <div key={asset.id} className="rounded-xl border border-border/50 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{platforms[asset.source_platform] || asset.source_platform}</Badge><Badge>{statuses[asset.status] || asset.status}</Badge><Badge variant="secondary">价值 {asset.value_score}</Badge><h3 className="font-medium">{asset.fetched_title || asset.raw_url}</h3></div><a href={asset.raw_url} target="_blank" rel="noreferrer" className="mt-2 block truncate text-xs text-muted-foreground hover:text-primary">{asset.raw_url}</a></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => process({ assetId: asset.id, retry: true })} disabled={busy || ["FETCHING", "GENERATING", "REVIEWING"].includes(asset.status)}><RefreshCw className="mr-1 h-3.5 w-3.5" />处理</Button>{output && ["READY", "SITE_PUBLISHED"].includes(output.status) && asset.status !== "SITE_PUBLISHED" && <Button size="sm" onClick={() => run(`/api/admin/content-studio/${output.id}/publish`)}><FileCheck2 className="mr-1 h-3.5 w-3.5" />发布网站</Button>}{asset.status === "SITE_PUBLISHED" && <Button size="sm" variant="outline" onClick={() => run(`/api/admin/content-studio/${asset.id}/unpublish`)}>取消发布</Button>}{["FETCH_FAILED", "NEEDS_REVIEW", "REJECTED"].includes(asset.status) && <Button size="sm" variant="outline" onClick={() => run(`/api/admin/content-studio/${asset.id}/regenerate`)}>重新生成</Button>}{asset.status !== "REJECTED" && asset.status !== "SITE_PUBLISHED" && <Button size="sm" variant="ghost" onClick={() => run(`/api/admin/content-studio/${asset.id}/reject`)}>拒绝</Button>}</div></div><div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto]"><div><Textarea value={notes[asset.id] ?? asset.manual_notes ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [asset.id]: event.target.value }))} placeholder="补充正文、截图说明、官方来源或人工编辑要求" className="min-h-20 text-sm" /><Button size="sm" variant="outline" className="mt-2" onClick={() => saveNotes(asset)} disabled={busy}>保存补充内容</Button></div><div className="space-y-2 text-xs text-muted-foreground"><div>输出：{asset.outputs?.map((item) => `${item.platform}:${item.status}`).join(" · ") || "尚未生成"}</div>{review && <div>审核：事实 {review.factScore ?? "-"} · 版权 {review.copyrightRisk || "-"} · 违规 {review.violationRisk || "-"}</div>}{review?.suggestions?.length ? <div className="max-w-sm rounded-md bg-muted p-2">建议：{review.suggestions.join("；")}</div> : null}<div>关联：{asset.relations?.length ? asset.relations.map((item) => `${item.target_type}#${item.target_id}`).join(" · ") : "暂无匹配内容"}</div></div></div>{asset.status === "FETCH_FAILED" && <div className="mt-3 flex items-center gap-2 text-xs text-red-600"><XCircle className="h-4 w-4" />抓取失败不会阻塞批次，可补充来源后重新生成。</div>}</div>; })}</CardContent></Card>
    <Card><CardHeader><CardTitle>批次概览</CardTitle></CardHeader><CardContent className="space-y-2">{batches.length ? batches.map((batch) => <div key={batch.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/40 p-3 text-sm"><div><span className="font-medium">{batch.name}</span><span className="ml-2 text-muted-foreground">#{batch.id}</span></div><div className="flex flex-wrap gap-3 text-xs text-muted-foreground"><span>总数 {batch.total_count}</span><span>待处理 {batch.pending_count}</span><span>成功 {batch.success_count}</span><span>失败 {batch.failed_count}</span><span>待审核 {batch.review_count}</span><Badge variant="outline">{batch.status}</Badge></div><Button size="sm" variant="ghost" onClick={() => toggleBatch(batch)}>{batch.status === "PAUSED" ? <Play className="mr-1 h-3.5 w-3.5" /> : <Pause className="mr-1 h-3.5 w-3.5" />}{batch.status === "PAUSED" ? "恢复" : "暂停"}</Button><Button size="sm" variant="outline" onClick={() => process({ batchId: batch.id, limit: 5 })} disabled={busy || batch.status === "PAUSED"}>处理批次</Button></div>) : <div className="text-sm text-muted-foreground">还没有导入批次。</div>}</CardContent></Card>
  </div>;
}
