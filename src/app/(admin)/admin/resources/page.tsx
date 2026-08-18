
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAllResources } from "@/lib/services/resources";
import { AdminItemsClient } from "@/components/admin/admin-items-client";

export const dynamic = "force-dynamic";

export default async function AdminResourcesPage() {
  const { resources, total } = await getAllResources();
  return (
    <AdminItemsClient
      items={resources as any}
      total={total}
      title="资料管理"
      subtitle="管理资源中心内容"
      createHref="/admin/resources/new"
      editBase="/admin/resources"
      detailPrefix="/resources"
      deleteApi="/api/resources"
      createLabel="新建资料"
      extraStatLabel="下载"
      extraStatKey="downloads"
    />
  );
}
