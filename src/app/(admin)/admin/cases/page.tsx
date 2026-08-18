
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAllCases } from "@/lib/services/cases";
import { AdminItemsClient } from "@/components/admin/admin-items-client";

export const dynamic = "force-dynamic";

export default async function AdminCasesPage() {
  const { cases, total } = await getAllCases();
  return (
    <AdminItemsClient
      items={cases as any}
      total={total}
      title="案例管理"
      subtitle="管理 AI 赚钱案例内容"
      createHref="/admin/cases/new"
      editBase="/admin/cases"
      detailPrefix="/cases"
      deleteApi="/api/cases"
      createLabel="新建案例"
    />
  );
}
