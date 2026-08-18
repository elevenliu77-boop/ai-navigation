"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Bot, Check, Loader2, Search, Sparkles } from "lucide-react";
import { Badge } from "@/ui/common/badge";
import { Button } from "@/ui/common/button";

interface AssistantResult {
  id: string;
  typeLabel: string;
  title: string;
  description: string;
  href: string;
  external?: boolean;
}

const examples = [
  "我是宝妈，想用 AI 做小红书副业",
  "我想搭一个企业内部 RAG 知识库",
  "我想提高日常写作和办公效率",
];

// AI 决策助手快捷入口
const shortcuts = [
  {
    label: "我想赚钱，但不知道做什么",
    icon: "💡",
  },
  {
    label: "我有一个AI项目，帮我判断值不值得做",
    icon: "🔍",
  },
  {
    label: "我想提高工作效率",
    icon: "⚡",
  },
  {
    label: "我想把自己的技能变成产品",
    icon: "🛠️",
  },
];

export default function AssistantClient() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [results, setResults] = useState<AssistantResult[]>([]);
  const [loading, setLoading] = useState(false);

  const ask = async (value = message) => {
    const nextMessage = value.trim();
    if (!nextMessage || loading) return;

    setMessage(nextMessage);
    setLoading(true);
    setReply("");
    setResults([]);

    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: nextMessage }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "请求失败");
      setReply(data.reply || "");
      setResults(data.results || []);
    } catch (error) {
      setReply(error instanceof Error ? error.message : "助手暂时无法响应");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4">
        <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-purple-500/10 p-8 sm:p-12">
          <div className="relative z-10 max-w-3xl">
            <Badge className="mb-5 gap-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
              <Sparkles className="w-3.5 h-3.5" /> 基于站内研究资产 Beta
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
              alphahole AI决策助手
            </h1>
            <p className="mt-4 text-muted-foreground text-base sm:text-lg leading-relaxed">
              基于站内工具、方法、案例和研究结果，帮你判断下一步该做什么。
            </p>
          </div>
          <Bot className="absolute -right-4 -bottom-8 h-44 w-44 text-primary/10" />
        </section>

        {/* 快捷入口 */}
        <section className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {shortcuts.map((shortcut) => (
            <button
              key={shortcut.label}
              onClick={() => ask(shortcut.label)}
              className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/40 px-4 py-3 text-left text-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <span className="text-lg">{shortcut.icon}</span>
              <span className="text-muted-foreground hover:text-foreground">{shortcut.label}</span>
            </button>
          ))}
        </section>

        <section className="mt-8 rounded-2xl border border-border/40 bg-card/40 p-4 sm:p-6">
          <div className="flex gap-2 rounded-xl border border-border/50 bg-background/70 p-2 shadow-sm">
            <Search className="ml-2 mt-2.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  ask();
                }
              }}
              placeholder="例如：我是宝妈，想用 AI 做小红书副业"
              className="min-h-12 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground/60"
              rows={2}
            />
            <Button
              onClick={() => ask()}
              disabled={loading || !message.trim()}
              className="self-end gap-1"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "开始规划"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground py-1">你可以这样问：</span>
            {examples.map((example) => (
              <button
                key={example}
                onClick={() => ask(example)}
                className="rounded-full border border-border/50 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
              >
                {example}
              </button>
            ))}
          </div>
        </section>

        {(reply || loading) && (
          <section className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-semibold">AI助手建议</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {loading ? "正在检索站内内容…" : reply}
                </p>
              </div>
            </div>
          </section>
        )}

        {results.length > 0 && (
          <section className="mt-8">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold">推荐从这里开始</h2>
                <p className="mt-1 text-sm text-muted-foreground">这些内容来自站内已有知识库</p>
              </div>
              <Check className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {results.map((result) =>
                result.external ? (
                  <a key={result.id} href={result.href} target="_blank" rel="noopener noreferrer" className="group">
                    <ResultCard result={result} />
                  </a>
                ) : (
                  <Link key={result.id} href={result.href} className="group">
                    <ResultCard result={result} />
                  </Link>
                )
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: AssistantResult }) {
  return (
    <div className="post-card h-full p-4 transition-transform group-hover:-translate-y-1">
      <Badge variant="secondary" className="text-[10px]">
        {result.typeLabel}
      </Badge>
      <h3 className="mt-3 font-semibold leading-snug group-hover:text-primary">
        {result.title}
      </h3>
      {result.description && (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
          {result.description}
        </p>
      )}
      <div className="mt-4 flex items-center gap-1 text-xs text-primary">
        查看详情 <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </div>
  );
}
