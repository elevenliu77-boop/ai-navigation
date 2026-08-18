/* eslint-disable @typescript-eslint/no-unused-vars, @next/next/no-assign-module-variable, no-var */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createHash, randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/db";
import { assertPublicUrl, fetchPublicResponse } from "@/lib/utils/url-safety";
import { sanitizeHtml, sanitizeText } from "@/lib/utils/sanitize";

// 兼容旧引用：SSRF 校验函数统一收敛到 src/lib/utils/url-safety.ts
export const assertPublicSourceUrl = assertPublicUrl;

export const CONTENT_STUDIO_STATUSES = [
  "NEW", "FETCHING", "FETCH_FAILED", "CLASSIFIED", "VERIFYING", "GENERATING",
  "REVIEWING", "READY_FOR_SITE", "SITE_PUBLISHED", "NEEDS_REVIEW", "SOCIAL_READY", "REJECTED",
] as const;

export const CONTENT_STUDIO_PLATFORMS = ["WEBSITE", "XIAOHONGSHU", "WECHAT", "TOUTIAO"] as const;

const DEFAULT_SCORE_WEIGHTS = {
  positioning: 20,
  informationGain: 20,
  utility: 20,
  seo: 15,
  social: 10,
  timeliness: 5,
  sourceTrust: 10,
};

const MODULE_LABELS: Record<string, string> = {
  TOOL: "AI工具库",
  DISCOVERY: "AI发现",
  KNOWLEDGE: "AI知识库",
  CASE: "AI赚钱案例",
  WORKFLOW: "AI工作流",
  PROMPT: "提示词库",
  RESOURCE: "资源中心",
};

const MODULE_CATEGORY_SLUGS: Record<string, string[]> = {
  DISCOVERY: ["ai-discovery"],
  TOOL: ["ai-tools", "ai-chat", "ai-coding"],
  KNOWLEDGE: ["tutorials", "llm", "open-source"],
  CASE: ["case-content", "case-sidehustle", "case-business"],
  WORKFLOW: ["wf-automation", "wf-content", "wf-data"],
  PROMPT: ["prompt-writing", "prompt-marketing", "prompt-coding"],
  RESOURCE: ["res-report", "res-template", "res-course"],
};

export type SourcePlatform = "X" | "GITHUB" | "YOUTUBE" | "WEBSITE" | "BLOG" | "OTHER";

export type FetchedSource = {
  title: string;
  description: string;
  snapshot: string;
  officialUrl: string;
  author: string | null;
  fetchedAt: Date;
  fingerprint: string;
};

export type ClassificationResult = {
  primaryModule: string;
  relatedModules: string[];
  contentType: string;
  confidence: number;
  platformFit: { xiaohongshu: number; wechat: number; toutiao: number; website: number };
  reasoning: string[];
};

export type ReviewResult = {
  factScore: number;
  originalityScore: number;
  naturalnessScore: number;
  platformFitScore: number;
  copyrightRisk: "LOW" | "MEDIUM" | "HIGH";
  violationRisk: "LOW" | "MEDIUM" | "HIGH";
  suggestions: string[];
  finalState: "READY" | "NEEDS_REVIEW" | "REJECTED";
};

export type WebsiteDraft = {
  title: string;
  excerpt: string;
  body: string;
  metadata: Record<string, unknown>;
};

export type SocialDraft = {
  titleCandidates: string[];
  coverTitles?: string[];
  body: string;
  metadata: Record<string, unknown>;
};

export interface ContentStudioProvider {
  readonly name: string;
  classify(source: FetchedSource): ClassificationResult | Promise<ClassificationResult>;
  generateWebsite(source: FetchedSource, classification: ClassificationResult): WebsiteDraft | Promise<WebsiteDraft>;
  generateSocial(platform: "XIAOHONGSHU" | "WECHAT" | "TOUTIAO", source: FetchedSource, website: WebsiteDraft, classification: ClassificationResult): SocialDraft | Promise<SocialDraft>;
  review(content: string, source: FetchedSource, platform: string): ReviewResult | Promise<ReviewResult>;
}

function decodeEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function readMeta(html: string, key: string) {
  const pattern = new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']*)["'][^>]*>`, "i");
  const reversePattern = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${key}["'][^>]*>`, "i");
  return decodeEntities(html.match(pattern)?.[1] || html.match(reversePattern)?.[1] || "");
}

function htmlToText(html: string) {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  ).slice(0, 120000);
}

