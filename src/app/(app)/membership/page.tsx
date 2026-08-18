import Link from "next/link";
import { ArrowRight, Check, Crown, Lock, Sparkles } from "lucide-react";
import { Badge } from "@/ui/common/badge";
import { Button } from "@/ui/common/button";

export const metadata = {
  title: "会员中心 · alphahole",
  description:
    "查看 alphahole 会员权益，解锁高级资料、提示词、工作流和 AI 助手能力。",
};

const benefits = [
  "高级资料与模板下载",
  "精选高级提示词合集",
  "可复用工作流模板",
  "AI助手的深度规划能力",
];

export default function MembershipPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4">
        <section className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-background to-purple-500/10 p-8 sm:p-12">
          <div className="relative z-10 max-w-3xl">
            <Badge className="mb-5 gap-1 bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/10">
              <Crown className="w-3.5 h-3.5" /> 会员体系预留
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
              把好内容，变成长期资产
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              会员中心已经接入资源权限结构。当前先开放免费内容，后续随着内容增长逐步开放高级资料和会员能力。
            </p>
          </div>
          <Crown className="absolute -right-4 -bottom-8 h-44 w-44 text-amber-500/10" />
        </section>

        <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border/40 bg-card/40 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">免费用户</h2>
              <Badge variant="secondary">当前开放</Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              先用内容解决问题，再决定是否需要更深的服务。
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "浏览 AI知识库",
                "使用公开提示词和工作流",
                "查看公开赚钱案例",
                "使用站内 AI助手检索",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 shadow-lg shadow-amber-500/5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">VIP会员</h2>
              <Badge className="gap-1 bg-amber-500 text-white hover:bg-amber-500">
                <Crown className="h-3 w-3" /> 即将开放
              </Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              会员权限字段已接入资源中心，支付和账号系统将在内容规模稳定后开启。
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {benefits.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-amber-500" />
                  {item}
                </li>
              ))}
            </ul>
            <Button asChild className="mt-6 w-full gap-2" variant="outline">
              <Link href="/resources">
                先浏览资源中心 <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-border/40 bg-card/30 p-6 text-center">
          <Sparkles className="mx-auto h-7 w-7 text-primary" />
          <h2 className="mt-3 text-xl font-bold">会员体系的推进顺序</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            先完成文章标签与知识关联，再持续做内容增长和 AI 搜索/RAG，最后根据真实使用需求决定会员权益和付费方式。
          </p>
        </section>
      </div>
    </div>
  );
}
