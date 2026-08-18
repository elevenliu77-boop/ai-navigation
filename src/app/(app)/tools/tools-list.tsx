"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Globe, Heart, ChevronLeft, ChevronRight, Users, Target } from "lucide-react";
import { Badge } from "@/ui/common/badge";
import { Button } from "@/ui/common/button";
import { toast } from "sonner";
import { ToolLogo } from "@/components/website/tool-logo";
import type { Website, Category } from "@/lib/types";

interface ToolsListProps {
  websites: Website[];
  total: number;
  page: number;
  pageSize: number;
  categories: Category[];
  currentCategory?: string;
  searchQuery?: string;
}

function getToolContext(categoryName?: string, metadata?: { audience?: string[]; scenarios?: string[] }) {
  if (metadata?.audience?.length || metadata?.scenarios?.length) {
    return {
      audience: metadata.audience?.length ? metadata.audience : ["普通用户", "创业者"],
      scenarios: metadata.scenarios?.length ? metadata.scenarios : ["办公", "副业"],
    };
  }
  const name = categoryName || "";
  if (/编程|开发|代码/i.test(name)) {
    return { audience: ["开发者", "创业者"], scenarios: ["编程", "自动化"] };
  }
  if (/写作|内容|营销|设计/i.test(name)) {
    return { audience: ["自媒体", "创业者"], scenarios: ["公众号", "小红书"] };
  }
  return { audience: ["普通用户", "创业者"], scenarios: ["办公", "副业"] };
}

export default function ToolsList({
  websites,
  total,
  page,
  pageSize,
  categories,
  currentCategory,
  searchQuery,
}: ToolsListProps) {
  const totalPages = Math.ceil(total / pageSize);
  const [liked, setLiked] = useState<Record<number, boolean>>({});

  const handleVisit = async (w: Website) => {
    fetch(`/api/websites/${w.id}/visit`, { method: "POST" }).catch(() => {});
    window.open(w.url, "_blank", "noopener,noreferrer");
  };

  const handleLike = async (w: Website) => {
    const key = `website-${w.id}-liked`;
    const lastLiked = localStorage.getItem(key);
    const now = Date.now();
    if (lastLiked && now - parseInt(lastLiked) < 24 * 60 * 60 * 1000) {
      toast.info("每天只能点赞一次哦，明天再来吧");
      return;
    }
    try {
      await fetch(`/api/websites/${w.id}/like`, { method: "POST" });
      localStorage.setItem(key, now.toString());
      setLiked((prev) => ({ ...prev, [w.id]: true }));
      toast.success("点赞成功，感谢支持");
    } catch {
      toast.error("点赞失败，请稍后重试");
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-10">
          <h1 className="text-3xl font-bold">
            {searchQuery
              ? `搜索: ${searchQuery}`
              : currentCategory
              ? categories.find((c) => c.slug === currentCategory)?.name || "AI 工具库"
              : "AI 工具库"}
          </h1>
          <p className="text-muted-foreground mt-1">
            精选 AI 工具与网站，按访问热度排序 · 共 {total} 个
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          <Link href="/tools">
            <Badge
              variant={!currentCategory ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm"
            >
              全部
            </Badge>
          </Link>
          {categories.map((cat) => (
            <Link key={cat.id} href={`/tools?category=${cat.slug}`}>
              <Badge
                variant={currentCategory === cat.slug ? "default" : "outline"}
                className="cursor-pointer px-3 py-1.5 text-sm"
              >
                {cat.name}
              </Badge>
            </Link>
          ))}
        </div>

        {websites.length === 0 ? (
          <div className="text-center py-20">
            <Globe className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">暂无工具</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {websites.map((w, i) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                whileHover={{ y: -3 }}
                className="group h-full"
              >
                <div className="post-card h-full p-5 flex flex-col justify-between">
                  <div className="space-y-3 flex-1">
                      <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <ToolLogo title={w.title} thumbnail={w.thumbnail} thumbnailBase64={w.thumbnail_base64} className="h-8 w-8" />
                        <div className="min-w-0">
                          <Link href={`/tools/${w.id}`} className="font-semibold leading-snug truncate group-hover:text-primary transition-colors">
                            {w.title}
                          </Link>
                          <p className="text-xs text-muted-foreground truncate">
                            {new URL(w.url).hostname}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[10px] px-2 py-0 shrink-0">
                        {w.category?.name || "未分类"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {w.description}
                    </p>
                    <div className="space-y-2 border-t border-border/20 pt-3">
                      <ToolContext
                        icon={<Users className="h-3.5 w-3.5" />}
                        label="适合人群"
                        items={getToolContext(w.category?.name, w.metadata as any).audience}
                      />
                      <ToolContext
                        icon={<Target className="h-3.5 w-3.5" />}
                        label="应用场景"
                        items={getToolContext(w.category?.name, w.metadata as any).scenarios}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/20">
                    <Link href={`/tools/${w.id}`} className="text-xs text-primary hover:underline">
                      查看详情
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {w.visits} 次访问 · {w.likes} 赞
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleLike(w)}
                        disabled={liked[w.id]}
                      >
                        <Heart
                          className={`w-4 h-4 ${liked[w.id] ? "fill-red-500 text-red-500" : ""}`}
                        />
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1"
                        onClick={() => handleVisit(w)}
                      >
                        访问
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            {page > 1 && (
              <Link href={`/tools?page=${page - 1}${currentCategory ? `&category=${currentCategory}` : ""}`}>
                <Button variant="outline" size="sm">
                  <ChevronLeft className="w-4 h-4 mr-1" /> 上一页
                </Button>
              </Link>
            )}
            <span className="text-sm text-muted-foreground px-4">
              第 {page} / {totalPages} 页
            </span>
            {page < totalPages && (
              <Link href={`/tools?page=${page + 1}${currentCategory ? `&category=${currentCategory}` : ""}`}>
                <Button variant="outline" size="sm">
                  下一页 <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ToolContext({
  icon,
  label,
  items,
}: {
  icon: React.ReactNode;
  label: string;
  items: string[];
}) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="mt-0.5 flex items-center gap-1 text-muted-foreground">
        {icon}
        {label}
      </span>
      <div className="flex flex-wrap gap-1">
        {items.map((item) => (
          <Badge key={item} variant="outline" className="px-1.5 py-0 text-[10px]">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}
