import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { contentPackageSchema } from "@/lib/content-import/schema";
import { receiveContentPackage, serializeAsset } from "@/lib/services/assets";

export async function POST(request: Request) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  try {
    const value = await request.json();
    const parsed = contentPackageSchema.safeParse(value);
    if (!parsed.success) return NextResponse.json({ success: false, error: "ContentPackage 校验失败", issues: parsed.error.issues }, { status: 400 });
    const asset = await receiveContentPackage(parsed.data);
    return NextResponse.json({ success: true, data: serializeAsset(asset), generated: false, published: false });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "ContentPackage 接收失败" }, { status: 400 });
  }
}
