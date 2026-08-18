/* eslint-disable @typescript-eslint/no-unused-vars, @next/next/no-assign-module-variable, no-var */

 
import { NextResponse } from "next/server";
import type { Website } from "@/lib/types";
import { AjaxResponse } from "@/lib/utils";
import { PrismaClient } from "@prisma/client";
import { assertPublicUrl, fetchPublicImage } from "@/lib/utils/url-safety";
import { assertPublicSourceUrl } from "@/lib/services/content-studio";
import { tokenFromRequest, verifyAdminToken } from "@/lib/auth/admin";

const prisma = new PrismaClient();

// GET /api/websites
// 获取所有指定分类的网站
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status =
    (searchParams.get("status") as Website["status"]) || "approved";
  const websites = await prisma.website.findMany({
    where: { status: status === "all" ? undefined : status },
  });
  return NextResponse.json(AjaxResponse.ok(websites));
}

// POST /api/websites
// 创建网站
export async function POST(request: Request) {
  if (!request.body) {
    return NextResponse.json(AjaxResponse.fail("Request body is required"), {
      status: 400,
    });
  }

  try {
    const data = await request.json();
    const isAdmin = verifyAdminToken(tokenFromRequest(request));
    const siteSettings = await prisma.setting.findMany({ where: { key: { in: ["allowSubmissions", "requireApproval"] } }, select: { key: true, value: true } });
    const settings = Object.fromEntries(siteSettings.map((item) => [item.key, item.value]));
    if (!isAdmin && settings.allowSubmissions === "false") return NextResponse.json(AjaxResponse.fail("网站提交功能暂时关闭"), { status: 403 });

    // Validate required fields
    if (!data.title || !data.url || !data.category_id) {
      return NextResponse.json(
        AjaxResponse.fail(
          "Missing required fields: title, url, or category_id"
        ),
        { status: 400 }
      );
    }

    try {
      await assertPublicSourceUrl(String(data.url).trim());
    } catch {
      return NextResponse.json(AjaxResponse.fail("请输入公开的 HTTP/HTTPS 网站地址"), { status: 400 });
    }

    const thumbnail = String(data.thumbnail || "").trim();
    if (thumbnail) {
      try {
        await assertPublicSourceUrl(thumbnail);
      } catch {
        return NextResponse.json(AjaxResponse.fail("缩略图地址无效"), { status: 400 });
      }
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: Number(data.category_id) },
    });

    if (!category) {
      return NextResponse.json(AjaxResponse.fail("Category does not exist"), {
        status: 400,
      });
    }

    console.log(data);

    // Check if URL already exists
    const existingWebsite = await prisma.website.findFirst({
      where: { url: data.url },
    });

    if (existingWebsite) {
      return NextResponse.json(AjaxResponse.fail("URL already exists"), {
        status: 400,
      });
    }

    // Validate URL format: 仅允许公开 HTTP/HTTPS 地址（SSRF 防护）
    let websiteUrl: URL;
    try {
      websiteUrl = await assertPublicUrl(data.url);
    } catch (error) {
      return NextResponse.json(
        AjaxResponse.fail(
          error instanceof Error ? error.message : "Invalid URL format"
        ),
        { status: 400 }
      );
    }
    if (websiteUrl.username || websiteUrl.password) {
      return NextResponse.json(
        AjaxResponse.fail("URL 不允许携带用户名或密码"),
        { status: 400 }
      );
    }

    let imageBase64 = "";
    if (thumbnail) {
      try {
        const { buffer, contentType } = await fetchPublicImage(thumbnail, {
          maxBytes: 1_000_000,
          timeoutMs: 8_000,
        });
        imageBase64 = `data:${contentType};base64,${buffer.toString("base64")}`;
      } catch {
        return NextResponse.json(AjaxResponse.fail("缩略图抓取失败，请更换图片地址"), { status: 400 });
      }
    }

    const website = await prisma.website.create({
      data: {
        title: data.title.trim(),
        url: websiteUrl.toString(),
        description: data.description?.trim() || "",
        category_id: Number(data.category_id),
        thumbnail: data.thumbnail?.trim() || "",
        status: isAdmin ? (["pending", "approved", "rejected"].includes(data.status) ? data.status : "pending") : settings.requireApproval === "false" ? "approved" : "pending",
        thumbnail_base64: imageBase64 as string,
        metadata: data.metadata || undefined,
      },
    });

    return NextResponse.json(AjaxResponse.ok(website));
  } catch (error) {
    console.error("Failed to create website:", error);
    return NextResponse.json(AjaxResponse.fail("Failed to create website"), {
      status: 500,
    });
  }
}
