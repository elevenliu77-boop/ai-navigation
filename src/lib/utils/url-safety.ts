import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * 服务端出站请求安全工具：
 * - 仅允许公开 HTTP/HTTPS 地址，禁止携带内嵌凭据与非标准端口
 * - 阻止解析到内网 / 回环 / 链路本地地址的域名与 IP（SSRF 防护）
 * - 手动跟随重定向并限制跳数，防止重定向到内网
 */

export function isPrivateIp(value: string): boolean {
  const ip = value.toLowerCase();
  if (ip.includes(":")) {
    return (
      ip === "::1" ||
      ip.startsWith("fc") ||
      ip.startsWith("fd") ||
      ip.startsWith("fe80") ||
      ip.startsWith("::ffff:127.") ||
      ip.startsWith("::ffff:10.") ||
      ip.startsWith("::ffff:192.168.") ||
      ip.startsWith("::ffff:172.")
    );
  }
  const parts = ip.split(".").map(Number);
  return (
    parts.length === 4 &&
    (parts[0] === 10 ||
      parts[0] === 127 ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168) ||
      parts[0] === 0 ||
      (parts[0] === 169 && parts[1] === 254))
  );
}

/** 校验 URL 可被服务端安全抓取；返回规范化 URL，非法地址抛错。 */
export async function assertPublicUrl(value: string): Promise<URL> {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("只允许访问公开 HTTP/HTTPS URL");
  }
  if (url.username || url.password) {
    throw new Error("URL 不允许携带用户名或密码");
  }
  if (url.port && !["80", "443"].includes(url.port)) {
    throw new Error("只允许访问 80/443 标准端口");
  }

  const host = url.hostname.toLowerCase();
  if (
    ["localhost", "metadata.google.internal", "169.254.169.254"].includes(host) ||
    host.endsWith(".internal") ||
    host.endsWith(".localhost")
  ) {
    throw new Error("禁止访问内网或本机地址");
  }

  if (isIP(host)) {
    if (isPrivateIp(host)) throw new Error("禁止访问内网 IP");
  } else {
    const addresses = await lookup(host, { all: true });
    if (!addresses.length || addresses.some((item) => isPrivateIp(item.address))) {
      throw new Error("域名解析到内网地址，已阻止抓取");
    }
  }
  return url;
}

/** 抓取公开 URL，手动跟随最多 4 次重定向，每跳都做 SSRF 校验。 */
export async function fetchPublicResponse(
  input: string,
  init: RequestInit,
  maxHops = 4
): Promise<Response> {
  let current = input;
  for (let hop = 0; hop < maxHops; hop += 1) {
    await assertPublicUrl(current);
    const response = await fetch(current, { ...init, redirect: "manual" });
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;
    const location = response.headers.get("location");
    if (!location) return response;
    current = new URL(location, current).toString();
  }
  throw new Error("URL 重定向次数过多");
}

/**
 * 安全抓取远程图片：SSRF 校验 + 手动重定向 + 超时 + 大小上限 + 内容类型校验。
 * 返回 { buffer, contentType }，任何一项不满足即抛错。
 */
export async function fetchPublicImage(
  input: string,
  options: { maxBytes?: number; timeoutMs?: number } = {}
): Promise<{ buffer: Buffer; contentType: string }> {
  const { maxBytes = 1_000_000, timeoutMs = 10_000 } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchPublicResponse(input, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const rawContentType = (response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!rawContentType.startsWith("image/")) throw new Error("不是图片内容类型");
    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > maxBytes) throw new Error("图片超过大小上限");
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength === 0 || arrayBuffer.byteLength > maxBytes) {
      throw new Error("图片超过大小上限");
    }
    return { buffer: Buffer.from(arrayBuffer), contentType: rawContentType };
  } finally {
    clearTimeout(timeout);
  }
}
