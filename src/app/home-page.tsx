"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useTheme } from "next-themes";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Bot,
  Copy,
  Download,
  FolderDown,
  ListOrdered,
  Rocket,
  Search,
  Sparkles,
  Target,
  TerminalSquare,
  Trophy,
  Users,
  Workflow as WorkflowIcon,
  Wrench,
  ShieldCheck,
  Filter,
} from "lucide-react";
import { Badge } from "@/ui/common/badge";
import { Button } from "@/ui/common/button";
import { cn } from "@/lib/utils/utils";
import { ToolLogo } from "@/components/website/tool-logo";
import type { Category, Post } from "@/lib/types";

interface CategoryWithCount extends Category {
  description: string | null;
  postCount: number;
}

interface HomePageProps {
  categories?: CategoryWithCount[];
  featuredPosts: Post[];
  latestPosts: Post[];
  latestDiscoveries: any[];
  hotTools: any[];
  hotPrompts: any[];
  featuredWorkflows: any[];
  latestCases: any[];
  latestResources: any[];
}

const searchOptions = [
  { value: "all", label: "全部内容" },
  { value: "tools", label: "AI工具" },
  { value: "discoveries", label: "AI发现" },
  { value: "posts", label: "AI知识库" },
  { value: "cases", label: "AI赚钱案例" },
  { value: "workflows", label: "AI工作流" },
  { value: "prompts", label: "提示词库" },
  { value: "resources", label: "资源中心" },
];

const libraryEntries = [
  { slug: "tools", name: "AI工具库", desc: "精选AI工具评测、使用方法和最佳实践", icon: Wrench, accent: "text-emerald-600", iconBg: "bg-emerald-500/10" },
  { slug: "posts", name: "AI知识库", desc: "AI技术、教程、方法论和实战经验", icon: BookOpen, accent: "text-blue-600", iconBg: "bg-blue-500/10" },
  { slug: "cases", name: "AI赚钱案例", desc: "真实案例拆解，看看普通人如何利用AI创造收入", icon: Trophy, accent: "text-amber-600", iconBg: "bg-amber-500/10" },
  { slug: "workflows", name: "AI工作流", desc: "可直接复制的AI自动化流程", icon: WorkflowIcon, accent: "text-cyan-600", iconBg: "bg-cyan-500/10" },
  { slug: "prompts", name: "提示词库", desc: "经过验证的AI提示词模板", icon: TerminalSquare, accent: "text-purple-600", iconBg: "bg-purple-500/10" },
  { slug: "resources", name: "资源中心", desc: "AI资料、模板、工具合集", icon: FolderDown, accent: "text-rose-600", iconBg: "bg-rose-500/10" },
];

// alphahole 实验室（第一版 4 个 Beta 实验）
const labEntries = [
  {
    slug: "personal-company-fit",
    name: "找适合我的AI赚钱模式",
    en: "Personal Company Fit Lab",
    desc: "根据你的技能、时间和风险偏好，匹配适合的AI变现方向",
    icon: Target,
    accent: "text-violet-600",
    iconBg: "bg-violet-500/10",
    border: "hover:border-violet-400/50",
  },
  {
    slug: "tool-opportunity-finder",
    name: "AI小工具机会发现器",
    en: "AI Tool Opportunity Finder",
    desc: "从需求信号中识别值得做的AI小工具机会",
    icon: Search,
    accent: "text-sky-600",
    iconBg: "bg-sky-500/10",
    border: "hover:border-sky-400/50",
  },
  {
    slug: "oss-readiness-auditor",
    name: "GitHub项目商业化检查器",
    en: "Open-source Business Readiness Auditor",
    desc: "检查开源项目是否具备商业化条件：许可、需求、维护、边界",
    icon: ShieldCheck,
    accent: "text-emerald-600",
    iconBg: "bg-emerald-500/10",
    border: "hover:border-emerald-400/50",
  },
  {
    slug: "content-funnel-diagnosis",
    name: "内容漏斗诊断",
    en: "Content Funnel Diagnosis",
    desc: "分析你的内容到付费转化漏斗，找到卡点",
    icon: Filter,
    accent: "text-amber-600",
    iconBg: "bg-amber-500/10",
    border: "hover:border-amber-400/50",
  },
];

