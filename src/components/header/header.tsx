"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { Brain } from "lucide-react";
import { Button } from "@/ui/common/button";
import ThemeSwitch from "@/components/theme-switcher/theme-switch";

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function Header() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        // data 可能是 AjaxResponse {code, data} 或原始数组
        const list = Array.isArray(data) ? data : data?.data ?? [];
        if (Array.isArray(list)) setCategories(list);
      })
      .catch(() => {});
  }, []);

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
            <Link href="/">
              <Button variant="ghost" size="sm">
                首页
              </Button>
            </Link>

            {/* 分类下拉 */}
            {categories.length > 0 && (
              <div className="relative group">
                <Button variant="ghost" size="sm" className="gap-1">
                  分类 <ChevronDown className="w-3 h-3" />
                </Button>
                <div className="absolute top-full left-0 mt-1 w-48 rounded-xl border border-border/40 bg-background/80 backdrop-blur-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="p-2 space-y-1">
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/category/${cat.slug}`}
                        className="block px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <Link href="/posts">
              <Button variant="ghost" size="sm">
                文章
              </Button>
            </Link>

            <Link href="/about">
              <Button variant="ghost" size="sm">
                关于
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
            <Link href="/" className="block px-3 py-2 rounded-lg hover:bg-accent" onClick={() => setMobileOpen(false)}>
              首页
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="block px-3 py-2 rounded-lg hover:bg-accent text-sm ml-2"
                onClick={() => setMobileOpen(false)}
              >
                {cat.name}
              </Link>
            ))}
            <Link href="/posts" className="block px-3 py-2 rounded-lg hover:bg-accent" onClick={() => setMobileOpen(false)}>
              文章
            </Link>
            <Link href="/about" className="block px-3 py-2 rounded-lg hover:bg-accent" onClick={() => setMobileOpen(false)}>
              关于
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
