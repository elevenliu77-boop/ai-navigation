import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { sanitizeContentFields, safeHttpUrl } from "@/lib/utils/sanitize";

interface Props {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: Request, { params }: Props) {
  const unauthorized = requireAdminApi(_req);
  if (unauthorized) return unauthorized;
  const { id } = await params;
  try {
    await prisma.resource.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 404 });
  }
}

export async function PUT(req: Request, { params }: Props) {
  const unauthorized = requireAdminApi(req);
  if (unauthorized) return unauthorized;
  const { id } = await params;
  try {
    const data = await req.json();
    sanitizeContentFields(data, [], ["title", "description"]);
    if (data.url !== undefined) {
      const url = safeHttpUrl(data.url);
      if (!url) {
        return NextResponse.json({ success: false, error: "资源地址必须是公开 HTTP/HTTPS 链接" }, { status: 400 });
      }
      data.url = url;
    }
    const resource = await prisma.resource.update({
      where: { id: Number(id) },
      data: {
        ...data,
        category_id: data.category_id === undefined ? undefined : data.category_id ?? null,
      },
      include: { category: true },
    });
    return NextResponse.json({ success: true, data: resource });
  } catch (e) {
    console.error("Update resource error:", e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
