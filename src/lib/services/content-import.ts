/* eslint-disable @typescript-eslint/no-unused-vars, @next/next/no-assign-module-variable, no-var */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db/db";
import { assertPublicSourceUrl } from "@/lib/services/content-studio";
import {
  contentPackageSchema,
  packageToRawJson,
  type ContentPackage,
  type RelatedReference,
} from "@/lib/content-import/schema";

export const CONTENT_IMPORT_STATUSES = [
  "PREVIEW",
  "CONFIRMED",
  "TECH_REVIEWING",
  "TECH_REVIEWED",
  "READY_TO_PUBLISH",
  "TECH_REVIEW_FAILED",
  "SOURCE_UNAVAILABLE",
  "READY_TO_IMPORT",
  "UPDATE_EXISTING",
  "IMPORTED",
  "SITE_PUBLISHED",
  "REJECTED",
] as const;

const typeLabels: Record<string, string> = {
  TOOL: "AI工具库",
  DISCOVERY: "AI发现",
  KNOWLEDGE: "AI知识库",
  CASE: "AI赚钱案例",
  WORKFLOW: "AI工作流",
  PROMPT: "提示词库",
  RESOURCE: "资源中心",
};

function asJson(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as any;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, stableValue(item)]));
  }
  return value;
}

export function contentPackageFingerprint(pkg: ContentPackage) {
  return createHash("sha256").update(JSON.stringify(stableValue(pkg))).digest("hex");
}

function slugify(value: string, fallback: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150);
  return slug || fallback;
}

function githubRepo(url: string) {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.toLowerCase().endsWith("github.com")) return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1].replace(/\.git$/, "") };
  } catch {
    return null;
  }
}

async function fetchChecked(url: string) {
  let current = url;
  for (let hop = 0; hop < 4; hop += 1) {
    await assertPublicSourceUrl(current);
    const response = await fetch(current, {
      headers: { accept: "text/html,application/json", "user-agent": "alphahole-content-import/1.0" },
      redirect: "manual",
      signal: AbortSignal.timeout(12_000),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error(`HTTP ${response.status} 无 Location`);
      current = new URL(location, current).toString();
      continue;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response;
  }
  throw new Error("重定向次数超过限制");
}

export async function technicalReviewPackage(pkg: ContentPackage) {
  const facts: string[] = [];
  const failures: string[] = [];
  const checkedUrls = Array.from(new Set([
    pkg.source.original_url,
    ...pkg.verification.official_urls,
    ...(pkg.verification.github_url ? [pkg.verification.github_url] : []),
    ...pkg.verification.documentation_urls,
  ])).slice(0, 12);

  for (const url of checkedUrls) {
    try {
      const response = await fetchChecked(url);
      facts.push(`${url} 可访问（HTTP ${response.status}）`);
    } catch (error) {
      failures.push(`${url}: ${error instanceof Error ? error.message : "无法访问"}`);
    }
  }

  const githubUrl = pkg.verification.github_url || pkg.source.original_url;
  const repo = githubRepo(githubUrl);
  let github: Record<string, unknown> | null = null;
  if (repo) {
    try {
      const response = await fetchChecked(`https://api.github.com/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}`);
      if (response.headers.get("content-type")?.includes("application/json")) {
        const data = await response.json() as Record<string, unknown>;
        github = {
          owner: repo.owner,
          name: repo.repo,
          stars: data.stargazers_count,
          license: data.license && typeof data.license === "object" ? (data.license as Record<string, unknown>).spdx_id : null,
          default_branch: data.default_branch,
          archived: data.archived,
          html_url: data.html_url,
          checked_at: new Date().toISOString(),
        };
        facts.push(`GitHub 仓库存在：${repo.owner}/${repo.repo}`);
        try {
          const readmeResponse = await fetchChecked(`https://api.github.com/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}/readme`);
          const readmeData = await readmeResponse.json() as Record<string, unknown>;
          github.readme = { exists: true, path: readmeData.path || "README.md", size: readmeData.size || null };
          facts.push("GitHub README 可访问");
        } catch {
          github.readme = { exists: false };
          failures.push(`GitHub README 无法核验：${repo.owner}/${repo.repo}`);
        }
        try {
          const releaseResponse = await fetchChecked(`https://api.github.com/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}/releases/latest`);
          const release = await releaseResponse.json() as Record<string, unknown>;
          github.latest_release = { tag_name: release.tag_name || null, published_at: release.published_at || null, html_url: release.html_url || null };
        } catch {
          github.latest_release = null;
        }
      } else {
        failures.push(`GitHub API 返回非 JSON：${repo.owner}/${repo.repo}`);
      }
    } catch (error) {
      failures.push(`GitHub 仓库核验失败：${error instanceof Error ? error.message : "无法访问"}`);
    }
  }

  const sourceUnavailable = checkedUrls.length > 0 && failures.length === checkedUrls.length;
  const status = sourceUnavailable ? "SOURCE_UNAVAILABLE" : failures.length > 0 ? "TECH_REVIEW_FAILED" : "TECH_REVIEWED";
  return {
    status,
    result: {
      checked_at: new Date().toISOString(),
      checked_urls: checkedUrls,
      facts,
      failures,
      github,
      note: failures.length ? "存在未完成核验项，禁止把未核验内容写成确定事实。" : "已完成可访问性和公开信息核验。",
    },
  } as const;
}

async function categoryFor(tx: any, type: string, name: string) {
  const categoryType = type === "TOOL" ? "website" : type === "CASE" ? "case" : type.toLowerCase() === "discovery" || type === "KNOWLEDGE" ? "post" : type.toLowerCase();
  const preferredSlugs: Record<string, string> = { DISCOVERY: "ai-discovery", TOOL: "ai-tools", KNOWLEDGE: "ai-knowledge", CASE: "case-content", WORKFLOW: "wf-automation", PROMPT: "prompt-writing", RESOURCE: "res-template" };
  const slug = preferredSlugs[type] || slugify(name, `${categoryType}-import`);
  return tx.category.upsert({
    where: { slug },
    create: { name: name || typeLabels[type] || type, slug, type: categoryType },
    update: {},
  });
}

async function addTags(tx: any, type: string, id: number, tags: string[]) {
  for (const raw of Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean))).slice(0, 30)) {
    const tag = await tx.tag.upsert({
      where: { slug: slugify(raw, `tag-${id}`) },
      create: { name: raw, slug: slugify(raw, `tag-${id}`) },
      update: { name: raw },
    });
    if (type === "POST") await tx.postTag.createMany({ data: [{ post_id: id, tag_id: tag.id }], skipDuplicates: true });
    if (type === "PROMPT") await tx.promptTag.createMany({ data: [{ prompt_id: id, tag_id: tag.id }], skipDuplicates: true });
    if (type === "WORKFLOW") await tx.workflowTag.createMany({ data: [{ workflow_id: id, tag_id: tag.id }], skipDuplicates: true });
    if (type === "CASE") await tx.caseTag.createMany({ data: [{ case_study_id: id, tag_id: tag.id }], skipDuplicates: true });
  }
}

