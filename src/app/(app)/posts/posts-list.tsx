"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/ui/common/badge";
import { Button } from "@/ui/common/button";
import type { Post, Category } from "@/lib/types";

interface PostsListProps {
  posts: Post[];
  total: number;
  page: number;
  pageSize: number;
  categories: Category[];
  currentCategory?: string;
  currentTag?: string;
  searchQuery?: string;
}

export default function PostsList({
  posts,
  total,
  page,
  pageSize,
  categories,
  currentCategory,
  currentTag,
  searchQuery,
}: PostsListProps) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* 页头 */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold">
            {searchQuery
              ? `搜索: ${searchQuery}`
              : currentCategory
              ? categories.find((c) => c.slug === currentCategory)?.name || "文章"
              : currentTag
              ? `#${currentTag}`
              : "全部文章"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {total} 篇文章{currentCategory ? ` · ${currentCategory}` : ""}{searchQuery ? ` · 搜索"${searchQuery}"` : ""}
          </p>
        </div>

        {/* 分类筛选 */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Link href="/posts">
            <Badge
              variant={!currentCategory ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm"
            >
              全部
            </Badge>
          </Link>
          {categories.map((cat) => (
            <Link key={cat.id} href={`/posts?category=${cat.slug}`}>
              <Badge
                variant={currentCategory === cat.slug ? "default" : "outline"}
                className="cursor-pointer px-3 py-1.5 text-sm"
              >
                {cat.name}
              </Badge>
            </Link>
          ))}
        </div>

        {/* 文章列表 */}
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">暂无文章</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post, i) => (
              <Link key={post.id} href={`/posts/${post.slug}`}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
                  whileHover={{ y: -3 }}
                  className="group h-full"
                >
                  <div className="post-card h-full p-5 flex flex-col justify-between">
                    <div className="space-y-3 flex-1">
                      <Badge variant="secondary" className="text-[10px] px-2 py-0">
                        {post.category?.name || "未分类"}
                      </Badge>
                      <h2 className="font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {post.excerpt}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/20 text-xs text-muted-foreground">
                      <span>{post.view_count} 次阅读</span>
                      {post.published_at && (
                        <span>{new Date(post.published_at).toLocaleDateString("zh-CN")}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            {page > 1 && (
              <Link href={`/posts?page=${page - 1}${currentCategory ? `&category=${currentCategory}` : ""}`}>
                <Button variant="outline" size="sm">
                  <ChevronLeft className="w-4 h-4 mr-1" /> 上一页
                </Button>
              </Link>
            )}
            <span className="text-sm text-muted-foreground px-4">
              第 {page} / {totalPages} 页
            </span>
            {page < totalPages && (
              <Link href={`/posts?page=${page + 1}${currentCategory ? `&category=${currentCategory}` : ""}`}>
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
