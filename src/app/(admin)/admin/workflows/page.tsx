
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAllWorkflows } from "@/lib/services/workflows";
import { AdminItemsClient } from "@/components/admin/admin-items-client";

export const dynamic = "force-dynamic";

export default async function AdminWorkflowsPage() {
  const { workflows, total } = await getAllWorkflows();
  return (
    <AdminItemsClient
      items={workflows as any}
      total={total}
      title="工作流管理"
      subtitle="管理 AI 工作流内容"
      createHref="/admin/workflows/new"
      editBase="/admin/workflows"
      detailPrefix="/workflows"
      deleteApi="/api/workflows"
      createLabel="新建工作流"
    />
  );
}
