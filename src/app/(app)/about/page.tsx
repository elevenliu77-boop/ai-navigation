import { Card, CardContent } from "@/ui/common/card";
import {
  Brain,
  Wrench,
  BookOpen,
  Workflow,
  Trophy,
  Copy,
  Sparkles,
  MessageCircle,
} from "lucide-react";

export const metadata = {
  title: "关于 alphahole",
  description: "alphahole.xyz — AI时代的效率与赚钱知识库，探索AI工具、自动化工作流和真实应用案例。",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Brain className="h-14 w-14 mx-auto text-primary animate-float mb-6" />
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            关于 alphahole
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            AI 时代的效率与赚钱知识库，帮助普通人和企业真正用好 AI
          </p>
        </div>
        {/* 背景光球 */}
        <div className="absolute top-1/2 left-1/4 w-72 h-72 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-purple-500/5 blur-3xl" />
      </section>

      {/* 定位 */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: <Wrench className="w-6 h-6" />, title: "AI 工具库", desc: "精选 AI 工具评测与使用指南，帮你选对工具" },
              { icon: <BookOpen className="w-6 h-6" />, title: "AI 知识库", desc: "AI 技术、应用方法与实战教程，从入门到进阶" },
              { icon: <Trophy className="w-6 h-6" />, title: "AI 赚钱案例", desc: "普通人和企业使用 AI 创造收益的真实拆解" },
              { icon: <Workflow className="w-6 h-6" />, title: "AI 工作流", desc: "可直接复用的 AI 自动化流程，提高效率" },
              { icon: <Copy className="w-6 h-6" />, title: "提示词库", desc: "精选可复制的 AI 提示词，一键提升输出质量" },
              { icon: <Sparkles className="w-6 h-6" />, title: "资源中心", desc: "AI 资料、模板和工具合集" },
            ].map((item, i) => (
              <Card key={i} className="bg-card/50 backdrop-blur-sm border-border/30">
                <CardContent className="p-5 text-center">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 text-primary">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 声明 */}
      <section className="py-12 border-t border-border/30">
        <div className="max-w-3xl mx-auto px-4">
          <div className="p-6 rounded-2xl bg-card/30 backdrop-blur-sm border border-border/20">
            <div className="flex items-start gap-4">
              <Sparkles className="w-6 h-6 text-primary shrink-0 mt-0.5" />
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                  alphahole.xyz 是一个专注于 AI 效率与变现的知识分享平台。
                  我们拆解真实赚钱案例，整理可直接复用的工作流和提示词，帮助副业用户、自媒体人和小企业用 AI 解决实际问题、真正产生价值。
                </p>
                <p>
                  所有工具评测和案例拆解均基于实际使用体验，与任何商业品牌无利益关联，保持内容的中立和客观。
                </p>
                <p>
                  如有建议或合作需求，欢迎通过以下方式联系我们。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 border-t border-border/30">
        <div className="max-w-3xl mx-auto px-4">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
            <h2 className="text-xl font-bold">未来规划</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              我们会先持续完善文章标签、知识关联和内容质量，再逐步建设 AI 搜索、RAG 知识助手和会员资源体系，让每一次访问都更接近一个可执行的解决方案。
            </p>
          </div>
        </div>
      </section>

      {/* 联系方式 */}
      <section className="py-12 text-center">
        <div className="max-w-md mx-auto px-4 space-y-4">
          <MessageCircle className="w-8 h-8 text-primary mx-auto" />
          <h2 className="text-xl font-bold">联系我们</h2>
          <p className="text-sm text-muted-foreground">
            意见反馈、合作咨询，欢迎发送邮件或通过 GitHub 讨论
          </p>
          <div className="flex items-center justify-center gap-4 text-sm">
            <a href="mailto:hello@alphahole.xyz" className="text-primary hover:underline">
              hello@alphahole.xyz
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