export function normalizeSourceUrl(value: string) {
  const url = new URL(value.trim());
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

export function detectSourcePlatform(value: string): SourcePlatform {
  const host = new URL(value).hostname.toLowerCase();
  if (host === "x.com" || host.endsWith(".x.com") || host === "twitter.com" || host.endsWith(".twitter.com")) return "X";
  if (host === "github.com" || host.endsWith(".github.com")) return "GITHUB";
  if (host === "youtube.com" || host === "youtu.be" || host.endsWith(".youtube.com")) return "YOUTUBE";
  if (["medium.com", "substack.com", "weixin.qq.com"].some((item) => host === item || host.endsWith(`.${item}`))) return "BLOG";
  if (host.includes("blog")) return "BLOG";
  return "WEBSITE";
}

export async function syncUrlsToContentStudio(urls: string[]) {
  const normalized = Array.from(new Set(urls.map((url) => normalizeSourceUrl(url))));
  if (!normalized.length) return { batchId: null, imported: 0, duplicates: [] as string[] };
  const existing = await prisma.contentStudioAsset.findMany({ where: { raw_url: { in: normalized } }, select: { raw_url: true } });
  const existingSet = new Set(existing.map((item) => item.raw_url));
  const newUrls = normalized.filter((url) => !existingSet.has(url));
  if (!newUrls.length) return { batchId: null, imported: 0, duplicates: normalized };
  const result = await prisma.$transaction(async (tx) => {
    const batch = await tx.contentStudioBatch.create({ data: { name: `素材资产同步 · ${new Date().toLocaleString("zh-CN")}` } });
    for (const rawUrl of newUrls) await tx.contentStudioAsset.create({ data: { raw_url: rawUrl, source_platform: detectSourcePlatform(rawUrl), batch_id: batch.id } });
    await tx.contentStudioBatch.update({ where: { id: batch.id }, data: { total_count: newUrls.length, pending_count: newUrls.length, status: "OPEN" } });
    return batch;
  });
  return { batchId: result.id, imported: newUrls.length, duplicates: normalized.filter((url) => existingSet.has(url)) };
}

export async function fetchSource(url: string): Promise<FetchedSource> {
  await assertPublicSourceUrl(url);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetchPublicResponse(url, {
      signal: controller.signal,
      headers: { "User-Agent": "alphahole-content-studio/1.0 (+https://alphahole.xyz)" },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > 2_000_000) throw new Error("来源页面超过 2MB，已停止抓取");
    const reader = response.body?.getReader();
    if (!reader) throw new Error("来源响应不可读取");
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (total <= 2_000_000) {
      const chunk = await reader.read();
      if (chunk.done) break;
      total += chunk.value.byteLength;
      if (total > 2_000_000) throw new Error("来源页面超过 2MB，已停止抓取");
      chunks.push(chunk.value);
    }
    const html = new TextDecoder().decode(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))));
    const title = readMeta(html, "og:title") || readMeta(html, "twitter:title") || decodeEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "未命名来源");
    const description = readMeta(html, "og:description") || readMeta(html, "description");
    const text = htmlToText(html);
    const snapshot = [description, text].filter(Boolean).join("\n\n").slice(0, 120000);
    const fingerprint = createHash("sha256").update(`${title}\n${snapshot}`).digest("hex");
    return {
      title: title || new URL(url).hostname,
      description: description || text.slice(0, 280),
      snapshot,
      officialUrl: url,
      author: readMeta(html, "author") || null,
      fetchedAt: new Date(),
      fingerprint,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function keywordScore(text: string, keywords: string[]) {
  const lower = text.toLowerCase();
  return keywords.reduce((score, keyword) => score + (lower.includes(keyword.toLowerCase()) ? 1 : 0), 0);
}

function metricScore(source: FetchedSource, kind: string) {
  const text = `${source.title} ${source.description} ${source.snapshot}`;
  if (kind === "positioning") return Math.min(100, 45 + keywordScore(text, ["ai", "人工智能", "自动化", "github", "模型", "agent"]) * 10);
  if (kind === "informationGain") return Math.min(100, source.snapshot.length > 3000 ? 90 : source.snapshot.length > 600 ? 70 : 40);
  if (kind === "utility") return Math.min(100, 35 + keywordScore(text, ["教程", "使用", "安装", "api", "workflow", "工作流", "功能", "docs"]) * 9);
  if (kind === "seo") return Math.min(100, 40 + Math.min(45, source.title.length * 2));
  if (kind === "social") return Math.min(100, 35 + keywordScore(text, ["图片", "视频", "效率", "赚钱", "案例", "模板", "免费"]) * 10);
  if (kind === "timeliness") return 70;
  if (kind === "sourceTrust") return source.officialUrl.includes("github.com") ? 95 : source.officialUrl.includes("x.com") || source.officialUrl.includes("twitter.com") ? 35 : 70;
  return 50;
}

async function getScoreWeights() {
  const setting = await prisma.setting.findUnique({ where: { key: "content_studio.score_weights" } });
  if (!setting) return DEFAULT_SCORE_WEIGHTS;
  try {
    const parsed = JSON.parse(setting.value);
    return { ...DEFAULT_SCORE_WEIGHTS, ...parsed } as typeof DEFAULT_SCORE_WEIGHTS;
  } catch {
    return DEFAULT_SCORE_WEIGHTS;
  }
}

export async function scoreSource(source: FetchedSource) {
  const weights = await getScoreWeights();
  const metrics = Object.fromEntries(Object.keys(weights).map((key) => [key, metricScore(source, key)]));
  const totalWeight = Object.values(weights).reduce((sum, item) => sum + Number(item || 0), 0) || 100;
  const score = Math.round(Object.entries(weights).reduce((sum, [key, weight]) => sum + (metrics[key] || 0) * Number(weight || 0), 0) / totalWeight);
  return { score: Math.max(0, Math.min(100, score)), breakdown: { metrics, weights } };
}

export class RuleBasedContentStudioProvider implements ContentStudioProvider {
  readonly name = "rule-based-v1";

  classify(source: FetchedSource): ClassificationResult {
    const text = `${source.title} ${source.description} ${source.snapshot}`.toLowerCase();
    const scores = [
      { module: "TOOL", score: keywordScore(text, ["tool", "工具", "app", "平台", "api", "软件"]) },
      { module: "DISCOVERY", score: keywordScore(text, ["github", "开源", "release", "项目", "新", "repo"]) },
      { module: "KNOWLEDGE", score: keywordScore(text, ["教程", "guide", "文档", "原理", "研究", "how to"]) },
      { module: "CASE", score: keywordScore(text, ["赚钱", "收入", "变现", "案例", "创业", "副业"]) },
      { module: "WORKFLOW", score: keywordScore(text, ["workflow", "工作流", "自动化", "n8n", "步骤", "pipeline"]) },
      { module: "PROMPT", score: keywordScore(text, ["prompt", "提示词", "提示", "模板"]) },
      { module: "RESOURCE", score: keywordScore(text, ["报告", "模板", "pdf", "下载", "资源", "dataset"]) },
    ].sort((a, b) => b.score - a.score);
    const primaryModule = scores[0].score > 0 ? scores[0].module : source.officialUrl.includes("github.com") ? "DISCOVERY" : "KNOWLEDGE";
    const relatedModules = scores.filter((item) => item.module !== primaryModule && item.score > 0).slice(0, 2).map((item) => item.module);
    const platformFit = {
      xiaohongshu: primaryModule === "TOOL" || primaryModule === "CASE" ? 78 : primaryModule === "PROMPT" ? 70 : 48,
      wechat: primaryModule === "KNOWLEDGE" || primaryModule === "DISCOVERY" ? 82 : 58,
      toutiao: primaryModule === "CASE" || primaryModule === "DISCOVERY" ? 76 : 45,
      website: 92,
    };
    return {
      primaryModule,
      relatedModules,
      contentType: primaryModule === "TOOL" ? "TOOL_REVIEW" : primaryModule === "DISCOVERY" ? "PROJECT_DISCOVERY" : `${primaryModule}_CONTENT`,
      confidence: Math.min(0.96, 0.52 + Math.min(scores[0].score, 4) * 0.1),
      platformFit,
      reasoning: [`主分类由公开页面标题、摘要和正文关键词判断：${MODULE_LABELS[primaryModule]}`, "未接入大模型时使用规则 Provider；事实仍需按来源人工复核"],
    };
  }

  generateWebsite(source: FetchedSource, classification: ClassificationResult): WebsiteDraft {
    const label = MODULE_LABELS[classification.primaryModule] || "AI知识库";
    const title = source.title.length > 70 ? `${source.title.slice(0, 67)}…` : source.title;
    const excerpt = `基于公开资料整理的${label}内容：${source.description || source.snapshot.slice(0, 150)}`;
    const body = `# ${title}\n\n> 本文根据公开资料重新整理，未将来源内容直接复制为结论。\n\n## 为什么值得关注\n\n它被归入「${label}」，原因是公开资料中出现了与 ${classification.reasoning[0]} 相关的信息。当前内容以来源核验和应用判断为主，不代替官方公告。\n\n## 它解决什么问题\n\n从公开页面能确认的方向是：${source.description || "帮助用户了解一个新的 AI 项目、工具或方法。"}\n\n## 适合谁\n\n更适合希望先了解项目边界、使用门槛和实际应用场景的普通用户、内容创作者、独立开发者或小团队。是否适合你的环境，需要结合官方文档和实际权限继续确认。\n\n## 核心信息\n\n- 内容类型：${classification.contentType}\n- 主要归类：${label}\n- 信息来源：${source.officialUrl}\n- 当前判断：公开资料可以支持方向性介绍，但价格、性能、兼容性和收益不应脱离官方来源单独下结论。\n\n## 怎么开始\n\n1. 先打开官方来源，确认项目状态、许可和使用条件。\n2. 用一个低成本、可回滚的小任务验证核心功能。\n3. 再决定是否接入现有工具、提示词或工作流。\n\n## 优点与局限\n\n优点：公开资料中有明确的项目介绍，适合继续研究。\n\n局限：本文没有虚构亲自测试、收益或长期稳定性；页面访问限制、版本变化和商业条款仍需人工复核。\n\n## 编辑判断\n\n从项目公开资料来看，它更适合先作为线索进入 alphahole 的内容关联体系，再根据官方文档补充具体教程和实测记录。\n\n## 相关来源\n\n- 原始灵感来源：[${source.officialUrl}](${source.officialUrl})\n- 官方来源：${source.officialUrl}\n`;
    return { title, excerpt, body, metadata: { module: label, sourceUrl: source.officialUrl, contentType: classification.contentType, relatedModules: classification.relatedModules } };
  }

  generateSocial(platform: "XIAOHONGSHU" | "WECHAT" | "TOUTIAO", source: FetchedSource, website: WebsiteDraft, classification: ClassificationResult): SocialDraft {
    const shortTitle = website.title.replace(/[：:，。].*$/, "");
    const titleCandidates = [
      `${shortTitle}：先看懂它解决什么问题`,
      `一个值得收藏的${MODULE_LABELS[classification.primaryModule] || "AI项目"}线索`,
      `别急着跟风，先从公开资料看${shortTitle}`,
      `${shortTitle}适合谁？这份整理先讲清楚`,
      `AI工具/项目观察：${shortTitle}`,
    ];
    const body = platform === "XIAOHONGSHU"
      ? `${website.title}\n\n这条内容更适合当作研究线索，不是夸张安利。\n\n它解决的问题：${source.description || "帮助用户了解一个新的 AI 项目或工具。"}\n\n适合：想先判断是否值得继续研究的人。\n\n建议顺序：看官方来源 → 做小任务验证 → 再考虑接入工作流。\n\n本文根据公开资料整理，没有虚构亲自体验或收益。`
      : platform === "WECHAT"
        ? `${website.title}\n\n${website.excerpt}\n\n${website.body}\n\n来源说明：本文基于公开页面重新组织，具体功能、价格和许可请以官方来源为准。`
        : `${website.title}\n\n${website.excerpt}\n\n这是什么？\n${source.description || "一个值得进一步核验的 AI 项目或工具。"}\n\n怎么判断是否适合自己？\n先看官方资料，再用小任务验证，避免只凭单条社交平台信息做结论。`;
    const imageCards = platform === "XIAOHONGSHU" ? [
      { index: 1, title: shortTitle, subtitle: "公开资料整理 · alphahole" },
      { index: 2, title: "它解决什么问题？", subtitle: source.description.slice(0, 80) },
      { index: 3, title: "适合哪些人？", subtitle: "普通用户 / 创作者 / 开发者 / 小团队" },
      { index: 4, title: "怎么开始？", subtitle: "官方来源 → 小任务验证 → 再接入工作流" },
      { index: 5, title: "需要注意什么？", subtitle: "版本、许可、价格和实际效果要继续核验" },
      { index: 6, title: "编辑判断", subtitle: "先作为线索收藏，再决定是否深入" },
      { index: 7, title: "来源", subtitle: source.officialUrl },
    ] : undefined;
    return {
      titleCandidates,
      coverTitles: platform === "XIAOHONGSHU" ? titleCandidates.slice(0, 3) : undefined,
      body,
      metadata: {
        tags: ["AI工具", "AI发现", MODULE_LABELS[classification.primaryModule]].filter(Boolean),
        firstComment: "你会把它用在什么任务上？欢迎补充官方资料或真实使用条件。",
        question: "你更想先看工具介绍、使用教程，还是工作流拆解？",
        imageCards,
        recommendedCoverTitle: titleCandidates[0],
        imageSuggestions: ["封面：项目名称与一句话结论", "中段：核心能力与适用人群", "结尾：使用路径与来源说明"],
        recommendedImages: ["项目官网或 GitHub 首页截图", "功能流程或公开演示截图"],
        keywords: ["AI", "工具", "开源项目", MODULE_LABELS[classification.primaryModule]].filter(Boolean),
        topics: ["AI工具", "效率提升", "项目发现"],
        platformFit: classification.platformFit,
        manualPublishOnly: true,
      },
    };
  }

  review(content: string, source: FetchedSource, platform: string): ReviewResult {
    const suggestions: string[] = [];
    const firstPersonRisk = /(我实测|我用了几天|我赚了多少钱|亲测|月入|稳赚|保证收益)/i.test(content);
    const claimRisk = /(最高|必然|绝对|100%|爆款|稳赚|保证)/i.test(content);
    const copyrightRisk = content.length > source.snapshot.length * 0.7 ? "HIGH" : content.length > 5000 ? "MEDIUM" : "LOW";
    const violationRisk = firstPersonRisk || claimRisk ? "HIGH" : platform === "XIAOHONGSHU" && /(加微信|私信领取|扫码)/.test(content) ? "MEDIUM" : "LOW";
    if (firstPersonRisk) suggestions.push("删除虚构的第一人称实测、使用时长或收益表述");
    if (claimRisk) suggestions.push("把绝对化或收益承诺改成有来源的限定性表达");
    if (!source.officialUrl || source.officialUrl.includes("x.com") || source.officialUrl.includes("twitter.com")) suggestions.push("补充官方官网、GitHub 或官方文档作为核验来源");
    if (copyrightRisk !== "LOW") suggestions.push("继续压缩来源复述，增加自己的结构化分析和应用判断");
    const finalState = violationRisk === "HIGH" || copyrightRisk === "HIGH" ? "NEEDS_REVIEW" : suggestions.length > 1 ? "NEEDS_REVIEW" : "READY";
    return { factScore: source.officialUrl.includes("github.com") ? 82 : 65, originalityScore: copyrightRisk === "LOW" ? 86 : 58, naturalnessScore: firstPersonRisk ? 45 : 78, platformFitScore: platform === "WEBSITE" ? 90 : 72, copyrightRisk, violationRisk, suggestions, finalState };
  }
}

type ModelProviderConfig = { apiKey: string; baseUrl: string; model: string };

async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs = 60_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function modelConfig(): ModelProviderConfig | null {
  const provider = process.env.CONTENT_STUDIO_PROVIDER;
  const apiKey = process.env.CONTENT_STUDIO_API_KEY || process.env.OPENAI_API_KEY;
  const model = process.env.CONTENT_STUDIO_MODEL;
  if (!provider || provider === "rule-based" || !apiKey || !model) return null;
  return { apiKey, model, baseUrl: (process.env.CONTENT_STUDIO_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "") };
}

async function callJsonModel(config: ModelProviderConfig, system: string, user: string) {
  const response = await fetchWithTimeout(`${config.baseUrl}/chat/completions`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${config.apiKey}` }, body: JSON.stringify({ model: config.model, temperature: 0.2, response_format: { type: "json_object" }, messages: [{ role: "system", content: system }, { role: "user", content: user.slice(0, 24000) }] }) });
  if (!response.ok) throw new Error(`AI Provider HTTP ${response.status}`);
  const json = await response.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI Provider 返回为空");
  return JSON.parse(String(content).replace(/^```json\s*|\s*```$/g, ""));
}

class OpenAICompatibleContentStudioProvider implements ContentStudioProvider {
  readonly name = "openai-compatible";
  constructor(private readonly config: ModelProviderConfig) {}
  async classify(source: FetchedSource) {
    return callJsonModel(this.config, "你是 alphahole 内容分类器。只能根据公开来源做谨慎判断，返回 JSON：primaryModule、relatedModules、contentType、confidence、platformFit、reasoning。模块只能使用 TOOL、DISCOVERY、KNOWLEDGE、CASE、WORKFLOW、PROMPT、RESOURCE。", JSON.stringify({ title: source.title, description: source.description, url: source.officialUrl, snapshot: source.snapshot }));
  }
  async generateWebsite(source: FetchedSource, classification: ClassificationResult) {
    return callJsonModel(this.config, "你是 alphahole 网站编辑。禁止复制原文、禁止虚构第一人称体验和收益。返回 JSON：title、excerpt、body、metadata。body 必须是中文 Markdown，包含为什么值得关注、解决什么问题、适合谁、核心能力、使用方法、优点、缺点、风险、编辑判断、来源。所有不确定事实要使用限定性表达。", JSON.stringify({ source, classification }));
  }
  async generateSocial(platform: "XIAOHONGSHU" | "WECHAT" | "TOUTIAO", source: FetchedSource, website: WebsiteDraft, classification: ClassificationResult) {
    return callJsonModel(this.config, `你是 alphahole ${platform} 内容编辑。只生成待人工发布成品，不自动发布。禁止虚构体验、夸大收益和低质量营销话术。返回 JSON：titleCandidates、coverTitles、body、metadata。根据平台调整语言节奏。小红书 metadata 必须包含 tags、firstComment、question、imageCards（7-9张，每张包含 index/title/subtitle）。公众号 metadata 必须包含 recommendedCoverTitle、imageSuggestions。今日头条 metadata 必须包含 recommendedImages、keywords、topics。`, JSON.stringify({ platform, source, website, classification }));
  }
  async review(content: string, source: FetchedSource, platform: string) {
    return callJsonModel(this.config, "你是独立审核器，不要沿用生成模型的判断。返回 JSON：factScore、originalityScore、naturalnessScore、platformFitScore、copyrightRisk、violationRisk、suggestions、finalState。finalState 只能 READY、NEEDS_REVIEW、REJECTED。重点检查事实来源、版权风险、虚构体验、收益承诺、敏感主题、引流和平台违规。", JSON.stringify({ platform, sourceUrl: source.officialUrl, sourceTitle: source.title, content }));
  }
}

export function getContentStudioProvider(): ContentStudioProvider {
  const config = modelConfig();
  if (config) return new OpenAICompatibleContentStudioProvider(config);
  return new RuleBasedContentStudioProvider();
}

function validateClassification(value: ClassificationResult) {
  const modules = new Set(["TOOL", "DISCOVERY", "KNOWLEDGE", "CASE", "WORKFLOW", "PROMPT", "RESOURCE"]);
  const fits = value?.platformFit;
  const validScore = (score: unknown, max = 100) => typeof score === "number" && Number.isFinite(score) && score >= 0 && score <= max;
  if (!value || !modules.has(value.primaryModule) || !Array.isArray(value.relatedModules) || value.relatedModules.length > 7 || value.relatedModules.some((item) => !modules.has(item)) || !fits || !validScore(value.confidence, 1) || !validScore(fits.website) || !validScore(fits.xiaohongshu) || !validScore(fits.wechat) || !validScore(fits.toutiao) || typeof value.contentType !== "string" || value.contentType.length > 120 || !Array.isArray(value.reasoning) || value.reasoning.length > 20 || value.reasoning.some((item) => typeof item !== "string" || item.length > 500)) throw new Error("Provider 返回的分类结果格式无效");
}

function validateReview(value: ReviewResult) {
  const validScore = (score: unknown) => typeof score === "number" && Number.isFinite(score) && score >= 0 && score <= 100;
  if (!value || !validScore(value.factScore) || !validScore(value.originalityScore) || !validScore(value.naturalnessScore) || !validScore(value.platformFitScore) || !["READY", "NEEDS_REVIEW", "REJECTED"].includes(value.finalState) || !["LOW", "MEDIUM", "HIGH"].includes(value.copyrightRisk) || !["LOW", "MEDIUM", "HIGH"].includes(value.violationRisk) || !Array.isArray(value.suggestions) || value.suggestions.length > 30 || value.suggestions.some((item) => typeof item !== "string" || item.length > 500)) throw new Error("Provider 返回的审核结果格式无效");
}

function validateWebsiteDraft(value: WebsiteDraft) {
  if (!value || typeof value.title !== "string" || !value.title.trim() || value.title.length > 200 || typeof value.excerpt !== "string" || value.excerpt.length > 2_000 || typeof value.body !== "string" || !value.body.trim() || value.body.length > 300_000 || !value.metadata || typeof value.metadata !== "object" || Array.isArray(value.metadata)) throw new Error("Provider 返回的网站稿格式无效");
}

function validateSocialDraft(value: SocialDraft) {
  if (!value || !Array.isArray(value.titleCandidates) || value.titleCandidates.length < 1 || value.titleCandidates.length > 10 || value.titleCandidates.some((item) => typeof item !== "string" || item.length > 300) || (value.coverTitles && (!Array.isArray(value.coverTitles) || value.coverTitles.length > 10 || value.coverTitles.some((item) => typeof item !== "string" || item.length > 300))) || typeof value.body !== "string" || !value.body.trim() || value.body.length > 300_000 || !value.metadata || typeof value.metadata !== "object" || Array.isArray(value.metadata)) throw new Error("Provider 返回的社媒稿格式无效");
}

export async function updateBatchCounters(batchId: number | null) {
  if (!batchId) return;
  const assets = await prisma.contentStudioAsset.findMany({ where: { batch_id: batchId }, select: { status: true } });
  const counts = assets.reduce((acc, item) => { acc.total += 1; if (["NEW", "FETCHING", "CLASSIFIED", "VERIFYING", "GENERATING", "REVIEWING"].includes(item.status)) acc.pending += 1; if (["FETCHING", "GENERATING", "REVIEWING"].includes(item.status)) acc.processing += 1; if (["READY_FOR_SITE", "SITE_PUBLISHED", "SOCIAL_READY"].includes(item.status)) acc.success += 1; if (item.status === "FETCH_FAILED") acc.failed += 1; if (item.status === "NEEDS_REVIEW") acc.review += 1; return acc; }, { total: 0, pending: 0, processing: 0, success: 0, failed: 0, review: 0 });
  const batch = await prisma.contentStudioBatch.findUnique({ where: { id: batchId }, select: { status: true } });
  await prisma.contentStudioBatch.update({ where: { id: batchId }, data: { total_count: counts.total, pending_count: counts.pending, processing_count: counts.processing, success_count: counts.success, failed_count: counts.failed, review_count: counts.review, status: batch?.status === "PAUSED" ? "PAUSED" : counts.pending === 0 ? "COMPLETED" : "OPEN" } });
}

function relationSearchTitle(source: FetchedSource) {
  return source.title.replace(/[^\p{L}\p{N}]+/gu, " ").trim().slice(0, 60);
}

export async function linkExistingContent(assetId: number, source: FetchedSource, classification: ClassificationResult) {
  const title = relationSearchTitle(source);
  if (title.length < 3) return [];
  const related: Array<{ target_type: string; target_id: number }> = [];
  const postMatches = await prisma.post.findMany({ where: { OR: [{ title: { contains: title, mode: "insensitive" } }, { content: { contains: title, mode: "insensitive" } }] }, select: { id: true }, take: 3 });
  related.push(...postMatches.map((item) => ({ target_type: "POST", target_id: item.id })));
  if (["TOOL", "DISCOVERY"].includes(classification.primaryModule)) {
    const websiteMatches = await prisma.website.findMany({ where: { OR: [{ title: { contains: title, mode: "insensitive" } }, { url: { contains: new URL(source.officialUrl).hostname, mode: "insensitive" } }] }, select: { id: true }, take: 3 });
    related.push(...websiteMatches.map((item) => ({ target_type: "WEBSITE", target_id: item.id })));
  }
  if (classification.relatedModules.includes("PROMPT") || classification.primaryModule === "PROMPT") {
    const promptMatches = await prisma.prompt.findMany({ where: { title: { contains: title, mode: "insensitive" } }, select: { id: true }, take: 2 });
    related.push(...promptMatches.map((item) => ({ target_type: "PROMPT", target_id: item.id })));
  }
  if (classification.relatedModules.includes("WORKFLOW") || classification.primaryModule === "WORKFLOW") {
    const workflowMatches = await prisma.workflow.findMany({ where: { title: { contains: title, mode: "insensitive" } }, select: { id: true }, take: 2 });
    related.push(...workflowMatches.map((item) => ({ target_type: "WORKFLOW", target_id: item.id })));
  }
  if (classification.relatedModules.includes("CASE") || classification.primaryModule === "CASE") {
    const caseMatches = await prisma.caseStudy.findMany({ where: { title: { contains: title, mode: "insensitive" } }, select: { id: true }, take: 2 });
    related.push(...caseMatches.map((item) => ({ target_type: "CASE", target_id: item.id })));
  }
  if (classification.relatedModules.includes("RESOURCE") || classification.primaryModule === "RESOURCE") {
    const resourceMatches = await prisma.resource.findMany({ where: { title: { contains: title, mode: "insensitive" } }, select: { id: true }, take: 2 });
    related.push(...resourceMatches.map((item) => ({ target_type: "RESOURCE", target_id: item.id })));
  }
  const unique = Array.from(new Map(related.map((item) => [`${item.target_type}:${item.target_id}`, item])).values());
  if (unique.length) await prisma.contentStudioRelation.createMany({ data: unique.map((item) => ({ asset_id: assetId, ...item })), skipDuplicates: true });
  return unique;
}

export async function processAsset(assetId: number) {
  if (process.env.CONTENT_STUDIO_ALLOW_AUTOGENERATION !== "true") {
    throw new Error("当前阶段已关闭自动生成；请先导入 ChatGPT 结构化研究结果，再进入内容导入中心审核");
  }
  const staleBefore = new Date(Date.now() - 20 * 60 * 1000);
  const processToken = `process:${randomUUID()}`;
  const lock = await prisma.contentStudioAsset.updateMany({
    where: {
      id: assetId,
      OR: [
        { status: { in: ["NEW", "FETCH_FAILED", "NEEDS_REVIEW"] }, OR: [{ locked_at: null }, { locked_at: { lt: staleBefore } }] },
        { status: "FETCHING", OR: [{ locked_at: null }, { locked_at: { lt: staleBefore } }] },
      ],
    },
    data: { status: "FETCHING", locked_at: new Date(), locked_by: processToken },
  });
  if (!lock.count) return null;
  const asset = await prisma.contentStudioAsset.findUnique({ where: { id: assetId } });
  if (!asset) {
    await prisma.contentStudioAsset.updateMany({ where: { id: assetId, locked_by: processToken }, data: { locked_at: null, locked_by: null } });
    throw new Error("素材不存在");
  }
  try {
    const source = asset.source_body_override
      ? { title: asset.fetched_title || new URL(asset.raw_url).hostname, description: asset.source_body_override.slice(0, 280), snapshot: asset.source_body_override, officialUrl: asset.official_url || asset.raw_url, author: asset.raw_author, fetchedAt: new Date(), fingerprint: createHash("sha256").update(`${asset.fetched_title || asset.raw_url}\n${asset.source_body_override}`).digest("hex") }
      : await fetchSource(asset.raw_url);
    const duplicateFingerprint = await prisma.contentStudioAsset.findFirst({ where: { content_fingerprint: source.fingerprint, id: { not: assetId } }, select: { id: true, raw_url: true } });
    const duplicateTitle = await prisma.contentStudioAsset.findFirst({ where: { fetched_title: { equals: source.title, mode: "insensitive" }, id: { not: assetId } }, select: { id: true, raw_url: true, fetched_title: true } });
    const duplicate = { fingerprint: duplicateFingerprint, title: duplicateTitle };
    const provider = getContentStudioProvider();
    const classification = await provider.classify(source);
    validateClassification(classification);
    const scoring = await scoreSource(source);
    const website = await provider.generateWebsite(source, classification);
    validateWebsiteDraft(website);
    const websiteReview = await provider.review(website.body, source, "WEBSITE");
    validateReview(websiteReview);
    const platformEntries: Array<["XIAOHONGSHU" | "WECHAT" | "TOUTIAO", number]> = [["XIAOHONGSHU", classification.platformFit.xiaohongshu], ["WECHAT", classification.platformFit.wechat], ["TOUTIAO", classification.platformFit.toutiao]];

    await prisma.contentStudioAsset.update({ where: { id: assetId }, data: { fetched_title: source.title, raw_author: source.author, fetched_at: source.fetchedAt, raw_snapshot: source.snapshot, official_url: source.officialUrl, content_fingerprint: source.fingerprint, source_platform: detectSourcePlatform(asset.raw_url), content_type: classification.contentType, value_score: scoring.score, score_breakdown: scoring.breakdown, classification: { ...classification, duplicate }, status: "REVIEWING" } });
    await linkExistingContent(assetId, source, classification);
    await prisma.contentStudioAudit.create({ data: { asset_id: assetId, stage: "CLASSIFIED", provider: provider.name, result: { classification, scoring, duplicate } } });

    const requiresManualReview = detectSourcePlatform(asset.raw_url) === "X" || Boolean(duplicate.fingerprint || duplicate.title);
    const websiteStatus = !requiresManualReview && websiteReview.finalState === "READY" && scoring.score >= 70 ? "READY" : "NEEDS_REVIEW";
    const websiteOutput = await prisma.contentStudioOutput.upsert({ where: { asset_id_platform: { asset_id: assetId, platform: "WEBSITE" } }, update: { status: websiteStatus, title_candidates: [website.title], body: website.body, metadata: website.metadata as any, review_result: websiteReview, generated_at: new Date() }, create: { asset_id: assetId, platform: "WEBSITE", status: websiteStatus, title_candidates: [website.title], body: website.body, metadata: website.metadata as any, review_result: websiteReview, generated_at: new Date() } });
    await prisma.contentStudioAudit.create({ data: { asset_id: assetId, output_id: websiteOutput.id, stage: "REVIEWED", provider: "independent-rule-review-v1", result: websiteReview } });
    for (const [platform, fit] of platformEntries) {
      if (fit < 50) continue;
      const social = await provider.generateSocial(platform, source, website, classification);
      validateSocialDraft(social);
      const review = await provider.review(social.body, source, platform);
      validateReview(review);
      await prisma.contentStudioOutput.upsert({ where: { asset_id_platform: { asset_id: assetId, platform } }, update: { status: review.finalState === "READY" ? "READY" : "NEEDS_REVIEW", title_candidates: social.titleCandidates, cover_titles: social.coverTitles, body: social.body, metadata: social.metadata as any, review_result: review, generated_at: new Date() }, create: { asset_id: assetId, platform, status: review.finalState === "READY" ? "READY" : "NEEDS_REVIEW", title_candidates: social.titleCandidates, cover_titles: social.coverTitles, body: social.body, metadata: social.metadata as any, review_result: review, generated_at: new Date() } });
    }
    const assetStatus = websiteOutput.status === "READY" ? "READY_FOR_SITE" : "NEEDS_REVIEW";
    const released = await prisma.contentStudioAsset.updateMany({ where: { id: assetId, locked_by: processToken }, data: { status: assetStatus, review_result: websiteReview, locked_at: null, locked_by: null } });
    if (!released.count) return (await prisma.contentStudioAsset.findUnique({ where: { id: assetId } })) || asset;
    const updated = await prisma.contentStudioAsset.findUnique({ where: { id: assetId } });
    await updateBatchCounters(asset.batch_id);
    return updated;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const released = await prisma.contentStudioAsset.updateMany({ where: { id: assetId, locked_by: processToken }, data: { status: "FETCH_FAILED", manual_notes: message, locked_at: null, locked_by: null } });
    const updated = released.count ? await prisma.contentStudioAsset.findUnique({ where: { id: assetId } }) : await prisma.contentStudioAsset.findUnique({ where: { id: assetId } });
    await updateBatchCounters(asset.batch_id);
    return updated;
  }
}

export async function publishWebsiteOutput(outputId: number, force = false) {
  const output = await prisma.contentStudioOutput.findUnique({ where: { id: outputId }, include: { asset: true } });
  if (!output || output.platform !== "WEBSITE") throw new Error("网站稿不存在");
  if (output.asset.site_content_id) return output.asset.site_content_id;
  if (!output.body?.trim()) throw new Error("网站稿正文为空，不能发布");
  const review = (output.review_result || {}) as Partial<ReviewResult>;
  if (!force && (output.status !== "READY" || review.finalState !== "READY")) throw new Error("该内容仍需人工审核，不能直接发布");
  const publishToken = `publish:${randomUUID()}`;
  const publishClaim = await prisma.contentStudioAsset.updateMany({ where: { id: output.asset.id, site_content_id: null, OR: [{ locked_by: null }, { locked_at: { lt: new Date(Date.now() - 20 * 60 * 1000) } }] }, data: { locked_by: publishToken, locked_at: new Date() } });
  if (!publishClaim.count) {
    const current = await prisma.contentStudioAsset.findUnique({ where: { id: output.asset.id }, select: { site_content_id: true } });
    if (current?.site_content_id) return current.site_content_id;
    throw new Error("该内容正在发布，请稍后重试");
  }
  try {
    const module = String((output.metadata as any)?.module || "");
    const moduleKey = Object.entries(MODULE_LABELS).find(([, label]) => label === module)?.[0] || "DISCOVERY";
    const category = (await prisma.category.findFirst({ where: { slug: { in: MODULE_CATEGORY_SLUGS[moduleKey] || [] } }, orderBy: { id: "asc" } })) || await prisma.category.findFirst({ where: { type: "post" }, orderBy: { id: "asc" } });
    if (!category) throw new Error("找不到可发布的文章分类");
    const title = String((output.title_candidates as any)?.[0] || output.asset.fetched_title || "AI内容整理").trim();
    const post = await prisma.$transaction(async (tx) => {
      const created = await tx.post.create({ data: { title: sanitizeText(title, 300) || "AI内容整理", slug: `studio-${output.asset.id}-${Date.now()}`, content: sanitizeHtml(output.body || "", 300_000), excerpt: sanitizeText((output.metadata as any)?.excerpt || "", 2000), metadata: { contentStudioAssetId: output.asset.id, sourceUrl: output.asset.raw_url, officialUrl: output.asset.official_url, generatedBy: "content-studio" }, status: "published", published_at: new Date(), category_id: category.id } });
      await tx.contentStudioRelation.create({ data: { asset_id: output.asset.id, target_type: "POST", target_id: created.id, relation_type: "PRIMARY" } });
      await tx.contentStudioOutput.update({ where: { id: outputId }, data: { status: "SITE_PUBLISHED" } });
      await tx.contentStudioAsset.update({ where: { id: output.asset.id }, data: { status: "SITE_PUBLISHED", site_content_id: created.id, locked_at: null, locked_by: null } });
      return created;
    });
    await updateBatchCounters(output.asset.batch_id);
    return post.id;
  } catch (error) {
    await prisma.contentStudioAsset.updateMany({ where: { id: output.asset.id, site_content_id: null, locked_by: publishToken }, data: { locked_at: null, locked_by: null } });
    throw error;
  }
}

export async function serializeStudioAsset(asset: any) {
  return { ...asset, created_at: asset.created_at?.toISOString?.() || asset.created_at, updated_at: asset.updated_at?.toISOString?.() || asset.updated_at, fetched_at: asset.fetched_at?.toISOString?.() || asset.fetched_at, outputs: asset.outputs?.map((output: any) => ({ ...output, generated_at: output.generated_at?.toISOString?.() || output.generated_at, updated_at: output.updated_at?.toISOString?.() || output.updated_at })), relations: asset.relations || [] };
}
