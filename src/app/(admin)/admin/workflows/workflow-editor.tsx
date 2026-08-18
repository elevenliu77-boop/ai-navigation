"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

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
import { Badge } from "@/ui/common/badge";
import { Save, Eye, ArrowLeft, Star } from "lucide-react";
import Link from "next/link";
import type { WorkflowMetadata } from "@/lib/types";

interface WorkflowEditorProps {
  initialData?: {
    id: number;
    title: string;
    slug: string;
    description: string;
    steps: any[];
    tools: any[];
    status: string;
    featured: boolean;
    category_id: number;
    tags: { id: number; name: string; slug: string }[];
    metadata?: WorkflowMetadata | null;
  };
  categories: { id: number; name: string; slug: string }[];
  tags: { id: number; name: string; slug: string }[];
}

export default function WorkflowEditor({
  initialData,
  categories,
  tags,
}: WorkflowEditorProps) {
  const router = useRouter();
  const isEdit = !!initialData;
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [stepsText, setStepsText] = useState(
    initialData ? JSON.stringify(initialData.steps, null, 2) : ""
  );
  const [toolsText, setToolsText] = useState(
    initialData ? JSON.stringify(initialData.tools, null, 2) : ""
  );
  const [status, setStatus] = useState(initialData?.status || "draft");
  const [featured, setFeatured] = useState(initialData?.featured || false);
  const [categoryId, setCategoryId] = useState(
    String(initialData?.category_id || "")
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialData?.tags.map((t) => t.slug) || []
  );
  const [audienceText, setAudienceText] = useState(initialData?.metadata?.audience?.join(", ") || "");
  const [effect, setEffect] = useState(initialData?.metadata?.effect || "");

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

  const handleSave = async (publishStatus?: string) => {
    setSaving(true);
    try {
      let steps: any[] = [];
      let tools: any[] = [];
      try {
        steps = stepsText.trim() ? JSON.parse(stepsText) : [];
        tools = toolsText.trim() ? JSON.parse(toolsText) : [];
      } catch {
        alert("步骤或工具 JSON 格式错误，请检查");
        setSaving(false);
        return;
      }

      const finalStatus = publishStatus || status;
      const body = {
        title,
        slug,
        description,
        steps,
        tools,
        status: finalStatus,
        featured,
        category_id: Number(categoryId),
        tags: selectedTags,
        metadata: {
          audience: audienceText.split(",").map((item) => item.trim()).filter(Boolean),
          effect,
        },
      };

      let res;
      if (isEdit) {
        res = await fetch(`/api/workflows/${initialData!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch("/api/workflows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      if (res.ok) {
        router.push("/admin/workflows");
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

  const toggleTag = (tagSlug: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagSlug)
        ? prev.filter((t) => t !== tagSlug)
        : [...prev, tagSlug]
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/workflows">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">
            {isEdit ? "编辑工作流" : "新建工作流"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave("draft")}
            disabled={saving}
          >
            <Save className="w-4 h-4 mr-1" /> 保存草稿
          </Button>
          <Button
            size="sm"
            onClick={() => handleSave("published")}
            disabled={saving}
          >
            <Eye className="w-4 h-4 mr-1" /> 发布
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">标题</label>
                <Input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    autoSlug(e.target.value);
                  }}
                  placeholder="工作流标题"
                />
              </div>
              <Card>
                <CardHeader><CardTitle className="text-sm">适用人群与效果</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Input value={audienceText} onChange={(e) => setAudienceText(e.target.value)} placeholder="适用人群，用逗号分隔" />
                  <Textarea value={effect} onChange={(e) => setEffect(e.target.value)} placeholder="效果：这套流程最终能带来什么结果" className="min-h-[80px] text-sm" />
                </CardContent>
              </Card>
              <div>
                <label className="text-sm font-medium mb-1 block">Slug</label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="workflow-slug"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">简介</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="工作流简介..."
                  className="min-h-[80px] text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  步骤 (JSON 数组)
                </label>
                <Textarea
                  value={stepsText}
                  onChange={(e) => setStepsText(e.target.value)}
                  placeholder={`[\n  { "title": "步骤1", "description": "说明", "tools": ["工具A"] }\n]`}
                  className="min-h-[240px] font-mono text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  使用工具 (JSON 数组, 可选)
                </label>
                <Textarea
                  value={toolsText}
                  onChange={(e) => setToolsText(e.target.value)}
                  placeholder={`[\n  { "name": "ChatGPT", "url": "https://chat.openai.com" }\n]`}
                  className="min-h-[100px] font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">工作流设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  分类
                </label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  状态
                </label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="published">已发布</SelectItem>
                    <SelectItem value="archived">归档</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={featured ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setFeatured(!featured)}
                >
                  <Star className={`w-3 h-3 mr-1 ${featured ? "fill-current" : ""}`} />
                  {featured ? "已精选" : "设为精选"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">标签</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={selectedTags.includes(tag.slug) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag.slug)}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
