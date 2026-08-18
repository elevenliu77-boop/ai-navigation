"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/ui/common/button";
import { Input } from "@/ui/common/input";
import { Textarea } from "@/ui/common/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/common/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/common/select";

interface Metadata { audience?: string[]; scenarios?: string[]; tags?: string[]; tutorial?: string; promptSlugs?: string[]; workflowSlugs?: string[]; caseSlugs?: string[]; rating?: string; difficulty?: string; pricing?: string; pros?: string[]; cons?: string[] }
interface Props { initialData: { id: number; title: string; url: string; description: string; category_id: number; status: string; metadata: unknown }; categories: { id: number; name: string }[] }

export default function ToolEditor({ initialData, categories }: Props) {
  const router = useRouter();
  const metadata = initialData.metadata && typeof initialData.metadata === "object" && !Array.isArray(initialData.metadata) ? initialData.metadata as Metadata : {};
  const [title, setTitle] = useState(initialData.title);
  const [url, setUrl] = useState(initialData.url);
  const [description, setDescription] = useState(initialData.description);
  const [categoryId, setCategoryId] = useState(String(initialData.category_id));
  const [audience, setAudience] = useState(metadata.audience?.join(", ") || "");
  const [scenarios, setScenarios] = useState(metadata.scenarios?.join(", ") || "");
  const [tags, setTags] = useState(metadata.tags?.join(", ") || "");
  const [tutorial, setTutorial] = useState(metadata.tutorial || "");
  const [promptSlugs, setPromptSlugs] = useState(metadata.promptSlugs?.join(", ") || "");
  const [workflowSlugs, setWorkflowSlugs] = useState(metadata.workflowSlugs?.join(", ") || "");
  const [caseSlugs, setCaseSlugs] = useState(metadata.caseSlugs?.join(", ") || "");
  const [rating, setRating] = useState(metadata.rating || "");
  const [difficulty, setDifficulty] = useState(metadata.difficulty || "");
  const [pricing, setPricing] = useState(metadata.pricing || "");
  const [pros, setPros] = useState(metadata.pros?.join(", ") || "");
  const [cons, setCons] = useState(metadata.cons?.join(", ") || "");
  const [saving, setSaving] = useState(false);
  const list = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/websites/${initialData.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, url, description, category_id: Number(categoryId), status: initialData.status, metadata: { audience: list(audience), scenarios: list(scenarios), tags: list(tags), tutorial, promptSlugs: list(promptSlugs), workflowSlugs: list(workflowSlugs), caseSlugs: list(caseSlugs), rating, difficulty, pricing, pros: list(pros), cons: list(cons) } }) });
      if (!response.ok) throw new Error((await response.json()).error || "保存失败");
      router.push("/admin");
      router.refresh();
    } catch (error) { alert(String(error)); } finally { setSaving(false); }
  };

  return <div className="p-6 max-w-5xl mx-auto"><div className="flex items-center justify-between mb-6"><div className="flex items-center gap-3"><Link href="/admin"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link><div><h1 className="text-2xl font-bold">编辑工具详情</h1><p className="text-sm text-muted-foreground mt-1">补充适用人群、使用教程和知识关联</p></div></div><Button onClick={handleSave} disabled={saving}><Save className="h-4 w-4 mr-1" />{saving ? "保存中" : "保存"}</Button></div><div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><Card><CardHeader><CardTitle className="text-sm">基础信息</CardTitle></CardHeader><CardContent className="space-y-3"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="工具名称" /><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="官网地址" /><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="工具简介" /><Select value={categoryId} onValueChange={setCategoryId}><SelectTrigger><SelectValue placeholder="选择分类" /></SelectTrigger><SelectContent>{categories.map((category) => <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>)}</SelectContent></Select></CardContent></Card><Card><CardHeader><CardTitle className="text-sm">适用范围</CardTitle></CardHeader><CardContent className="space-y-3"><Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="适合用户，逗号分隔" /><Input value={scenarios} onChange={(e) => setScenarios(e.target.value)} placeholder="应用场景，逗号分隔" /><Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="标签，逗号分隔" /></CardContent></Card><Card className="lg:col-span-2"><CardHeader><CardTitle className="text-sm">评分与使用成本</CardTitle></CardHeader><CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3"><Input value={rating} onChange={(e) => setRating(e.target.value)} placeholder="评分，如 4.8/5" /><Input value={difficulty} onChange={(e) => setDifficulty(e.target.value)} placeholder="使用难度，如 入门" /><Input value={pricing} onChange={(e) => setPricing(e.target.value)} placeholder="免费/付费状态" /><Input value={pros} onChange={(e) => setPros(e.target.value)} placeholder="优点，逗号分隔" /><Input value={cons} onChange={(e) => setCons(e.target.value)} placeholder="缺点或注意事项，逗号分隔" /></CardContent></Card><Card className="lg:col-span-2"><CardHeader><CardTitle className="text-sm">使用教程</CardTitle></CardHeader><CardContent><Textarea value={tutorial} onChange={(e) => setTutorial(e.target.value)} placeholder="支持 Markdown，填写安装、上手和注意事项" className="min-h-[160px] font-mono text-sm" /></CardContent></Card><Card className="lg:col-span-2"><CardHeader><CardTitle className="text-sm">关联内容</CardTitle></CardHeader><CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3"><Input value={promptSlugs} onChange={(e) => setPromptSlugs(e.target.value)} placeholder="提示词 slug，逗号分隔" /><Input value={workflowSlugs} onChange={(e) => setWorkflowSlugs(e.target.value)} placeholder="工作流 slug，逗号分隔" /><Input value={caseSlugs} onChange={(e) => setCaseSlugs(e.target.value)} placeholder="案例 slug，逗号分隔" /></CardContent></Card></div></div>;
}
