"use client";
 

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect } from "react";
import { ArrowLeft, Clock, Eye, Tag as TagIcon, Copy, Workflow, Trophy, Wrench, ExternalLink, Sparkles } from "lucide-react";
import { Badge } from "@/ui/common/badge";
import { Button } from "@/ui/common/button";
import type { Post } from "@/lib/types";
import { FavoriteButton, ShareButton } from "@/components/content-actions/content-actions";
import { MarkdownContent } from "@/components/markdown-content";

interface RelatedItem {
  id: number;
  title: string;
  slug: string;
  category?: { name: string } | null;
  view_count?: number;
  url?: string | null;
  description?: string | null;
}

interface PostDetailProps {
  post: Post;
  relatedPosts: Post[];
  relatedDiscoveries?: RelatedItem[];
  relatedTools?: RelatedItem[];
  relatedPrompts?: RelatedItem[];
  relatedWorkflows?: RelatedItem[];
  relatedCases?: RelatedItem[];
}

export default function PostDetail({
  post,
  relatedPosts,
  relatedDiscoveries = [],
  relatedTools = [],
  relatedPrompts = [],
  relatedWorkflows = [],
  relatedCases = [],
}: PostDetailProps) {
  const hasRelated =
    relatedTools.length > 0 ||
    relatedDiscoveries.length > 0 ||
    relatedPrompts.length > 0 ||
    relatedWorkflows.length > 0 ||
    relatedCases.length > 0;

  // 记录阅读次数
  useEffect(() => {
    fetch("/api/posts/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: post.slug }),
    }).catch(() => {});
  }, [post.slug]);

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* 返回链接 */}
        <Link href="/posts">
          <Button variant="ghost" size="sm" className="mb-6 gap-1">
            <ArrowLeft className="w-4 h-4" /> 返回AI知识库
          </Button>
        </Link>

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* 文章头部 */}
          <header className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary">
                {post.category?.name || "未分类"}
              </Badge>
              {post.tags?.map((tag) => (
                <Link key={tag.id} href={`/tags/${tag.slug}`}>
                  <Badge variant="outline" className="text-[10px]">
                    #{tag.name}
                  </Badge>
                </Link>
              ))}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-lg text-muted-foreground mb-4">
                {post.excerpt}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {post.published_at
                  ? new Date(post.published_at).toLocaleDateString("zh-CN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : ""}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {post.view_count} 次阅读
              </span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2"><FavoriteButton targetType="post" targetId={post.id} /><ShareButton title={post.title} /></div>
          </header>

          {/* 文章内容 */}
          <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-code:text-primary prose-a:text-primary prose-headings:font-bold prose-headings:tracking-tight prose-img:rounded-xl">
            <MarkdownContent content={post.content} />
          </div>

          {/* 标签 */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t border-border/20">
              <div className="flex items-center gap-2 flex-wrap">
                <TagIcon className="w-4 h-4 text-muted-foreground" />
                {post.tags.map((tag) => (
                  <Link key={tag.id} href={`/tags/${tag.slug}`}>
                    <Badge variant="secondary" className="cursor-pointer hover:bg-primary/10 transition-colors">
                      #{tag.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </motion.article>

        {/* 知识关联（V2.1 预留：跨内容类型关联，未来接入 AI 助手/RAG） */}
        {hasRelated && (
          <section className="mt-16">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">你可能还需要</h2>
              <p className="text-sm text-muted-foreground mt-1">
                与本文相关的提示词、工作流和案例，一键直达
              </p>
            </div>
            <div className="space-y-6">
              {relatedDiscoveries.length > 0 && (
                <RelatedGroup
                  title="相关 AI发现"
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                  items={relatedDiscoveries}
                  basePath="/discoveries"
                />
              )}
              {relatedTools.length > 0 && (
                <RelatedToolGroup items={relatedTools} />
              )}
              {relatedPrompts.length > 0 && (
                <RelatedGroup
                  title="相关提示词"
                  icon={<Copy className="w-3.5 h-3.5" />}
                  items={relatedPrompts}
                  basePath="/prompts"
                />
              )}
              {relatedWorkflows.length > 0 && (
                <RelatedGroup
                  title="相关AI工作流"
                  icon={<Workflow className="w-3.5 h-3.5" />}
                  items={relatedWorkflows}
                  basePath="/workflows"
                />
              )}
              {relatedCases.length > 0 && (
                <RelatedGroup
                  title="相关赚钱案例"
                  icon={<Trophy className="w-3.5 h-3.5" />}
                  items={relatedCases}
                  basePath="/cases"
                />
              )}
            </div>
          </section>
        )}

        {/* 相关文章 */}
        {relatedPosts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-6">相关文章</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedPosts.map((rp) => (
                <Link key={rp.id} href={`/posts/${rp.slug}`}>
                  <motion.div
                    whileHover={{ y: -3 }}
                    className="group"
                  >
                    <div className="post-card p-4 h-full">
                      <Badge variant="secondary" className="text-[10px] px-2 py-0 mb-2">
                        {rp.category?.name || "未分类"}
                      </Badge>
                      <h3 className="font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {rp.title}
                      </h3>
                      <div className="text-xs text-muted-foreground mt-2">
                        {rp.view_count} 次阅读
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

function RelatedToolGroup({ items }: { items: RelatedItem[] }) {
  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-3">
        <span className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
          <Wrench className="w-3.5 h-3.5" />
        </span>
        相关AI工具
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.url || "#"}
            target="_blank"
            rel="noopener noreferrer"
          >
            <motion.div whileHover={{ y: -3 }} className="group h-full">
              <div className="post-card p-4 h-full">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary" className="text-[10px] px-2 py-0">
                    AI工具库
                  </Badge>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <h4 className="mt-3 text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h4>
                {item.description && (
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                    {item.description}
                  </p>
                )}
              </div>
            </motion.div>
          </a>
        ))}
      </div>
    </div>
  );
}

// 知识关联分组（V2.1：按共享标签关联的跨类型内容）
function RelatedGroup({
  title,
  icon,
  items,
  basePath,
}: {
  title: string;
  icon: React.ReactNode;
  items: RelatedItem[];
  basePath: string;
}) {
  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-3">
        <span className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
          {icon}
        </span>
        {title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {items.map((item) => (
          <Link key={item.id} href={`${basePath}/${item.slug}`}>
            <motion.div whileHover={{ y: -3 }} className="group h-full">
              <div className="post-card p-4 h-full">
                <Badge variant="secondary" className="text-[10px] px-2 py-0 mb-2">
                  {item.category?.name || "未分类"}
                </Badge>
                <h4 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h4>
                {typeof item.view_count === "number" && (
                  <div className="text-xs text-muted-foreground mt-2">
                    {item.view_count} 次浏览
                  </div>
                )}
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
