"use client";

import { Suspense } from "react";
import TradeAddPage from "../add/tradeAddPage";

export default function TradeDetailPage() {
  return (
    <Suspense fallback={<div>页面加载中...</div>}>
      <TradeAddPage className="flex-1" readOnly disableStatusChange />
    </Suspense>
  );
}
