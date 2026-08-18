import LabBetaPage from "@/components/lab/lab-beta-page";

export const metadata = {
  title: "GitHub项目商业化检查器 · alphahole 实验室",
  description: "Open-source Business Readiness Auditor - 检查开源项目商业化条件。",
};

export default function OssReadinessAuditorPage() {
  return (
    <LabBetaPage
      labKey="oss-readiness-auditor"
      title="GitHub项目商业化检查器"
      enTitle="Open-source Business Readiness Auditor"
      description="许可证 ≠ 商业权。本实验检查许可、维护、需求、商标与托管边界，判断开源项目是否值得商业化。"
      fields={[
        { name: "repoUrl", label: "GitHub 项目地址", placeholder: "https://github.com/owner/repo" },
        { name: "license", label: "许可证（如已知）", placeholder: "MIT / Apache-2.0 / GPL / AGPL / 无…" },
        { name: "stars", label: "Star 数量（约）", placeholder: "例如：1k / 10k / 100k" },
        { name: "maintenance", label: "维护状态", placeholder: "活跃 / 间歇 / 停滞，最近提交时间" },
        { name: "goal", label: "目标变现方式", placeholder: "托管服务 / 企业版 / 实现服务 / 插件…" },
      ]}
      resultPreview={[
        { label: "许可证边界", desc: "是否允许商业化、白标、托管、修改再分发" },
        { label: "需求证据", desc: "Star/Issue/竞品 ≠ 付费需求，给出证据缺口" },
        { label: "商业模式匹配", desc: "哪种变现方式与项目形态最吻合" },
        { label: "风险清单", desc: "商标、上游依赖、维护负担与停止规则" },
      ]}
    />
  );
}
