import LabBetaPage from "@/components/lab/lab-beta-page";

export const metadata = {
  title: "AI小工具机会发现器 · alphahole 实验室",
  description: "AI Tool Opportunity Finder - 从需求信号中识别值得做的AI小工具机会。",
};

export default function ToolOpportunityFinderPage() {
  return (
    <LabBetaPage
      labKey="tool-opportunity-finder"
      title="AI小工具机会发现器"
      enTitle="AI Tool Opportunity Finder"
      description="从小众需求、重复劳动和社区抱怨中，识别值得做成 AI 小工具的机会。Beta 阶段先收集你的领域信号。"
      fields={[
        { name: "domain", label: "你熟悉的领域", placeholder: "例如：跨境电商、留学、HR、餐饮、法律…" },
        { name: "pain", label: "你观察到的重复劳动/痛点", placeholder: "描述你或身边人反复做的低效事情", textarea: true },
        { name: "audience", label: "目标人群", placeholder: "谁愿意为这个工具付费或使用" },
        { name: "competing", label: "现有替代方案", placeholder: "现在大家怎么解决这个问题" },
      ]}
      resultPreview={[
        { label: "机会评分", desc: "需求强度 × 付费意愿 × 你的技能匹配" },
        { label: "最小产品建议", desc: "第一版只解决一个高频判断/动作" },
        { label: "分发渠道", desc: "目标人群在哪里聚集，如何触达" },
        { label: "竞品边界", desc: "已有方案的缺口与你的差异化" },
      ]}
    />
  );
}
