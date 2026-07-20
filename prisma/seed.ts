// 种子数据：初始化分类和示例文章
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 开始初始化数据...");

  // ─────────── 创建分类 ───────────
  const categories = [
    { name: "AI 开发工具", slug: "ai-dev-tools", description: "LLM 框架、AI SDK、模型部署工具" },
    { name: "开源项目", slug: "open-source", description: "值得关注的开源项目与工具" },
    { name: "自部署方案", slug: "self-hosted", description: "自托管、私有化部署方案" },
    { name: "开发者工具", slug: "dev-tools", description: "通用开发者效率工具" },
    { name: "教程指南", slug: "tutorials", description: "AI 开发与工程实践教程" },
    { name: "大模型", slug: "llm", description: "大语言模型评测、对比与应用" },
    { name: "效率工作流", slug: "workflow", description: "AI 自动化与效率提升方案" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: cat,
    });
    console.log(`  ✅ 分类: ${cat.name}`);
  }

  // ─────────── 创建标签 ───────────
  const tags = [
    { name: "ChatGPT", slug: "chatgpt" },
    { name: "DeepSeek", slug: "deepseek" },
    { name: "Claude", slug: "claude" },
    { name: "LangChain", slug: "langchain" },
    { name: "Docker", slug: "docker" },
    { name: "开源", slug: "open-source" },
    { name: "自部署", slug: "self-hosted" },
    { name: "API", slug: "api" },
    { name: "Python", slug: "python" },
    { name: "JavaScript", slug: "javascript" },
  ];

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: { name: tag.name },
      create: tag,
    });
    console.log(`  ✅ 标签: ${tag.name}`);
  }

  console.log("🎉 初始化完成！");
}

main()
  .catch((e) => {
    console.error("❌ 初始化失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
