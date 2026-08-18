/* eslint-disable @typescript-eslint/no-unused-vars, @next/next/no-assign-module-variable, no-var */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/db/db";
import { contentPackageFingerprint } from "@/lib/services/content-import";
import { createAssets } from "@/lib/services/assets";
import { contentPackageSchema } from "@/lib/content-import/schema";

export const RESEARCH_STATUSES = [
  "PENDING",
  "QUEUED",
  "RESEARCHING",
  "FACT_CHECKING",
  "BUSINESS_ANALYZING",
  "CONTENT_DECISION",
  "COMPLETED",
  "FAILED",
  "PAUSED",
] as const;

export const RESEARCH_PRIORITIES = ["S", "A", "B", "C", "D"] as const;
export const ACTIVE_RESEARCH_STATUSES = ["PENDING", "QUEUED", "RESEARCHING", "FACT_CHECKING", "BUSINESS_ANALYZING", "CONTENT_DECISION", "PAUSED"] as const;
export const RESEARCH_STATUS_LABELS: Record<string, string> = {
  PENDING: "待处理",
  QUEUED: "已入队",
  RESEARCHING: "研究中",
  FACT_CHECKING: "事实验证中",
  BUSINESS_ANALYZING: "商业分析中",
  CONTENT_DECISION: "内容去向判断",
  COMPLETED: "已完成",
  FAILED: "失败",
  PAUSED: "已暂停",
};

const priorityRank: Record<string, number> = { S: 0, A: 1, B: 2, C: 3, D: 4 };

function nextTaskNumber(taskCode: string | null) {
  const match = taskCode?.match(/^TASK-(\d+)$/i);
  return match ? Number(match[1]) + 1 : 1;
}

