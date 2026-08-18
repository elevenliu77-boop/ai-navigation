"use client";

import { useEffect, useState } from "react";
import { Check, Heart, Share2 } from "lucide-react";
import { Button } from "@/ui/common/button";
import { toast } from "sonner";

interface FavoriteButtonProps { targetType: "post" | "discovery" | "tool" | "prompt" | "workflow" | "case"; targetId: number; initialCount?: number }

export function FavoriteButton({ targetType, targetId, initialCount = 0 }: FavoriteButtonProps) {
  const [visitorKey, setVisitorKey] = useState("");
  const [count, setCount] = useState(initialCount);
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const keyName = "alphahole-visitor-key";
    let key = localStorage.getItem(keyName);
    if (!key) { key = crypto.randomUUID(); localStorage.setItem(keyName, key); }
    setVisitorKey(key);
    fetch(`/api/favorites?targetType=${targetType}&targetId=${targetId}&visitorKey=${encodeURIComponent(key)}`).then((res) => res.ok ? res.json() : null).then((data) => { if (data) { setCount(data.count); setFavorited(data.favorited); } }).catch(() => {});
  }, [targetId, targetType]);

  const toggle = async () => {
    if (!visitorKey || loading) return;
    setLoading(true);
    const next = !favorited;
    setFavorited(next);
    setCount((value) => Math.max(0, value + (next ? 1 : -1)));
    try {
      const response = await fetch("/api/favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetType, targetId, visitorKey, action: next ? "add" : "remove" }) });
      if (!response.ok) throw new Error("favorite failed");
      const data = await response.json();
      setCount(data.count);
      toast.success(next ? "已收藏" : "已取消收藏");
    } catch { setFavorited(!next); setCount((value) => Math.max(0, value + (next ? -1 : 1))); toast.error("收藏操作失败，请稍后重试"); } finally { setLoading(false); }
  };

  return <Button type="button" variant={favorited ? "default" : "outline"} size="sm" className="gap-1.5" onClick={toggle} disabled={loading}><Heart className={`h-4 w-4 ${favorited ? "fill-current" : ""}`} />{favorited ? "已收藏" : "收藏"}<span className="text-xs opacity-80">{count}</span></Button>;
}

export function ShareButton({ title }: { title: string }) {
  const [shared, setShared] = useState(false);
  const share = async () => {
    const url = window.location.href;
    try { if (navigator.share) await navigator.share({ title, url }); else { await navigator.clipboard.writeText(url); setShared(true); setTimeout(() => setShared(false), 1800); toast.success("链接已复制"); } } catch { /* 用户取消分享 */ }
  };
  return <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={share}>{shared ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}分享</Button>;
}
