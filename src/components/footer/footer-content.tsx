"use client";
/* eslint-disable @typescript-eslint/no-unused-vars, @next/next/no-assign-module-variable, no-var */
 

import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/ui/common/button";
import { Plus } from "lucide-react";
import { isAdminModeAtom, footerSettingsAtom } from "@/lib/atoms";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/ui/common/dialog";
import { Input } from "@/ui/common/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils/utils";
import type { FooterSettings } from "@/lib/types";

export default function FooterContent({
  initialSettings,
}: {
  initialSettings: FooterSettings;
}) {
  const [isAdmin] = useAtom(isAdminModeAtom);
  const [settings, setSettings] = useAtom(footerSettingsAtom);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newLink, setNewLink] = useState({ title: "", url: "" });
  const { toast } = useToast();

  // Initialize settings
  useEffect(() => {
    setSettings({
      copyright: initialSettings.copyright || "",
      icpBeian: initialSettings.icpBeian || "",
      links:
        initialSettings.links?.map((link) => ({
          id: link.id,
          title: link.title,
          url: link.url,
        })) || [],
      customHtml: initialSettings.customHtml || "",
    });
  }, [initialSettings, setSettings]);

  const handleAddLink = async () => {
    if (!newLink.title || !newLink.url) {
      toast({
        title: "错误",
        description: "请填写完整的链接信息",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/footer-links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newLink),
      });

      if (!response.ok) throw new Error("Failed to add link");

      const result = await response.json();
      const createdId = Number(result?.data?.id);
      if (!Number.isInteger(createdId) || createdId < 1) throw new Error("Invalid footer link response");
      setSettings((prev) => ({
        ...prev,
        links: [...prev.links, { id: createdId, title: newLink.title, url: newLink.url }],
      }));

      setNewLink({ title: "", url: "" });
      setIsDialogOpen(false);

      toast({
        title: "添加成功",
        description: "新的页脚链接已添加",
      });
    } catch (error) {
      toast({
        title: "添加失败",
        description: "添加页脚链接时出错",
        variant: "destructive",
      });
    }
  };

  const handleRemoveLink = async (id: number) => {
    try {
      const response = await fetch(`/api/footer-links?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to remove link");

      setSettings((prev) => ({
        ...prev,
        links: prev.links.filter((link) => link.id !== id),
      }));

      toast({
        title: "删除成功",
        description: "页脚链接已删除",
      });
    } catch (error) {
      toast({
        title: "删除失败",
        description: "删除页脚链接时出错",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "w-full border-t border-border",
        "bg-background/80 backdrop-blur-sm",
        "transition-colors duration-300"
      )}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {settings.links.length > 0 ? (
              settings.links.map((link, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.title}
                  </a>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-5 w-5 p-0 rounded-full",
                        "hover:bg-destructive/10 hover:text-destructive",
                        "transition-colors duration-200"
                      )}
                      onClick={() => handleRemoveLink(link.id)}
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground/60 italic">
                {isAdmin ? "点击右侧加号添加页脚链接" : "暂无页脚链接"}
              </div>
            )}
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-5 w-5 p-0 rounded-full",
                  "hover:bg-primary/10 hover:text-primary",
                  "transition-colors duration-200"
                )}
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <Link href="/about" className="hover:text-foreground transition-colors">关于</Link>
            <Link href="/discoveries" className="hover:text-foreground transition-colors">AI发现</Link>
            <Link href="/lab" className="hover:text-foreground transition-colors">实验室</Link>
            <span className="hidden md:inline text-muted-foreground/60">|</span>
            <a
              href="https://github.com/liyown/ai-navigation"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              {settings.copyright}
            </a>
            {settings.icpBeian && (
              <>
                <span className="hidden md:inline text-muted-foreground/60">
                  |
                </span>
                <a
                  href="https://beian.miit.gov.cn/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  {settings.icpBeian}
                </a>
              </>
            )}
          </div>
        </div>
        {/* 联系方式（始终显示） */}
        <div className="mt-3 pt-3 border-t border-border/30 flex flex-wrap items-center gap-x-4 gap-y-1">
          <a
            href="https://mail.google.com/mail/?view=cm&fs=1&to=elevenliu77@gmail.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            邮箱联系
          </a>
          <a
            href="https://t.me/Elevenliu77"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-[#26A5E4] transition-colors inline-flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.46-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.751-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.015 3.333-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.145.118.185.276.208.399.023.123.052.404.029.64z" />
            </svg>
            Telegram 联系
          </a>
        </div>

        {settings.customHtml && (
          <div
            className="mt-2 text-xs text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: settings.customHtml }}
          />
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-background border-border">
          <DialogHeader>
            <DialogTitle>添加页脚链接</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              请填写链接的名称和地址
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                链接名称
              </label>
              <Input
                value={newLink.title}
                onChange={(e) =>
                  setNewLink((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="输入链接名称"
                className="border-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                链接地址
              </label>
              <Input
                value={newLink.url}
                onChange={(e) =>
                  setNewLink((prev) => ({ ...prev, url: e.target.value }))
                }
                placeholder="输入链接地址"
                className="border-input"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="border-input hover:bg-accent hover:text-accent-foreground"
              >
                取消
              </Button>
              <Button
                onClick={handleAddLink}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                添加
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.footer>
  );
}
