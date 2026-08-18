"use client";
/* eslint-disable @typescript-eslint/no-unused-vars, @next/next/no-assign-module-variable, no-var */
 

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, FileJson, Pause, Play, RefreshCw, Send, Upload, XCircle } from "lucide-react";
import { Badge } from "@/ui/common/badge";
import { Button } from "@/ui/common/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/common/card";
import { Textarea } from "@/ui/common/textarea";

type Item = { id: number; batch_id: number; package_id: string; raw_json: string; status: string; source: { original_url: string; source_type: string }; website: { title: string; seo_title?: string; seo_description?: string }; classification: { primary_type: string; tags: string[]; category: string }; editorial_review: { final_status: string }; technical_review?: { facts?: string[]; failures?: string[] } | null; error_message?: string | null; outputs?: Array<{ platform: string; status: string }> };
type Batch = { id: number; name: string; total_count: number; pending_count: number; tech_review_count: number; failed_count: number; imported_count: number; published_count: number; status: string };

const labels: Record<string, string> = { TOOL: "AI工具库", DISCOVERY: "AI发现", KNOWLEDGE: "AI知识库", CASE: "AI赚钱案例", WORKFLOW: "AI工作流", PROMPT: "提示词库", RESOURCE: "资源中心" };
const statuses: Record<string, string> = { PREVIEW: "待确认", CONFIRMED: "待技术核验", TECH_REVIEWING: "核验中", TECH_REVIEWED: "可导入", READY_TO_PUBLISH: "可发布", TECH_REVIEW_FAILED: "核验失败", SOURCE_UNAVAILABLE: "来源不可用", READY_TO_IMPORT: "待再次确认", UPDATE_EXISTING: "已有内容", SITE_PUBLISHED: "网站已发布", REJECTED: "已拒绝" };

