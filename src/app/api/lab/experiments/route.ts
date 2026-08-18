import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const validKeys = [
  "personal-company-fit",
  "tool-opportunity-finder",
  "oss-readiness-auditor",
  "content-funnel-diagnosis",
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { labKey, title, inputs } = body;
    if (!validKeys.includes(labKey)) {
      return NextResponse.json({ success: false, error: "未知实验" }, { status: 400 });
    }

    const experiment = await prisma.labExperiment.create({
      data: {
        labKey,
        title: String(title || labKey),
        inputs: inputs || {},
        status: "DRAFT",
        version: "beta",
      },
    });
    return NextResponse.json({ success: true, data: { id: experiment.id } });
  } catch (e) {
    console.error("Lab experiment error:", e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
