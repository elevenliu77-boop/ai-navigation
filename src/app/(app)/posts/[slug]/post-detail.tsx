"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect } from "react";
import { ArrowLeft, Clock, Eye, Tag as TagIcon } from "lucide-react";
import { Badge } from "@/ui/common/badge";
import { Button } from "@/ui/common/button";
import type { Post } from "@/lib/types";

interface PostDetailProps {
  post: Post;
  relatedPosts: Post[];
}

export default function PostDetail({ post, relatedPosts }: PostDetailProps) {
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
            <ArrowLeft className="w-4 h-4" /> 返回文章列表
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

// 简易 Markdown 渲染
function MarkdownContent({ content }: { content: string }) {
  const html = renderMarkdown(content);

  return (
    <div
      className="markdown-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function renderMarkdown(md: string): string {
  let html = md
    // 代码块 (```)
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const escaped = escapeHtml(code);
      return `<pre><code class="language-${lang || 'text'}">${escaped}</code></pre>`;
    })
    // 行内代码 (`)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // 标题
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // 加粗
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // 斜体
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // 链接
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // 无序列表
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // 有序列表
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // 段落 (双换行)
    .replace(/\n\n/g, '</p><p>')
    // 空行清理
    .replace(/<li><\/li>/g, '')
    // 列表包装
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => {
      if (match.split('\n').filter(l => l.trim()).every(l => l.match(/^\d+\./))) {
        return `<ol>${match.replace(/^\d+\. /gm, '')}</ol>`;
      }
      return `<ul>${match.replace(/^- /gm, '')}</ul>`;
    });

  return `<p>${html}</p>`.replace(/(<li>.*?<\/li>)+/g, (match) => {
    // Proper list rendering without extra p tags
    return match;
  }).replace(/<p><(ul|ol)>/g, '<$1>').replace(/<\/(ul|ol)><\/p>/g, '</$1>');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
