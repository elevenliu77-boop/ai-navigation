"use client";
/* eslint-disable @typescript-eslint/no-unused-vars, @next/next/no-assign-module-variable, no-var */
 

import { motion, AnimatePresence } from "framer-motion";
import { Suspense, useEffect, useRef, useState } from "react";
import { SearchBox } from "@/components/search-box";
import CategoryFilter from "@/components/category-filter";
import Fallback from "@/components/loading/fallback";
import type { Category } from "@/lib/types";

interface PersistentHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  categories: Category[];
  isScrolled: boolean;
}

export function PersistentHeader({
  searchQuery,
  onSearchChange,
  categories,
}: PersistentHeaderProps) {
  return (
    <div className="sticky top-14 z-40 w-full transition-[background,border] duration-100 md:duration-300">
      <div className="w-full px-2 py-3 sm:py-2 md:px-4 md:py-4">
        <div className="max-w-2xl mx-auto space-y-4 sm:space-y-3 md:space-y-4">
          <div className="relative h-[36px] sm:h-[40px] md:h-[44px]">
            <SearchBox value={searchQuery} onChange={onSearchChange} />
          </div>
          <div className="relative pt-2 min-h-[32px] sm:min-h-[36px] md:min-h-[40px] mt-1 sm:mt-2">
            <Suspense fallback={<Fallback />}>
              <CategoryFilter categories={categories} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
