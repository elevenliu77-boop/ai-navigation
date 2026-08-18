// 案例证据等级 → 中文展示（NO FAKE SOCIAL PROOF 配套）
export const evidenceLabel: Record<string, string> = {
  SOURCE_CLAIM: "案例自述",
  SOURCE_CASE: "案例自述",
  SCREENSHOT_ONLY: "截图证据",
  BACKEND_DATA: "后台数据",
  REVENUE_VERIFIED: "收入已核",
  COST_VERIFIED: "成本已核",
  NET_PROFIT_VERIFIED: "净利润已核",
};

export const evidenceDescription: Record<string, string> = {
  SOURCE_CLAIM: "来自作者/来源的自述，未独立核实",
  SOURCE_CASE: "单一案例来源，不代表普遍结果",
  SCREENSHOT_ONLY: "仅有截图证据，缺少后台与成本数据",
  BACKEND_DATA: "有后台/订单数据支持",
  REVENUE_VERIFIED: "收入数据已核验",
  COST_VERIFIED: "成本数据已核验",
  NET_PROFIT_VERIFIED: "净利润已完整核验",
};

export function evidenceLevelLabel(level: unknown): string {
  if (typeof level !== "string") return "";
  return evidenceLabel[level] || "";
}

export function evidenceLevelDescription(level: unknown): string {
  if (typeof level !== "string") return "";
  return evidenceDescription[level] || "";
}
