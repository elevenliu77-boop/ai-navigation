"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Copy } from "lucide-react";
import { Badge } from "@/ui/common/badge";
import { Button } from "@/ui/common/button";
import { toast } from "sonner";
import type { Prompt, Category } from "@/lib/types";

interface PromptsListProps {
  prompts: Prompt[];
  total: number;
  page: number;
  pageSize: number;
  categories: Category[];
  currentCategory?: string;
  currentTag?: string;
  searchQuery?: string;
}

const promptTopics = ["写作", "营销", "自媒体", "编程", "办公", "创业", "电商"];

export default function PromptsList({
  prompts,
  total,
  page,
  pageSize,
  categories,
  currentCategory,
  currentTag,
  searchQuery,
}: PromptsListProps) {
  const totalPages = Math.ceil(total / pageSize);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopy = async (prompt: Prompt) => {
    try {
      await navigator.clipboard.writeText(prompt.content);
      setCopiedId(prompt.id);
      toast.success("提示词已复制");
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      toast.error("复制失败，请进入详情页手动复制");
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-10">
          <h1 className="text-3xl font-bold">
            {searchQuery
              ? "搜索: " + searchQuery
              : currentCategory
              ? categories.find((c) => c.slug === currentCategory)?.name || "提示词库"
              : currentTag
              ? "#" + currentTag
              : "提示词库"}
          </h1>
          <p className="text-muted-foreground mt-1">
            精选 AI 提示词，直接复制使用 · 共 {total} 条
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          <Link href="/prompts">
            <Badge
              variant={!currentCategory ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm"
            >
              全部
            </Badge>
          </Link>
          {categories.map((cat) => (
            <Link key={cat.id} href={"/prompts?category=" + cat.slug}>
              <Badge
                variant={currentCategory === cat.slug ? "default" : "outline"}
                className="cursor-pointer px-3 py-1.5 text-sm"
              >
                {cat.name}
              </Badge>
            </Link>
          ))}
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm text-muted-foreground">场景分类</span>
          {promptTopics.map((topic) => (
            <Link key={topic} href={"/prompts?q=" + encodeURIComponent(topic)}>
              <Badge
                variant={searchQuery === topic ? "default" : "outline"}
                className="cursor-pointer px-3 py-1.5 text-sm"
              >
                {topic}
              </Badge>
            </Link>
          ))}
        </div>

        {prompts.length === 0 ? (
          <div className="text-center py-20">
            <Copy className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">暂无提示词</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {prompts.map((prompt, i) => (
              <motion.div
                key={prompt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                whileHover={{ y: -3 }}
                className="group h-full"
              >
                <div className="post-card h-full p-5 flex flex-col justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] px-2 py-0">
                        {prompt.category?.name || "未分类"}
                      </Badge>
                      {prompt.featured && (
                        <Badge className="text-[10px] px-2 py-0 bg-gradient-to-r from-purple-500 to-pink-500 border-0">
                          精选
                        </Badge>
                      )}
                    </div>
                    <Link href={"/prompts/" + prompt.slug}>
                      <h2 className="font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {prompt.title}
                      </h2>
                    </Link>
                    {prompt.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {prompt.excerpt}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/20 text-xs text-muted-foreground">
                    <span>{prompt.view_count} 次浏览</span>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Copy className="w-3 h-3" />
                        {prompt.copy_count}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs"
                        onClick={() => handleCopy(prompt)}
                      >
                        {copiedId === prompt.id ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        {copiedId === prompt.id ? "已复制" : "复制"}
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
              <Link
                href={
                  "/prompts?page=" +
                  (page - 1) +
                  (currentCategory ? "&category=" + currentCategory : "")
                }
              >
                <Button variant="outline" size="sm">
                  <ChevronLeft className="w-4 h-4 mr-1" /> 上一页
                </Button>
              </Link>
            )}
            <span className="text-sm text-muted-foreground px-4">
              第 {page} / {totalPages} 页
            </span>
            {page < totalPages && (
              <Link
                href={
                  "/prompts?page=" +
                  (page + 1) +
                  (currentCategory ? "&category=" + currentCategory : "")
                }
              >
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
