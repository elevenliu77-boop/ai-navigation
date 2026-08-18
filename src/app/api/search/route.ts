import { NextResponse } from "next/server";
import { searchTypes, unifiedSearch, type SearchType } from "@/lib/services/unified-search";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() || "";
  const rawType = url.searchParams.get("type") as SearchType | null;
  const type = rawType && searchTypes.includes(rawType) ? rawType : "all";
  return NextResponse.json({ query: q, type, results: await unifiedSearch(q, type) });
}
