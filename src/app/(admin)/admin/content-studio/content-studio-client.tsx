"use client";
/* eslint-disable @typescript-eslint/no-unused-vars, @next/next/no-assign-module-variable, no-var */
 

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, FileCheck2, Loader2, Play, RefreshCw, Send, Upload, XCircle } from "lucide-react";
import { Badge } from "@/ui/common/badge";
import { Button } from "@/ui/common/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/common/card";
import { Textarea } from "@/ui/common/textarea";
import { Input } from "@/ui/common/input";

type Asset = { id: number; raw_url: string; source_platform: string; fetched_title?: string | null; status: string; value_score: number; created_at: string; updated_at: string; outputs?: Array<{ id: number; platform: string; status: string }> };
type Batch = { id: number; name: string; total_count: number; pending_count: number; processing_count: number; success_count: number; failed_count: number; review_count: number; status: string };

const statusLabels: Record<string, string> = { NEW: "素材池", FETCHING: "抓取中", FETCH_FAILED: "抓取失败", CLASSIFIED: "已分类", VERIFYING: "核验中", GENERATING: "生成中", REVIEWING: "审核中", READY_FOR_SITE: "网站待发布", SITE_PUBLISHED: "网站已发布", NEEDS_REVIEW: "人工审核", SOCIAL_READY: "社媒待发布", REJECTED: "已拒绝" };
const platformLabels: Record<string, string> = { X: "X / Twitter", GITHUB: "GitHub", WEBSITE: "网站", BLOG: "博客", YOUTUBE: "YouTube", OTHER: "其他" };

