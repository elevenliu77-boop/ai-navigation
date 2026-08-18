"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit, ExternalLink, Eye, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/ui/common/badge";
import { Button } from "@/ui/common/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/common/card";

interface Props { posts: { id: number; title: string; slug: string; status: string; view_count: number; updated_at: string }[] }
export default function AdminDiscoveriesClient({ posts: initialPosts }: Props) {
  const router = useRouter();
  const handleDelete = async (id: number) => { if (!confirm("确定删除这条 AI发现内容吗？")) return; const response = await fetch(`/api/posts/${id}`, { method: "DELETE" }); if (response.ok) router.refresh(); };
  return <div className="p-6 max-w-5xl mx-auto"><div className="flex items-center justify-between mb-6"><div><h1 className="text-2xl font-bold">AI发现管理</h1><p className="text-sm text-muted-foreground mt-1">通过文章编辑器维护项目介绍、教程和标签关联。</p></div><Button asChild><Link href="/admin/discoveries/new"><Plus className="h-4 w-4 mr-1" />新增 AI发现</Link></Button></div><Card><CardHeader><CardTitle>发现内容（{initialPosts.length}）</CardTitle></CardHeader><CardContent className="space-y-2">{initialPosts.length ? initialPosts.map((post) => <div key={post.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/30 p-3"><div className="min-w-0"><div className="flex items-center gap-2"><Badge variant={post.status === "published" ? "default" : "outline"}>{post.status === "published" ? "已发布" : post.status}</Badge><h2 className="font-medium truncate">{post.title}</h2></div><div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground"><span><Eye className="inline h-3 w-3 mr-1" />{post.view_count}</span><span>更新于 {new Date(post.updated_at).toLocaleDateString("zh-CN")}</span></div></div><div className="flex items-center gap-1"><Button variant="ghost" size="sm" asChild><Link href={`/discoveries/${post.slug}`} target="_blank"><ExternalLink className="h-4 w-4" /></Link></Button><Button variant="ghost" size="sm" asChild><Link href={`/admin/discoveries/${post.id}/edit`}><Edit className="h-4 w-4" /></Link></Button><Button variant="ghost" size="sm" onClick={() => handleDelete(post.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button></div></div>) : <div className="py-12 text-center text-muted-foreground">暂无 AI发现内容</div>}</CardContent></Card></div>;
}
