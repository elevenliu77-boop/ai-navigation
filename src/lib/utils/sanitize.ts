/**
 * 服务端 HTML 消毒（无第三方依赖的严格白名单实现）。
 * 用于文章/案例/提示词/工作流等内容在写入数据库前的清理，
 * 与前端「先转义再渲染」的 markdown 渲染器形成双层 XSS 防护。
 */

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "a",
  "code",
  "pre",
  "blockquote",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "img",
  "hr",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "span",
  "div",
]);

const ALLOWED_ATTRS = new Set([
  "href",
  "src",
  "alt",
  "title",
  "rel",
  "target",
  "width",
  "height",
  "class",
  "style",
]);

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeUrl(value: string): string | null {
  const candidate = value.trim();
  if (candidate.startsWith("#")) return candidate;
  try {
    const url = new URL(candidate, "https://alphahole.xyz");
    if (["http:", "https:", "mailto:"].includes(url.protocol)) {
      return url.toString();
    }
  } catch {
    /* 忽略非法 URL */
  }
  return null;
}

/** 校验外部链接/下载地址必须是公开 http(s) URL。 */
export function safeHttpUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (["http:", "https:"].includes(url.protocol) && !url.username && !url.password) {
      return url.toString();
    }
  } catch {
    /* 忽略非法 URL */
  }
  return null;
}

function sanitizeStyle(value: string): string {
  // 仅保留安全的样式声明（颜色/字号/间距等），剥离表达式与外部引入
  return value
    .split(";")
    .map((decl) => decl.trim())
    .filter((decl) => {
      const colon = decl.indexOf(":");
      if (colon < 1) return false;
      const prop = decl.slice(0, colon).trim().toLowerCase();
      const val = decl.slice(colon + 1).trim().toLowerCase();
      if (val.includes("expression") || val.includes("javascript:") || val.includes("url(")) return false;
      return /^(color|background(-color)?|font(-size|-weight|-style)?|text-align|margin|padding|border(-radius|-width)?|width|height|max-width|max-height|line-height|letter-spacing)$/.test(prop);
    })
    .join("; ");
}

/**
 * 白名单式消毒 HTML。所有未允许的标签被移除（内容保留为纯文本），
 * 事件属性与 javascript: 协议一律剔除。
 */
export function sanitizeHtml(input: string, maxLength = 500_000): string {
  if (typeof input !== "string") return "";
  if (input.length > maxLength) input = input.slice(0, maxLength);

  // 第一步：剥离注释与危险标签块
  let html = input
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\s*(script|style|iframe|object|embed|form|link|meta|base|svg|math|video|audio|source|track)[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed|form|link|meta|base|svg|math)[^>]*\/?>/gi, "");

  // 第二步：逐标签处理（开放/闭合标签）
  html = html.replace(/<\s*(\/?)\s*([a-zA-Z0-9]+)([^>]*)>/g, (match, closing, rawTag, attrs) => {
    const tag = rawTag.toLowerCase();
    const isClosing = closing === "/";
    if (!ALLOWED_TAGS.has(tag)) {
      // 未允许的标签：保留内容，去掉标签本身
      return "";
    }
    if (isClosing) return `</${tag}>`;

    const kept: string[] = [];
    const attrPattern = /([a-zA-Z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
    let attrMatch: RegExpExecArray | null;
    while ((attrMatch = attrPattern.exec(attrs)) !== null) {
      const name = attrMatch[1].toLowerCase();
      const value = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? "";
      if (!ALLOWED_ATTRS.has(name)) continue;
      if (name.startsWith("on")) continue;
      if (name === "href" || name === "src") {
        if (tag === "a" && name === "href") {
          const url = safeUrl(value);
          if (!url) continue;
          kept.push(`href="${escapeHtml(url)}"`);
          kept.push('rel="noopener noreferrer nofollow"');
          kept.push('target="_blank"');
          continue;
        }
        if ((tag === "img" || tag === "a") && name === "src") {
          const url = safeUrl(value);
          if (!url) continue;
          kept.push(`src="${escapeHtml(url)}"`);
          continue;
        }
        continue;
      }
      if (name === "style") {
        const cleaned = sanitizeStyle(value);
        if (cleaned) kept.push(`style="${escapeHtml(cleaned)}"`);
        continue;
      }
      kept.push(`${name}="${escapeHtml(value)}"`);
    }
    return `<${tag}${kept.length ? " " + kept.join(" ") : ""}>`;
  });

  // 第三步：转义残留的 < >（避免畸形标签绕过）
  html = html.replace(/<(?![a-zA-Z\/])/g, "&lt;").replace(/([^a-zA-Z])>/g, "$1&gt;");

  // 第四步：清理空块级标签与多余的空白
  html = html
    .replace(/<(p|div|li|span)\s*>\s*<\/\1>/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  return html;
}

/** 便捷函数：字符串则消毒，非字符串返回空串。 */
export function sanitizeText(input: unknown, maxLength = 5000): string {
  if (typeof input !== "string") return "";
  return input.slice(0, maxLength);
}

/** 批量消毒内容写入载荷：htmlFields 走 HTML 白名单，textFields 走纯文本截断。 */
export function sanitizeContentFields(
  data: Record<string, unknown>,
  htmlFields: string[] = [],
  textFields: string[] = []
): Record<string, unknown> {
  for (const field of htmlFields) {
    if (typeof data[field] === "string") {
      data[field] = sanitizeHtml(data[field] as string);
    }
  }
  for (const field of textFields) {
    if (typeof data[field] === "string") {
      data[field] = sanitizeText(data[field], field === "title" ? 300 : 5000);
    }
  }
  return data;
}
