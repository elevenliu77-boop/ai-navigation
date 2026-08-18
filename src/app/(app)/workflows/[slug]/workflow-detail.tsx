"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect } from "react";
import {
  ArrowLeft,
  Clock,
  Eye,
  ListOrdered,
  Wrench,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/ui/common/badge";
import { Button } from "@/ui/common/button";
import type { Workflow, WorkflowMetadata, WorkflowStep, WorkflowTool } from "@/lib/types";
import { FavoriteButton, ShareButton } from "@/components/content-actions/content-actions";

interface WorkflowDetailProps {
  workflow: Workflow;
  relatedWorkflows: Workflow[];
}

export default function WorkflowDetail({
  workflow,
  relatedWorkflows,
}: WorkflowDetailProps) {
  useEffect(() => {
    fetch("/api/workflows/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: workflow.slug }),
    }).catch(() => {});
  }, [workflow.slug]);

  const steps: WorkflowStep[] = Array.isArray(workflow.steps)
    ? workflow.steps
    : [];
  const tools: WorkflowTool[] = Array.isArray(workflow.tools)
    ? workflow.tools
    : [];
  const difficulty = steps.length >= 6 ? "高级" : steps.length >= 4 ? "中等" : "简单";
  const duration = Math.max(steps.length * 10, 15) + "分钟";
  const metadata: WorkflowMetadata = workflow.metadata || {};
  const audience = metadata.audience?.length ? metadata.audience.join("、") : "普通用户、创业者";

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/workflows">
          <Button variant="ghost" size="sm" className="mb-6 gap-1">
            <ArrowLeft className="w-4 h-4" /> 返回AI工作流
          </Button>
        </Link>

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <header className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary">{workflow.category?.name || "未分类"}</Badge>
              {workflow.tags?.map((tag) => (
                <Link key={tag.id} href={`/workflows?tag=${tag.slug}`}>
                  <Badge variant="outline" className="text-[10px]">
                    #{tag.name}
                  </Badge>
                </Link>
              ))}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
              {workflow.title}
            </h1>

            <p className="text-lg text-muted-foreground mb-4">
              {workflow.description}
            </p>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {workflow.published_at
                  ? new Date(workflow.published_at).toLocaleDateString("zh-CN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : ""}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {workflow.view_count} 次浏览
              </span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2"><FavoriteButton targetType="workflow" targetId={workflow.id} /><ShareButton title={workflow.title} /></div>
          </header>

          <div className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="post-card p-4">
              <div className="text-xs text-muted-foreground">目标</div>
              <div className="mt-2 text-sm font-medium">{workflow.description}</div>
            </div>
            <div className="post-card p-4">
              <div className="text-xs text-muted-foreground">难度</div>
              <div className="mt-2 text-sm font-medium">{difficulty}</div>
            </div>
            <div className="post-card p-4">
              <div className="text-xs text-muted-foreground">适用人群</div>
              <div className="mt-2 text-sm font-medium">{audience}</div>
            </div>
            <div className="post-card p-4">
              <div className="text-xs text-muted-foreground">预计耗时</div>
              <div className="mt-2 text-sm font-medium">{duration}</div>
            </div>
          </div>

          {metadata.effect && (
            <div className="mb-10 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="text-xs text-muted-foreground">效果</div>
              <div className="mt-1 text-sm font-medium">{metadata.effect}</div>
            </div>
          )}

          {/* 使用工具 */}
          {tools.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-primary" /> 使用工具
              </h2>
              <div className="flex flex-wrap gap-2">
                {tools.map((tool, i) =>
                  tool.url ? (
                    <a
                      key={i}
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border border-border/40 bg-muted/30 hover:bg-primary/10 hover:border-primary/30 transition-colors"
                    >
                      {tool.name}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span
                      key={i}
                      className="px-3 py-1.5 text-sm rounded-full border border-border/40 bg-muted/30"
                    >
                      {tool.name}
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          {/* 步骤 */}
          {steps.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-primary" /> 执行步骤（{steps.length}）
              </h2>
              <div className="space-y-0">
                {steps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="relative pl-12 pb-8 last:pb-0"
                  >
                    {/* 时间线 */}
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-border/40" />
                    <div className="absolute left-0 top-1 w-7 h-7 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                      {i + 1}
                    </div>
                    <div className="post-card p-4">
                      <h3 className="font-semibold mb-2">{step.title}</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {step.description}
                      </p>
                      {Array.isArray(step.tools) && step.tools.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {step.tools.map((t, j) => (
                            <Badge key={j} variant="outline" className="text-[10px]">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.article>

        {relatedWorkflows.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-6">相关工作流</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedWorkflows.map((rw) => (
                <Link key={rw.id} href={`/workflows/${rw.slug}`}>
                  <motion.div whileHover={{ y: -3 }} className="group">
                    <div className="post-card p-4 h-full">
                      <Badge variant="secondary" className="text-[10px] px-2 py-0 mb-2">
                        {rw.category?.name || "未分类"}
                      </Badge>
                      <h3 className="font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {rw.title}
                      </h3>
                      <div className="text-xs text-muted-foreground mt-2">
                        {rw.view_count} 次浏览
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
