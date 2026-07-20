"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Code2,
  Github,
  Server,
  Wrench,
  BookOpen,
  Brain,
  ArrowRight,
  Sparkles,
  Zap,
  Cpu,
  Globe,
} from "lucide-react";
import { Button } from "@/ui/common/button";
import { Badge } from "@/ui/common/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/common/select";
import { Card } from "@/ui/common/card";
import { cn } from "@/lib/utils/utils";
import type { Post, Category, Tag } from "@/lib/types";

// ─────────── 类型 ───────────

interface CategoryWithCount extends Category {
  description: string | null;
  postCount: number;
}

interface HomePageProps {
  categories: CategoryWithCount[];
  featuredPosts: Post[];
  latestPosts: Post[];
}

// 分类图标映射
const categoryIcons: Record<string, React.ElementType> = {
  "ai-dev-tools": Brain,
  "open-source": Github,
  "self-hosted": Server,
  "dev-tools": Wrench,
  tutorials: BookOpen,
  llm: Brain,
  workflow: Zap,
  default: Globe,
};

const categoryColors: Record<string, string> = {
  "ai-dev-tools": "from-blue-500 to-purple-600",
  "open-source": "from-green-500 to-teal-600",
  "self-hosted": "from-orange-500 to-red-600",
  "dev-tools": "from-indigo-500 to-blue-600",
  tutorials: "from-pink-500 to-rose-600",
  llm: "from-violet-500 to-purple-600",
  workflow: "from-cyan-500 to-blue-600",
  default: "from-gray-500 to-gray-600",
};

// ─────────── 主组件 ───────────

