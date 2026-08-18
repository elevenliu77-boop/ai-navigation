export function MarkdownContent({ content }: { content: string }) {
  const html = renderMarkdown(content);
  return (
    <div
      className="markdown-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function renderMarkdown(md: string): string {
  const codeBlocks: string[] = [];
  const tokenized = md.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const safeLang = String(lang || "text").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 30) || "text";
    const token = `@@CODE_BLOCK_${codeBlocks.length}@@`;
    codeBlocks.push(`<pre><code class="language-${safeLang}">${escapeHtml(code)}</code></pre>`);
    return token;
  });

  let html = escapeHtml(tokenized)
    // 行内代码 (`)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // 标题
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // 加粗
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // 斜体
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // 链接
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, rawUrl) => {
      const url = sanitizeUrl(rawUrl);
      return url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${label}</a>` : label;
    })
    // 无序列表
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    // 有序列表
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    // 段落 (双换行)
    .replace(/\n\n/g, "</p><p>")
    // 空行清理
    .replace(/<li><\/li>/g, "")
    // 列表包装
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => {
      if (
        match
          .split("\n")
          .filter((l) => l.trim())
          .every((l) => l.match(/^\d+\./))
      ) {
        return `<ol>${match.replace(/^\d+\. /gm, "")}</ol>`;
      }
      return `<ul>${match.replace(/^- /gm, "")}</ul>`;
    });

  html = codeBlocks.reduce((result, block, index) => result.replace(`@@CODE_BLOCK_${index}@@`, block), html);

  return `<p>${html}</p>`
    .replace(/(<li>.*?<\/li>)+/g, (match) => match)
    .replace(/<p><(ul|ol)>/g, "<$1>")
    .replace(/<\/(ul|ol)><\/p>/g, "</$1>");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeUrl(value: string): string | null {
  const candidate = value
    .trim()
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
  if (candidate.startsWith("/") && !candidate.startsWith("//")) return candidate;
  if (candidate.startsWith("#")) return candidate;
  try {
    const url = new URL(candidate);
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}
