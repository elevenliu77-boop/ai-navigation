
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const stopWords = new Set([
  "ai",
  "我是",
  "想要",
  "想做",
  "想用",
  "我要",
  "我想",
  "做",
  "用",
  "怎么",
  "如何",
  "可以",
  "帮我",
  "一下",
  "一个",
  "现在",
  "开始",
  "请问",
]);

function extractTerms(message: string): string[] {
  const keywordLibrary = [
    "小红书",
    "公众号",
    "短视频",
    "变现",
    "赚钱",
    "副业",
    "宝妈",
    "RAG",
    "LangChain",
    "DeepSeek",
    "Docker",
    "自部署",
    "Cursor",
    "AI编程",
    "Agent",
    "Python",
    "n8n",
    "知识库",
    "工作流",
    "办公",
    "效率",
    "编程",
    "代码",
  ];
  const matchedKeywords = keywordLibrary.filter((keyword) =>
    message.toLowerCase().includes(keyword.toLowerCase())
  );
  const raw = message
    .trim()
    .toLowerCase()
    .split(/[^\p{L}\p{N}+#.-]+/u)
    .filter((term) => term.length >= 2 && !stopWords.has(term));

  const intentTerms = [
    { pattern: /赚钱|副业|变现|收入|宝妈/u, terms: ["变现", "小红书"] },
    { pattern: /效率|办公|自动化|流程/u, terms: ["自动化", "工作流"] },
    { pattern: /编程|开发|代码|程序员/u, terms: ["AI编程", "Agent", "Python"] },
    { pattern: /知识库|检索|RAG|向量/u, terms: ["RAG", "LangChain"] },
  ];

  const expanded = intentTerms.flatMap((item) =>
    item.pattern.test(message) ? item.terms : []
  );

  return [...new Set([...matchedKeywords, ...expanded, ...raw])].slice(0, 10);
}

function buildWhere(terms: string[], fields: string[]): any {
  const or = terms.flatMap((term) => [
    ...fields.map((field) => ({
      [field]: { contains: term, mode: "insensitive" },
    })),
    {
      tags: {
        some: {
          tag: {
            OR: [
              { name: { contains: term, mode: "insensitive" } },
              { slug: { contains: term, mode: "insensitive" } },
            ],
          },
        },
      },
    },
  ]);

  return {
    status: "published",
    ...(or.length ? { OR: or } : {}),
  };
}

function toResult(
  type: string,
  typeLabel: string,
  item: {
    id: number;
    title: string;
    slug: string;
    description?: string | null;
    excerpt?: string | null;
    summary?: string | null;
    view_count?: number;
    url?: string;
  }
) {
  const collection =
    type === "post"
      ? "posts"
      : type === "prompt"
      ? "prompts"
      : type === "workflow"
      ? "workflows"
      : "cases";

  return {
    id: type + "-" + item.id,
    type,
    typeLabel,
    title: item.title,
    description: item.description || item.excerpt || item.summary || "",
    viewCount: item.view_count || 0,
    href: type === "tool" ? item.url || "/" : "/" + collection + "/" + item.slug,
    external: type === "tool",
  };
}

function buildToolWhere(terms: string[]): any {
  const or = terms.flatMap((term) => [
    { title: { contains: term, mode: "insensitive" } },
    { description: { contains: term, mode: "insensitive" } },
  ]);
  return {
    status: "approved",
    ...(or.length ? { OR: or } : {}),
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json(
        { message: "请先告诉我你想解决什么问题" },
        { status: 400 }
      );
    }

    const terms = extractTerms(message);
    const [tools, posts, prompts, workflows, cases, researchAssets] = await Promise.all([
      prisma.website.findMany({
        where: buildToolWhere(terms),
        select: { id: true, title: true, url: true, description: true, visits: true },
        orderBy: [{ visits: "desc" }, { likes: "desc" }],
        take: 3,
      }),
      prisma.post.findMany({
        where: buildWhere(terms, ["title", "excerpt", "content"]),
        select: { id: true, title: true, slug: true, excerpt: true, view_count: true },
        orderBy: [{ view_count: "desc" }, { published_at: "desc" }],
        take: 4,
      }),
      prisma.prompt.findMany({
        where: buildWhere(terms, ["title", "excerpt", "content"]),
        select: { id: true, title: true, slug: true, excerpt: true, view_count: true },
        orderBy: [{ view_count: "desc" }, { published_at: "desc" }],
        take: 3,
      }),
      prisma.workflow.findMany({
        where: buildWhere(terms, ["title", "description"]),
        select: { id: true, title: true, slug: true, description: true, view_count: true },
        orderBy: [{ view_count: "desc" }, { published_at: "desc" }],
        take: 3,
      }),
      prisma.caseStudy.findMany({
        where: buildWhere(terms, ["title", "summary", "content"]),
        select: { id: true, title: true, slug: true, summary: true, view_count: true },
        orderBy: [{ view_count: "desc" }, { published_at: "desc" }],
        take: 3,
      }),
      // 研究资产（ResearchAsset）：仅已发布（status=PUBLISHED）且关联网站内容已发布时进入公开检索
      prisma.researchAsset.findMany({
        where: {
          status: "PUBLISHED",
          terminalState: "FINAL", // MERGE/REJECT 永不作为推荐内容；REJECT 仅用于防错知识
          OR: terms.flatMap((term) => [
            { title: { contains: term, mode: "insensitive" } },
            { summary: { contains: term, mode: "insensitive" } },
            { ahId: { contains: term, mode: "insensitive" } },
          ]),
        },
        select: { id: true, ahId: true, title: true, summary: true, siteContentId: true },
        orderBy: [{ updatedAt: "desc" }],
        take: 3,
      }),
    ]);

    const results = [
      ...tools.map((item) =>
        toResult("tool", "AI工具库", {
          id: item.id,
          title: item.title,
          slug: "",
          url: item.url,
          description: item.description,
          view_count: item.visits,
        })
      ),
      ...posts.map((item) => toResult("post", "AI知识库", item)),
      ...prompts.map((item) => toResult("prompt", "提示词库", item)),
      ...workflows.map((item) => toResult("workflow", "AI工作流", item)),
      ...cases.map((item) => toResult("case", "AI赚钱案例", item)),
      ...researchAssets
        .filter((item) => item.siteContentId != null)
        .map((item) =>
          toResult("post", "研究资产", {
            id: item.id,
            title: `${item.title}（AH-${item.ahId.slice(3)}）`,
            slug: "",
            description: item.summary || "研究资产摘要",
            view_count: 0,
          })
        ),
    ].slice(0, 10);

    const reply = results.length
      ? "我根据“" + message + "”在站内知识库找到了 " + results.length + " 条相关内容，你可以先从最匹配的教程和工作流开始。"
      : "暂时没有找到完全匹配的内容。你可以换一种说法，或直接告诉我你的目标、行业和目前水平。";

    return NextResponse.json({ reply, terms, results });
  } catch (error) {
    console.error("Assistant chat error:", error);
    return NextResponse.json(
      { message: "助手暂时无法响应，请稍后再试" },
      { status: 500 }
    );
  }
}
