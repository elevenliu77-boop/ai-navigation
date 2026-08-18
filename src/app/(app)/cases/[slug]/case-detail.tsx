"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect } from "react";
import { ArrowLeft, Clock, Eye, TrendingUp } from "lucide-react";
import { FavoriteButton, ShareButton } from "@/components/content-actions/content-actions";
import { Badge } from "@/ui/common/badge";
import { Button } from "@/ui/common/button";
import { MarkdownContent } from "@/components/markdown-content";
import { evidenceLevelDescription, evidenceLevelLabel } from "@/lib/utils/evidence";
import type { CaseStudy, CaseResultItem } from "@/lib/types";

interface CaseDetailProps {
  caseData: CaseStudy;
  relatedCases: CaseStudy[];
}

export default function CaseDetail({
  caseData,
  relatedCases,
}: CaseDetailProps) {
  useEffect(() => {
    fetch("/api/cases/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: caseData.slug }),
    }).catch(() => {});
  }, [caseData.slug]);

  const result: CaseResultItem[] = Array.isArray(caseData.result)
    ? caseData.result
    : [];
  const metadata = caseData.metadata || {};

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/cases">
          <Button variant="ghost" size="sm" className="mb-6 gap-1">
            <ArrowLeft className="w-4 h-4" /> 返回AI赚钱案例
          </Button>
        </Link>

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <header className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary">{caseData.category?.name || "未分类"}</Badge>
              {evidenceLevelLabel(metadata.evidenceLevel) && (
                <Badge className="border-0 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  证据等级：{evidenceLevelLabel(metadata.evidenceLevel)}
                </Badge>
              )}
              {caseData.tags?.map((tag) => (
                <Link key={tag.id} href={`/cases?tag=${tag.slug}`}>
                  <Badge variant="outline" className="text-[10px]">
                    #{tag.name}
                  </Badge>
                </Link>
              ))}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
              {caseData.title}
            </h1>

            <p className="text-lg text-muted-foreground mb-4">{caseData.summary}</p>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="mr-1">案例拆解：</span>
              {["背景", "使用工具", "执行流程", "结果", "经验总结"].map((section) => (
                <Badge key={section} variant="outline">
                  {section}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {caseData.published_at
                  ? new Date(caseData.published_at).toLocaleDateString("zh-CN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : ""}
              </span>
              {caseData.view_count > 0 && (
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {caseData.view_count} 次浏览
                </span>
              )}
            </div>
            <div className="mt-5 flex flex-wrap gap-2"><FavoriteButton targetType="case" targetId={caseData.id} /><ShareButton title={caseData.title} /></div>
          </header>

          <div className="mb-8 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-muted-foreground">
            {evidenceLevelLabel(metadata.evidenceLevel)
              ? <>证据等级：{evidenceLevelLabel(metadata.evidenceLevel)}（{evidenceLevelDescription(metadata.evidenceLevel)}）。</>
              : "证据等级：待核。当前展示基于来源材料，未独立核验。"}
            {" "}案例用于拆解方法和过程，结果受行业、执行力和时间投入影响，不构成收益承诺。
          </div>

          <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[["收益模式", metadata.revenueModel || "按案例拆解"], ["投入成本", metadata.cost || "需按项目核算"], ["适合人群", metadata.audience?.join("、") || "个人创业者"], ["使用工具", metadata.tools?.join(" + ") || "见正文"], ["执行难度", metadata.difficulty || "中等"], ["预计周期", metadata.cycle || "按执行计划"]].map(([label, value]) => (
              <div key={label} className="post-card p-4"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-2 text-sm font-semibold">{value}</div></div>
            ))}
          </div>

          {/* 案例效果数据 */}
          {result.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> 案例效果
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {result.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.06 }}
                    className="post-card p-4 text-center"
                  >
                    <div className="text-2xl font-bold text-primary bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                      {item.value}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {item.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* 案例正文 */}
          <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-code:text-primary prose-a:text-primary prose-headings:font-bold prose-headings:tracking-tight prose-img:rounded-xl">
            <MarkdownContent content={caseData.content} />
          </div>
        </motion.article>

        {relatedCases.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-6">相关案例</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedCases.map((rc) => (
                <Link key={rc.id} href={`/cases/${rc.slug}`}>
                  <motion.div whileHover={{ y: -3 }} className="group">
                    <div className="post-card p-4 h-full">
                      <Badge variant="secondary" className="text-[10px] px-2 py-0 mb-2">
                        {rc.category?.name || "未分类"}
                      </Badge>
                      <h3 className="font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {rc.title}
                      </h3>
                      <div className="text-xs text-muted-foreground mt-2">
                        {rc.view_count} 次浏览
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
