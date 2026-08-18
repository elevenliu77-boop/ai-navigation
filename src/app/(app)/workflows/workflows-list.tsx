"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Workflow as WorkflowIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/ui/common/badge";
import { Button } from "@/ui/common/button";
import type { Workflow, Category } from "@/lib/types";

interface WorkflowsListProps {
  workflows: Workflow[];
  total: number;
  page: number;
  pageSize: number;
  categories: Category[];
  currentCategory?: string;
  currentTag?: string;
  searchQuery?: string;
}

export default function WorkflowsList({
  workflows,
  total,
  page,
  pageSize,
  categories,
  currentCategory,
  currentTag,
  searchQuery,
}: WorkflowsListProps) {
  const totalPages = Math.ceil(total / pageSize);

  const stepsCount = (steps: unknown): number =>
    Array.isArray(steps) ? steps.length : 0;

  const workflowMeta = (workflow: Workflow) => {
    const count = stepsCount(workflow.steps);
    return {
      difficulty: count >= 6 ? "高级" : count >= 4 ? "中等" : "简单",
      duration: Math.max(count * 10, 15) + "分钟",
      tools: Array.isArray(workflow.tools)
        ? workflow.tools.map((tool) => tool.name).slice(0, 3)
        : [],
    };
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-10">
          <h1 className="text-3xl font-bold">
            {searchQuery
              ? `搜索: ${searchQuery}`
              : currentCategory
              ? categories.find((c) => c.slug === currentCategory)?.name || "AI工作流"
              : currentTag
              ? `#${currentTag}`
              : "AI工作流"}
          </h1>
          <p className="text-muted-foreground mt-1">
            可直接复用的 AI 自动化流程 · 共 {total} 条
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          <Link href="/workflows">
            <Badge
              variant={!currentCategory ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm"
            >
              全部
            </Badge>
          </Link>
          {categories.map((cat) => (
            <Link key={cat.id} href={`/workflows?category=${cat.slug}`}>
              <Badge
                variant={currentCategory === cat.slug ? "default" : "outline"}
                className="cursor-pointer px-3 py-1.5 text-sm"
              >
                {cat.name}
              </Badge>
            </Link>
          ))}
        </div>

        {workflows.length === 0 ? (
          <div className="text-center py-20">
            <WorkflowIcon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">暂无工作流</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map((wf, i) => (
              <Link key={wf.id} href={`/workflows/${wf.slug}`}>
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
                          {wf.category?.name || "未分类"}
                        </Badge>
                        {wf.featured && (
                          <Badge className="text-[10px] px-2 py-0 bg-gradient-to-r from-cyan-500 to-blue-500 border-0">
                            精选
                          </Badge>
                        )}
                      </div>
                      <h2 className="font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {wf.title}
                      </h2>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {wf.description}
                      </p>
                      <div className="grid grid-cols-2 gap-2 border-t border-border/20 pt-3 text-xs">
                        <span className="text-muted-foreground">
                          难度 <strong className="ml-1 text-foreground">{workflowMeta(wf).difficulty}</strong>
                        </span>
                        <span className="text-muted-foreground">
                          耗时 <strong className="ml-1 text-foreground">{workflowMeta(wf).duration}</strong>
                        </span>
                      </div>
                      {workflowMeta(wf).tools.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {workflowMeta(wf).tools.map((tool) => (
                            <Badge key={tool} variant="outline" className="text-[10px]">
                              {tool}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/20 text-xs text-muted-foreground">
                      <span>{stepsCount(wf.steps)} 个步骤</span>
                      <span>{wf.view_count} 次浏览</span>
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
              <Link href={`/workflows?page=${page - 1}${currentCategory ? `&category=${currentCategory}` : ""}`}>
                <Button variant="outline" size="sm">
                  <ChevronLeft className="w-4 h-4 mr-1" /> 上一页
                </Button>
              </Link>
            )}
            <span className="text-sm text-muted-foreground px-4">
              第 {page} / {totalPages} 页
            </span>
            {page < totalPages && (
              <Link href={`/workflows?page=${page + 1}${currentCategory ? `&category=${currentCategory}` : ""}`}>
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
