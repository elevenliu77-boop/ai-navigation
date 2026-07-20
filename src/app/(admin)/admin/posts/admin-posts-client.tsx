"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/ui/common/button";
import { Badge } from "@/ui/common/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/ui/common/card";
import { motion } from "framer-motion";

interface Post {
  id: number;
  title: string;
  slug: string;
  status: string;
  view_count: number;
  published_at: string | null;
  created_at: string;
  category?: { id: number; name: string; slug: string } | null;
}

interface AdminPostsClientProps {
  initialPosts: Post[];
  total: number;
  categories: { id: number; name: string; slug: string }[];
}

export function AdminPostsClient({
  initialPosts,
  total,
}: AdminPostsClientProps) {
  const [posts, setPosts] = useState(initialPosts);
  const router = useRouter();

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除这篇文章？此操作不可撤销。")) return;

    try {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
        router.refresh();
      }
    } catch (e) {
      console.error("Delete failed:", e);
    }
  };

  const statusColors: Record<string, string> = {
    draft: "bg-yellow-500/10 text-yellow-600",
    published: "bg-green-500/10 text-green-600",
    archived: "bg-gray-500/10 text-gray-600",
  };

  const statusText: Record<string, string> = {
    draft: "草稿",
    published: "已发布",
    archived: "归档",
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">文章管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            共 {total} 篇文章
          </p>
        </div>
        <Button asChild>
          <a href="/admin/posts/new">
            <Plus className="w-4 h-4 mr-1" /> 写文章
          </a>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>文章列表</CardTitle>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              暂无文章
            </div>
          ) : (
            <div className="space-y-2">
              {posts.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/30 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={
                          statusColors[post.status] || ""
                        }
                      >
                        {statusText[post.status] || post.status}
                      </Badge>
                      <h3 className="font-medium truncate">
                        {post.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {post.view_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.published_at
                          ? new Date(post.published_at).toLocaleDateString("zh-CN")
                          : new Date(post.created_at).toLocaleDateString("zh-CN")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                    >
                      <a
                        href={`/posts/${post.slug}`}
                        target="_blank"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                    >
                      <a href={`/admin/posts/${post.id}/edit`}>
                        <Edit className="w-4 h-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
