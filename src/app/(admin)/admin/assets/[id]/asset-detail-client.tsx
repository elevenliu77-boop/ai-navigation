"use client";
/* eslint-disable @typescript-eslint/no-unused-vars, @next/next/no-assign-module-variable, no-var */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Save } from "lucide-react";
import { Badge } from "@/ui/common/badge";
import { Button } from "@/ui/common/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/common/card";
import { Input } from "@/ui/common/input";
import { Textarea } from "@/ui/common/textarea";

type Asset = { id: number; assetCode: string; sourceUrl: string; sourceType: string; title: string; author?: string | null; description?: string | null; category: string; status: string; priority: string; score: number; researchNotes?: string | null; businessAnalysis?: string | null; verificationNotes?: string | null; officialSources?: any; finalDecision?: string | null; contentPackage?: any };
const categories = ["AI工具库", "AI发现", "AI知识库", "AI赚钱案例", "AI工作流", "提示词库", "资源中心", "方法论", "商业机会"];
const statuses = ["NEW", "ANALYZING", "RESEARCHING", "VERIFIED", "CONTENT_READY", "PUBLISHED", "METHOD_LIBRARY", "BUSINESS_OPPORTUNITY", "OBSERVATION", "REJECTED"];
const decisions = ["发布", "观察", "淘汰", "方法库", "商业机会"];

export default function AssetDetailClient({ id }: { id: string }) {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [message, setMessage] = useState("");
  const load = async () => { const response = await fetch(`/api/admin/assets/${id}`, { cache: "no-store" }); const result = await response.json(); if (result.success) { setAsset(result.data); setForm(result.data); } else setMessage(result.error || "加载失败"); };
  useEffect(() => { void load(); }, [id]);
  const set = (key: string, value: unknown) => setForm((current) => ({ ...current, [key]: value }));
  const save = async () => { setMessage(""); const response = await fetch(`/api/admin/assets/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(form) }); const result = await response.json(); setMessage(result.success ? "已保存" : result.error || "保存失败"); if (result.success) setAsset(result.data); };
  if (!asset) return <main className="p-6 text-center text-muted-foreground">{message || "加载中…"}</main>;
  return <main className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6"><Link href="/admin/assets" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="mr-1 h-4 w-4" />返回素材资产库</Link><div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold">{asset.assetCode} · 素材详情</h1><p className="mt-1 text-sm text-muted-foreground">只管理素材资产和研究记录，不生成文章。</p></div><Button onClick={save}><Save className="mr-2 h-4 w-4" />保存修改</Button></div>{message && <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">{message}</div>}
    <Card><CardHeader><CardTitle>来源与基本信息</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex flex-wrap items-center gap-2"><Badge>{asset.sourceType}</Badge><Badge variant="outline">{asset.assetCode}</Badge><a href={asset.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">打开原始链接<ExternalLink className="h-3.5 w-3.5" /></a></div><Input value={form.title || ""} onChange={(event) => set("title", event.target.value)} placeholder="标题" /><Input value={form.author || ""} onChange={(event) => set("author", event.target.value)} placeholder="作者" /><Textarea value={form.description || ""} onChange={(event) => set("description", event.target.value)} placeholder="简介" /></CardContent></Card>
    <Card><CardHeader><CardTitle>分类与处理状态</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2"><select value={form.category || ""} onChange={(event) => set("category", event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">{categories.map((value) => <option key={value}>{value}</option>)}</select><select value={form.status || ""} onChange={(event) => set("status", event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">{statuses.map((value) => <option key={value}>{value}</option>)}</select><select value={form.priority || "C"} onChange={(event) => set("priority", event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm"><option>S</option><option>A</option><option>B</option><option>C</option><option>D</option></select><Input type="number" min="0" max="100" value={form.score ?? 0} onChange={(event) => set("score", event.target.value)} placeholder="价值评分 0-100" /><select value={form.finalDecision || ""} onChange={(event) => set("finalDecision", event.target.value || null)} className="h-10 rounded-md border bg-background px-3 text-sm"><option value="">未决定</option>{decisions.map((value) => <option key={value}>{value}</option>)}</select></CardContent></Card>
    <Card><CardHeader><CardTitle>研究与验证记录</CardTitle></CardHeader><CardContent className="space-y-3"><Textarea value={form.researchNotes || ""} onChange={(event) => set("researchNotes", event.target.value)} placeholder="研究记录" className="min-h-32" /><Textarea value={form.businessAnalysis || ""} onChange={(event) => set("businessAnalysis", event.target.value)} placeholder="商业分析" className="min-h-32" /><Textarea value={form.verificationNotes || ""} onChange={(event) => set("verificationNotes", event.target.value)} placeholder="验证记录" className="min-h-32" /><Textarea value={form.officialSources ? JSON.stringify(form.officialSources, null, 2) : ""} onChange={(event) => { try { set("officialSources", JSON.parse(event.target.value)); } catch { /* 保存前由用户修正 JSON */ } }} placeholder="官方来源 JSON" className="min-h-24 font-mono text-xs" /></CardContent></Card>
    {asset.contentPackage && <Card><CardHeader><CardTitle>ContentPackage 接收状态</CardTitle></CardHeader><CardContent><div className="mb-3 flex flex-wrap gap-2"><Badge variant="secondary">已接收</Badge><Badge variant="outline">不生成</Badge><Badge variant="outline">不发布</Badge></div><pre className="max-h-96 overflow-auto rounded-lg bg-muted p-3 text-xs">{JSON.stringify(asset.contentPackage, null, 2)}</pre></CardContent></Card>}
  </main>;
}
