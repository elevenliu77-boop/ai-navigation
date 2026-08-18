"use client";

import { useState } from "react";
import { Wrench } from "lucide-react";
import { cn } from "@/lib/utils/utils";

// 工具 Logo：本地 asset 优先，外链失效时回退到统一占位（首字母色块）
// 目标：broken image = 0

const palette = [
  "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  "bg-teal-500/10 text-teal-600 dark:text-teal-400",
];

function colorIndex(title: string) {
  let sum = 0;
  for (let i = 0; i < title.length; i++) sum += title.charCodeAt(i);
  return sum % palette.length;
}

function initials(title: string) {
  const t = title.trim();
  if (!t) return "AI";
  const ascii = /^[A-Za-z0-9]/.test(t);
  if (ascii) {
    const parts = t.split(/[\s\-._]+/).filter(Boolean);
    return parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : t.slice(0, 2).toUpperCase();
  }
  return t.slice(0, 1);
}

interface ToolLogoProps {
  title: string;
  thumbnail?: string | null;
  thumbnailBase64?: string | null;
  className?: string;
}

export function ToolLogo({
  title,
  thumbnail,
  thumbnailBase64,
  className,
}: ToolLogoProps) {
  const [failed, setFailed] = useState(false);

  // 本地数据优先（base64 或项目内 asset）
  const src = thumbnailBase64 || thumbnail;
  const isLocal =
    !!src &&
    (src.startsWith("data:") ||
      src.startsWith("/") ||
      !failed);

  if (src && isLocal && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={title}
        className={cn("rounded-lg bg-muted object-cover", className)}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }

  // 统一占位：首字母色块
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg",
        palette[colorIndex(title)],
        className
      )}
      aria-label={title}
    >
      <span className="font-bold leading-none select-none">
        {initials(title)}
      </span>
    </span>
  );
}

export function ToolLogoIcon({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground",
        className
      )}
    >
      <Wrench className="h-4 w-4" />
    </span>
  );
}
