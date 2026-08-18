import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { sanitizeContentFields, safeHttpUrl } from "@/lib/utils/sanitize";

export async function POST(req: Request) {
  const unauthorized = requireAdminApi(req);
  if (unauthorized) return unauthorized;
  try {
    const data = await req.json();
    sanitizeContentFields(data, [], ["title", "description"]);
    const url = safeHttpUrl(data.url);
    if (!url) {
      return NextResponse.json({ success: false, error: "资源地址必须是公开 HTTP/HTTPS 链接" }, { status: 400 });
    }
    data.url = url;
    const existing = await prisma.resource.findUnique({ where: { slug: data.slug } });
    if (existing) {
      return NextResponse.json({ success: false, error: "Slug 已被使用" }, { status: 400 });
    }
    const resource = await prisma.resource.create({
      data: { ...data, category_id: data.category_id ?? null },
      include: { category: true },
    });
    return NextResponse.json({ success: true, data: resource });
  } catch (e) {
    console.error("Create resource error:", e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
