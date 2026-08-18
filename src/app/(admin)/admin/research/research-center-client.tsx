"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Activity, AlertTriangle, ArrowLeft, CheckCircle2, Clock3, LayoutDashboard, ListTodo, Pause, Play, RefreshCw, RotateCcw, Search } from "lucide-react";
import { Badge } from "@/ui/common/badge";
import { Button } from "@/ui/common/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/common/card";
import { Input } from "@/ui/common/input";

type Task = { id: number; taskCode: string; status: string; priority: string; progress: number; startedAt?: string | null; updatedAt: string; errorMessage?: string | null; asset: { id: number; assetCode: string; sourceUrl: string; sourceType: string; title: string; category: string; score: number; researchStatus: string } };
type Data = { stats: { totalAssets: number; pending: number; researching: number; completed: number; failed: number; todayCompleted: number }; items: Task[]; total: number };
const statuses = ["PENDING", "QUEUED", "RESEARCHING", "FACT_CHECKING", "BUSINESS_ANALYZING", "CONTENT_DECISION", "COMPLETED", "FAILED", "PAUSED"];
const labels: Record<string, string> = { PENDING: "待处理", QUEUED: "已入队", RESEARCHING: "研究中", FACT_CHECKING: "事实验证中", BUSINESS_ANALYZING: "商业分析中", CONTENT_DECISION: "内容去向判断", COMPLETED: "已完成", FAILED: "失败", PAUSED: "暂停" };
const priorities = ["S", "A", "B", "C", "D"];

function date(value?: string | null) { return value ? new Date(value).toLocaleString("zh-CN", { hour12: false }) : "—"; }
function statusVariant(status: string) { return status === "FAILED" ? "destructive" : status === "COMPLETED" ? "default" : "secondary"; }

export default function ResearchCenterClient() {
  const [data, setData] = useState<Data | null>(null);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [sort, setSort] = useState("updated");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const query = new URLSearchParams({ pageSize: "100", ...(status ? { status } : {}), ...(priority ? { priority } : {}), ...(sourceType ? { sourceType } : {}), ...(sort ? { sort } : {}), ...(search ? { search } : {}) });
    const response = await fetch(`/api/admin/research?${query}`, { cache: "no-store" });
    const result = await response.json();
    if (result.success) setData(result.data);
    else setMessage(result.error || "研究数据加载失败");
  }, [priority, search, sort, sourceType, status]);

  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 15000); return () => window.clearInterval(timer); }, [load]);

  const enqueueAll = async () => {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/research/tasks", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ all: true }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "入队失败");
      setMessage(`已创建 ${result.data.created.length} 个研究任务，跳过 ${result.data.skipped} 条已有任务`);
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "入队失败"); }
    finally { setBusy(false); }
  };

  const updateTask = async (task: Task, nextStatus: string, progress?: number) => {
    const response = await fetch(`/api/admin/research/tasks/${task.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: nextStatus, progress }) });
    const result = await response.json();
    if (!response.ok || !result.success) setMessage(result.error || "任务更新失败");
    else await load();
  };

  const stats = data?.stats;
  return <main className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><Link href="/admin" className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="mr-1 h-4 w-4" />返回后台</Link><h1 className="text-2xl font-bold">AI研究中心</h1><p className="mt-1 text-sm text-muted-foreground">统一管理素材研究任务、状态、进度和失败原因。这里不自动生成文章或发布社媒。</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" asChild><Link href="/admin/research/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />进度仪表盘</Link></Button><Button variant="outline" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />刷新</Button><Button onClick={() => void enqueueAll()} disabled={busy}><ListTodo className="mr-2 h-4 w-4" />将未完成素材加入队列</Button></div></div>
    {message && <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">{message}</div>}
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><Stat icon={<ListTodo className="h-5 w-5" />} label="总素材" value={stats?.totalAssets ?? "—"} /><Stat icon={<Clock3 className="h-5 w-5" />} label="待研究" value={stats?.pending ?? "—"} /><Stat icon={<Activity className="h-5 w-5" />} label="研究中" value={stats?.researching ?? "—"} /><Stat icon={<CheckCircle2 className="h-5 w-5" />} label="已完成" value={stats?.completed ?? "—"} /><Stat icon={<AlertTriangle className="h-5 w-5" />} label="失败" value={stats?.failed ?? "—"} /></div>
    <Card><CardHeader><CardTitle>研究任务队列（{data?.total ?? 0}）</CardTitle><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6"><div className="flex gap-2 lg:col-span-2"><Input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void load(); }} placeholder="搜索任务编号、素材编号、标题" /><Button variant="outline" onClick={() => void load()}><Search className="h-4 w-4" /></Button></div><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm"><option value="">全部状态</option>{statuses.map((value) => <option key={value} value={value}>{labels[value]}</option>)}</select><select value={priority} onChange={(event) => setPriority(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm"><option value="">全部优先级</option>{priorities.map((value) => <option key={value}>{value}</option>)}</select><select value={sourceType} onChange={(event) => setSourceType(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm"><option value="">全部来源</option>{["X", "GITHUB", "WEBSITE", "YOUTUBE", "OTHER"].map((value) => <option key={value}>{value}</option>)}</select><select value={sort} onChange={(event) => setSort(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm"><option value="updated">最新更新</option><option value="priority">优先级最高</option><option value="taskCode">任务编号</option></select></div></CardHeader><CardContent>{!data ? <div className="py-12 text-center text-muted-foreground">加载中…</div> : data.items.length === 0 ? <div className="py-12 text-center text-muted-foreground">暂无研究任务，请先将素材加入队列。</div> : <div className="space-y-2">{data.items.map((task) => <div key={task.id} className="grid gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/30 lg:grid-cols-[125px_minmax(0,1fr)_135px_80px_180px_150px]"><div><Link href={`/admin/research/tasks/${task.id}`} className="font-mono text-sm font-semibold text-primary hover:underline">{task.taskCode}</Link><div className="mt-1 text-xs text-muted-foreground">{task.asset.assetCode}</div></div><div className="min-w-0"><Link href={`/admin/research/tasks/${task.id}`} className="font-medium hover:text-primary">{task.asset.title || "未命名素材"}</Link><div className="mt-1 truncate text-xs text-muted-foreground">{task.asset.sourceType} · {task.asset.sourceUrl}</div></div><Badge variant={statusVariant(task.status) as any} className="w-fit">{labels[task.status] || task.status}</Badge><span className="text-sm font-medium">{task.priority}</span><div><div className="mb-1 flex justify-between text-xs"><span>{task.progress}%</span><span className="text-muted-foreground">{date(task.updatedAt)}</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${task.progress}%` }} /></div>{task.errorMessage && <div className="mt-1 truncate text-xs text-destructive">{task.errorMessage}</div>}</div><div className="flex items-center gap-1"><Button size="sm" variant="outline" onClick={() => void updateTask(task, task.status === "PAUSED" ? "QUEUED" : "PAUSED")} disabled={task.status === "COMPLETED"}>{task.status === "PAUSED" ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}</Button>{task.status === "FAILED" && <Button size="sm" variant="outline" onClick={() => void updateTask(task, "QUEUED", 0)}><RotateCcw className="h-4 w-4" /></Button>}<span className="text-xs text-muted-foreground">开始 {date(task.startedAt)}</span></div></div>)}</div>}</CardContent></Card>
  </main>;
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) { return <Card><CardContent className="flex items-center gap-3 p-4"><div className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</div><div><div className="text-xs text-muted-foreground">{label}</div><div className="text-2xl font-semibold">{value}</div></div></CardContent></Card>; }
