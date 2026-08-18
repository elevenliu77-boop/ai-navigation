import LabBetaPage from "@/components/lab/lab-beta-page";

export const metadata = {
  title: "找适合我的AI赚钱模式 · alphahole 实验室",
  description: "Personal Company Fit Lab - 根据你的技能、时间和风险偏好匹配AI变现方向。",
};

export default function PersonalCompanyFitPage() {
  return (
    <LabBetaPage
      labKey="personal-company-fit"
      title="找适合我的AI赚钱模式"
      enTitle="Personal Company Fit Lab"
      description="把你当成一家微型公司：技能、时间、风险偏好和资源决定你适合哪条 AI 变现路径。本实验基于站内研究方法库构建判断框架。"
      fields={[
        { name: "skills", label: "你的核心技能", placeholder: "例如：写作、设计、编程、数据分析、销售…" },
        { name: "hours", label: "每周可投入时间", placeholder: "例如：5小时 / 10小时 / 20小时" },
        { name: "risk", label: "风险偏好", placeholder: "例如：稳健（不希望投入金钱）/ 中等 / 可承担小成本试错" },
        { name: "income", label: "期望月收入目标", placeholder: "例如：1000元 / 5000元 / 1万元以上" },
        { name: "context", label: "背景补充（可选）", placeholder: "你目前的职业、资源、账号情况…", textarea: true },
      ]}
      resultPreview={[
        { label: "匹配的变现模式", desc: "服务 / 产品 / 分销 / 资产收入 / 投机，按你的画像排序" },
        { label: "证据等级", desc: "每个方向标注当前研究证据等级，不做虚假收益承诺" },
        { label: "验证路径", desc: "30 天最小实验：渠道、动作、指标、停止规则" },
        { label: "风险与失败条件", desc: "依赖、成本、平台规则与常见死法" },
      ]}
    />
  );
}
