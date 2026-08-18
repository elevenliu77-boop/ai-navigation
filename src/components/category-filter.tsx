"use client";
/* eslint-disable @typescript-eslint/no-unused-vars, @next/next/no-assign-module-variable, no-var */
 

import { useAtom } from "jotai";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { selectedCategoryAtom } from "@/lib/atoms/index";
import { Button } from "../ui/common/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/common/dropdown-menu";
import type { Category } from "@/lib/types";
import { useRef, useState, useEffect } from "react";

interface CategoryFilterProps {
  categories: Category[];
}

const buttonVariants = {
  active: {
    scale: 1.08,
    y: -1,
    backgroundColor: "rgb(255, 255, 255)",
    color: "hsl(var(--primary))",
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 30,
    },
  },
  inactive: {
    scale: 1,
    y: 0,
    backgroundColor: "transparent",
    color: "hsl(var(--muted-foreground))",
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 30,
    },
  },
};

export default function CategoryFilter({ categories }: CategoryFilterProps) {
  const [selectedCategory, setSelectedCategory] = useAtom(selectedCategoryAtom);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 15 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedCategoryName = selectedCategory
    ? categories?.find((c) => c.id === Number(selectedCategory))?.name ||
      "未知分类"
    : categories[0]?.name || "未知分类";

  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategory(categoryId);
    const index = categories.findIndex((c) => c.id === categoryId);
    if (index !== -1) {
      centerCategory(index);
    }
  };

  const centerCategory = (index: number) => {
    const visibleCount = 5;
    const halfVisible = Math.floor(visibleCount / 2);
    const maxLength = categories?.length || 0;
    let start = Math.max(0, index - halfVisible);
    const end = Math.min(maxLength, start + visibleCount);

    if (end === maxLength) {
      start = Math.max(0, end - visibleCount);
    }

    setVisibleRange({ start, end });
  };

  const handleScroll = (direction: "left" | "right") => {
    const step = 1;
    const maxLength = categories?.length || 0;
    if (direction === "left") {
      setVisibleRange((prev) => ({
        start: Math.max(0, prev.start - step),
        end: Math.max(15, prev.end - step),
      }));
    } else {
      setVisibleRange((prev) => ({
        start: Math.min(maxLength - 5, prev.start + step),
        end: Math.min(maxLength, prev.end + step),
      }));
    }
  };

  const visibleCategories = [
    ...(categories?.slice(visibleRange.start, visibleRange.end) || []),
  ];

  const canScrollLeft = visibleRange.start > 0;
  const canScrollRight = visibleRange.end < (categories?.length || 0);

  if (!mounted) {
    return null;
  }

  return (
    <div className="w-full">
      {/* Mobile: Dropdown Menu */}
      <div className="bg-background/20 backdrop-blur-xl border-border/40 shadow-lg md:hidden rounded-xl">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between bg-background/40 backdrop-blur-sm border-border/30 hover:bg-background/60 hover:border-border/50 h-10 px-4 rounded-xl"
            >
              <motion.span
                initial={false}
                animate={{
                  color:
                    selectedCategory === null
                      ? "hsl(var(--primary))"
                      : "hsl(var(--foreground))",
                }}
                className="font-medium"
              >
                {selectedCategoryName}
              </motion.span>
              <motion.div
                initial={false}
                animate={{ rotate: 0 }}
                exit={{ rotate: 180 }}
              >
                <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
              </motion.div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[calc(100vw-2rem)] min-w-[200px] bg-background/95 backdrop-blur-md border-border/30 shadow-lg rounded-lg overflow-hidden"
            align="center"
            sideOffset={8}
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="py-1"
            >
              {categories.map((category) => (
                <DropdownMenuItem
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className={`${
                    selectedCategory?.toString() === category.id.toString()
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground/80 hover:text-foreground"
                  } h-11 flex items-center px-4 hover:bg-accent/50 focus:bg-accent active:bg-accent/70 transition-colors duration-200`}
                >
                  {category.name}
                </DropdownMenuItem>
              ))}
            </motion.div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop: Horizontal Categories with Arrows */}
      <div className="hidden md:block">
        <div className="flex items-center justify-center gap-2">
          <AnimatePresence initial={false}>
            <div className="relative flex items-center gap-2">
              {/* Background Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-background/40 to-background/60 rounded-xl backdrop-blur-sm" />

              <Button
                variant="ghost"
                size="icon"
                className="relative h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-background/40 disabled:opacity-20 transition-all z-10"
                onClick={() => canScrollLeft && handleScroll("left")}
                disabled={!canScrollLeft}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div
                ref={containerRef}
                className="relative flex items-center gap-2 overflow-hidden px-2 z-10"
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  {visibleCategories.map((category) => (
                    <motion.button
                      key={category.id ?? "all"}
                      onClick={() => handleCategorySelect(category.id)}
                      className={`h-8 px-4 text-sm whitespace-nowrap transition-colors duration-300 rounded-md
                        ${
                          selectedCategory === category.id
                            ? "bg-white dark:bg-primary text-primary dark:text-primary-foreground font-medium shadow-[0_2px_12px_-2px_rgba(0,0,0,0.2)] dark:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.4)]"
                            : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                        }`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        scale: selectedCategory === category.id ? 1.08 : 1,
                        y: selectedCategory === category.id ? -1 : 0,
                      }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{
                        type: "spring",
                        stiffness: 150,
                        damping: 20,
                        mass: 1,
                        velocity: 2,
                        duration: 0.6,
                        ease: "easeInOut",
                      }}
                      layout="position"
                    >
                      {category.name}
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="relative h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-background/40 disabled:opacity-20 transition-all z-10"
                onClick={() => canScrollRight && handleScroll("right")}
                disabled={!canScrollRight}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
