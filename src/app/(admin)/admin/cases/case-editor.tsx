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

interface CaseEditorProps {
  initialData?: {
    id: number;
    title: string;
    slug: string;
    summary: string;
    content: string;
    cover: string;
    result: any[];
    metadata?: any;
    status: string;
    featured: boolean;
    category_id: number;
    tags: { id: number; name: string; slug: string }[];
  };
  categories: { id: number; name: string; slug: string }[];
  tags: { id: number; name: string; slug: string }[];
}

export default function CaseEditor({
  initialData,
  categories,
  tags,
}: CaseEditorProps) {
  const router = useRouter();
  const isEdit = !!initialData;
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [summary, setSummary] = useState(initialData?.summary || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [cover, setCover] = useState(initialData?.cover || "");
  const [resultText, setResultText] = useState(
    initialData ? JSON.stringify(initialData.result, null, 2) : ""
  );
  const initialMetadata = initialData?.metadata || {};
  const [revenueModel, setRevenueModel] = useState(initialMetadata.revenueModel || "");
  const [cost, setCost] = useState(initialMetadata.cost || "");
  const [audience, setAudience] = useState((initialMetadata.audience || []).join(", "));
  const [tools, setTools] = useState((initialMetadata.tools || []).join(", "));
  const [difficulty, setDifficulty] = useState(initialMetadata.difficulty || "");
  const [cycle, setCycle] = useState(initialMetadata.cycle || "");
  const [evidenceLevel, setEvidenceLevel] = useState(initialMetadata.evidenceLevel || "");
  const [status, setStatus] = useState(initialData?.status || "draft");
  const [featured, setFeatured] = useState(initialData?.featured || false);
  const [categoryId, setCategoryId] = useState(
    String(initialData?.category_id || "")
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialData?.tags.map((t) => t.slug) || []
  );

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
      let result: any[] = [];
      if (resultText.trim()) {
        try {
          result = JSON.parse(resultText);
        } catch {
          alert("效果数据 JSON 格式错误，请检查");
          setSaving(false);
          return;
        }
      }

      const finalStatus = publishStatus || status;
      const body = {
        title,
        slug,
        summary,
        content,
        cover,
        result,
        metadata: { revenueModel, cost, audience: audience.split(",").map((item: string) => item.trim()).filter(Boolean), tools: tools.split(",").map((item: string) => item.trim()).filter(Boolean), difficulty, cycle, evidenceLevel: evidenceLevel === "none" ? "" : evidenceLevel },
        status: finalStatus,
        featured,
        category_id: Number(categoryId),
        tags: selectedTags,
      };

      let res;
      if (isEdit) {
        res = await fetch(`/api/cases/${initialData!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch("/api/cases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      if (res.ok) {
        router.push("/admin/cases");
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
          <Link href="/admin/cases">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">
            {isEdit ? "编辑案例" : "新建案例"}
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
                  placeholder="案例标题"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium mb-1 block">收益模式</label><Input value={revenueModel} onChange={(e) => setRevenueModel(e.target.value)} placeholder="接广、订阅、服务费" /></div>
                <div><label className="text-sm font-medium mb-1 block">投入成本</label><Input value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0-500元" /></div>
                <div><label className="text-sm font-medium mb-1 block">适合人群</label><Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="逗号分隔" /></div>
                <div><label className="text-sm font-medium mb-1 block">使用工具</label><Input value={tools} onChange={(e) => setTools(e.target.value)} placeholder="ChatGPT, n8n" /></div>
                <div><label className="text-sm font-medium mb-1 block">执行难度</label><Input value={difficulty} onChange={(e) => setDifficulty(e.target.value)} placeholder="简单/中等/高级" /></div>
                <div><label className="text-sm font-medium mb-1 block">预计周期</label><Input value={cycle} onChange={(e) => setCycle(e.target.value)} placeholder="3个月" /></div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Slug</label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="case-slug"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  案例简介
                </label>
                <Textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="一句话介绍案例..."
                  className="min-h-[60px] text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  正文 (Markdown)
                </label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="使用 Markdown 格式撰写案例正文..."
                  className="min-h-[320px] font-mono text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  效果数据 (JSON 数组, 可选)
                </label>
                <Textarea
                  value={resultText}
                  onChange={(e) => setResultText(e.target.value)}
                  placeholder={`[\n  { "label": "月收入", "value": "¥2万+" }\n]`}
                  className="min-h-[100px] font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">案例设置</CardTitle>
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
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  证据等级（NO FAKE SOCIAL PROOF）
                </label>
                <Select value={evidenceLevel} onValueChange={setEvidenceLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择证据等级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">待核（默认）</SelectItem>
                    <SelectItem value="SOURCE_CLAIM">案例自述</SelectItem>
                    <SelectItem value="SCREENSHOT_ONLY">截图证据</SelectItem>
                    <SelectItem value="BACKEND_DATA">后台数据</SelectItem>
                    <SelectItem value="REVENUE_VERIFIED">收入已核</SelectItem>
                    <SelectItem value="COST_VERIFIED">成本已核</SelectItem>
                    <SelectItem value="NET_PROFIT_VERIFIED">净利润已核</SelectItem>
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
              <CardTitle className="text-sm">封面图 URL</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={cover}
                onChange={(e) => setCover(e.target.value)}
                placeholder="https://...（可选）"
              />
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