async function existingContent(pkg: ContentPackage) {
  const title = pkg.website.title;
  const slug = pkg.website.slug || slugify(title, pkg.package_id);
  const [website, post, prompt, workflow, caseStudy, resource] = await Promise.all([
    prisma.website.findFirst({ where: { OR: [{ url: pkg.source.original_url }, { title: { equals: title, mode: "insensitive" } }, { metadata: { path: ["source_url"], equals: pkg.source.original_url } }] } }),
    prisma.post.findFirst({ where: { OR: [{ slug }, { title: { equals: title, mode: "insensitive" } }, { metadata: { path: ["source_url"], equals: pkg.source.original_url } }] } }),
    prisma.prompt.findFirst({ where: { OR: [{ slug }, { title: { equals: title, mode: "insensitive" } }] } }),
    prisma.workflow.findFirst({ where: { OR: [{ slug }, { title: { equals: title, mode: "insensitive" } }] } }),
    prisma.caseStudy.findFirst({ where: { OR: [{ slug }, { title: { equals: title, mode: "insensitive" } }] } }),
    prisma.resource.findFirst({ where: { OR: [{ slug }, { title: { equals: title, mode: "insensitive" } }, { url: pkg.source.original_url }] } }),
  ]);
  if (website) return { type: "WEBSITE", id: website.id, title: website.title };
  if (post) return { type: "POST", id: post.id, title: post.title };
  if (prompt) return { type: "PROMPT", id: prompt.id, title: prompt.title };
  if (workflow) return { type: "WORKFLOW", id: workflow.id, title: workflow.title };
  if (caseStudy) return { type: "CASE", id: caseStudy.id, title: caseStudy.title };
  if (resource) return { type: "RESOURCE", id: resource.id, title: resource.title };
  return null;
}

