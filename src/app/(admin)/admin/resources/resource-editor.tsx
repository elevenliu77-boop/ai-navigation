"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/common/button";
import { Input } from "@/ui/common/input";
import { Textarea } from "@/ui/common/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/common/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/common/card";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ResourceEditorProps {
  initialData?: {
    id: number;
    title: string;
    slug: string;
    type: string;
    description: string;
    url: string;
    category_id: number | null;
    permission: string;
    status: string;
  };
  categories: { id: number; name: string; slug: string }[];
}

export default function ResourceEditor({
  initialData,
  categories,
}: ResourceEditorProps) {
  const router = useRouter();
  const isEdit = !!initialData;
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [type, setType] = useState(initialData?.type || "file");
  const [description, setDescription] = useState(initialData?.description || "");
  const [url, setUrl] = useState(initialData?.url || "");
  const [categoryId, setCategoryId] = useState(
    initialData?.category_id ? String(initialData.category_id) : "none"
  );
  const [permission, setPermission] = useState(initialData?.permission || "FREE");
  const [status, setStatus] = useState(initialData?.status || "published");

  const autoSlug = (val: string) => {
    if (!isEdit && !slug) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^\w一-龥]+/g, "-")
          .replace(/^-+|-+$/g, "")
      );
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        title,
        slug,
        type,
        description,
        url,
        category_id: categoryId === "none" ? null : Number(categoryId),
        permission,
        status,
      };

      let res;
      if (isEdit) {
        res = await fetch(`/api/resources/${initialData!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch("/api/resources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      if (res.ok) {
        router.push("/admin/resources");
        router.refresh();
      } else {
        const err = await res.json();
        alert("保存失败: " + (err.error || "未知错误"));
      }
    } catch (e) {
      alert("保存失败: " + String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/resources">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">
            {isEdit ? "编辑资料" : "新建资料"}
          </h1>
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-1" /> 保存
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">资料信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">标题</label>
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  autoSlug(e.target.value);
                }}
                placeholder="资料标题"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Slug</label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="resource-slug"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">类型</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="template">模板</SelectItem>
                  <SelectItem value="video">视频</SelectItem>
                  <SelectItem value="file">资料</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">权限</label>
              <Select value={permission} onValueChange={setPermission}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FREE">免费</SelectItem>
                  <SelectItem value="VIP">VIP（预留）</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">状态</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">公开</SelectItem>
                  <SelectItem value="hidden">隐藏</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">分类</label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无分类</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                资料链接 URL
              </label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">描述</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="资料描述..."
              className="min-h-[100px] text-sm"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
