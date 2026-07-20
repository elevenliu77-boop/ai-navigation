import { Card, CardContent } from "@/ui/common/card";
import {
  Brain,
  Github,
  Server,
  BookOpen,
  Code2,
  Sparkles,
  MessageCircle,
} from "lucide-react";

export const metadata = {
  title: "关于 alphahole",
  description: "alphahole.xyz — 探索 AI 开发与开源项目的最新动态、工具评测与实践教程。",
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
            专注分享 AI 开发工具、开源项目、自部署方案与技术教程
          </p>
        </div>
        {/* 背景光球 */}
        <div className="absolute top-1/2 left-1/4 w-72 h-72 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-purple-500/5 blur-3xl" />
      </section>

      {/* 定位 */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <Code2 className="w-6 h-6" />, title: "AI 开发工具", desc: "LLM 框架、AI SDK、模型部署与开发工具评测" },
              { icon: <Github className="w-6 h-6" />, title: "开源项目", desc: "精选值得关注的开源 AI 与开发者项目" },
              { icon: <Server className="w-6 h-6" />, title: "自部署方案", desc: "自托管、私有化部署的完整技术方案" },
              { icon: <BookOpen className="w-6 h-6" />, title: "技术教程", desc: "AI 开发与工程实践的手把手教程" },
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
                  alphahole.xyz 是一个专注于 AI 开发和开源技术的内容分享平台。
                  我们关注 AI 前沿技术，分享实用的开发工具和开源项目，帮助开发者更高效地工作。
                </p>
                <p>
                  网站内容由编辑撰写，所有评测和推荐均基于实际使用体验。
                  我们与任何商业品牌无利益关联，保持内容的中立和客观。
                </p>
                <p>
                  如有建议或合作需求，欢迎通过以下方式联系我们。
                </p>
              </div>
            </div>
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
