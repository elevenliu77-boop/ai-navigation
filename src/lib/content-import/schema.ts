import { z } from "zod";

const text = (max: number) => z.string().trim().max(max);
const requiredText = (max: number) => text(max).min(1);
const url = z.string().url();

const relatedReference = z.union([
  z.string().trim().min(1).max(300),
  z.number().int().positive(),
  z.object({ id: z.number().int().positive().optional(), slug: text(200).optional(), title: text(300).optional(), url: url.optional() }).passthrough(),
]);

const imageCard = z.object({
  index: z.number().int().positive(),
  title: requiredText(200),
  subtitle: text(500).default(""),
  image_url: url.optional(),
  alt: text(200).optional(),
}).passthrough();

const editorialReview = z.object({
  factuality: z.number().min(0).max(100).optional(),
  originality: z.number().min(0).max(100).optional(),
  copyright_risk: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  ai_style_risk: z.number().min(0).max(100).optional(),
  platform_risk: z.number().min(0).max(100).optional(),
  unsupported_claims: z.array(text(500)).max(50).default([]),
  final_status: z.enum(["EDITORIAL_REVIEWED", "READY_TO_PUBLISH", "NEEDS_REVIEW", "REJECTED"]).default("NEEDS_REVIEW"),
}).passthrough();

const socialDraft = z.object({
  suitability_score: z.number().min(0).max(100).optional(),
  title_candidates: z.array(requiredText(300)).max(10).default([]),
  selected_title: text(300).default(""),
  body: text(300_000).default(""),
  tags: z.array(text(80)).max(30).default([]),
  first_comment: text(2_000).default(""),
  image_cards: z.array(imageCard).max(12).default([]),
  summary: text(2_000).default(""),
  image_plan: z.array(text(500)).max(30).default([]),
  review: z.record(z.string(), z.unknown()).default({}),
}).passthrough();

const verification = z.object({
  official_urls: z.array(url).max(30).default([]),
  github_url: url.optional(),
  documentation_urls: z.array(url).max(30).default([]),
  verified_facts: z.array(text(1_000)).max(100).default([]),
  uncertain_facts: z.array(text(1_000)).max(100).default([]),
  verification_notes: text(10_000).default(""),
  verified_at: text(100).optional(),
}).passthrough();

const classification = z.object({
  primary_type: z.enum(["TOOL", "DISCOVERY", "KNOWLEDGE", "CASE", "WORKFLOW", "PROMPT", "RESOURCE"]),
  secondary_types: z.array(z.enum(["TOOL", "DISCOVERY", "KNOWLEDGE", "CASE", "WORKFLOW", "PROMPT", "RESOURCE"])).max(7).default([]),
  category: requiredText(150),
  tags: z.array(text(80)).max(30).default([]),
  publish_recommendation: text(100).default("NEEDS_REVIEW"),
}).passthrough();

const website = z.object({
  title: requiredText(200),
  slug: text(200).default(""),
  summary: text(2_000).default(""),
  body: text(300_000).default(""),
  cover_image: url.optional(),
  content_images: z.array(z.union([url, z.object({ url: url, alt: text(200).optional(), caption: text(500).optional() }).passthrough()])).max(30).default([]),
  seo_title: text(200).default(""),
  seo_description: text(500).default(""),
  seo_keywords: z.array(text(80)).max(50).default([]),
  related_tools: z.array(relatedReference).max(30).default([]),
  related_discoveries: z.array(relatedReference).max(30).default([]),
  related_workflows: z.array(relatedReference).max(30).default([]),
  related_prompts: z.array(relatedReference).max(30).default([]),
  related_cases: z.array(relatedReference).max(30).default([]),
  source_note: text(5_000).default(""),
}).passthrough();

export const contentPackageSchema = z.object({
  package_version: requiredText(40),
  package_id: requiredText(160),
  created_at: requiredText(100),
  source: z.object({
    original_url: url,
    source_type: requiredText(80),
    source_author: text(300).default(""),
    source_title: text(300).default(""),
    source_date: text(100).default(""),
  }).passthrough(),
  verification: verification.default({}),
  classification,
  website,
  social: z.object({
    xiaohongshu: socialDraft.optional(),
    wechat: socialDraft.optional(),
    toutiao: socialDraft.optional(),
  }).passthrough().default({}),
  editorial_review: editorialReview.default({}),
}).passthrough();

export type ContentPackage = z.infer<typeof contentPackageSchema>;
export type RelatedReference = z.infer<typeof relatedReference>;
export type ContentPackageIssue = { packageIndex: number; packageId?: string; message: string };

export function parseContentPackages(value: unknown) {
  const candidates = Array.isArray(value) ? value : [value];
  const packages: ContentPackage[] = [];
  const issues: ContentPackageIssue[] = [];
  const seen = new Set<string>();
  candidates.forEach((candidate, packageIndex) => {
    const result = contentPackageSchema.safeParse(candidate);
    if (!result.success) {
      issues.push({ packageIndex, message: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("；") });
      return;
    }
    if (seen.has(result.data.package_id)) {
      issues.push({ packageIndex, packageId: result.data.package_id, message: "同一批次内 package_id 重复" });
      return;
    }
    seen.add(result.data.package_id);
    packages.push(result.data);
  });
  return { packages, issues };
}

export function packageToRawJson(value: ContentPackage) {
  return JSON.stringify(value, null, 2);
}
