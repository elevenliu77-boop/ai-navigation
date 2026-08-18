"use client";
 

import Link from "next/link";
import { useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { Brain } from "lucide-react";
import { Button } from "@/ui/common/button";
import ThemeSwitch from "@/components/theme-switcher/theme-switch";

// 全站统一导航（V2.2 产品定位：AI效率与赚钱实验室）
const navItems = [
  { href: "/", label: "首页" },
  { href: "/tools", label: "AI工具库" },
  { href: "/posts", label: "AI知识库" },
  { href: "/cases", label: "AI赚钱案例" },
  { href: "/workflows", label: "AI工作流" },
  { href: "/prompts", label: "提示词库" },
  { href: "/resources", label: "资源中心" },
];

// 更多菜单（二级入口）
const moreItems = [
  { href: "/discoveries", label: "AI发现", desc: "每日新工具与项目" },
  { href: "/lab", label: "alphahole实验室", desc: "判断工具与实验" },
  { href: "/about", label: "关于", desc: "项目介绍与联系" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/30 backdrop-blur-xl">
      <nav className="container mx-auto px-4 h-14">
        <div className="flex h-full items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Brain className="h-6 w-6 text-primary" />
            <span className="font-bold">alphahole</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button variant="ghost" size="sm">
                  {item.label}
                </Button>
              </Link>
            ))}

            {/* 更多下拉 */}
            <div className="relative group">
              <Button variant="ghost" size="sm" className="gap-1">
                更多 <ChevronDown className="w-3 h-3" />
              </Button>
              <div className="absolute top-full left-0 mt-1 w-52 rounded-xl border border-border/40 bg-background/90 backdrop-blur-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-2 space-y-1">
                  {moreItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors"
                    >
                      <span className="font-medium">{item.label}</span>
                      <span className="block text-xs text-muted-foreground mt-0.5">
                        {item.desc}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link href="/assistant">
              <Button variant="default" size="sm">
                AI助手
              </Button>
            </Link>
            <Link href="/membership">
              <Button variant="outline" size="sm">
                会员中心
              </Button>
            </Link>

            <ThemeSwitch />
          </div>

          {/* Mobile Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeSwitch />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border/20 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2 rounded-lg hover:bg-accent"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {moreItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2 rounded-lg hover:bg-accent text-sm"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/assistant"
              className="block px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/15"
              onClick={() => setMobileOpen(false)}
            >
              AI助手
            </Link>
            <Link
              href="/membership"
              className="block px-3 py-2 rounded-lg hover:bg-accent"
              onClick={() => setMobileOpen(false)}
            >
              会员中心
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