function clampProgress(value: unknown, fallback = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function statusMessage(status: string) {
  return RESEARCH_STATUS_LABELS[status] || status;
}

export function serializeResearchTask(task: any) {
  return {
    id: task.id,
    taskCode: task.taskCode,
    assetId: task.assetId,
    status: task.status,
    priority: task.priority,
    startedAt: task.startedAt,
    completedAt: task.completedAt,
    progress: task.progress,
    notes: task.notes,
    errorMessage: task.errorMessage,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    asset: task.asset ? {
      id: task.asset.id,
      assetCode: task.asset.assetCode,
      sourceUrl: task.asset.sourceUrl,
      sourceType: task.asset.sourceType,
      title: task.asset.title,
      category: task.asset.category,
      score: task.asset.score,
      researchStatus: task.asset.researchStatus,
    } : undefined,
    logs: task.logs?.map((log: any) => ({
      id: log.id,
      assetId: log.assetId,
      taskId: log.taskId,
      action: log.action,
      message: log.message,
      createdAt: log.createdAt,
    })),
  };
}

async function addLog(tx: any, input: { assetId: number; taskId?: number | null; action: string; message: string }) {
  return tx.researchLog.create({ data: input });
}

export async function enqueueResearchTasks(input: { assetIds?: number[]; all?: boolean; force?: boolean } = {}) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(812342);`;
    const where: any = input.assetIds?.length
      ? { id: { in: input.assetIds } }
      : input.all ? {} : { researchStatus: { not: "COMPLETED" } };
    const assets = await tx.asset.findMany({ where, orderBy: { id: "asc" } });
    if (!assets.length) return { created: [], skipped: 0 };

    const existing = await tx.researchTask.findMany({
      where: { assetId: { in: assets.map((asset: any) => asset.id) } },
      orderBy: { createdAt: "desc" },
    });
    const latestByAsset = new Map<number, any>();
    for (const task of existing) if (!latestByAsset.has(task.assetId)) latestByAsset.set(task.assetId, task);

    const last = await tx.researchTask.findFirst({ orderBy: { id: "desc" }, select: { taskCode: true } });
    let taskNumber = nextTaskNumber(last?.taskCode || null);
    const created: any[] = [];
    let skipped = 0;
    for (const asset of assets) {
      const latest = latestByAsset.get(asset.id);
      if (!input.force && asset.researchStatus === "COMPLETED" && !latest?.status) {
        skipped += 1;
        continue;
      }
      if (!input.force && latest && latest.status !== "FAILED" && latest.status !== "COMPLETED") {
        skipped += 1;
        continue;
      }
      if (!input.force && latest?.status === "COMPLETED") {
        skipped += 1;
        continue;
      }
      const task = await tx.researchTask.create({
        data: {
          taskCode: `TASK-${String(taskNumber).padStart(6, "0")}`,
          assetId: asset.id,
          status: "QUEUED",
          priority: asset.priority,
          progress: 0,
        },
      });
      taskNumber += 1;
      await tx.asset.update({ where: { id: asset.id }, data: { researchStatus: "QUEUED", lastResearchUpdateAt: new Date() } });
      await addLog(tx, { assetId: asset.id, taskId: task.id, action: "QUEUED", message: "素材已加入 AI 研究队列" });
      created.push(task);
    }
    return { created, skipped };
  });
}

export async function syncUrlsToResearchAssets(urls: string[]) {
  const uniqueUrls = Array.from(new Set(urls.map((url) => url.trim()).filter(Boolean)));
  if (!uniqueUrls.length) return { assetIds: [], imported: 0, queued: 0, duplicates: [] as string[] };
  const createdResult = await createAssets(uniqueUrls.map((sourceUrl) => ({ sourceUrl })));
  const normalized = uniqueUrls.map((url) => new URL(url).toString());
  const assets = await prisma.asset.findMany({ where: { sourceUrl: { in: normalized } }, select: { id: true } });
  const queuedResult = await enqueueResearchTasks({ assetIds: assets.map((asset) => asset.id) });
  return { assetIds: assets.map((asset) => asset.id), imported: createdResult.created.length, queued: queuedResult.created.length, duplicates: createdResult.duplicates };
}

export async function backfillContentStudioAssetsToResearch() {
  const rows = await prisma.contentStudioAsset.findMany({ select: { raw_url: true }, orderBy: { id: "asc" } });
  return syncUrlsToResearchAssets(rows.map((row) => row.raw_url));
}

export async function updateResearchTask(taskId: number, input: { status?: string; progress?: unknown; notes?: unknown; errorMessage?: unknown }) {
  if (input.status && !RESEARCH_STATUSES.includes(input.status as any)) throw new Error("研究状态无效");
  return prisma.$transaction(async (tx) => {
    const task = await tx.researchTask.findUnique({ where: { id: taskId } });
    if (!task) throw new Error("研究任务不存在");
    const nextStatus = input.status || task.status;
    const now = new Date();
    const progress = nextStatus === "COMPLETED" ? 100 : clampProgress(input.progress, task.progress);
    const startedAt = nextStatus === "RESEARCHING" || task.startedAt ? task.startedAt || now : null;
    const completedAt = nextStatus === "COMPLETED" ? task.completedAt || now : nextStatus === "FAILED" ? null : task.completedAt;
    const notes = input.notes === undefined ? task.notes : input.notes === null ? null : String(input.notes).slice(0, 200_000);
    const errorMessage = input.errorMessage === undefined ? (nextStatus === "FAILED" ? task.errorMessage : null) : input.errorMessage === null ? null : String(input.errorMessage).slice(0, 50_000);
    const updated = await tx.researchTask.update({ where: { id: taskId }, data: { status: nextStatus, progress, startedAt, completedAt, notes, errorMessage } });
    await tx.asset.update({
      where: { id: task.assetId },
      data: {
        researchStatus: nextStatus,
        lastResearchUpdateAt: now,
        ...(nextStatus === "RESEARCHING" && !task.startedAt ? { researchStartedAt: now } : {}),
        ...(nextStatus === "COMPLETED" ? { researchCompletedAt: completedAt } : {}),
        ...(notes !== task.notes ? { researcherNotes: notes } : {}),
      },
    });
    if (nextStatus !== task.status || notes !== task.notes || errorMessage !== task.errorMessage) {
      await addLog(tx, {
        assetId: task.assetId,
        taskId,
        action: nextStatus,
        message: errorMessage && nextStatus === "FAILED" ? `${statusMessage(nextStatus)}：${errorMessage}` : statusMessage(nextStatus),
      });
    }
    return tx.researchTask.findUnique({ where: { id: taskId }, include: { asset: true, logs: { orderBy: { createdAt: "desc" } } } });
  });
}

export async function getResearchStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [totalAssets, pending, researching, completed, failed, imported, todayCompleted, current, latestCompleted, statusGroups] = await Promise.all([
    prisma.asset.count(),
    prisma.asset.count({ where: { researchStatus: { in: ["PENDING", "QUEUED"] } } }),
    prisma.asset.count({ where: { researchStatus: { in: ["RESEARCHING", "FACT_CHECKING", "BUSINESS_ANALYZING", "CONTENT_DECISION"] } } }),
    prisma.asset.count({ where: { researchStatus: "COMPLETED" } }),
    prisma.asset.count({ where: { researchStatus: "FAILED" } }),
    prisma.asset.count({ where: { contentPackage: { not: null } as any } }),
    prisma.researchTask.count({ where: { status: "COMPLETED", completedAt: { gte: today } } }),
    prisma.researchTask.findFirst({ where: { status: { in: ["RESEARCHING", "FACT_CHECKING", "BUSINESS_ANALYZING", "CONTENT_DECISION"] } }, include: { asset: true }, orderBy: { updatedAt: "desc" } }),
    prisma.researchTask.findFirst({ where: { status: "COMPLETED" }, include: { asset: true }, orderBy: { completedAt: "desc" } }),
    prisma.asset.groupBy({ by: ["researchStatus"], _count: { _all: true } }),
  ]);
  return {
    totalAssets,
    pending,
    researching,
    completed,
    failed,
    imported,
    todayCompleted,
    current: current ? serializeResearchTask(current) : null,
    latestCompleted: latestCompleted ? serializeResearchTask(latestCompleted) : null,
    byStatus: Object.fromEntries(statusGroups.map((group: any) => [group.researchStatus, group._count._all])),
  };
}

export async function listResearchTasks(params: { status?: string; priority?: string; sourceType?: string; search?: string; sort?: string; page?: number; pageSize?: number }) {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 50));
  const where: any = {
    ...(params.status && RESEARCH_STATUSES.includes(params.status as any) ? { status: params.status } : {}),
    ...(params.priority && RESEARCH_PRIORITIES.includes(params.priority as any) ? { priority: params.priority } : {}),
    ...(params.sourceType ? { asset: { sourceType: params.sourceType } } : {}),
    ...(params.search ? { OR: [
      { taskCode: { contains: params.search, mode: "insensitive" } },
      { asset: { assetCode: { contains: params.search, mode: "insensitive" } } },
      { asset: { title: { contains: params.search, mode: "insensitive" } } },
    ] } : {}),
  };
  const tasks = await prisma.researchTask.findMany({ where, include: { asset: true }, orderBy: { updatedAt: "desc" }, take: 1000 });
  const sorted = params.sort === "priority" ? tasks.sort((a: any, b: any) => (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9) || +new Date(b.updatedAt) - +new Date(a.updatedAt)) : params.sort === "taskCode" ? tasks.sort((a: any, b: any) => a.taskCode.localeCompare(b.taskCode)) : tasks;
  const items = sorted.slice((page - 1) * pageSize, page * pageSize).map(serializeResearchTask);
  return { items, total: sorted.length, page, pageSize, pages: Math.ceil(sorted.length / pageSize) };
}

export async function getResearchTask(taskId: number) {
  const task = await prisma.researchTask.findUnique({ where: { id: taskId }, include: { asset: true, logs: { orderBy: { createdAt: "desc" } } } });
  return task ? serializeResearchTask(task) : null;
}

export async function importResearchResults(value: unknown) {
  const raw = value as any;
  const items = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [raw];
  if (!items.length || items.length > 1000) throw new Error("研究结果数量必须在 1-1000 条之间");
  return prisma.$transaction(async (tx) => {
    let nextNumber = nextTaskNumber((await tx.researchTask.findFirst({ orderBy: { id: "desc" }, select: { taskCode: true } }))?.taskCode || null);
    const imported: any[] = [];
    const failed: any[] = [];
    for (const item of items) {
      try {
        if (!item || typeof item !== "object") throw new Error("结果项格式无效");
        const asset = item.assetCode ? await tx.asset.findUnique({ where: { assetCode: String(item.assetCode) } }) : item.sourceUrl ? await tx.asset.findUnique({ where: { sourceUrl: String(item.sourceUrl) } }) : null;
        if (!asset) throw new Error("找不到对应素材，请提供 assetCode 或 sourceUrl");
        let task = item.taskCode ? await tx.researchTask.findUnique({ where: { taskCode: String(item.taskCode) } }) : await tx.researchTask.findFirst({ where: { assetId: asset.id }, orderBy: { createdAt: "desc" } });
        if (!task) {
          task = await tx.researchTask.create({ data: { taskCode: `TASK-${String(nextNumber++).padStart(6, "0")}`, assetId: asset.id, priority: asset.priority, status: "PENDING" } });
        }
        const research = {
          summary: item.researchSummary ?? item.summary ?? null,
          verification: item.verification ?? null,
          businessAnalysis: item.businessAnalysis ?? null,
          category: item.category ?? null,
          finalStatus: item.finalStatus ?? item.finalDecision ?? null,
          websiteContentSuggestion: item.websiteContentSuggestion ?? null,
          socialMediaSuggestions: item.socialMediaSuggestions ?? null,
          importedAt: new Date().toISOString(),
        };
        const assetStatuses = ["NEW", "ANALYZING", "RESEARCHING", "VERIFIED", "CONTENT_READY", "PUBLISHED", "METHOD_LIBRARY", "BUSINESS_OPPORTUNITY", "OBSERVATION", "REJECTED"];
        const nextResearchStatus = typeof item.researchStatus === "string" && RESEARCH_STATUSES.includes(item.researchStatus as any) ? item.researchStatus : "COMPLETED";
        const existingPackage = asset.contentPackage && typeof asset.contentPackage === "object" && !Array.isArray(asset.contentPackage) ? asset.contentPackage : {};
        await tx.asset.update({ where: { id: asset.id }, data: {
          status: typeof item.status === "string" && assetStatuses.includes(item.status) ? item.status : asset.status,
          researchStatus: nextResearchStatus,
          researchCompletedAt: nextResearchStatus === "COMPLETED" ? new Date() : asset.researchCompletedAt,
          lastResearchUpdateAt: new Date(),
          researcherNotes: item.notes ? String(item.notes).slice(0, 200_000) : asset.researcherNotes,
          researchNotes: item.researchSummary || item.summary ? String(item.researchSummary || item.summary).slice(0, 200_000) : asset.researchNotes,
          businessAnalysis: item.businessAnalysis ? String(item.businessAnalysis).slice(0, 200_000) : asset.businessAnalysis,
          verificationNotes: item.verification ? JSON.stringify(item.verification).slice(0, 200_000) : asset.verificationNotes,
          category: typeof item.category === "string" && item.category.trim() ? item.category.trim() : asset.category,
          finalDecision: item.finalDecision || item.finalStatus ? String(item.finalDecision || item.finalStatus).slice(0, 100) : asset.finalDecision,
          contentPackage: JSON.parse(JSON.stringify({ ...existingPackage, research })),
        } });
        await tx.researchTask.update({ where: { id: task.id }, data: { status: "COMPLETED", progress: 100, completedAt: new Date(), errorMessage: null } });
        await addLog(tx, { assetId: asset.id, taskId: task.id, action: "IMPORTED", message: "已导入结构化 AI 研究结果，研究任务完成" });
        imported.push({ assetCode: asset.assetCode, taskCode: task.taskCode });
      } catch (error) {
        failed.push({ item, error: error instanceof Error ? error.message : "导入失败" });
      }
    }
    return { imported, failed };
  });
}

function categoryToPrimaryType(category: string) {
  if (category.includes("工具")) return "TOOL";
  if (category.includes("发现")) return "DISCOVERY";
  if (category.includes("赚钱") || category.includes("商业")) return "CASE";
  if (category.includes("工作流")) return "WORKFLOW";
  if (category.includes("提示词")) return "PROMPT";
  if (category.includes("资源")) return "RESOURCE";
  return "KNOWLEDGE";
}

function validHttpUrl(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol) ? url.toString() : null;
  } catch { return null; }
}

function validHttpUrls(value: unknown) {
  return Array.isArray(value) ? value.map(validHttpUrl).filter((item): item is string => Boolean(item)) : [];
}

function safeRelatedReferences(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => {
    if (typeof item === "string") return Boolean(item.trim());
    if (typeof item === "number") return Number.isInteger(item) && item > 0;
    if (!item || typeof item !== "object") return false;
    const candidate = item as Record<string, unknown>;
    return Boolean(candidate.id || candidate.slug || candidate.title || validHttpUrl(candidate.url));
  }).map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return item;
    const candidate = { ...(item as Record<string, unknown>) };
    if (candidate.url) candidate.url = validHttpUrl(candidate.url) || undefined;
    return candidate;
  });
}

function websiteDraftFromAsset(asset: any) {
  const packageValue = asset.contentPackage && typeof asset.contentPackage === "object" && !Array.isArray(asset.contentPackage) ? asset.contentPackage : {};
  const research = packageValue.research && typeof packageValue.research === "object" ? packageValue.research : {};
  const supplied = research.websiteContentSuggestion ?? packageValue.website ?? null;
  const website = supplied && typeof supplied === "object" && !Array.isArray(supplied) ? supplied : { body: typeof supplied === "string" ? supplied : "" };
  const body = String(website.body ?? website.content ?? website.markdown ?? "").trim();
  if (!body) return null;
  const category = String(website.category ?? research.category ?? asset.category ?? "AI知识库");
  const title = String(website.title ?? asset.title ?? "").trim();
  if (!title) return null;
  const summary = String(website.summary ?? website.excerpt ?? asset.description ?? body.slice(0, 240)).trim();
  const verification = research.verification && typeof research.verification === "object" ? research.verification : {};
  const officialUrls = validHttpUrls(verification.official_urls);
  const rawClassification = research.classification && typeof research.classification === "object" ? research.classification : {};
  const classification = {
    primary_type: ["TOOL", "DISCOVERY", "KNOWLEDGE", "CASE", "WORKFLOW", "PROMPT", "RESOURCE"].includes(rawClassification.primary_type) ? rawClassification.primary_type : categoryToPrimaryType(category),
    secondary_types: Array.isArray(rawClassification.secondary_types) ? rawClassification.secondary_types.filter((item: unknown) => ["TOOL", "DISCOVERY", "KNOWLEDGE", "CASE", "WORKFLOW", "PROMPT", "RESOURCE"].includes(item as string)) : [],
    category,
    tags: Array.isArray(rawClassification.tags) ? rawClassification.tags : [],
    publish_recommendation: "NEEDS_REVIEW",
  };
  const pkg = {
    package_version: "1.0",
    package_id: `research-${asset.assetCode}-${Date.now()}`,
    created_at: new Date().toISOString(),
    source: {
      original_url: asset.sourceUrl,
      source_type: asset.sourceType,
      source_author: asset.author || "",
      source_title: asset.title || "",
      source_date: "",
    },
    verification: {
      official_urls: officialUrls,
      github_url: validHttpUrl(verification.github_url) || undefined,
      documentation_urls: validHttpUrls(verification.documentation_urls),
      verified_facts: Array.isArray(verification.verified_facts) ? verification.verified_facts : [],
      uncertain_facts: Array.isArray(verification.uncertain_facts) ? verification.uncertain_facts : [],
      verification_notes: String(verification.verification_notes ?? asset.verificationNotes ?? ""),
      verified_at: new Date().toISOString(),
    },
    classification,
    website: {
      title,
      slug: String(website.slug ?? ""),
      summary,
      body,
      cover_image: validHttpUrl(website.cover_image) || undefined,
      content_images: Array.isArray(website.content_images) ? website.content_images.filter((item: any) => validHttpUrl(typeof item === "string" ? item : item?.url)) : [],
      seo_title: String(website.seo_title ?? title),
      seo_description: String(website.seo_description ?? summary),
      seo_keywords: Array.isArray(website.seo_keywords) ? website.seo_keywords : [],
      related_tools: safeRelatedReferences(website.related_tools),
      related_discoveries: safeRelatedReferences(website.related_discoveries),
      related_workflows: safeRelatedReferences(website.related_workflows),
      related_prompts: safeRelatedReferences(website.related_prompts),
      related_cases: safeRelatedReferences(website.related_cases),
      source_note: String(website.source_note ?? "研究结果导入，待人工审核"),
    },
    social: {},
    editorial_review: { final_status: "NEEDS_REVIEW", unsupported_claims: [] },
  };
  const parsed = contentPackageSchema.safeParse(pkg);
  if (!parsed.success) throw new Error(`网站草稿结构校验失败：${parsed.error.issues.slice(0, 5).map((issue) => issue.path.join(".") + " " + issue.message).join("；")}`);
  return parsed.data;
}

export async function promoteResearchToContentImport(taskId: number) {
  return prisma.$transaction(async (tx) => {
    const task = await tx.researchTask.findUnique({ where: { id: taskId }, include: { asset: true } });
    if (!task) throw new Error("研究任务不存在");
    const pkg = websiteDraftFromAsset(task.asset);
    if (!pkg) throw new Error("研究结果中没有可用的 websiteContentSuggestion，不能凭空生成网站草稿");
    const existing = await tx.contentImportPackage.findFirst({ where: { original_url: task.asset.sourceUrl, status: { notIn: ["SITE_PUBLISHED", "REJECTED"] } }, orderBy: { created_at: "desc" } });
    if (existing) return { packageId: existing.id, batchId: existing.batch_id, status: existing.status, reused: true };
    const rawJson = JSON.stringify(pkg, null, 2);
    const batch = await tx.contentImportBatch.create({ data: { name: `研究结果待审核 · ${task.asset.assetCode}`, total_count: 1, pending_count: 1, status: "PREVIEW" } });
    const record = await tx.contentImportPackage.create({ data: {
      batch_id: batch.id,
      package_id: pkg.package_id,
      package_version: pkg.package_version,
      raw_json: rawJson,
      content_fingerprint: contentPackageFingerprint(pkg as any),
      original_url: pkg.source.original_url,
      source_type: pkg.source.source_type,
      source_author: pkg.source.source_author,
      source_title: pkg.source.source_title,
      source_date: pkg.source.source_date,
      verification: JSON.parse(JSON.stringify(pkg.verification)),
      classification: JSON.parse(JSON.stringify(pkg.classification)),
      website: JSON.parse(JSON.stringify(pkg.website)),
      social: JSON.parse(JSON.stringify(pkg.social)),
      editorial_review: JSON.parse(JSON.stringify(pkg.editorial_review)),
      status: "PREVIEW",
    } });
    const existingPackage = task.asset.contentPackage && typeof task.asset.contentPackage === "object" && !Array.isArray(task.asset.contentPackage) ? task.asset.contentPackage : {};
    await tx.asset.update({ where: { id: task.assetId }, data: { status: "CONTENT_READY", finalDecision: "发布", contentPackage: JSON.parse(JSON.stringify({ ...existingPackage, promotion: { packageId: record.id, batchId: batch.id, status: "PREVIEW" } })) } });
    await addLog(tx, { assetId: task.assetId, taskId, action: "CONTENT_DRAFT_CREATED", message: `已创建网站待审核草稿包 #${record.id}，不会自动发布` });
    return { packageId: record.id, batchId: batch.id, status: record.status, reused: false };
  });
}
