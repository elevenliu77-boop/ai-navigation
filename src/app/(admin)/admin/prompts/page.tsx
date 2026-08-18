
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAllPrompts } from "@/lib/services/prompts";
import { AdminItemsClient } from "@/components/admin/admin-items-client";

export const dynamic = "force-dynamic";

export default async function AdminPromptsPage() {
  const { prompts, total } = await getAllPrompts();
  return (
    <AdminItemsClient
      items={prompts as any}
      total={total}
      title="提示词库管理"
      subtitle="管理提示词库内容"
      createHref="/admin/prompts/new"
      editBase="/admin/prompts"
      detailPrefix="/prompts"
      deleteApi="/api/prompts"
      createLabel="新建提示词"
      extraStatLabel="复制"
      extraStatKey="copy_count"
    />
  );
}