export default function ContentStudioClient() {
  const [urls, setUrls] = useState("");
  const [batchName, setBatchName] = useState("");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    const res = await fetch(`/api/admin/content-studio${filter === "ALL" ? "" : `?status=${filter}`}`);
    const json = await res.json();
    if (json.success) { setAssets(json.data); setBatches(json.batches); }
  };
  useEffect(() => { load(); }, [filter]);

  const counts = useMemo(() => assets.reduce((acc, item) => { acc[item.status] = (acc[item.status] || 0) + 1; return acc; }, {} as Record<string, number>), [assets]);
  const importUrls = async () => {
    setLoading(true); setMessage("");
    try {
      const res = await fetch("/api/admin/content-studio/import", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ urls, name: batchName }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "导入失败");
      setMessage(`已导入 ${json.imported} 条；重复 ${json.duplicates?.length || 0} 条；无效 ${json.invalid?.length || 0} 条`);
      setUrls(""); setBatchName(""); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : String(error)); } finally { setLoading(false); }
  };
  const process = async (payload: Record<string, unknown>) => {
    setLoading(true); setMessage("");
    try { const res = await fetch("/api/admin/content-studio/process", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }); const json = await res.json(); if (!res.ok) throw new Error(json.error || "处理失败"); setMessage(`本次处理完成 ${json.processed} 条，失败素材会单独保留，不影响其他任务`); await load(); } catch (error) { setMessage(error instanceof Error ? error.message : String(error)); } finally { setLoading(false); }
  };
  const publish = async (outputId: number) => {
    setLoading(true);
    try { const res = await fetch(`/api/admin/content-studio/${outputId}/publish`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }); const json = await res.json(); setMessage(json.success ? `网站内容已发布，Post ID: ${json.postId}` : json.error); await load(); } finally { setLoading(false); }
  };
  const assetAction = async (assetId: number, action: "reject" | "regenerate" | "unpublish") => { setLoading(true); try { const res = await fetch(`/api/admin/content-studio/${assetId}/${action}`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }); const json = await res.json(); setMessage(json.success ? `${action} 已完成` : json.error); await load(); } finally { setLoading(false); } };
  const toggleBatch = async (batch: Batch) => { await fetch(`/api/admin/content-studio/batches/${batch.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: batch.status === "PAUSED" ? "OPEN" : "PAUSED" }) }); await load(); };

  return <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-bold">内容工作台</h1><p className="mt-1 text-sm text-muted-foreground">批量导入公开链接，经过抓取、分类、生成和独立审核，再进入网站或社媒待发布。</p></div><Button asChild variant="outline"><Link href="/admin/publish-center"><Send className="mr-2 h-4 w-4" />社媒待发布中心</Link></Button></div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5 text-primary" />批量导入 URL</CardTitle></CardHeader><CardContent className="space-y-3"><Input value={batchName} onChange={(event) => setBatchName(event.target.value)} placeholder="批次名称（可选，例如：2026-08 X 收藏回填）" /><Textarea value={urls} onChange={(event) => setUrls(event.target.value)} placeholder={'每行一条 URL\nhttps://x.com/...\nhttps://github.com/...\nhttps://example.com/...'} className="min-h-40 font-mono text-sm" /><div className="flex flex-wrap items-center gap-3"><Button onClick={importUrls} disabled={loading || !urls.trim()}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}批量导入</Button><span className="text-xs text-muted-foreground">支持 X / GitHub / 普通网站 / 博客；YouTube 已预留。</span></div>{message && <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">{message}</div>}</CardContent></Card>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["素材池", counts.NEW || 0], ["处理中", (counts.FETCHING || 0) + (counts.GENERATING || 0) + (counts.REVIEWING || 0)], ["待审核", counts.NEEDS_REVIEW || 0], ["抓取失败", counts.FETCH_FAILED || 0]].map(([label, value]) => <Card key={String(label)}><CardContent className="p-4"><div className="text-sm text-muted-foreground">{label}</div><div className="mt-1 text-2xl font-bold">{value}</div></CardContent></Card>)}</div>
    <Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>处理队列</CardTitle><div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => process({ limit: 5 })} disabled={loading}><Play className="mr-1 h-4 w-4" />处理下一批</Button><Button size="sm" variant="outline" onClick={() => process({ retry: true, limit: 5 })} disabled={loading}><RefreshCw className="mr-1 h-4 w-4" />重试失败/待审核</Button></div></div><div className="flex flex-wrap gap-2 pt-2">{[["ALL", "全部"], ["NEW", "素材池"], ["NEEDS_REVIEW", "人工审核"], ["READY_FOR_SITE", "网站待发布"], ["SITE_PUBLISHED", "网站已发布"], ["FETCH_FAILED", "抓取失败"]].map(([value, label]) => <Button key={value} size="sm" variant={filter === value ? "default" : "outline"} onClick={() => setFilter(value)}>{label}</Button>)}</div></CardHeader><CardContent className="space-y-3">{assets.length === 0 ? <div className="py-12 text-center text-muted-foreground">当前筛选没有素材</div> : assets.map((asset) => <div key={asset.id} className="rounded-xl border border-border/50 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{platformLabels[asset.source_platform] || asset.source_platform}</Badge><Badge>{statusLabels[asset.status] || asset.status}</Badge><Badge variant="secondary">价值 {asset.value_score}</Badge><h3 className="font-medium">{asset.fetched_title || asset.raw_url}</h3></div><a href={asset.raw_url} target="_blank" rel="noreferrer" className="mt-2 block truncate text-xs text-muted-foreground hover:text-primary">{asset.raw_url}</a></div><div className="flex shrink-0 gap-2"><Button size="sm" variant="outline" onClick={() => process({ assetId: asset.id, retry: true })} disabled={loading || ["FETCHING", "GENERATING", "REVIEWING"].includes(asset.status)}><RefreshCw className="mr-1 h-3.5 w-3.5" />处理</Button>{asset.outputs?.find((item) => item.platform === "WEBSITE" && ["READY", "SITE_PUBLISHED"].includes(item.status)) && asset.status !== "SITE_PUBLISHED" && <Button size="sm" onClick={() => publish(asset.outputs!.find((item) => item.platform === "WEBSITE")!.id)}><FileCheck2 className="mr-1 h-3.5 w-3.5" />发布网站</Button>}</div></div><div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">{asset.outputs?.map((output) => <span key={output.id} className="rounded-md bg-muted px-2 py-1">{output.platform === "WEBSITE" ? "网站" : output.platform === "XIAOHONGSHU" ? "小红书" : output.platform === "WECHAT" ? "公众号" : "头条"}：{output.status}</span>)}</div>{asset.status === "FETCH_FAILED" && <div className="mt-3 flex items-center gap-2 text-xs text-red-600"><XCircle className="h-4 w-4" />抓取失败不会阻塞同批次其他 URL，可补充正文/截图后重试。</div>}</div>)}</CardContent></Card>
    <Card><CardHeader><CardTitle>批次概览</CardTitle></CardHeader><CardContent className="space-y-2">{batches.length ? batches.map((batch) => <div key={batch.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/40 p-3 text-sm"><div><span className="font-medium">{batch.name}</span><span className="ml-2 text-muted-foreground">#{batch.id}</span></div><div className="flex flex-wrap gap-3 text-xs text-muted-foreground"><span>总数 {batch.total_count}</span><span>待处理 {batch.pending_count}</span><span>成功 {batch.success_count}</span><span>失败 {batch.failed_count}</span><span>待审核 {batch.review_count}</span><Badge variant="outline">{batch.status}</Badge></div><Button size="sm" variant="ghost" onClick={() => process({ batchId: batch.id, limit: 5 })}><Play className="mr-1 h-3.5 w-3.5" />处理批次</Button></div>) : <div className="text-sm text-muted-foreground">还没有导入批次。</div>}</CardContent></Card>
  </div>;
}
