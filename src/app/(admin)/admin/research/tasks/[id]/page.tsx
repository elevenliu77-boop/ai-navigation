import ResearchTaskDetailClient from "./research-task-detail-client";

export const dynamic = "force-dynamic";

export default async function ResearchTaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <ResearchTaskDetailClient id={(await params).id} />;
}
