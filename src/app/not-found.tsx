import Link from "next/link";
import { Button } from "@/ui/common/button";
import { Search, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="mx-auto max-w-lg text-center">
        <p className="text-6xl font-bold text-primary/30">404</p>
        <h1 className="mt-4 text-2xl font-bold">页面不存在或已下线</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          你访问的页面可能被移动、改名或还没有发布。可以从下面入口继续探索：
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/">
            <Button variant="default" className="gap-2">
              <Compass className="h-4 w-4" /> 回到首页
            </Button>
          </Link>
          <Link href="/search">
            <Button variant="outline" className="gap-2">
              <Search className="h-4 w-4" /> 全站搜索
            </Button>
          </Link>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm">
          <Link href="/tools" className="text-primary hover:underline">AI工具库</Link>
          <span className="text-muted-foreground/40">·</span>
          <Link href="/posts" className="text-primary hover:underline">AI知识库</Link>
          <span className="text-muted-foreground/40">·</span>
          <Link href="/cases" className="text-primary hover:underline">AI赚钱案例</Link>
          <span className="text-muted-foreground/40">·</span>
          <Link href="/prompts" className="text-primary hover:underline">提示词库</Link>
        </div>
      </div>
    </main>
  );
}