export default function HomePageClient({
  categories,
  featuredPosts,
  latestPosts,
}: HomePageProps) {
  const { theme } = useTheme();
  const { scrollY } = useScroll();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("all");

  // 多层视差
  const bgY = useTransform(scrollY, [0, 500], [0, -150]);
  const midY = useTransform(scrollY, [0, 500], [0, -80]);
  const contentY = useTransform(scrollY, [0, 500], [0, -30]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  // 暗色主题应用到 html
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const firstFeatured = featuredPosts[0];
  const restFeatured = featuredPosts.slice(1, 5);

  const hotTags = [
    "DeepSeek", "ChatGPT", "Claude", "AI Agent",
    "LangChain", "Docker", "开源", "自部署", "Python"
  ];

  const handleSearch = () => {
    const base = "/posts";
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (searchCategory !== "all") params.set("category", searchCategory);
    const qs = params.toString();
    window.location.href = qs ? `${base}?${qs}` : base;
  };

  return (
    <div className="relative min-h-screen">
      {/* ═══════ HERO 区域 ═══════ */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        {/* 背景层：浮动光球 */}
        <motion.div style={{ y: bgY }} className="absolute inset-0 -z-10">
          {/* 大幅蓝色光晕 */}
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-500/15 via-blue-400/10 to-transparent blur-[120px] animate-pulse-glow" />
          {/* 紫色光晕 */}
          <div className="absolute -top-1/3 right-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-purple-500/15 via-purple-400/10 to-transparent blur-[120px] animate-pulse-glow" style={{ animationDelay: "3s" }} />
          {/* 粉色光晕 */}
          <div className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-pink-500/10 via-pink-400/5 to-transparent blur-[100px] animate-pulse-glow" style={{ animationDelay: "5s" }} />
          {/* 青色光晕 */}
          <div className="absolute top-2/3 left-1/3 w-[450px] h-[450px] rounded-full bg-gradient-to-br from-cyan-500/10 via-blue-400/8 to-transparent blur-[100px] animate-pulse-glow" style={{ animationDelay: "2s" }} />
        </motion.div>

        {/* 点阵背景 */}
        <motion.div style={{ y: midY }} className="absolute inset-0 -z-10">
          <div
            className="absolute inset-0 opacity-[0.15] dark:opacity-[0.08]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            }}
          />
        </motion.div>

        {/* 内容层 */}
        <motion.div
          style={{ y: contentY, opacity: heroOpacity }}
          className="relative z-10 w-full max-w-5xl mx-auto px-4 py-20"
        >
          <div className="text-center space-y-8">
            {/* 标题 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-4"
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">
                  探索 AI 开发与开源
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                发现 AI 开发工具、开源项目、自部署方案与技术教程
              </p>
            </motion.div>

            {/* 搜索框 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="max-w-2xl mx-auto"
            >
              <div className="flex gap-2 p-1.5 rounded-2xl bg-background/60 dark:bg-white/5 backdrop-blur-xl border border-border/50 shadow-2xl shadow-purple-500/5">
                <div className="flex-1 flex items-center gap-2 pl-3">
                  <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    placeholder="搜索文章、工具、开源项目..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="flex-1 bg-transparent border-none outline-none text-sm py-2 placeholder:text-muted-foreground/50"
                  />
                </div>
                <Select value={searchCategory} onValueChange={setSearchCategory}>
                  <SelectTrigger className="w-[130px] h-9 bg-muted/50 border-0">
                    <SelectValue placeholder="全部分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部分类</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.slug}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" className="h-9 px-4 rounded-xl" onClick={handleSearch}>
                  搜索
                </Button>
              </div>
            </motion.div>

            {/* 热门标签 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-2"
            >
              <span className="text-sm text-muted-foreground mr-1">搜索热词</span>
              {hotTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSearchQuery(tag)}
                  className="px-3 py-1 text-sm rounded-full border border-border/40 bg-background/40 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all duration-200"
                >
                  {tag}
                </button>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* 底部渐变过渡 */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
      </section>

      {/* ═══════ 分类卡片 ═══════ */}
      <section className="relative -mt-16 z-20 pb-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {categories.map((cat, i) => {
              const Icon = categoryIcons[cat.slug] || categoryIcons.default;
              const gradient = categoryColors[cat.slug] || categoryColors.default;
              return (
                <Link key={cat.id} href={`/category/${cat.slug}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    className="relative group cursor-pointer"
                  >
                    <div
                      className={cn(
                        "relative overflow-hidden rounded-2xl p-4 h-28",
                        "bg-gradient-to-br",
                        gradient,
                        "shadow-lg hover:shadow-xl transition-all duration-300"
                      )}
                    >
                      {/* 背景装饰 */}
                      <div className="absolute top-2 right-2 opacity-10">
                        <Icon className="w-16 h-16" />
                      </div>
                      <div className="relative z-10 h-full flex flex-col justify-between">
                        <Icon className="w-6 h-6 text-white/90" />
                        <div>
                          <h3 className="text-sm font-semibold text-white leading-tight">
                            {cat.name}
                          </h3>
                          <p className="text-xs text-white/70 mt-0.5">
                            {cat.postCount} 篇
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════ 精选文章 ═══════ */}
      {featuredPosts.length > 0 && (
        <section className="py-12">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold">精选推荐</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  最受欢迎的 AI 开发与开源内容
                </p>
              </div>
              <Link href="/posts">
                <Button variant="ghost" className="gap-1 text-sm">
                  查看全部 <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* 左侧大卡片 — 第一篇 */}
              {firstFeatured && (
                <Link href={`/posts/${firstFeatured.slug}`} className="lg:col-span-2 group">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative h-64 sm:h-80 lg:h-full min-h-[300px] rounded-2xl overflow-hidden"
                  >
                    {/* 背景渐变 */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-purple-600/20 to-pink-600/30 group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                    {/* 装饰元素 */}
                    <div className="absolute top-4 right-4 opacity-20">
                      <Sparkles className="w-24 h-24 text-white" />
                    </div>

                    {/* 内容 */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                      <div className="space-y-3">
                        <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                          {firstFeatured.category?.name || "未分类"}
                        </Badge>
                        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight group-hover:underline decoration-white/50 underline-offset-4">
                          {firstFeatured.title}
                        </h3>
                        {firstFeatured.excerpt && (
                          <p className="text-sm text-white/70 line-clamp-2 max-w-2xl">
                            {firstFeatured.excerpt}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-white/50">
                          <span>
                            {firstFeatured.published_at
                              ? new Date(firstFeatured.published_at).toLocaleDateString("zh-CN")
                              : ""}
                          </span>
                          <span>{firstFeatured.view_count} 次阅读</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              )}

              {/* 右侧小卡片 — 4篇 */}
              <div className="grid grid-cols-2 gap-3">
                {restFeatured.map((post, i) => (
                  <Link key={post.id} href={`/posts/${post.slug}`} className={i >= 2 ? "hidden sm:block" : ""}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
                      whileHover={{ y: -2 }}
                      className="group h-full"
                    >
                      <div className="post-card h-full p-4 flex flex-col justify-between">
                        <div className="space-y-2">
                          <Badge variant="secondary" className="text-[10px] px-2 py-0">
                            {post.category?.name || "未分类"}
                          </Badge>
                          <h3 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                            {post.title}
                          </h3>
                          {post.excerpt && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {post.excerpt}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-2">
                          <span>{post.view_count} 阅读</span>
                          {post.published_at && (
                            <>
                              <span>·</span>
                              <span>{new Date(post.published_at).toLocaleDateString("zh-CN")}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════ 最新文章 ═══════ */}
      {latestPosts.length > 0 && (
        <section className="py-12">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold">最新文章</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  最新的 AI 开发、开源与技术内容
                </p>
              </div>
              <Link href="/posts">
                <Button variant="ghost" className="gap-1 text-sm">
                  查看全部 <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {latestPosts.map((post, i) => (
                <Link key={post.id} href={`/posts/${post.slug}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.03 }}
                    whileHover={{ y: -4 }}
                    className="group"
                  >
                    <div className="post-card h-full p-5 flex flex-col justify-between">
                      <div className="space-y-3 flex-1">
                        <Badge variant="secondary" className="text-[10px] px-2 py-0">
                          {post.category?.name || "未分类"}
                        </Badge>
                        <h3 className="font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                          {post.title}
                        </h3>
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
          </div>
        </section>
      )}

      {/* ═══════ 空状态 ═══════ */}
      {latestPosts.length === 0 && (
        <section className="py-24">
          <div className="max-w-md mx-auto text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mx-auto">
              <Code2 className="w-10 h-10 text-primary/40" />
            </div>
            <h2 className="text-xl font-semibold">还没有文章</h2>
            <p className="text-muted-foreground">
              内容正在准备中，敬请期待！
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
