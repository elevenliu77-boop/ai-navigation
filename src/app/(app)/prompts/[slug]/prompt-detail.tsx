"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Clock, Copy, Check, Eye } from "lucide-react";
import { Badge } from "@/ui/common/badge";
import { Button } from "@/ui/common/button";
import { toast } from "sonner";
import type { Prompt, PromptMetadata } from "@/lib/types";
import { FavoriteButton, ShareButton } from "@/components/content-actions/content-actions";


function ContractRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold text-muted-foreground">{label}</div>
      <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">{value}</p>
    </div>
  );
}
interface PromptDetailProps {
  prompt: Prompt;
  relatedPrompts: Prompt[];
}

export default function PromptDetail({ prompt, relatedPrompts }: PromptDetailProps) {
  const [copied, setCopied] = useState(false);
  const metadata: PromptMetadata = prompt.metadata || {};

  useEffect(() => {
    fetch("/api/prompts/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: prompt.slug }),
    }).catch(() => {});
  }, [prompt.slug]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.content);
      setCopied(true);
      toast.success("已复制到剪贴板");
      fetch("/api/prompts/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: prompt.slug }),
      }).catch(() => {});
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("复制失败，请手动选择复制");
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/prompts">
          <Button variant="ghost" size="sm" className="mb-6 gap-1">
            <ArrowLeft className="w-4 h-4" /> 返回提示词库
          </Button>
        </Link>

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <header className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary">{prompt.category?.name || "未分类"}</Badge>
              {prompt.tags?.map((tag) => (
                <Link key={tag.id} href={`/prompts?tag=${tag.slug}`}>
                  <Badge variant="outline" className="text-[10px]">
                    #{tag.name}
                  </Badge>
                </Link>
              ))}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
              {prompt.title}
            </h1>

            {prompt.excerpt && (
              <p className="text-lg text-muted-foreground mb-4">{prompt.excerpt}</p>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {prompt.published_at
                  ? new Date(prompt.published_at).toLocaleDateString("zh-CN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : ""}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {prompt.view_count} 次浏览
              </span>
              <span className="flex items-center gap-1">
                <Copy className="w-4 h-4" />
                {prompt.copy_count} 次复制
              </span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2"><FavoriteButton targetType="prompt" targetId={prompt.id} /><ShareButton title={prompt.title} /></div>
          </header>

          {/* Prompt 正文 */}
          {metadata.scenarios?.length || metadata.recommendedModel || metadata.exampleInput || metadata.exampleOutput ? (
            <section className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {metadata.scenarios?.length ? <div className="post-card p-4"><h2 className="text-sm font-semibold">使用场景</h2><div className="mt-3 flex flex-wrap gap-2">{metadata.scenarios.map((item) => <Badge key={item} variant="outline">{item}</Badge>)}</div></div> : null}
              {metadata.recommendedModel ? <div className="post-card p-4"><h2 className="text-sm font-semibold">推荐模型</h2><p className="mt-2 text-sm text-muted-foreground">{metadata.recommendedModel}</p></div> : null}
              {metadata.exampleInput ? <div className="post-card p-4"><h2 className="text-sm font-semibold">示例输入</h2><pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{metadata.exampleInput}</pre></div> : null}
              {metadata.exampleOutput ? <div className="post-card p-4"><h2 className="text-sm font-semibold">示例输出</h2><pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{metadata.exampleOutput}</pre></div> : null}
              {metadata.taskGoal || metadata.inputRequirements || metadata.prohibited || metadata.outputFormat || metadata.acceptanceCriteria || metadata.lastVerifiedAt ? <div className="post-card p-4"><h2 className="text-sm font-semibold mb-3">任务契约</h2><div className="space-y-3">{metadata.taskGoal ? <ContractRow label="任务目标" value={metadata.taskGoal} /> : null}{metadata.inputRequirements ? <ContractRow label="输入要求" value={metadata.inputRequirements} /> : null}{metadata.prohibited ? <ContractRow label="禁止事项" value={metadata.prohibited} /> : null}{metadata.outputFormat ? <ContractRow label="输出格式" value={metadata.outputFormat} /> : null}{metadata.acceptanceCriteria ? <ContractRow label="验收条件" value={metadata.acceptanceCriteria} /> : null}{metadata.lastVerifiedAt ? <div className="text-xs text-muted-foreground">最后验证：{metadata.lastVerifiedAt}</div> : null}</div></div> : null}
            </section>
          ) : null}

          <div className="rounded-2xl border border-border/40 bg-muted/30 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30 bg-muted/50">
              <span className="text-xs font-mono text-muted-foreground">提示词</span>
              <Button size="sm" variant={copied ? "default" : "outline"} onClick={handleCopy} className="gap-1">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "已复制" : "一键复制"}
              </Button>
            </div>
            <pre className="p-5 text-sm leading-relaxed whitespace-pre-wrap font-mono max-h-[480px] overflow-y-auto">
              {prompt.content}
            </pre>
          </div>
        </motion.article>

        {relatedPrompts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-6">相关提示词</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedPrompts.map((rp) => (
                <Link key={rp.id} href={`/prompts/${rp.slug}`}>
                  <motion.div whileHover={{ y: -3 }} className="group">
                    <div className="post-card p-4 h-full">
                      <Badge variant="secondary" className="text-[10px] px-2 py-0 mb-2">
                        {rp.category?.name || "未分类"}
                      </Badge>
                      <h3 className="font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {rp.title}
                      </h3>
                      <div className="text-xs text-muted-foreground mt-2">
                        {rp.view_count} 次浏览
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
