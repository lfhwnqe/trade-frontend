"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import TradeAddPage from "../../add/tradeAddPage";

export default function TradeSharedDetailPage() {
  const params = useParams<{ shareId?: string }>();
  const shareIdParam = params?.shareId;
  const shareId = Array.isArray(shareIdParam) ? shareIdParam[0] : shareIdParam;

  if (!shareId) {
    return <div className="p-6 text-sm text-red-300">分享链接无效</div>;
  }

  return (
    <Suspense fallback={<div>页面加载中...</div>}>
      <TradeAddPage
        className="flex-1"
        readOnly
        disableStatusChange
        detailMode="share"
        detailId={shareId}
      />
    </Suspense>
  );
}
