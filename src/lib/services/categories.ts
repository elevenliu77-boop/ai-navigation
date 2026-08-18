import { prisma } from "@/lib/prisma";

// 按 type 获取分类（website | post | prompt | workflow | case | resource）
export async function getCategoriesByType(type: string) {
  return prisma.category.findMany({
    where: { type },
    orderBy: { id: "asc" },
  });
}

export async function getCategoriesByTypes(types: string[]) {
  return prisma.category.findMany({
    where: { type: { in: types } },
    orderBy: { id: "asc" },
  });
}