async function relatedId(tx: any, ref: RelatedReference, type: string) {
  const id = typeof ref === "number" ? ref : typeof ref === "object" && ref.id ? ref.id : null;
  const title = typeof ref === "string" ? ref : typeof ref === "object" ? ref.title : null;
  const slug = typeof ref === "object" ? ref.slug : null;
  const url = typeof ref === "object" ? ref.url : null;
  if (!id && !title && !slug && !url) return null;
  if (type === "WEBSITE") {
    const item = id ? await tx.website.findUnique({ where: { id } }) : await tx.website.findFirst({ where: { OR: [{ title: title || undefined }, { url: url || undefined }, { metadata: { path: ["slug"], equals: slug } }] } });
    return item?.id || null;
  }
  const model = type === "POST" ? tx.post : type === "PROMPT" ? tx.prompt : type === "WORKFLOW" ? tx.workflow : type === "CASE" ? tx.caseStudy : tx.resource;
  if (!model) return null;
  const item = id ? await model.findUnique({ where: { id } }) : await model.findFirst({ where: { OR: [{ title: title || undefined }, { slug: slug || undefined }] } });
  return item?.id || null;
}

async function importSiteContent(tx: any, pkg: ContentPackage) {
  const type = pkg.classification.primary_type;
  const category = await categoryFor(tx, type, pkg.classification.category);
  const slug = slugify(pkg.website.slug || pkg.website.title, pkg.package_id);
  const sourceMetadata = {
    package_id: pkg.package_id,
    source_url: pkg.source.original_url,
    official_urls: pkg.verification.official_urls,
    seo_title: pkg.website.seo_title,
    seo_description: pkg.website.seo_description,
    seo_keywords: pkg.website.seo_keywords,
    source_note: pkg.website.source_note,
  };
  let importedType: string;
  let importedId: number;

  if (type === "TOOL") {
    const item = await tx.website.create({ data: { title: pkg.website.title, url: pkg.source.original_url, description: pkg.website.summary || pkg.website.body.slice(0, 240), category_id: category.id, thumbnail: pkg.website.cover_image || null, status: "approved", metadata: asJson({ ...sourceMetadata, ...pkg.website }) } });
    importedType = "WEBSITE"; importedId = item.id;
  } else if (type === "PROMPT") {
    const item = await tx.prompt.create({ data: { title: pkg.website.title, slug, content: pkg.website.body, excerpt: pkg.website.summary, category_id: category.id, status: "published", published_at: new Date(), metadata: asJson(sourceMetadata) } });
    importedType = "PROMPT"; importedId = item.id;
    await addTags(tx, importedType, importedId, pkg.classification.tags);
  } else if (type === "WORKFLOW") {
    const item = await tx.workflow.create({ data: { title: pkg.website.title, slug, description: pkg.website.summary, steps: asJson([{ title: "内容包步骤", description: pkg.website.body }]), tools: asJson(pkg.website.related_tools), metadata: asJson(sourceMetadata), category_id: category.id, status: "published", published_at: new Date() } });
    importedType = "WORKFLOW"; importedId = item.id;
    await addTags(tx, importedType, importedId, pkg.classification.tags);
  } else if (type === "CASE") {
    const item = await tx.caseStudy.create({ data: { title: pkg.website.title, slug, summary: pkg.website.summary, content: pkg.website.body, cover: pkg.website.cover_image || null, result: asJson({}), metadata: asJson(sourceMetadata), category_id: category.id, status: "published", published_at: new Date() } });
    importedType = "CASE"; importedId = item.id;
    await addTags(tx, importedType, importedId, pkg.classification.tags);
  } else if (type === "RESOURCE") {
    const item = await tx.resource.create({ data: { title: pkg.website.title, slug, description: pkg.website.summary, url: pkg.source.original_url, category_id: category.id, permission: "FREE", status: "published" } });
    importedType = "RESOURCE"; importedId = item.id;
  } else {
    const item = await tx.post.create({ data: { title: pkg.website.title, slug, content: pkg.website.body, excerpt: pkg.website.summary, metadata: asJson({ ...sourceMetadata, content_type: type }), featured_image: pkg.website.cover_image || null, category_id: category.id, status: "published", published_at: new Date() } });
    importedType = "POST"; importedId = item.id;
    await addTags(tx, importedType, importedId, pkg.classification.tags);
  }

  return { importedType, importedId };
}

