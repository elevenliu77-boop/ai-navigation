"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, ExternalLink, Eye, Clock } from "lucide-react";
import { Button } from "@/ui/common/button";
import { Badge } from "@/ui/common/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/common/card";
import { motion } from "framer-motion";

export interface AdminItem {
  id: number;
  title: string;
  slug: string;
  status: string;
  view_count?: number;
  copy_count?: number;
  downloads?: number;
  published_at?: string | null;
  created_at?: string;
  category?: { id: number; name: string; slug: string } | null;
}

interface AdminItemsClientProps {
  items: AdminItem[];
  total: number;
  title: string;
  subtitle: string;
  createHref: string;
  editBase: string;
  detailPrefix: string;
  deleteApi: string;
  createLabel: string;
  extraStatLabel?: string;
  extraStatKey?: "copy_count" | "downloads";
}

export function AdminItemsClient({
  items,
  total,
  title,
  subtitle,
  createHref,
  editBase,
  detailPrefix,
  deleteApi,
  createLabel,
  extraStatLabel,
  extraStatKey,
}: AdminItemsClientProps) {
  const [list, setList] = useState(items);
  const router = useRouter();

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除这条内容？此操作不可撤销。")) return;
    try {
      const res = await fetch(`${deleteApi}/${id}`, { method: "DELETE" });
      if (res.ok) {
        setList((prev) => prev.filter((p) => p.id !== id));
        router.refresh();
      }
    } catch (e) {
      console.error("Delete failed:", e);
    }
  };

  const statusColors: Record<string, string> = {
    draft: "bg-yellow-500/10 text-yellow-600",
    published: "bg-green-500/10 text-green-600",
    archived: "bg-gray-500/10 text-gray-600",
    hidden: "bg-gray-500/10 text-gray-600",
  };

  const statusText: Record<string, string> = {
    draft: "草稿",
    published: "已发布",
    archived: "归档",
    hidden: "隐藏",
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {subtitle} · 共 {total} 条
          </p>
        </div>
        <Button asChild>
          <a href={createHref}>
            <Plus className="w-4 h-4 mr-1" /> {createLabel}
          </a>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{title}列表</CardTitle>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">暂无内容</div>
          ) : (
            <div className="space-y-2">
              {list.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/30 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={statusColors[item.status] || ""}
                      >
                        {statusText[item.status] || item.status}
                      </Badge>
                      {item.category && (
                        <Badge variant="outline" className="text-[10px]">
                          {item.category.name}
                        </Badge>
                      )}
                      <h3 className="font-medium truncate">{item.title}</h3>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {item.view_count ?? 0}
                      </span>
                      {extraStatKey && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item[extraStatKey] ?? 0} {extraStatLabel}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.published_at
                          ? new Date(item.published_at).toLocaleDateString("zh-CN")
                          : item.created_at
                          ? new Date(item.created_at).toLocaleDateString("zh-CN")
                          : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`${detailPrefix}/${item.slug}`} target="_blank">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`${editBase}/${item.id}/edit`}>
                        <Edit className="w-4 h-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
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
