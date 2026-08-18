"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, FileJson, FileUp, Loader2, XCircle } from "lucide-react";
import { Badge } from "@/ui/common/badge";
import { Button } from "@/ui/common/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/common/card";

type ImportResult = { imported: Array<{ assetCode: string; taskCode: string }>; failed: Array<{ item: unknown; error: string }>; drafts: Array<{ packageId: number; batchId: number; status: string; reused?: boolean }>; draftErrors: Array<{ assetCode: string; error: string }> };

export default function ImportResearchClient() {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  const submit = async () => {
    if (!files.length) return;
    setBusy(true); setMessage(""); setResult(null);
    try {
      const form = new FormData();
      files.forEach((file) => form.append("files", file));
      const response = await fetch("/api/research/import", { method: "POST", body: form });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || "研究结果导入失败");
      setResult(payload.data);
      setMessage(`导入完成：成功 ${payload.data.imported.length} 条，失败 ${payload.data.failed.length} 条，网站待审核草稿 ${payload.data.drafts.length} 条`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "研究结果导入失败"); }
    finally { setBusy(false); }
  };

  return <main className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><Link href="/admin/research" className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="mr-1 h-4 w-4" />返回 AI研究中心</Link><h1 className="text-2xl font-bold">导入 ChatGPT 研究结果</h1><p className="mt-1 text-sm text-muted-foreground">上传 JSON 后自动匹配 Asset 编号、更新研究记录，并将网站稿送入待审核内容包。</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" asChild><Link href="/admin/research-progress">研究进度</Link></Button><Button variant="outline" asChild><Link href="/admin/content-import">内容导入中心</Link></Button></div></div><Card><CardHeader><CardTitle className="flex items-center gap-2"><FileJson className="h-5 w-5 text-primary" />选择 JSON 文件</CardTitle></CardHeader><CardContent className="space-y-4"><div className="rounded-xl border-2 border-dashed border-muted-foreground/25 p-8 text-center"><FileUp className="mx-auto h-9 w-9 text-muted-foreground" /><div className="mt-3 text-sm font-medium">支持单个或多个 JSON 文件</div><div className="mt-1 text-xs text-muted-foreground">支持 JSON 数组、{`{"items": [...]}`} 或单条研究对象；总大小不超过 20MB。</div><input type="file" accept="application/json,.json" multiple onChange={(event) => setFiles(Array.from(event.target.files || []))} className="mx-auto mt-5 block max-w-full text-sm" /></div>{files.length > 0 && <div className="space-y-2">{files.map((file) => <div key={`${file.name}-${file.lastModified}`} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"><span className="truncate">{file.name}</span><span className="ml-3 shrink-0 text-xs text-muted-foreground">{Math.ceil(file.size / 1024)} KB</span></div>)}</div>}<Button onClick={() => void submit()} disabled={busy || !files.length}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}上传并导入</Button>{message && <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">{message}</div>}</CardContent></Card>{result && <div className="grid gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><CheckCircle2 className="h-5 w-5 text-emerald-600" />成功导入</CardTitle></CardHeader><CardContent className="space-y-2">{result.imported.length ? result.imported.map((item) => <div key={item.assetCode} className="flex items-center justify-between rounded-lg border p-3 text-sm"><span className="font-mono text-primary">{item.assetCode}</span><span className="text-muted-foreground">{item.taskCode}</span></div>) : <div className="py-6 text-center text-sm text-muted-foreground">没有成功匹配的素材</div>}</CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><XCircle className="h-5 w-5 text-destructive" />需要处理</CardTitle></CardHeader><CardContent className="space-y-2">{[...result.failed.map((item) => ({ key: JSON.stringify(item.item), label: "研究结果", error: item.error })), ...result.draftErrors.map((item) => ({ key: item.assetCode, label: item.assetCode, error: item.error }))].map((item) => <div key={item.key} className="rounded-lg border border-destructive/20 p-3 text-sm"><div className="font-medium">{item.label}</div><div className="mt-1 text-xs text-destructive">{item.error}</div></div>)}{!result.failed.length && !result.draftErrors.length && <div className="py-6 text-center text-sm text-muted-foreground">没有失败项</div>}</CardContent></Card></div>}{result?.drafts.length ? <Card><CardHeader><CardTitle>网站待审核草稿</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex flex-wrap gap-2">{result.drafts.map((draft) => <Badge key={draft.packageId} variant="secondary">内容包 #{draft.packageId} · {draft.status}</Badge>)}</div><Button asChild><Link href="/admin/content-import">进入内容导入中心审核</Link></Button></CardContent></Card> : null}</main>;
}