// AI 决策助手快捷入口
const assistantShortcuts = [
  "我想赚钱，但不知道做什么",
  "我有一个AI项目，帮我判断值不值得做",
  "我想提高工作效率",
  "我想把自己的技能变成产品",
];

// 案例证据等级 → 中文
const evidenceLabel: Record<string, string> = {
  SOURCE_CLAIM: "案例自述",
  SOURCE_CASE: "案例自述",
  SCREENSHOT_ONLY: "截图证据",
  BACKEND_DATA: "后台数据",
  REVENUE_VERIFIED: "收入已核",
  COST_VERIFIED: "成本已核",
  NET_PROFIT_VERIFIED: "净利润已核",
};

// 知识类型徽章
const knowledgeTypeLabel: Record<string, string> = {
  METHOD: "方法论",
  FRAMEWORK: "框架",
  GATE: "判断门",
  CHECKLIST: "检查清单",
  DECISION_RULE: "决策规则",
};

const hotTags = ["赚钱", "Cursor", "n8n", "AI Agent", "小红书", "自动化", "RAG", "本地部署"];

type SearchCategoryPortalProps = {
  anchorRef: { current: HTMLButtonElement | null };
  open: boolean;
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
};

function SearchCategoryPortal({ anchorRef, open, selectedValue, onSelect, onClose }: SearchCategoryPortalProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [hoveredValue, setHoveredValue] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPosition(null);
      setHoveredValue(null);
      return;
    }

    const updatePosition = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const viewportPadding = 8;
      const width = Math.min(Math.max(rect.width, 210), Math.max(0, window.innerWidth - viewportPadding * 2));
      const left = Math.min(Math.max(rect.left, viewportPadding), Math.max(viewportPadding, window.innerWidth - width - viewportPadding));
      setPosition({ top: rect.bottom + 8, left, width });
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!anchorRef.current?.contains(target) && !menuRef.current?.contains(target)) onClose();
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [anchorRef, onClose, open]);

  if (!open || !position || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={menuRef}
      role="listbox"
      aria-label="搜索分类"
      id="search-category-menu"
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        width: position.width,
        zIndex: 99999,
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
        padding: 6,
        color: "#111827",
        fontFamily: "inherit",
      }}
    >
      {searchOptions.map((option) => {
        const isHovered = hoveredValue === option.value;
        const isSelected = selectedValue === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => onSelect(option.value)}
            onMouseEnter={() => setHoveredValue(option.value)}
            onMouseLeave={() => setHoveredValue(null)}
            style={{
              display: "flex",
              width: "100%",
              alignItems: "center",
              border: 0,
              borderRadius: 8,
              padding: "10px 12px",
              backgroundColor: isHovered ? "#2563eb" : isSelected ? "#eff6ff" : "#ffffff",
              color: isHovered ? "#ffffff" : isSelected ? "#2563eb" : "#111827",
              cursor: "pointer",
              fontSize: 14,
              lineHeight: 1.25,
              textAlign: "left",
              transition: "background-color 120ms ease, color 120ms ease",
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>,
    document.body,
  );
}

function SectionHeader({ eyebrow, title, description, href, accent = "text-primary" }: { eyebrow?: string; title: string; description: string; href: string; accent?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <div className={cn("mb-2 text-xs font-semibold uppercase tracking-[0.18em]", accent)}>{eyebrow}</div>}
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <Link href={href} className="shrink-0">
        <Button variant="ghost" size="sm" className="gap-1 text-sm">查看全部 <ArrowRight className="h-4 w-4" /></Button>
      </Link>
    </div>
  );
}

export default function HomePageClient({
  featuredPosts,
  latestPosts,
  latestDiscoveries,
  hotTools,
  hotPrompts,
  featuredWorkflows,
  latestCases,
  latestResources,
}: HomePageProps) {
  const { theme } = useTheme();
  const { scrollY } = useScroll();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("all");
  const [searchMenuOpen, setSearchMenuOpen] = useState(false);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const bgY = useTransform(scrollY, [0, 500], [0, -150]);
  const midY = useTransform(scrollY, [0, 500], [0, -80]);
  const contentY = useTransform(scrollY, [0, 500], [0, -30]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const selectedSearch = searchOptions.find((item) => item.value === searchCategory) || searchOptions[0];
  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (searchCategory !== "all") params.set("type", searchCategory);
    window.location.href = `/search${params.toString() ? `?${params}` : ""}`;
  };

  const firstFeatured = featuredPosts[0];
  const restFeatured = featuredPosts.slice(1, 5);

  return (
    <div className="relative min-h-screen">
      <section className="relative flex min-h-[52vh] items-center justify-center overflow-hidden sm:min-h-[55vh]">
        <motion.div style={{ y: bgY }} className="absolute inset-0 -z-10">
          <div className="absolute left-1/4 top-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-blue-500/15 via-blue-400/10 to-transparent blur-[120px] animate-pulse-glow" />
          <div className="absolute -top-1/3 right-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-purple-500/15 via-purple-400/10 to-transparent blur-[120px] animate-pulse-glow" />
          <div className="absolute bottom-1/3 right-1/3 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-pink-500/10 to-transparent blur-[100px] animate-pulse-glow" />
        </motion.div>
        <motion.div style={{ y: midY }} className="absolute inset-0 -z-10 opacity-20 dark:opacity-10" aria-hidden="true">
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        </motion.div>

        <motion.div style={{ y: contentY, opacity: heroOpacity }} className="relative z-10 w-full max-w-5xl px-4 py-8 sm:py-10">
          <div className="space-y-3 text-center sm:space-y-4">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="space-y-4">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                <Rocket className="h-3.5 w-3.5" /> AI效率与赚钱实验平台
              </div>
              <h1 className="break-keep text-3xl font-bold tracking-tight sm:whitespace-nowrap sm:text-4xl md:text-5xl">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">alphahole · AI效率与赚钱实验室</span>
              </h1>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">发现AI工具、自动化工作流和真实赚钱案例，<br className="hidden sm:block" />让AI提升效率并创造价值</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/cases"><Button variant="outline" className="h-11 gap-2 rounded-xl border-primary/25 bg-primary/5 px-5 hover:bg-primary/10"><Trophy className="h-4 w-4 text-amber-500" />我要用AI赚钱</Button></Link>
              <Link href="/workflows"><Button variant="outline" className="h-11 gap-2 rounded-xl border-primary/25 bg-primary/5 px-5 hover:bg-primary/10"><WorkflowIcon className="h-4 w-4 text-cyan-500" />我要提高效率</Button></Link>
              <Link href="/posts"><Button variant="outline" className="h-11 gap-2 rounded-xl border-primary/25 bg-primary/5 px-5 hover:bg-primary/10"><BookOpen className="h-4 w-4 text-blue-500" />我要学习AI技术</Button></Link>
            </motion.div>

            {/* alphahole AI 决策助手 */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mx-auto max-w-2xl">
              <Link href="/assistant" className="block rounded-2xl border border-primary/25 bg-white/85 p-4 text-left shadow-md shadow-primary/10 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg dark:bg-slate-900/85">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm"><Bot className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <span className="block text-base font-semibold text-foreground">alphahole AI决策助手</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">基于站内工具、方法、案例和研究结果，帮你判断下一步该做什么</span>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {assistantShortcuts.map((s) => (
                    <span key={s} className="rounded-full border border-border/50 bg-background/60 px-2.5 py-1 text-[11px] text-muted-foreground">
                      {s}
                    </span>
                  ))}
                </div>
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mx-auto max-w-3xl">
              <div className="relative flex flex-col gap-2 rounded-2xl border border-border/60 bg-background/80 p-2 shadow-2xl shadow-purple-500/10 backdrop-blur-xl sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-2 px-2">
                  <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <input type="text" placeholder="搜索工具、发现、案例、教程或提示词..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && handleSearch()} className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" />
                </div>
                <div className="shrink-0">
                  <button ref={searchButtonRef} type="button" aria-haspopup="listbox" aria-expanded={searchMenuOpen} aria-controls="search-category-menu" onClick={() => setSearchMenuOpen((open) => !open)} className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-border/60 bg-background px-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary sm:w-[138px]">
                    <span>{selectedSearch.label}</span><span className="text-xs text-muted-foreground">⌄</span>
                  </button>
                </div>
                <Button size="sm" className="h-10 rounded-xl px-5" onClick={handleSearch}>搜索</Button>
              </div>
            </motion.div>
            <SearchCategoryPortal anchorRef={searchButtonRef} open={searchMenuOpen} selectedValue={searchCategory} onSelect={(value) => { setSearchCategory(value); setSearchMenuOpen(false); }} onClose={() => setSearchMenuOpen(false)} />

            <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="mr-1 text-muted-foreground">热门探索</span>
              {hotTags.map((tag) => <button key={tag} onClick={() => setSearchQuery(tag)} className="rounded-full border border-border/50 bg-background/50 px-3 py-1 text-muted-foreground backdrop-blur-sm transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary">{tag}</button>)}
            </div>
          </div>
        </motion.div>
        <div className="absolute bottom-0 left-0 right-0 z-10 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      <section className="relative z-20 -mt-10 pb-6">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-4 sm:grid-cols-3 lg:grid-cols-6">
          {libraryEntries.map((entry, index) => { const Icon = entry.icon; return <Link key={entry.slug} href={`/${entry.slug}`}><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ y: -4 }} className="post-card group relative h-28 overflow-hidden bg-white/95 p-4 shadow-sm hover:border-primary/25 hover:shadow-lg dark:bg-card"><div className={cn("absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl", entry.iconBg)}><Icon className={cn("h-4 w-4", entry.accent)} /></div><div className="relative z-10 flex h-full flex-col justify-between"><Icon className={cn("h-6 w-6", entry.accent)} /><div><h3 className="text-sm font-semibold leading-tight text-foreground">{entry.name}</h3><p className="mt-1 line-clamp-2 text-[10px] leading-4 text-muted-foreground">{entry.desc}</p></div></div></motion.div></Link>; })}
        </div>
      </section>

      {/* ══════════ alphahole 实验室 ══════════ */}
      <section className="py-8 sm:py-10">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeader eyebrow="BETA 实验" title="alphahole 实验室" description="把AI知识变成可以直接使用的判断工具和实验" href="/lab" accent="text-violet-600" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {labEntries.map((lab, index) => { const Icon = lab.icon; return (
              <Link key={lab.slug} href={`/lab/${lab.slug}`} className="group">
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} whileHover={{ y: -3 }} className={cn("h-full rounded-2xl border border-violet-200/50 bg-gradient-to-b from-violet-50/60 to-background p-5 shadow-sm transition-all hover:shadow-md dark:border-violet-500/20 dark:from-violet-500/5", lab.border)}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", lab.iconBg)}><Icon className={cn("h-4.5 w-4.5", lab.accent)} /></span>
                    <Badge className="border-0 bg-violet-500/10 text-[10px] text-violet-600 dark:text-violet-400">Beta</Badge>
                  </div>
                  <h3 className="mt-4 text-sm font-semibold leading-snug group-hover:text-primary">{lab.name}</h3>
                  <p className="mt-0.5 text-[10px] font-medium text-muted-foreground/70">{lab.en}</p>
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{lab.desc}</p>
                </motion.div>
              </Link>
            ); })}
          </div>
        </div>
      </section>

      {latestDiscoveries.length > 0 && <section className="py-8 sm:py-10"><div className="mx-auto max-w-6xl px-4"><SectionHeader eyebrow="每日更新" title="今日AI发现" description="发现新工具、新项目，找到值得亲自试用的方向" href="/discoveries" /><div className="grid gap-3 md:grid-cols-3">{latestDiscoveries.map((item, index) => <Link key={item.id} href={`/discoveries/${item.slug}`} className="group"><motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ y: -3 }} className="post-card h-full p-5"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Sparkles className="h-4 w-4" /></span><Badge variant="secondary" className="text-[10px]">🔥 推荐关注</Badge></div><h3 className="mt-4 line-clamp-2 font-semibold leading-snug group-hover:text-primary">{item.title}</h3><p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.excerpt || "查看项目简介、使用方法和关联工作流。"}</p><div className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground"><span>{new Date(item.updated_at).toLocaleDateString("zh-CN")}</span></div></motion.div></Link>)}</div></div></section>}

      {latestCases.length > 0 && <section className="py-8 sm:py-10"><div className="mx-auto max-w-6xl px-4"><SectionHeader eyebrow="差异化内容" title="最新赚钱案例" description="真实案例拆解，重点看方法、成本和执行周期，不夸大收益" href="/cases" accent="text-amber-600" /><div className="grid gap-3 md:grid-cols-3">{latestCases.map((item, index) => { const meta = item.metadata || {}; const ev = evidenceLabel[meta.evidenceLevel] || ""; return <Link key={item.id} href={`/cases/${item.slug}`} className="group"><motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ y: -3 }} className="post-card h-full p-5"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600"><Trophy className="h-4 w-4" /></span><Badge variant="secondary" className="text-[10px]">{item.category?.name || "案例拆解"}</Badge>{ev && <Badge className="border-0 bg-amber-500/10 text-[10px] text-amber-600 dark:text-amber-400">{ev}</Badge>}</div><h3 className="mt-4 line-clamp-2 font-semibold group-hover:text-primary">{item.title}</h3><p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.summary}</p></motion.div></Link>; })}</div></div></section>}

      {hotTools.length > 0 && <section className="py-8 sm:py-10"><div className="mx-auto max-w-6xl px-4"><SectionHeader eyebrow="开始使用" title="热门AI工具" description="从聊天模型到编程、自动化、设计和语音工具，直接进入使用" href="/tools" accent="text-emerald-600" /><div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">{hotTools.map((tool, index) => <Link key={tool.id} href={`/tools/${tool.id}`} className="group"><motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} whileHover={{ y: -3 }} className="post-card h-full p-3"><div className="flex items-center gap-2"><ToolLogo title={tool.title} thumbnail={tool.thumbnail} thumbnailBase64={tool.thumbnail_base64} className="h-8 w-8" /><h3 className="min-w-0 truncate text-sm font-semibold group-hover:text-primary">{tool.title}</h3></div><p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{tool.description}</p><div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground"><span>{tool.category?.name || "AI工具"}</span></div></motion.div></Link>)}</div></div></section>}

      {featuredWorkflows.length > 0 && <section className="py-8 sm:py-10"><div className="mx-auto max-w-6xl px-4"><SectionHeader eyebrow="直接复用" title="精选AI工作流" description="把工具串成可执行的流程，少走弯路，直接开始" href="/workflows" accent="text-cyan-600" /><div className="grid gap-3 md:grid-cols-3">{featuredWorkflows.map((workflow, index) => <Link key={workflow.id} href={`/workflows/${workflow.slug}`} className="group"><motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ y: -3 }} className="post-card h-full p-5"><div className="flex items-center justify-between gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600"><WorkflowIcon className="h-4 w-4" /></span><Badge variant="secondary" className="text-[10px]">{workflow.category?.name || "工作流"}</Badge></div><h3 className="mt-4 line-clamp-2 font-semibold group-hover:text-primary">{workflow.title}</h3><p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{workflow.description}</p><div className="mt-4 flex items-center gap-3 border-t border-border/30 pt-3 text-[10px] text-muted-foreground"><span className="flex items-center gap-1"><ListOrdered className="h-3 w-3" />{Array.isArray(workflow.steps) ? workflow.steps.length : 0} 步</span><span className="flex items-center gap-1"><Sparkles className="h-3 w-3" />{workflow.metadata?.duration || "可复用"}</span></div></motion.div></Link>)}</div></div></section>}

      {hotPrompts.length > 0 && <section className="py-8 sm:py-10"><div className="mx-auto max-w-6xl px-4"><SectionHeader eyebrow="拿来即用" title="提示词库" description="经过验证的AI提示词模板，复制后按你的任务改一两处" href="/prompts" accent="text-purple-600" /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{hotPrompts.map((prompt, index) => <Link key={prompt.id} href={`/prompts/${prompt.slug}`} className="group"><motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} whileHover={{ y: -3 }} className="post-card h-full p-4"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600"><Copy className="h-3.5 w-3.5" /></span><Badge variant="secondary" className="text-[10px]">{prompt.category?.name || "提示词"}</Badge></div><h3 className="mt-3 line-clamp-2 text-sm font-semibold group-hover:text-primary">{prompt.title}</h3><p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{prompt.excerpt || "打开详情后可一键复制。"}</p></motion.div></Link>)}</div></div></section>}

      {featuredPosts.length > 0 && <section className="py-8 sm:py-10"><div className="mx-auto max-w-6xl px-4"><SectionHeader eyebrow="方法与认知" title="知识精选" description="AI技术、教程、方法论和实战经验，帮助你把想法变成行动" href="/posts" accent="text-blue-600" /><div className="grid gap-4 lg:grid-cols-3">{firstFeatured && <Link href={`/posts/${firstFeatured.slug}`} className="group lg:col-span-2"><motion.div whileHover={{ y: -3 }} className="relative min-h-[300px] overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/80 via-purple-600/70 to-pink-600/70 p-6 text-white shadow-lg sm:p-8"><div className="absolute right-5 top-5 opacity-20"><Sparkles className="h-24 w-24" /></div><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-6 sm:p-8"><Badge className="border-0 bg-white/20 text-white">{knowledgeTypeLabel[(firstFeatured.metadata as any)?.type] || firstFeatured.category?.name || "AI知识库"}</Badge><h3 className="mt-3 line-clamp-3 text-xl font-bold leading-tight sm:text-2xl">{firstFeatured.title}</h3><p className="mt-2 line-clamp-2 text-sm text-white/75">{firstFeatured.excerpt}</p></div></motion.div></Link>}<div className="grid grid-cols-2 gap-3">{restFeatured.map((post) => <Link key={post.id} href={`/posts/${post.slug}`} className="group"><motion.div whileHover={{ y: -3 }} className="post-card h-full p-4"><Badge variant="secondary" className="text-[10px]">{knowledgeTypeLabel[(post.metadata as any)?.type] || post.category?.name || "AI知识库"}</Badge><h3 className="mt-3 line-clamp-3 text-sm font-semibold group-hover:text-primary">{post.title}</h3></motion.div></Link>)}</div></div></div></section>}

      {latestPosts.length > 0 && <section className="py-8 sm:py-10"><div className="mx-auto max-w-6xl px-4"><SectionHeader title="最新文章" description="持续更新的 AI 应用方法与实战教程" href="/posts" accent="text-slate-600" /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{latestPosts.map((post) => <Link key={post.id} href={`/posts/${post.slug}`} className="group"><motion.div whileHover={{ y: -3 }} className="post-card h-full p-4"><Badge variant="secondary" className="text-[10px]">{post.category?.name || "AI知识库"}</Badge><h3 className="mt-3 line-clamp-2 text-sm font-semibold group-hover:text-primary">{post.title}</h3>{post.excerpt && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{post.excerpt}</p>}<div className="mt-4 flex items-center justify-between border-t border-border/30 pt-2 text-[10px] text-muted-foreground"><span>{post.published_at ? new Date(post.published_at).toLocaleDateString("zh-CN") : ""}</span></div></motion.div></Link>)}</div></div></section>}

      {latestResources.length > 0 && <section className="py-8 pb-16 sm:py-10"><div className="mx-auto max-w-6xl px-4"><SectionHeader title="资源中心" description="AI资料、模板、工具合集，未来将支持会员专属资源" href="/resources" accent="text-rose-600" /><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{latestResources.map((resource) => <Link key={resource.id} href="/resources" className="group"><motion.div whileHover={{ y: -3 }} className="post-card h-full p-4"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600"><Download className="h-3.5 w-3.5" /></span><Badge variant="secondary" className="text-[10px]">{resource.type === "template" ? "模板" : resource.type === "pdf" ? "资料" : "资源"}</Badge></div><h3 className="mt-3 line-clamp-2 text-sm font-semibold group-hover:text-primary">{resource.title}</h3></motion.div></Link>)}</div></div></section>}

      {!latestPosts.length && !latestDiscoveries.length && <section className="py-24 text-center"><Users className="mx-auto h-12 w-12 text-muted-foreground/40" /><h2 className="mt-4 text-xl font-semibold">实验内容正在准备中</h2><p className="mt-2 text-muted-foreground">先从 AI助手 或 AI工具库开始探索。</p></section>}
    </div>
  );
}
