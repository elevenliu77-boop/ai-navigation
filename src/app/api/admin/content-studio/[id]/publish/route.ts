import { NextResponse } from "next/server";
import { publishWebsiteOutput } from "@/lib/services/content-studio";
import { requireAdminApi } from "@/lib/auth/admin";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  try {
    const { id: rawId } = await params;
    const payload = await request.json().catch(() => ({}));
    const postId = await publishWebsiteOutput(Number(rawId), payload.force === true);
    return NextResponse.json({ success: true, postId });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
