"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { motion } from "framer-motion";
import Link from "next/link";
import { Trophy, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/ui/common/badge";
import { Button } from "@/ui/common/button";
import { evidenceLevelLabel } from "@/lib/utils/evidence";
import type { CaseStudy, Category } from "@/lib/types";

interface CasesListProps {
  cases: CaseStudy[];
  total: number;
  page: number;
  pageSize: number;
  categories: Category[];
  currentCategory?: string;
  currentTag?: string;
  searchQuery?: string;
}

export default function CasesList({
  cases,
  total,
  page,
  pageSize,
  categories,
  currentCategory,
  currentTag,
  searchQuery,
}: CasesListProps) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-10">
          <h1 className="text-3xl font-bold">
            {searchQuery
              ? `搜索: ${searchQuery}`
              : currentCategory
              ? categories.find((c) => c.slug === currentCategory)?.name || "AI赚钱案例"
              : currentTag
              ? `#${currentTag}`
              : "AI赚钱案例"}
          </h1>
          <p className="text-muted-foreground mt-1">
            普通人用 AI 创造收益的真实拆解 · 共 {total} 个
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          <Link href="/cases">
            <Badge
              variant={!currentCategory ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm"
            >
              全部
            </Badge>
          </Link>
          {categories.map((cat) => (
            <Link key={cat.id} href={`/cases?category=${cat.slug}`}>
              <Badge
                variant={currentCategory === cat.slug ? "default" : "outline"}
                className="cursor-pointer px-3 py-1.5 text-sm"
              >
                {cat.name}
              </Badge>
            </Link>
          ))}
        </div>

        {cases.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">暂无案例</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cases.map((cs, i) => (
              <Link key={cs.id} href={`/cases/${cs.slug}`}>
                <motion.div
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
                          {cs.category?.name || "未分类"}
                        </Badge>
                        {cs.featured && (
                          <Badge className="text-[10px] px-2 py-0 bg-gradient-to-r from-amber-500 to-orange-500 border-0">
                            精选
                          </Badge>
                        )}
                        {evidenceLevelLabel((cs.metadata as any)?.evidenceLevel) && (
                          <Badge className="text-[10px] px-2 py-0 border-0 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            {evidenceLevelLabel((cs.metadata as any)?.evidenceLevel)}
                          </Badge>
                        )}
                      </div>
                      <h2 className="font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {cs.title}
                      </h2>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {cs.summary}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/20 text-xs text-muted-foreground">
                      {cs.view_count > 0 && <span>{cs.view_count} 次浏览</span>}
                      {cs.published_at && (
                        <span>{new Date(cs.published_at).toLocaleDateString("zh-CN")}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            {page > 1 && (
              <Link href={`/cases?page=${page - 1}${currentCategory ? `&category=${currentCategory}` : ""}`}>
                <Button variant="outline" size="sm">
                  <ChevronLeft className="w-4 h-4 mr-1" /> 上一页
                </Button>
              </Link>
            )}
            <span className="text-sm text-muted-foreground px-4">
              第 {page} / {totalPages} 页
            </span>
            {page < totalPages && (
              <Link href={`/cases?page=${page + 1}${currentCategory ? `&category=${currentCategory}` : ""}`}>
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
