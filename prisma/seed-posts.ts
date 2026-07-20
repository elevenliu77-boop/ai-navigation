import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("📝 添加示例文章...");

  // 查找分类
  const aiDev = await prisma.category.findUnique({ where: { slug: "ai-dev-tools" } });
  const openSource = await prisma.category.findUnique({ where: { slug: "open-source" } });
  const selfHosted = await prisma.category.findUnique({ where: { slug: "self-hosted" } });
  const tutorials = await prisma.category.findUnique({ where: { slug: "tutorials" } });
  const llm = await prisma.category.findUnique({ where: { slug: "llm" } });
  const devTools = await prisma.category.findUnique({ where: { slug: "dev-tools" } });

  const samplePosts = [
    {
      title: "DeepSeek V3 全面评测：国产大模型的新突破",
      slug: "deepseek-v3-review",
      content: `# DeepSeek V3 全面评测

## 概述

DeepSeek V3 是深度求索最新推出的大语言模型，在多项基准测试中表现出色。

## 核心能力

- **推理能力**: 在数学、编程等复杂推理任务上表现优异
- **长文本处理**: 支持 128K 上下文窗口
- **多语言支持**: 中英文双语能力均衡

## 使用方式

\`\`\`python
from openai import OpenAI

client = OpenAI(
    api_key="your-api-key",
    base_url="https://api.deepseek.com"
)

response = client.chat.completions.create(
    model="deepseek-chat",
    messages=[{"role": "user", "content": "你好"}]
)
print(response.choices[0].message.content)
\`\`\`

## 总结

DeepSeek V3 在推理能力和性价比方面具有显著优势，值得开发者关注。`,
      excerpt: "DeepSeek V3 在多项基准测试中达到领先水平，本文从推理能力、长文本处理、API 使用等角度进行全面评测。",
      status: "published",
      category_id: llm!.id,
      published_at: new Date("2026-07-18"),
      view_count: 1520,
    },
    {
      title: "2026 年最值得关注的 10 个 AI 开源项目",
      slug: "top-10-ai-open-source-2026",
      content: `# 2026 年最值得关注的 AI 开源项目

## 1. LangChain

LLM 应用开发框架，支持链式调用、Agent、RAG 等模式。

## 2. Ollama

本地运行大模型的利器，支持 Llama、Mistral、DeepSeek 等模型。

## 3. Diffusers

Hugging Face 出品的扩散模型库，支持 Stable Diffusion 等图像生成模型。

...`,
      excerpt: "从 LLM 框架到 AI 应用工具，精选 2026 年最值得关注的 10 个 AI 开源项目，涵盖大模型、RAG、Agent 等方向。",
      status: "published",
      category_id: openSource!.id,
      published_at: new Date("2026-07-16"),
      view_count: 2340,
    },
    {
      title: "使用 Docker 自部署 LLM 推理服务完整指南",
      slug: "self-host-llm-with-docker",
      content: `# 使用 Docker 自部署 LLM 推理服务

## 环境准备

- Docker 24+ 和 Docker Compose V2
- NVIDIA GPU（建议 24GB+ 显存）
- Linux 或 WSL2

## 部署 vLLM

\`\`\`yaml
# docker-compose.yml
version: "3.8"
services:
  vllm:
    image: vllm/vllm-openai:latest
    runtime: nvidia
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
    command: --model deepseek-ai/deepseek-coder-6.7b-instruct
    ports:
      - "8000:8000"
\`\`\`

## 调用 API

\`\`\`bash
curl http://localhost:8000/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{"model":"deepseek-coder","messages":[{"role":"user","content":"写一个 Python 快速排序"}]}'
\`\`\``,
      excerpt: "手把手教你用 Docker + vLLM 部署大模型推理服务，支持 OpenAI 兼容 API，适合本地开发和内网使用。",
      status: "published",
      category_id: selfHosted!.id,
      published_at: new Date("2026-07-14"),
      view_count: 1890,
    },
    {
      title: "Cursor IDE 深度使用教程：AI 编程的最佳实践",
      slug: "cursor-ide-guide",
      content: `# Cursor IDE 深度使用教程

## 为什么选择 Cursor

Cursor 是基于 VS Code 的 AI 优先编辑器，内置了强大的 AI 辅助编程功能。

## 核心功能

1. **Tab 补全**: 智能代码补全，比 Copilot 更准确
2. **Chat**: 内置 AI 对话，支持 @file @code 等上下文引用
3. **Composer**: 多文件编辑模式，批量修改代码
4. **Agent 模式**: AI 自动执行命令、安装依赖、调试

## 最佳实践

### 技巧 1：使用 @ 符号引用上下文

在 Chat 中输入 \`@\` 可以引用文件、函数或代码块，让 AI 理解你的代码上下文。`,
      excerpt: "Cursor 已经成为开发者首选的 AI 编程工具，本文分享从基础配置到高级技巧的完整使用指南。",
      status: "published",
      category_id: aiDev!.id,
      published_at: new Date("2026-07-12"),
      view_count: 3120,
    },
    {
      title: "MCP 协议详解：让 AI 模型真正使用工具的桥梁",
      slug: "mcp-protocol-guide",
      content: `# MCP 协议详解

## 什么是 MCP

MCP (Model Context Protocol) 是 Anthropic 推出的开放协议，让 AI 模型能够安全地访问外部工具和数据源。

## 核心原理

\`\`\`python
# MCP Server 示例
from mcp.server import Server

app = Server("hello-world")

@app.tool()
async def greet(name: str) -> str:
    return f"Hello, {name}!"
\`\`\`

## 应用场景

- 数据库查询
- 文件系统操作
- API 调用
- 代码执行`,
      excerpt: "MCP 是连接 AI 模型与外部世界的桥梁，本文深入讲解协议原理、Server/Client 实现和实际应用场景。",
      status: "published",
      category_id: tutorials!.id,
      published_at: new Date("2026-07-10"),
      view_count: 980,
    },
    {
      title: "2026 年最佳 AI 编程助手横向对比",
      slug: "ai-coding-assistant-comparison-2026",
      content: `# 2026 年 AI 编程助手横向对比

| 工具 | 代码补全 | 上下文理解 | 价格 |
|:----|:--------|:----------|:----|
| GitHub Copilot | ⭐⭐⭐ | ⭐⭐⭐⭐ | $10/月 |
| Cursor | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | $20/月 |
| Codeium | ⭐⭐⭐⭐ | ⭐⭐⭐ | 免费/付费 |
| Amazon Q | ⭐⭐⭐ | ⭐⭐⭐ | 免费 |

## 综合评价

Cursor 在代码质量和上下文理解方面领先，Copilot 胜在生态整合度。`,
      excerpt: "对比 GitHub Copilot、Cursor、Codeium 等主流 AI 编程助手，从代码补全、上下文理解、价格等维度给出推荐。",
      status: "published",
      category_id: devTools!.id,
      published_at: new Date("2026-07-08"),
      view_count: 2150,
    },
    {
      title: "LangChain + DeepSeek 构建 RAG 知识库系统",
      slug: "langchain-deepseek-rag",
      content: `# LangChain + DeepSeek 构建 RAG 系统

## 技术栈

- LangChain：LLM 应用框架
- DeepSeek：大语言模型
- ChromaDB：向量数据库
- FastAPI：API 服务

## 核心代码

\`\`\`python
from langchain.chains import RetrievalQA
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import Chroma

# 构建检索链
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    retriever=vectorstore.as_retriever(),
    chain_type="stuff"
)
\`\`\`

## 部署

使用 Docker Compose 一键部署。`,
      excerpt: "使用 LangChain + DeepSeek 构建企业级 RAG 知识库系统，支持文档上传、向量检索、流式问答。",
      status: "published",
      category_id: tutorials!.id,
      published_at: new Date("2026-07-06"),
      view_count: 1670,
    },
  ];

  for (const post of samplePosts) {
    await prisma.post.upsert({
      where: { slug: post.slug },
      update: { view_count: post.view_count },
      create: post,
    });
    console.log(`  ✅ ${post.title}`);
  }

  console.log("🎉 示例文章添加完成！");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
