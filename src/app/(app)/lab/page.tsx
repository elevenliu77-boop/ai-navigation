import Link from "next/link";
import { Filter, FlaskConical, Search, ShieldCheck, Target } from "lucide-react";
import { Badge } from "@/ui/common/badge";
import { prisma } from "@/lib/db/db";

export const metadata = {
  title: "alphahole 实验室 · alphahole",
  description: "把AI知识变成可以直接使用的判断工具和实验。",
};

const labs = [
  {
    slug: "personal-company-fit",
    name: "找适合我的AI赚钱模式",
    en: "Personal Company Fit Lab",
    desc: "根据你的技能、时间、风险偏好和资源，匹配适合的AI变现方向，并给出验证路径。",
    icon: Target,
    accent: "text-violet-600",
    iconBg: "bg-violet-500/10",
    border: "hover:border-violet-400/50",
  },
  {
    slug: "tool-opportunity-finder",
    name: "AI小工具机会发现器",
    en: "AI Tool Opportunity Finder",
    desc: "从你熟悉的领域和需求信号里，识别值得做成 AI 小工具的机会。",
    icon: Search,
    accent: "text-sky-600",
    iconBg: "bg-sky-500/10",
    border: "hover:border-sky-400/50",
  },
  {
    slug: "oss-readiness-auditor",
    name: "GitHub项目商业化检查器",
    en: "Open-source Business Readiness Auditor",
    desc: "检查开源项目的许可、维护、需求与商业边界，判断是否值得商业化。",
    icon: ShieldCheck,
    accent: "text-emerald-600",
    iconBg: "bg-emerald-500/10",
    border: "hover:border-emerald-400/50",
  },
  {
    slug: "content-funnel-diagnosis",
    name: "内容漏斗诊断",
    en: "Content Funnel Diagnosis",
    desc: "从内容到付费转化的漏斗分析，找出卡点并给出下一轮实验建议。",
    icon: Filter,
    accent: "text-amber-600",
    iconBg: "bg-amber-500/10",
    border: "hover:border-amber-400/50",
  },
];

export default async function LabPage() {
  // 研究资产接入状态（真实数据，来自 ZIP 导入）
  const [assetCount, relationCount, methodRelations] = await Promise.all([
    prisma.researchAsset.count(),
    prisma.researchRelation.count(),
    prisma.researchRelation.groupBy({ by: ["targetName"], where: { relationType: { in: ["STRENGTHENS", "METHOD"] } }, _count: true }),
  ]);

  const labKeyword: Record<string, string[]> = {
    "personal-company-fit": ["个人公司", "Personal Company", "变现", "机会"],
    "tool-opportunity-finder": ["机会", "Opportunity", "小工具", "需求"],
    "oss-readiness-auditor": ["开源", "Open-source", "商业化", "License"],
    "content-funnel-diagnosis": ["漏斗", "内容", "分发", "Content"],
  };
  const labMethodCount: Record<string, number> = {};
  for (const lab of labs) {
    const keywords = labKeyword[lab.slug] || [];
    labMethodCount[lab.slug] = methodRelations.filter((m) =>
      keywords.some((k) => m.targetName.toLowerCase().includes(k.toLowerCase()))
    ).length;
  }

  return (
    <div className="min-h-screen py-12">
      <div className="mx-auto max-w-6xl px-4">
        <header className="mb-10">
          <div className="flex items-center gap-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <FlaskConical className="h-5 w-5" />
            </span>
            <Badge className="border-0 bg-violet-500/10 text-violet-600 dark:text-violet-400">Beta</Badge>
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">alphahole 实验室</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            把AI知识变成可以直接使用的判断工具和实验。已接入研究资产 {assetCount} 项、方法关系 {relationCount} 条，分析引擎将基于这些资产逐步上线。
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {labs.map((lab) => {
            const Icon = lab.icon;
            return (
              <Link key={lab.slug} href={`/lab/${lab.slug}`} className="group">
                <div className={`h-full rounded-2xl border border-border/40 bg-card/40 p-6 transition-all hover:shadow-md ${lab.border}`}>
                  <div className="flex items-start justify-between">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${lab.iconBg}`}>
                      <Icon className={`h-5 w-5 ${lab.accent}`} />
                    </span>
                    <Badge className="border-0 bg-violet-500/10 text-[10px] text-violet-600 dark:text-violet-400">Beta</Badge>
                  </div>
                  <h2 className="mt-5 text-lg font-semibold group-hover:text-primary">{lab.name}</h2>
                  <p className="mt-0.5 text-xs font-medium text-muted-foreground/70">{lab.en}</p>
                  <p className="mt-3 text-sm text-muted-foreground">{lab.desc}</p>
                  <div className="mt-4 border-t border-border/30 pt-3">
                    <span className="text-[11px] text-muted-foreground">
                      引用研究方法：{labMethodCount[lab.slug] || 0} 项（研究资产匹配）
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
