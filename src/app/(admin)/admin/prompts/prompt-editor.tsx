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
import { Badge } from "@/ui/common/badge";
import { Save, Eye, ArrowLeft, Star } from "lucide-react";
import Link from "next/link";
import type { PromptMetadata } from "@/lib/types";

interface PromptEditorProps {
  initialData?: {
    id: number;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    status: string;
    featured: boolean;
    category_id: number;
    tags: { id: number; name: string; slug: string }[];
    metadata?: PromptMetadata | null;
  };
  categories: { id: number; name: string; slug: string }[];
  tags: { id: number; name: string; slug: string }[];
}

export default function PromptEditor({
  initialData,
  categories,
  tags,
}: PromptEditorProps) {
  const router = useRouter();
  const isEdit = !!initialData;
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [status, setStatus] = useState(initialData?.status || "draft");
  const [featured, setFeatured] = useState(initialData?.featured || false);
  const [categoryId, setCategoryId] = useState(
    String(initialData?.category_id || "")
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialData?.tags.map((t) => t.slug) || []
  );
  const [scenariosText, setScenariosText] = useState(initialData?.metadata?.scenarios?.join(", ") || "");
  const [recommendedModel, setRecommendedModel] = useState(initialData?.metadata?.recommendedModel || "");
  const [exampleInput, setExampleInput] = useState(initialData?.metadata?.exampleInput || "");
  const [exampleOutput, setExampleOutput] = useState(initialData?.metadata?.exampleOutput || "");
  const [taskGoal, setTaskGoal] = useState(initialData?.metadata?.taskGoal || "");
  const [inputRequirements, setInputRequirements] = useState(initialData?.metadata?.inputRequirements || "");
  const [prohibited, setProhibited] = useState(initialData?.metadata?.prohibited || "");
  const [outputFormat, setOutputFormat] = useState(initialData?.metadata?.outputFormat || "");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState(initialData?.metadata?.acceptanceCriteria || "");
  const [lastVerifiedAt, setLastVerifiedAt] = useState(initialData?.metadata?.lastVerifiedAt || "");

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
      const finalStatus = publishStatus || status;
      const body = {
        title,
        slug,
        content,
        excerpt,
        status: finalStatus,
        featured,
        category_id: Number(categoryId),
        tags: selectedTags,
        metadata: {
          scenarios: scenariosText.split(",").map((item) => item.trim()).filter(Boolean),
          recommendedModel,
          exampleInput,
          exampleOutput,
          taskGoal,
          inputRequirements,
          prohibited,
          outputFormat,
          acceptanceCriteria,
          lastVerifiedAt,
        },
      };

      let res;
      if (isEdit) {
        res = await fetch(`/api/prompts/${initialData!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch("/api/prompts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      if (res.ok) {
        router.push("/admin/prompts");
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
          <Link href="/admin/prompts">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">
            {isEdit ? "编辑提示词" : "新建提示词"}
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
                  placeholder="提示词标题"
                />
              </div>
              <Card>
                <CardHeader><CardTitle className="text-sm">使用说明</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Input value={scenariosText} onChange={(e) => setScenariosText(e.target.value)} placeholder="使用场景，用逗号分隔" />
                  <Input value={recommendedModel} onChange={(e) => setRecommendedModel(e.target.value)} placeholder="推荐模型，例如 ChatGPT、Claude" />
                  <Textarea value={exampleInput} onChange={(e) => setExampleInput(e.target.value)} placeholder="示例输入" className="min-h-[80px] text-sm" />
                  <Textarea value={exampleOutput} onChange={(e) => setExampleOutput(e.target.value)} placeholder="示例输出" className="min-h-[80px] text-sm" />
                </CardContent>
              </Card>
              <div>
                <label className="text-sm font-medium mb-1 block">Slug</label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="prompt-slug"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  提示词内容
                </label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="输入完整的提示词内容..."
                  className="min-h-[400px] font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">提示词设置</CardTitle>
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
              <CardTitle className="text-sm">摘要</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="提示词摘要..."
                className="min-h-[80px] text-sm"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">任务契约（Task Contract）</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">任务目标</label>
                <Textarea
                  value={taskGoal}
                  onChange={(e) => setTaskGoal(e.target.value)}
                  placeholder="这个提示词让 AI 完成什么任务..."
                  className="min-h-[60px] text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">适用场景（逗号分隔）</label>
                <Input
                  value={scenariosText}
                  onChange={(e) => setScenariosText(e.target.value)}
                  placeholder="写作, 营销, 办公..."
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">输入要求</label>
                <Textarea
                  value={inputRequirements}
                  onChange={(e) => setInputRequirements(e.target.value)}
                  placeholder="用户需要提供什么输入、格式要求..."
                  className="min-h-[60px] text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">禁止事项</label>
                <Textarea
                  value={prohibited}
                  onChange={(e) => setProhibited(e.target.value)}
                  placeholder="AI 不应做什么..."
                  className="min-h-[60px] text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">输出格式</label>
                <Textarea
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                  placeholder="要求的输出结构、格式..."
                  className="min-h-[60px] text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">验收条件</label>
                <Textarea
                  value={acceptanceCriteria}
                  onChange={(e) => setAcceptanceCriteria(e.target.value)}
                  placeholder="怎么判断输出是否合格..."
                  className="min-h-[60px] text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">模型版本</label>
                  <Input
                    value={recommendedModel}
                    onChange={(e) => setRecommendedModel(e.target.value)}
                    placeholder="如 GPT-4o / Claude 3.7"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">最后验证日期</label>
                  <Input
                    value={lastVerifiedAt}
                    onChange={(e) => setLastVerifiedAt(e.target.value)}
                    placeholder="如 2026-08-01"
                  />
                </div>
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
