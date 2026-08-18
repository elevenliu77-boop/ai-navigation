import AssetDetailClient from "./asset-detail-client";

export const dynamic = "force-dynamic";

export default async function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <AssetDetailClient id={(await params).id} />;
}
