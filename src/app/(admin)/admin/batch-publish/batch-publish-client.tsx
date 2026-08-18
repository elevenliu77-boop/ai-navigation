"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/ui/common/badge";
import { Button } from "@/ui/common/button";
import { Input } from "@/ui/common/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/common/card";
import { Checkbox } from "@/ui/common/checkbox";
import { motion } from "framer-motion";
import { Eye, Loader2, Send, Undo2 } from "lucide-react";

interface PublishItem {
  ahId: string;
  title: string;
  status: string;
  sourceBatch: number | null;
  importedFromZip: string | null;
  category: { key: string; label: string };
  evidenceInfo: string;
  risks: string[];
  mediaCount: number;
  siteContentId: number | null;
  hasContent: boolean;
}

const categoryOptions = [
  { key: "all", label: "全部栏目" },
  { key: "tools", label: "AI工具" },
  { key: "cases", label: "AI赚钱案例" },
  { key: "workflows", label: "AI工作流" },
  { key: "prompts", label: "提示词" },
  { key: "knowledge", label: "AI知识" },
  { key: "resources", label: "资源" },
  { key: "lab", label: "实验室" },
  { key: "general", label: "综合" },
];

const riskColor: Record<string, string> = {
  "敏感领域": "bg-red-500/10 text-red-600 dark:text-red-400",
  "时效风险": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "时效未知": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "无媒体": "bg-slate-500/10 text-slate-600 dark:text-slate-400",
};

export default function BatchPublishClient() {
  const router = useRouter();
  const [status, setStatus] = useState("READY_TO_PUBLISH");
  const [category, setCategory] = useState("all");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<PublishItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status, category });
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/admin/batch-publish?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.data.items);
        setTotal(data.data.total);
        setSelected(new Set());
      }
    } finally {
      setLoading(false);
    }
  }, [status, category, q]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (ahId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(ahId)) next.delete(ahId);
      else next.add(ahId);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => (prev.size === items.length ? new Set() : new Set(items.map((i) => i.ahId))));
  };

  const batchAction = async (action: "publish" | "revert") => {
    if (!selected.size) return;
    if (!confirm(`确定${action === "publish" ? "发布" : "退回"}选中的 ${selected.size} 条内容？`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/batch-publish/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ahIds: Array.from(selected) }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`${action === "publish" ? "已发布" : "已退回"} ${data.published ?? data.reverted} 条`);
        load();
        router.refresh();
      } else {
        alert("操作失败: " + (data.error || "未知错误"));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">批量发布审核</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            只从 FINAL 中选择；MERGE / REJECT 永远不作为普通文章发布。当前 {total} 条
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="default" size="sm" disabled={busy || !selected.size} onClick={() => batchAction("publish")} className="gap-1">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            批量发布 ({selected.size})
          </Button>
          <Button variant="outline" size="sm" disabled={busy || !selected.size} onClick={() => batchAction("revert")} className="gap-1">
            <Undo2 className="h-4 w-4" />
            退回 DRAFT ({selected.size})
          </Button>
        </div>
      </div>

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="flex items-center gap-1 rounded-lg border border-border/40 p-1">
            {["READY_TO_PUBLISH", "PUBLISHED", "DRAFT"].map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${status === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
              >
                {s === "READY_TO_PUBLISH" ? "待发布" : s === "PUBLISHED" ? "已发布" : "草稿"}
              </button>
            ))}
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-9 rounded-lg border border-border/40 bg-background px-3 text-sm"
          >
            {categoryOptions.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="搜索标题 / AH / 摘要..."
            className="w-64"
          />
          <Button variant="outline" size="sm" onClick={load}>刷新</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>内容列表（{total}）</CardTitle>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={items.length > 0 && selected.size === items.length} onCheckedChange={toggleAll} />
            全选本页
          </label>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">加载中...</div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">暂无内容</div>
          ) : (
            <div className="space-y-2">
              {items.map((item, i) => (
                <motion.div
                  key={item.ahId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.01, 0.3) }}
                  className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${selected.has(item.ahId) ? "border-primary/50 bg-primary/5" : "border-border/30 hover:bg-accent/40"}`}
                >
                  <Checkbox checked={selected.has(item.ahId)} onCheckedChange={() => toggle(item.ahId)} className="mt-1" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{item.ahId}</span>
                      <Badge variant="secondary" className="text-[10px]">{item.category.label}</Badge>
                      {item.evidenceInfo && (
                        <Badge variant="outline" className="text-[10px]">证据: {item.evidenceInfo}</Badge>
                      )}
                      {item.risks.map((r) => (
                        <Badge key={r} className={`border-0 text-[10px] ${riskColor[r] || "bg-slate-500/10 text-slate-600"}`}>{r}</Badge>
                      ))}
                    </div>
                    <h3 className="mt-1.5 font-medium leading-snug">{item.title}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>来源: {item.importedFromZip || "未知"}</span>
                      <span>媒体: {item.mediaCount}</span>
                      <span>正文: {item.hasContent ? "完整" : "待补"}</span>
                      {item.siteContentId && (
                        <a href={`/posts/${item.ahId.toLowerCase()}`} target="_blank" className="inline-flex items-center gap-1 text-primary hover:underline">
                          <Eye className="h-3 w-3" /> 预览
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
