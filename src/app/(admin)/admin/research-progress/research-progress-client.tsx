"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3, FileCheck2, RefreshCw, Upload } from "lucide-react";
import { Button } from "@/ui/common/button";
import { Card, CardContent } from "@/ui/common/card";

type Stats = { totalAssets: number; pending: number; completed: number; imported: number; researching: number; failed: number; todayCompleted: number };

export default function ResearchProgressClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const load = useCallback(async () => { const response = await fetch("/api/admin/research?pageSize=1", { cache: "no-store" }); const result = await response.json(); if (result.success) setStats(result.data.stats); }, []);
  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 15000); return () => window.clearInterval(timer); }, [load]);
  const total = stats?.totalAssets || 0;
  const completePercent = total ? Math.round(((stats?.completed || 0) / total) * 100) : 0;
  return <main className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><Link href="/admin/research" className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="mr-1 h-4 w-4" />返回 AI研究中心</Link><h1 className="text-2xl font-bold">AI研究进度</h1><p className="mt-1 text-sm text-muted-foreground">每 15 秒自动刷新，不需要通过聊天记录判断进度。</p></div><div className="flex gap-2"><Button variant="outline" asChild><Link href="/admin/import-research"><Upload className="mr-2 h-4 w-4" />导入研究结果</Link></Button><Button variant="outline" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />刷新</Button></div></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric title="总素材数量" value={stats?.totalAssets} icon={<FileCheck2 className="h-5 w-5" />} /><Metric title="已研究数量" value={stats?.completed} icon={<CheckCircle2 className="h-5 w-5" />} /><Metric title="已导入数量" value={stats?.imported} icon={<Upload className="h-5 w-5" />} /><Metric title="待处理数量" value={stats?.pending} icon={<Clock3 className="h-5 w-5" />} /></div><Card><CardContent className="p-6"><div className="flex items-end justify-between gap-3"><div><div className="text-sm text-muted-foreground">总体研究完成度</div><div className="mt-1 text-4xl font-bold text-primary">{completePercent}%</div></div><div className="text-right text-sm text-muted-foreground">今日完成 {stats?.todayCompleted ?? "—"} 条<br />失败 {stats?.failed ?? "—"} 条</div></div><div className="mt-5 h-4 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completePercent}%` }} /></div><div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground"><span>已研究：{stats?.completed ?? "—"}</span><span>研究中：{stats?.researching ?? "—"}</span><span>待处理：{stats?.pending ?? "—"}</span><span>已导入网站草稿：{stats?.imported ?? "—"}</span></div></CardContent></Card></main>;
}

function Metric({ title, value, icon }: { title: string; value?: number; icon: React.ReactNode }) { return <Card><CardContent className="flex items-center gap-3 p-5"><div className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</div><div><div className="text-sm text-muted-foreground">{title}</div><div className="text-3xl font-bold">{value ?? "—"}</div></div></CardContent></Card>; }
