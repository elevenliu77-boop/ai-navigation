import { PrismaClient } from "@prisma/client";
import { fetchPublicImage } from "@/lib/utils/url-safety";

const prisma = new PrismaClient();

export async function updateWebsiteThumbnails() {
  try {
    // 获取所有需要更新的网站
    const websites = await prisma.website.findMany({
      where: {
        thumbnail: {
          not: "",
        },
      },
      select: {
        id: true,
        thumbnail: true,
      },
    });

    console.log(`开始更新 ${websites.length} 个网站的缩略图`);

    // 逐个更新网站缩略图
    for (const website of websites) {
      try {
        if (!website.thumbnail) continue;

        // SSRF 防护：仅允许公开 HTTP/HTTPS 图片地址，限制大小与超时
        const { buffer, contentType } = await fetchPublicImage(website.thumbnail, {
          maxBytes: 1_000_000,
          timeoutMs: 10_000,
        });
        const imageBase64 = `data:${contentType};base64,${buffer.toString("base64")}`;

        await prisma.website.update({
          where: { id: website.id },
          data: {
            thumbnail_base64: imageBase64,
            updated_at: new Date(),
          },
        });

        console.log(`成功更新网站 ID: ${website.id} 的缩略图`);
      } catch (error) {
        if (error instanceof Error) {
          console.log(
            `更新网站 ID: ${website.id} 的缩略图失败: ${error.message}`
          );
        } else {
          console.log(`更新网站 ID: ${website.id} 的缩略图失败: 未知错误`);
        }
      }

      // 添加延迟，避免请求过快
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log("所有缩略图更新完成");
  } catch (error) {
    if (error instanceof Error) {
      console.log("更新缩略图过程中发生错误:", error.message);
    } else {
      console.log("更新缩略图过程中发生未知错误");
    }
  } finally {
    await prisma.$disconnect();
  }
}