async function addPackageRelations(tx: any, packageId: number, pkg: ContentPackage) {
  const relationGroups: Array<[string, RelatedReference[]]> = [
    ["WEBSITE", pkg.website.related_tools],
    ["POST", pkg.website.related_discoveries],
    ["WORKFLOW", pkg.website.related_workflows],
    ["PROMPT", pkg.website.related_prompts],
    ["CASE", pkg.website.related_cases],
  ];
  for (const [targetType, refs] of relationGroups) {
    for (const ref of refs) {
      const targetId = await relatedId(tx, ref, targetType);
      if (targetId) {
        await tx.contentImportRelation.create({ data: { package_id: packageId, target_type: targetType, target_id: targetId, relation_type: "RELATED" } }).catch(() => undefined);
      }
    }
  }
}

function socialOutputs(pkg: ContentPackage) {
  const status = pkg.editorial_review.final_status === "READY_TO_PUBLISH" ? "READY" : "NEEDS_REVIEW";
  return ([
    ["XIAOHONGSHU", pkg.social.xiaohongshu],
    ["WECHAT", pkg.social.wechat],
    ["TOUTIAO", pkg.social.toutiao],
  ] as const).filter(([, value]) => value).map(([platform, value]) => ({
    platform,
    status,
    title_candidates: asJson(value!.title_candidates),
    cover_titles: asJson(value!.title_candidates.slice(0, 3)),
    body: value!.body,
    metadata: asJson({ tags: value!.tags, first_comment: value!.first_comment, imageCards: value!.image_cards, summary: value!.summary, image_plan: value!.image_plan }),
    review_result: asJson(value!.review),
    generated_at: new Date(),
  }));
}

export async function reviewImportPackage(id: number) {
  const record = await prisma.contentImportPackage.findUnique({ where: { id } });
  if (!record) throw new Error("内容包不存在");
  const pkgResult = contentPackageSchema.safeParse(JSON.parse(record.raw_json));
  if (!pkgResult.success) {
    await prisma.contentImportPackage.update({ where: { id }, data: { status: "TECH_REVIEW_FAILED", error_message: "已存内容包无法再次通过 Schema 校验" } });
    return { id, status: "TECH_REVIEW_FAILED" };
  }
  await prisma.contentImportPackage.update({ where: { id }, data: { status: "TECH_REVIEWING", error_message: null } });
  const result = await technicalReviewPackage(pkgResult.data);
  const finalStatus = result.status === "TECH_REVIEWED" && pkgResult.data.editorial_review.final_status === "READY_TO_PUBLISH" ? "READY_TO_PUBLISH" : result.status;
  await prisma.contentImportPackage.update({ where: { id }, data: { status: finalStatus, technical_review: asJson(result.result), error_message: result.result.failures.length ? result.result.failures.join("\n") : null } });
  return { id, status: finalStatus, result: result.result };
}

export async function importPackage(id: number, force = false) {
  const record = await prisma.contentImportPackage.findUnique({ where: { id } });
  if (!record) throw new Error("内容包不存在");
  if (!["TECH_REVIEWED", "READY_TO_PUBLISH", "READY_TO_IMPORT"].includes(record.status)) throw new Error(`当前状态不可导入：${record.status}`);
  const pkg = contentPackageSchema.parse(JSON.parse(record.raw_json));
  if (["TECH_REVIEWED"].includes(record.status) && pkg.editorial_review.final_status !== "READY_TO_PUBLISH") {
    await prisma.contentImportPackage.update({ where: { id }, data: { status: "READY_TO_IMPORT" } });
    return { id, status: "READY_TO_IMPORT", imported: false };
  }
  if (record.status === "READY_TO_IMPORT" && !force) return { id, status: "READY_TO_IMPORT", imported: false };
  const claimed = await prisma.contentImportPackage.updateMany({ where: { id, status: record.status }, data: { status: "IMPORTED" } });
  if (!claimed.count) return { id, status: "IMPORTED", imported: false };
  const duplicate = await existingContent(pkg);
  if (duplicate) {
    await prisma.contentImportPackage.update({ where: { id }, data: { status: "UPDATE_EXISTING", duplicate_reason: "已有相同 URL、标题或 slug 内容", duplicate_target_type: duplicate.type, duplicate_target_id: duplicate.id } });
    return { id, status: "UPDATE_EXISTING", duplicate };
  }
  try {
    const result = await prisma.$transaction(async (tx) => {
      const imported = await importSiteContent(tx, pkg);
      await addPackageRelations(tx, id, pkg);
      await tx.contentImportPackage.update({ where: { id }, data: { status: "SITE_PUBLISHED", imported_type: imported.importedType, imported_id: imported.importedId, error_message: null } });
      for (const output of socialOutputs(pkg)) await tx.contentImportOutput.upsert({ where: { package_id_platform: { package_id: id, platform: output.platform } }, create: { package_id: id, ...output }, update: output });
      return imported;
    });
    return { id, status: "SITE_PUBLISHED", imported: true, ...result };
  } catch (error) {
    await prisma.contentImportPackage.update({ where: { id }, data: { status: "TECH_REVIEWED", error_message: error instanceof Error ? error.message : "导入失败" } });
    throw error;
  }
}