export default function ContentImportClient() {
  const [json, setJson] = useState("");
  const [fileCount, setFileCount] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingJson, setEditingJson] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const response = await fetch("/api/admin/content-import", { cache: "no-store" });
    const result = await response.json();
    if (result.success) { setItems(result.data.packages); setBatches(result.data.batches); setSelectedBatchId((current) => current ?? result.data.batches[0]?.id ?? null); }
  };
  useEffect(() => { void load(); }, []);

  const request = async (url: string, body: unknown) => {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "操作失败");
      setMessage("操作完成"); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "操作失败"); }
    finally { setBusy(false); }
  };

  const previewText = async () => {
    setBusy(true); setMessage("");
    try {
      let response: Response;
      if (fileRef.current?.files?.length) {
        const form = new FormData();
        Array.from(fileRef.current.files).forEach((file) => form.append("files", file));
        response = await fetch("/api/admin/content-import/preview", { method: "POST", body: form });
      } else {
        if (!json.trim()) throw new Error("请粘贴 JSON 或选择 JSON 文件");
        response = await fetch("/api/admin/content-import/preview", { method: "POST", headers: { "content-type": "application/json" }, body: json });
      }
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || result.issues?.map((item: { message: string }) => item.message).join("；") || "内容包校验失败");
      setMessage(`已建立预览批次 #${result.data.batch_id}，共 ${result.data.count} 条`); setJson(""); setFileCount(0); if (fileRef.current) fileRef.current.value = ""; await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "预览失败"); }
    finally { setBusy(false); }
  };

  const saveEdit = async (id: number) => {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/admin/content-import/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ raw_json: editingJson }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "保存失败");
      setEditingId(null); setEditingJson(""); setMessage("内容包已保存并回到待确认状态"); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "保存失败"); }
    finally { setBusy(false); }
  };

  const currentBatch = batches.find((batch) => batch.id === selectedBatchId) || batches[0];
  const visibleItems = currentBatch ? items.filter((item) => item.batch_id === currentBatch.id) : items;
  return <main className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><Link href="/admin" className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="mr-1 h-4 w-4" />返回后台</Link><h1 className="text-2xl font-bold">ChatGPT 内容包导入中心</h1><p className="mt-1 max-w-3xl text-sm text-muted-foreground">ChatGPT 负责研究与编辑，Codex 负责 Schema 校验、技术核验、去重、入库、关联和渲染。社媒内容只生成待发布成品，不自动登录或发布。</p></div><Button asChild variant="outline"><Link href="/admin/publish-center"><Send className="mr-2 h-4 w-4" />社媒待发布中心</Link></Button></div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><FileJson className="h-5 w-5 text-primary" />粘贴或上传内容包 JSON</CardTitle></CardHeader><CardContent className="space-y-3"><Textarea value={json} onChange={(event) => setJson(event.target.value)} placeholder={'单个 JSON 或 {"packages":[...]}，也支持一次上传多个 .json 文件'} className="min-h-52 font-mono text-xs" /><div className="flex flex-wrap items-center gap-2"><input ref={fileRef} type="file" accept="application/json,.json" multiple className="hidden" onChange={(event) => setFileCount(event.target.files?.length || 0)} /><Button variant="outline" onClick={() => fileRef.current?.click()}><Upload className="mr-2 h-4 w-4" />选择 JSON 文件{fileCount ? `（${fileCount}）` : ""}</Button><Button onClick={previewText} disabled={busy}><CheckCircle2 className="mr-2 h-4 w-4" />校验并建立预览</Button></div>{message && <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">{message}</div>}</CardContent></Card>
    {currentBatch && <Card><CardHeader><CardTitle className="flex flex-wrap items-center justify-between gap-2"><span>批次 #{currentBatch.id}</span><div className="flex flex-wrap gap-2"><select value={currentBatch.id} onChange={(event) => setSelectedBatchId(Number(event.target.value))} className="h-9 rounded-md border bg-background px-2 text-sm">{batches.map((batch) => <option key={batch.id} value={batch.id}>#{batch.id} · {batch.name}</option>)}</select><Badge variant="outline">{currentBatch.status}</Badge><Button size="sm" variant="outline" onClick={() => request(`/api/admin/content-import/batches/${currentBatch.id}`, { status: currentBatch.status === "PAUSED" ? "OPEN" : "PAUSED" })}>{currentBatch.status === "PAUSED" ? <Play className="mr-1 h-3.5 w-3.5" /> : <Pause className="mr-1 h-3.5 w-3.5" />}{currentBatch.status === "PAUSED" ? "恢复" : "暂停"}</Button></div></CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5"><div>总数<strong className="ml-2 text-xl">{currentBatch.total_count}</strong></div><div>待处理<strong className="ml-2 text-xl">{currentBatch.pending_count}</strong></div><div>核验<strong className="ml-2 text-xl">{currentBatch.tech_review_count}</strong></div><div>失败<strong className="ml-2 text-xl">{currentBatch.failed_count}</strong></div><div>已发布<strong className="ml-2 text-xl">{currentBatch.published_count}</strong></div></CardContent></Card>}
    <Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>内容包队列（{visibleItems.length}）</CardTitle><div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => request("/api/admin/content-import/confirm", { batchId: currentBatch?.id })} disabled={busy || !currentBatch}><CheckCircle2 className="mr-1 h-4 w-4" />确认预览</Button><Button size="sm" variant="outline" onClick={() => request("/api/admin/content-import/review", { batchId: currentBatch?.id, limit: 20 })} disabled={busy || !currentBatch}><RefreshCw className="mr-1 h-4 w-4" />技术核验</Button><Button size="sm" variant="outline" onClick={() => request("/api/admin/content-import/import", { batchId: currentBatch?.id, limit: 20 })} disabled={busy || !currentBatch}><Upload className="mr-1 h-4 w-4" />导入网站</Button></div></div></CardHeader><CardContent className="space-y-3">{visibleItems.length === 0 ? <div className="py-12 text-center text-muted-foreground">还没有内容包</div> : visibleItems.map((item) => <div key={item.id} className="rounded-xl border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{labels[item.classification.primary_type] || item.classification.primary_type}</Badge><Badge>{statuses[item.status] || item.status}</Badge><Badge variant="secondary">{item.editorial_review.final_status}</Badge><h2 className="font-medium">{item.website.title}</h2></div><a className="mt-1 block truncate text-xs text-muted-foreground hover:text-primary" href={item.source.original_url} target="_blank" rel="noreferrer">{item.source.original_url}</a></div><div className="flex gap-2">{["TECH_REVIEWED", "READY_TO_PUBLISH", "READY_TO_IMPORT"].includes(item.status) && <Button size="sm" onClick={() => request("/api/admin/content-import/import", { packageIds: [item.id], force: item.status === "READY_TO_IMPORT" })} disabled={busy}>导入网站</Button>}{!["SITE_PUBLISHED", "REJECTED"].includes(item.status) && <Button size="sm" variant="ghost" onClick={() => request(`/api/admin/content-import/${item.id}/reject`, { reason: "人工拒绝" })} disabled={busy}><XCircle className="mr-1 h-4 w-4" />拒绝</Button>}</div></div><div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2"><div>标签：{item.classification.tags?.join("、") || "无"}</div><div>分类：{item.classification.category}</div><div>SEO：{item.website.seo_title || "未提供"}</div><div>社媒：{item.outputs?.map((output) => `${output.platform}:${output.status}`).join("、") || "未入库"}</div></div>{item.error_message && <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">{item.error_message}</div>}</div>)}</CardContent></Card>
  </main>;
}
