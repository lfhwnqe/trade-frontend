"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TradeHomePage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center gap-8 bg-muted/50 px-4 py-10">
      {/* 顶部标题 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 tracking-tight">交易主页</h1>
        <p className="text-muted-foreground">欢迎来到交易管理系统，开始您的高效管理之旅！</p>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-4">
        <Link href="/trade/list">
          <Button variant="default" size="lg" className="shadow-md">
            查看交易列表
          </Button>
        </Link>
        <Link href="/trade/add">
          <Button variant="secondary" size="lg" className="shadow-md">
            新增交易
          </Button>
        </Link>
      </div>

      {/* 简单统计区块 */}
      <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
        {/* 卡片1 */}
        <div className="rounded-xl bg-background shadow p-6 flex flex-col items-center">
          <span className="text-2xl font-semibold text-primary">12</span>
          <span className="mt-2 text-muted-foreground">本月交易数</span>
        </div>
        {/* 卡片2 */}
        <div className="rounded-xl bg-background shadow p-6 flex flex-col items-center">
          <span className="text-2xl font-semibold text-green-600">￥5,600</span>
          <span className="mt-2 text-muted-foreground">总交易金额</span>
        </div>
        {/* 卡片3 */}
        <div className="rounded-xl bg-background shadow p-6 flex flex-col items-center">
          <span className="text-2xl font-semibold text-orange-500">3</span>
          <span className="mt-2 text-muted-foreground">待处理事项</span>
        </div>
      </div>
    </div>
  );
}