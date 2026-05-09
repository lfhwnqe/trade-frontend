"use client";
import { Suspense } from "react";
import TradeAddPage from "./tradeAddPage";

export default function PageWrapper() {
  return (
    <Suspense fallback={<div>页面加载中...</div>}>
      <TradeAddPage className="flex-1" />
      {/* <div className="flex-1 flex flex-col">
        <div className="bg-amber-700 h-16">asd</div>
        <div className="bg-amber-400 flex-grow overflow-y-auto">
          <div className="h-100 bg-black mb-2"></div>
          <div className="h-100 bg-black mb-2"></div>
          <div className="h-100 bg-black mb-2"></div>
          <div className="h-100 bg-black mb-2"></div>
        </div>
        <div className="bg-amber-700 h-16">asd</div>
      </div> */}
    </Suspense>
  );
}
