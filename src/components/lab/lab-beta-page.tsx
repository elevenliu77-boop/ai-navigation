"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, FlaskConical, Loader2, Send } from "lucide-react";
import { Badge } from "@/ui/common/badge";
import { Button } from "@/ui/common/button";
import { Input } from "@/ui/common/input";
import { Textarea } from "@/ui/common/textarea";

export interface LabField {
  name: string;
  label: string;
  placeholder: string;
  textarea?: boolean;
}

interface LabBetaPageProps {
  labKey: string;
  title: string;
  enTitle: string;
  description: string;
  fields: LabField[];
  resultPreview: { label: string; desc: string }[];
}

export default function LabBetaPage({
  labKey,
  title,
  enTitle,
  description,
  fields,
  resultPreview,
}: LabBetaPageProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/lab/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labKey, title, inputs: values }),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="mx-auto max-w-4xl px-4">
        <Link href="/lab">
          <Button variant="ghost" size="sm" className="mb-6 gap-1">
            <ArrowLeft className="h-4 w-4" /> 返回实验室
          </Button>
        </Link>

        <header className="mb-8">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <FlaskConical className="h-5 w-5" />
            </span>
            <Badge className="border-0 bg-violet-500/10 text-violet-600 dark:text-violet-400">Beta</Badge>
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">{enTitle}</p>
          <p className="mt-3 max-w-2xl text-muted-foreground">{description}</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* 输入结构 */}
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-2xl border border-border/40 bg-card/40 p-5">
              <h2 className="text-sm font-semibold text-muted-foreground">输入结构</h2>
              <div className="mt-4 space-y-4">
                {fields.map((field) => (
                  <div key={field.name}>
                    <label className="mb-1 block text-sm font-medium">{field.label}</label>
                    {field.textarea ? (
                      <Textarea
                        value={values[field.name] || ""}
                        onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                        placeholder={field.placeholder}
                        className="min-h-[80px] text-sm"
                      />
                    ) : (
                      <Input
                        value={values[field.name] || ""}
                        onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                        placeholder={field.placeholder}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-3">
                <Button onClick={handleSubmit} disabled={saving || saved} className="gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {saved ? "已记录，Beta 引擎开发中" : "提交实验"}
                </Button>
                <span className="text-xs text-muted-foreground">
                  {saved ? "你的输入已保存为 DRAFT 实验记录，后续引擎上线后自动处理。" : "Beta 阶段：输入会被保存，分析引擎尚未上线。"}
                </span>
              </div>
            </div>
          </div>

          {/* 结果结构 */}
          <div>
            <div className="rounded-2xl border border-dashed border-violet-300/60 bg-violet-50/40 p-5 dark:border-violet-500/30 dark:bg-violet-500/5">
              <h2 className="text-sm font-semibold text-muted-foreground">结果结构（Beta 预览）</h2>
              <ul className="mt-4 space-y-3">
                {resultPreview.map((item) => (
                  <li key={item.label} className="rounded-xl bg-background/80 p-3">
                    <div className="text-sm font-semibold">{item.label}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{item.desc}</div>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[11px] text-muted-foreground">
                正式版本将基于站内研究方法与研究资产（ResearchAsset）生成判断，不做虚构分析。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
