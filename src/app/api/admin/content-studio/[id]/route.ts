import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/db";
import { serializeStudioAsset } from "@/lib/services/content-studio";
import { requireAdminApi } from "@/lib/auth/admin";

const assetStatuses = new Set(["NEW", "FETCH_FAILED", "NEEDS_REVIEW", "READY_FOR_SITE", "REJECTED"]);
const outputStatuses = new Set(["NOT_GENERATED", "GENERATING", "NEEDS_REVIEW", "READY", "REJECTED"]);

function bounded(value: unknown, max: number) {
  return String(value).slice(0, max);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  try {
    const id = Number((await params).id);
    if (!Number.isInteger(id) || id < 1) return NextResponse.json({ success: false, error: "Invalid asset ID" }, { status: 400 });
    const payload = await request.json();
    if (payload.status && !assetStatuses.has(String(payload.status))) return NextResponse.json({ success: false, error: "Invalid asset status" }, { status: 400 });

    const parsedOutputId = Number(payload.outputId);
    const outputId = payload.outputId === undefined ? undefined : Number.isInteger(parsedOutputId) && parsedOutputId > 0 ? parsedOutputId : undefined;
    if (payload.outputId !== undefined && outputId === undefined) return NextResponse.json({ success: false, error: "Invalid output ID" }, { status: 400 });
    if (outputId) {
      const output = await prisma.contentStudioOutput.findFirst({ where: { id: outputId, asset_id: id } });
      if (!output) return NextResponse.json({ success: false, error: "Output does not belong to this asset" }, { status: 400 });
      if (payload.outputStatus && !outputStatuses.has(String(payload.outputStatus))) return NextResponse.json({ success: false, error: "Invalid output status" }, { status: 400 });
      if (payload.titleCandidates !== undefined && !Array.isArray(payload.titleCandidates)) return NextResponse.json({ success: false, error: "titleCandidates must be an array" }, { status: 400 });
    }
    const asset = await prisma.$transaction(async (tx) => {
      const updated = await tx.contentStudioAsset.update({
        where: { id },
        data: {
          ...(payload.manualNotes !== undefined ? { manual_notes: bounded(payload.manualNotes, 20_000) } : {}),
          ...(payload.rawSnapshot !== undefined ? { raw_snapshot: bounded(payload.rawSnapshot, 200_000) } : {}),
          ...(payload.sourceBody !== undefined ? { source_body_override: bounded(payload.sourceBody, 200_000) } : {}),
          ...(payload.screenshotUrl !== undefined ? { screenshot_url: bounded(payload.screenshotUrl, 2_000) } : {}),
          ...(payload.attachmentUrl !== undefined ? { attachment_url: bounded(payload.attachmentUrl, 2_000) } : {}),
          ...(payload.officialUrl !== undefined ? { official_url: bounded(payload.officialUrl, 2_000) } : {}),
          ...(payload.status ? { status: String(payload.status) } : {}),
        },
      });
      if (outputId) await tx.contentStudioOutput.update({ where: { id: outputId }, data: { ...(payload.body !== undefined ? { body: bounded(payload.body, 300_000) } : {}), ...(payload.titleCandidates !== undefined ? { title_candidates: payload.titleCandidates.slice(0, 10).map((item: unknown) => bounded(item, 300)) } : {}), ...(payload.outputStatus ? { status: String(payload.outputStatus) } : {}) } });
      return tx.contentStudioAsset.findUnique({ where: { id: updated.id }, include: { outputs: true, batch: true, relations: true } });
    });
    return NextResponse.json({ success: true, data: await serializeStudioAsset(asset) });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