export async function getImportRelationIds(importedType: string, importedId: number) {
  const packages = await prisma.contentImportPackage.findMany({
    where: { imported_type: importedType, imported_id: importedId },
    select: { relations: { select: { target_type: true, target_id: true } } },
  });
  const ids: Record<string, number[]> = {};
  for (const pkg of packages) for (const relation of pkg.relations) {
    ids[relation.target_type] = Array.from(new Set([...(ids[relation.target_type] || []), relation.target_id]));
  }
  return ids;
}

export function serializeContentImportPackage(record: any) {
  return {
    id: record.id,
    batch_id: record.batch_id,
    package_id: record.package_id,
    package_version: record.package_version,
    raw_json: record.raw_json,
    status: record.status,
    source: { original_url: record.original_url, source_type: record.source_type, source_author: record.source_author, source_title: record.source_title, source_date: record.source_date },
    website: record.website,
    classification: record.classification,
    verification: record.verification,
    editorial_review: record.editorial_review,
    technical_review: record.technical_review,
    duplicate_reason: record.duplicate_reason,
    duplicate_target_type: record.duplicate_target_type,
    duplicate_target_id: record.duplicate_target_id,
    error_message: record.error_message,
    imported_type: record.imported_type,
    imported_id: record.imported_id,
    outputs: record.outputs || [],
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

export function packagePreview(pkg: ContentPackage) {
  return {
    package_id: pkg.package_id,
    package_version: pkg.package_version,
    title: pkg.website.title,
    type: pkg.classification.primary_type,
    type_label: typeLabels[pkg.classification.primary_type] || pkg.classification.primary_type,
    original_url: pkg.source.original_url,
    official_urls: pkg.verification.official_urls,
    target_module: typeLabels[pkg.classification.primary_type] || pkg.classification.primary_type,
    tags: pkg.classification.tags,
    seo: { title: pkg.website.seo_title, description: pkg.website.seo_description, keywords: pkg.website.seo_keywords },
    relations: { tools: pkg.website.related_tools, discoveries: pkg.website.related_discoveries, workflows: pkg.website.related_workflows, prompts: pkg.website.related_prompts, cases: pkg.website.related_cases },
    social: { xiaohongshu: Boolean(pkg.social.xiaohongshu), wechat: Boolean(pkg.social.wechat), toutiao: Boolean(pkg.social.toutiao) },
    editorial_status: pkg.editorial_review.final_status,
  };
}

export async function recalculateBatch(batchId: number) {
  const grouped = await prisma.contentImportPackage.groupBy({ by: ["status"], where: { batch_id: batchId }, _count: { _all: true } });
  const counts = Object.fromEntries(grouped.map((row) => [row.status, row._count._all]));
  return prisma.contentImportBatch.update({ where: { id: batchId }, data: {
    total_count: grouped.reduce((sum, row) => sum + row._count._all, 0),
    pending_count: (counts.PREVIEW || 0) + (counts.CONFIRMED || 0) + (counts.READY_TO_IMPORT || 0) + (counts.READY_TO_PUBLISH || 0),
    tech_review_count: (counts.TECH_REVIEWING || 0) + (counts.TECH_REVIEWED || 0) + (counts.READY_TO_PUBLISH || 0),
    validated_count: (counts.TECH_REVIEWED || 0) + (counts.READY_TO_PUBLISH || 0),
    failed_count: (counts.TECH_REVIEW_FAILED || 0) + (counts.SOURCE_UNAVAILABLE || 0),
    duplicate_count: (counts.UPDATE_EXISTING || 0) + (counts.REJECTED || 0),
    imported_count: (counts.IMPORTED || 0) + (counts.SITE_PUBLISHED || 0),
    published_count: counts.SITE_PUBLISHED || 0,
  } });
}
