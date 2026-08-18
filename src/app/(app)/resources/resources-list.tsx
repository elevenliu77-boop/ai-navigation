"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import { Download, FileText, Film, FileCode2, Package, ChevronLeft, ChevronRight, Crown } from "lucide-react";
import { Badge } from "@/ui/common/badge";
import { Button } from "@/ui/common/button";
import { toast } from "sonner";
import type { Resource, Category } from "@/lib/types";

interface ResourcesListProps {
  resources: Resource[];
  total: number;
  page: number;
  pageSize: number;
  categories: Category[];
  currentCategory?: string;
}

const typeIcons: Record<string, React.ElementType> = {
  pdf: FileText,
  template: FileCode2,
  video: Film,
  file: Package,
};

const typeText: Record<string, string> = {
  pdf: "PDF",
  template: "模板",
  video: "视频",
  file: "资料",
  prompt_bundle: "提示词合集",
  workflow_template: "工作流模板",
  report: "行业报告",
};

export default function ResourcesList({
  resources,
  total,
  page,
  pageSize,
  categories,
  currentCategory,
}: ResourcesListProps) {
  const totalPages = Math.ceil(total / pageSize);
  const [downloading, setDownloading] = useState<number | null>(null);

  const handleDownload = async (r: Resource) => {
    setDownloading(r.id);
    try {
      await fetch(`/api/resources/${r.id}/download`, { method: "POST" });
      toast.success(`正在打开「${r.title}」`);
      window.open(r.url, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-10">
          <h1 className="text-3xl font-bold">资源中心</h1>
          <p className="text-muted-foreground mt-1">
            AI 资料、模板与工具合集 · 共 {total} 个
          </p>
          <Link href="/membership" className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline">
            查看会员权益，了解高级资源 <Crown className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => (window.location.href = "/resources")}
          >
            <Badge
              variant={!currentCategory ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm"
            >
              全部
            </Badge>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => (window.location.href = `/resources?category=${cat.slug}`)}
            >
              <Badge
                variant={currentCategory === cat.slug ? "default" : "outline"}
                className="cursor-pointer px-3 py-1.5 text-sm"
              >
                {cat.name}
              </Badge>
            </button>
          ))}
        </div>

        {resources.length === 0 ? (
          <div className="text-center py-20">
            <Download className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">暂无资料</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((r, i) => {
              const Icon = typeIcons[r.type] || Package;
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
                  className="group h-full"
                >
                  <div className="post-card h-full p-5 flex flex-col justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                          <Icon className="w-4 h-4" />
                        </span>
                        <Badge variant="secondary" className="text-[10px] px-2 py-0">
                          {typeText[r.type] || r.type}
                        </Badge>
                        {r.category && (
                          <Badge variant="outline" className="text-[10px] px-2 py-0">
                            {r.category.name}
                          </Badge>
                        )}
                        {r.permission?.toUpperCase() === "VIP" && (
                          <Badge className="gap-1 bg-amber-500 text-[10px] text-white hover:bg-amber-500">
                            <Crown className="h-3 w-3" /> VIP
                          </Badge>
                        )}
                      </div>
                      <h2 className="font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {r.title}
                      </h2>
                      {r.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {r.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/20">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        {r.downloads} 次下载
                      </span>
                      {r.permission?.toUpperCase() === "VIP" ? (
                        <Button asChild size="sm" variant="outline" className="gap-1">
                          <Link href="/membership">
                            <Crown className="h-3.5 w-3.5" /> 解锁资源
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleDownload(r)}
                          disabled={downloading === r.id}
                        >
                          {downloading === r.id ? "打开中..." : "获取资料"}
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            {page > 1 && (
              <button
                onClick={() => (window.location.href = `/resources?page=${page - 1}${currentCategory ? `&category=${currentCategory}` : ""}`)}
              >
                <Button variant="outline" size="sm">
                  <ChevronLeft className="w-4 h-4 mr-1" /> 上一页
                </Button>
              </button>
            )}
            <span className="text-sm text-muted-foreground px-4">
              第 {page} / {totalPages} 页
            </span>
            {page < totalPages && (
              <button
                onClick={() => (window.location.href = `/resources?page=${page + 1}${currentCategory ? `&category=${currentCategory}` : ""}`)}
              >
                <Button variant="outline" size="sm">
                  下一页 <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
