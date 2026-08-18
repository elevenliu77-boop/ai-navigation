import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const allowedTargets = new Set(["post", "discovery", "tool", "prompt", "workflow", "case"]);

function parseInput(input: Record<string, unknown>) {
  const targetType = typeof input.targetType === "string" ? input.targetType : "";
  const targetId = Number(input.targetId);
  const visitorKey = typeof input.visitorKey === "string" ? input.visitorKey.trim() : "";
  if (!allowedTargets.has(targetType) || !Number.isInteger(targetId) || targetId < 1 || !visitorKey || visitorKey.length > 120) return null;
  return { targetType, targetId, visitorKey };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const input = parseInput({ targetType: url.searchParams.get("targetType"), targetId: url.searchParams.get("targetId"), visitorKey: url.searchParams.get("visitorKey") });
  if (!input) return NextResponse.json({ error: "Invalid favorite target" }, { status: 400 });
  const [count, favorite] = await Promise.all([
    prisma.favorite.count({ where: { target_type: input.targetType, target_id: input.targetId } }),
    prisma.favorite.findUnique({ where: { visitor_key_target_type_target_id: { visitor_key: input.visitorKey, target_type: input.targetType, target_id: input.targetId } } }),
  ]);
  return NextResponse.json({ count, favorited: Boolean(favorite) });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = parseInput(body);
    if (!input) return NextResponse.json({ error: "Invalid favorite target" }, { status: 400 });
    const remove = body.action === "remove";
    if (remove) {
      await prisma.favorite.deleteMany({ where: { visitor_key: input.visitorKey, target_type: input.targetType, target_id: input.targetId } });
    } else {
      await prisma.favorite.upsert({ where: { visitor_key_target_type_target_id: { visitor_key: input.visitorKey, target_type: input.targetType, target_id: input.targetId } }, update: {}, create: { visitor_key: input.visitorKey, target_type: input.targetType, target_id: input.targetId } });
    }
    const count = await prisma.favorite.count({ where: { target_type: input.targetType, target_id: input.targetId } });
    return NextResponse.json({ count, favorited: !remove });
  } catch (error) {
    console.error("Favorite operation failed", error);
    return NextResponse.json({ error: "Favorite operation failed" }, { status: 500 });
  }
}
