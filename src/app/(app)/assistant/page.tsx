import AssistantClient from "./assistant-client";

export const metadata = {
  title: "alphahole AI决策助手 · alphahole",
  description:
    "基于站内工具、方法、案例和研究结果，帮你判断下一步该做什么。",
};

export default function AssistantPage() {
  return <AssistantClient />;
}
