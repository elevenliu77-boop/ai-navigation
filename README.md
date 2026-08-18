# alphahole · AI 效率与赚钱知识库

alphahole 是一个聚焦 **AI 效率与赚钱** 的内容平台：精选 AI 工具、可复制的自动化工作流、经过验证的提示词模板、真实变现案例拆解，以及把知识变成判断工具的互动实验。

## 站点结构

| 栏目 | 路径 | 说明 |
| --- | --- | --- |
| 首页 | `/` | AI 赚钱 + 效率 + 工具定位，聚合各栏目精选内容 |
| AI 工具库 | `/tools` | 精选 AI 工具与使用评测 |
| AI 知识库 | `/posts` | AI 技术、教程、方法论与实战经验 |
| AI 赚钱案例 | `/cases` | 真实案例拆解：收益模式、成本、周期 |
| AI 工作流 | `/workflows` | 可直接复制的自动化流程 |
| 提示词库 | `/prompts` | 验证过的提示词模板 |
| 资源中心 | `/resources` | 报告、模板、课程等资料 |
| AI 发现 | `/discoveries` | 每日新工具与开源项目 |
| alphahole 实验室 | `/lab` | 判断工具与互动实验 |

## 技术栈

- Next.js 15（App Router）+ React 18 + TypeScript
- Prisma + PostgreSQL（Neon）
- Tailwind CSS + Radix UI + shadcn/ui
- Vercel 部署（region: hkg1）

## 本地开发

```bash
pnpm install        # 或 npm install
cp .env.example .env
pnpm prisma generate
pnpm dev            # http://localhost:3000
```

必填环境变量：`DATABASE_URL`、`DIRECT_URL`、`ADMIN_PASSWORD`（后台登录密码）、`JWT_SECRET`（会话签名密钥，请使用足够长的随机值）。

## 后台管理

- 登录页：`/admin/login`（httpOnly + SameSite Cookie 会话，7 天有效期）
- 后台入口：`/admin`
- 所有 `/api/admin/*` 与内容写入接口均要求管理员会话；页面层与 API 层双重校验，另有全局 middleware 兜底。

## 安全说明

- 服务端出站请求（缩略图抓取、URL 可访问性检查、内容采集）统一经过 SSRF 防护：仅允许公开 HTTP/HTTPS、禁止内网/回环/链路本地地址、手动限制重定向跳数、限制响应大小与超时。
- 文章等内容写入数据库前做白名单式 HTML 消毒，前端渲染采用「先转义再渲染」的 Markdown 渲染器，双层防 XSS。
- 生产环境通过响应头启用 CSP、X-Content-Type-Options、X-Frame-Options、Referrer-Policy 与 Permissions-Policy。
- 定时任务不再在应用内启动（Serverless 环境不可靠且不安全）；缩略图刷新改由后台手动触发（`/admin` → 缩略图更新）。

## 部署

```bash
pnpm build
vercel --prod
```

Vercel 构建命令会执行 `prisma db push && prisma generate && next build`，数据库表结构变更随部署自动应用。
