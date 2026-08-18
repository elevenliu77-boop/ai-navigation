
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/db/db";
import { contentPackageSchema, type ContentPackage } from "@/lib/content-import/schema";

export const ASSET_SOURCE_TYPES = ["X", "GITHUB", "WEBSITE", "YOUTUBE", "OTHER"] as const;
export const ASSET_CATEGORIES = ["AI工具库", "AI发现", "AI知识库", "AI赚钱案例", "AI工作流", "提示词库", "资源中心", "方法论", "商业机会"] as const;
export const ASSET_STATUSES = ["NEW", "ANALYZING", "RESEARCHING", "VERIFIED", "CONTENT_READY", "PUBLISHED", "METHOD_LIBRARY", "BUSINESS_OPPORTUNITY", "OBSERVATION", "REJECTED"] as const;
export const ASSET_PRIORITIES = ["S", "A", "B", "C", "D"] as const;
export const ASSET_DECISIONS = ["发布", "观察", "淘汰", "方法库", "商业机会"] as const;

export type AssetSourceType = typeof ASSET_SOURCE_TYPES[number];
export type AssetCreateInput = { sourceUrl: string; title?: string; sourceType?: AssetSourceType; author?: string };

function cleanUrl(value: string) {
  const url = new URL(value.trim());
  if (!/^https?:$/.test(url.protocol)) throw new Error("只支持 http/https 链接");
  return url.toString();
}

export function sourceTypeForUrl(value: string): AssetSourceType {
  const hostname = new URL(value).hostname.toLowerCase();
  if (hostname === "x.com" || hostname.endsWith(".x.com") || hostname === "twitter.com" || hostname.endsWith(".twitter.com")) return "X";
  if (hostname === "github.com" || hostname.endsWith(".github.com")) return "GITHUB";
  if (hostname === "youtube.com" || hostname === "www.youtube.com" || hostname === "youtu.be") return "YOUTUBE";
  if (["http:", "https:"].includes(new URL(value).protocol)) return "WEBSITE";
  return "OTHER";
}

function titleFromUrl(value: string) {
  const url = new URL(value);
  const last = url.pathname.split("/").filter(Boolean).pop();
  return (last ? decodeURIComponent(last).replace(/[-_]+/g, " ") : url.hostname).slice(0, 240);
}

function nextAssetNumber(assetCode: string | null) {
  const match = assetCode?.match(/^AH-(\d+)$/i);
  return match ? Number(match[1]) + 1 : 1;
}

export function parseAssetUrls(value: string) {
  const seen = new Set<string>();
  const urls: string[] = [];
  const invalid: string[] = [];
  const duplicates: string[] = [];
  for (const raw of value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)) {
    try {
      const normalized = cleanUrl(raw.split(",")[0]);
      if (!seen.has(normalized)) { seen.add(normalized); urls.push(normalized); } else duplicates.push(normalized);
    } catch { invalid.push(raw); }
  }
  return { urls, invalid, duplicates };
}

export function parseAssetCsv(value: string) {
  const lines = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return { urls: [], invalid: [] as string[], duplicates: [] as string[] };
  const first = lines[0].split(",").map((item) => item.trim().toLowerCase());
  const hasHeader = first.some((item) => ["url", "sourceurl", "source_url", "链接", "网址"].includes(item));
  const urlIndex = hasHeader ? Math.max(0, first.findIndex((item) => ["url", "sourceurl", "source_url", "链接", "网址"].includes(item))) : 0;
  return parseAssetUrls(lines.slice(hasHeader ? 1 : 0).map((line) => line.split(",")[urlIndex] || "").join("\n"));
}

export async function createAssets(input: AssetCreateInput[]) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(812341);`;
    const last = await tx.asset.findFirst({ orderBy: { id: "desc" }, select: { assetCode: true } });
    let number = nextAssetNumber(last?.assetCode || null);
    const created: any[] = [];
    const duplicates: string[] = [];
    for (const item of input) {
      const sourceUrl = cleanUrl(item.sourceUrl);
      const existing = await tx.asset.findUnique({ where: { sourceUrl }, select: { assetCode: true } });
      if (existing) { duplicates.push(sourceUrl); continue; }
      const asset = await tx.asset.create({ data: {
        assetCode: `AH-${String(number).padStart(4, "0")}`,
        sourceUrl,
        sourceType: item.sourceType || sourceTypeForUrl(sourceUrl),
        title: item.title?.trim() || titleFromUrl(sourceUrl),
        author: item.author?.trim() || null,
      } });
      number += 1;
      created.push(asset);
    }
    return { created, duplicates };
  });
}

export function packageCategory(pkg: ContentPackage) {
  const map: Record<string, string> = { TOOL: "AI工具库", DISCOVERY: "AI发现", KNOWLEDGE: "AI知识库", CASE: "AI赚钱案例", WORKFLOW: "AI工作流", PROMPT: "提示词库", RESOURCE: "资源中心" };
  return map[pkg.classification.primary_type] || pkg.classification.category;
}

export function decisionFromPackage(pkg: ContentPackage) {
  if (pkg.editorial_review.final_status === "READY_TO_PUBLISH") return "发布";
  if (pkg.editorial_review.final_status === "REJECTED") return "淘汰";
  return "观察";
}

export async function receiveContentPackage(value: unknown) {
  const parsed = contentPackageSchema.parse(value);
  const sourceUrl = cleanUrl(parsed.source.original_url);
  const existing = await prisma.asset.findUnique({ where: { sourceUrl } });
  const data = {
    sourceType: sourceTypeForUrl(sourceUrl),
    title: parsed.website.title,
    author: parsed.source.source_author || null,
    description: parsed.website.summary || null,
    category: packageCategory(parsed),
    status: "CONTENT_READY",
    priority: "C",
    score: 0,
    researchNotes: parsed.verification.verification_notes || null,
    businessAnalysis: null,
    verificationNotes: [...parsed.verification.verified_facts, ...parsed.verification.uncertain_facts].join("\n") || null,
    officialSources: JSON.parse(JSON.stringify({ urls: parsed.verification.official_urls, github: parsed.verification.github_url || null, documentation: parsed.verification.documentation_urls })),
    finalDecision: decisionFromPackage(parsed),
    contentPackage: JSON.parse(JSON.stringify(parsed)),
  };
  if (existing) return prisma.asset.update({ where: { id: existing.id }, data });
  const { created } = await createAssets([{ sourceUrl, title: parsed.website.title, sourceType: sourceTypeForUrl(sourceUrl), author: parsed.source.source_author }]);
  return prisma.asset.update({ where: { id: created[0].id }, data });
}

export function serializeAsset(asset: any) {
  return {
    id: asset.id,
    assetCode: asset.assetCode,
    sourceUrl: asset.sourceUrl,
    sourceType: asset.sourceType,
    title: asset.title,
    author: asset.author,
    description: asset.description,
    category: asset.category,
    status: asset.status,
    priority: asset.priority,
    score: asset.score,
    researchNotes: asset.researchNotes,
    businessAnalysis: asset.businessAnalysis,
    verificationNotes: asset.verificationNotes,
    officialSources: asset.officialSources,
    finalDecision: asset.finalDecision,
    contentPackage: asset.contentPackage,
    researchStatus: asset.researchStatus,
    researchStartedAt: asset.researchStartedAt,
    researchCompletedAt: asset.researchCompletedAt,
    lastResearchUpdateAt: asset.lastResearchUpdateAt,
    researcherNotes: asset.researcherNotes,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
  };
}
