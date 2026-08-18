import LabBetaPage from "@/components/lab/lab-beta-page";

export const metadata = {
  title: "内容漏斗诊断 · alphahole 实验室",
  description: "Content Funnel Diagnosis - 分析内容到付费转化的漏斗卡点。",
};

export default function ContentFunnelDiagnosisPage() {
  return (
    <LabBetaPage
      labKey="content-funnel-diagnosis"
      title="内容漏斗诊断"
      enTitle="Content Funnel Diagnosis"
      description="流量不是终点。本实验把你的内容数据按 触达→关注→信任→咨询→付费 拆解，定位最弱的环节。"
      fields={[
        { name: "platform", label: "内容平台", placeholder: "小红书 / 公众号 / 抖音 / B站 / 知乎…" },
        { name: "contentType", label: "内容类型", placeholder: "图文 / 视频 / 长文…" },
        { name: "followers", label: "粉丝数（约）", placeholder: "如实填写，不填也不会编造" },
        { name: "metrics", label: "最近数据概况", placeholder: "播放/阅读、互动、涨粉、私信咨询等（如实即可）", textarea: true },
        { name: "monetization", label: "变现方式（如有）", placeholder: "接广 / 咨询 / 课程 / 产品…" },
      ]}
      resultPreview={[
        { label: "漏斗定位", desc: "哪个环节是当前瓶颈（曝光/关注/信任/转化）" },
        { label: "证据说明", desc: "基于你提供的数据做推断，标注推断与事实" },
        { label: "下一轮实验", desc: "1 个最小实验 + 指标 + 周期 + 停止规则" },
      ]}
    />
  );
}
