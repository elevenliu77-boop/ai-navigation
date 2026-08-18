// FINAL 研究资产 → 网站栏目归类（用于批量发布审核筛选）
// 关键词映射，仅供筛选辅助；不改变资产本身
const categoryRules: { key: string; label: string; keywords: string[] }[] = [
  { key: "tools", label: "AI工具", keywords: ["工具", "cursor", "n8n", "模型", "ide", "app", "软件", "插件", "github", "开源项目", "部署", "本地", "api", "cli"] },
  { key: "cases", label: "AI赚钱案例", keywords: ["赚钱", "收入", "副业", "变现", "案例", "月入", "收益", "赚", "接单", "佣金", "广告收入"] },
  { key: "workflows", label: "AI工作流", keywords: ["工作流", "自动化", "流程", "agent", "批量", "pipeline", "任务", "脚本"] },
  { key: "prompts", label: "提示词", keywords: ["prompt", "提示词", "提示", "咒语", "指令"] },
  { key: "knowledge", label: "AI知识", keywords: ["教程", "指南", "方法", "框架", "知识", "学习", "原理", "协议", "合同", "checklist", "清单", "规则", "认知", "误区"] },
  { key: "resources", label: "资源", keywords: ["资料", "合集", "模板", "库", "清单", "资源", "素材", "报告"] },
  { key: "lab", label: "实验室", keywords: ["判断", "决策", "实验", "机会", "auditor", "diagnosis", "fit", "匹配"] },
];

export function classifyContent(text: string): { key: string; label: string } {
  const hay = (text || "").toLowerCase();
  let best: { key: string; label: string } | null = null;
  let bestHits = 0;
  for (const rule of categoryRules) {
    const hits = rule.keywords.filter((k) => hay.includes(k)).length;
    if (hits > bestHits) {
      bestHits = hits;
      best = { key: rule.key, label: rule.label };
    }
  }
  return best || { key: "general", label: "综合" };
}
