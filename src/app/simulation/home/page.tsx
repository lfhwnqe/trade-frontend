"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

import React from "react";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

function fetchStats() {
  return fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: "simulation-train/stats",
      actualMethod: "GET",
    },
    actualBody: {},
  }).then(async (res) => {
    if (!res.ok) throw new Error(await res.text());
    const result = await res.json();
    return result.data || {};
  });
}

export default function TradeHomePage() {
  const [stats, setStats] = React.useState<{
    thisMonthClosedTradeCount: number;
    thisMonthWinRate: number;
  }>({ thisMonthClosedTradeCount: 0, thisMonthWinRate: 0 });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLoading(true);
    fetchStats()
      .then((data) => {
        setStats({
          thisMonthClosedTradeCount: data.thisMonthClosedTradeCount ?? 0,
          thisMonthWinRate: data.thisMonthWinRate ?? 0,
        });
        setLoading(false);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || "获取统计数据失败");
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8  px-4 py-10">
      {/* 顶部标题 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 tracking-tight">交易主页</h1>
        <p className="text-muted-foreground">
          欢迎来到交易管理系统，开始您的高效管理之旅！
        </p>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-4">
        <Link href="/simulation/list">
          <Button variant="default" size="lg" className="shadow-md">
            查看交易列表
          </Button>
        </Link>
        <Link href="/simulation/add">
          <Button variant="secondary" size="lg" className="shadow-md">
            新增交易
          </Button>
        </Link>
      </div>

      {/* 简单统计区块 */}
      <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
        {/* 卡片1 */}
        <div className="rounded-xl bg-background shadow p-6 flex flex-col items-center">
          <span className="text-2xl font-semibold text-primary">
            {loading ? "..." : stats.thisMonthClosedTradeCount}
          </span>
          <span className="mt-2 text-muted-foreground">本月交易数</span>
        </div>
        {/* 卡片2 */}
        <div className="rounded-xl bg-background shadow p-6 flex flex-col items-center">
          <span className="text-2xl font-semibold text-green-600">
            {loading ? "..." : `${stats.thisMonthWinRate}%`}
          </span>
          <span className="mt-2 text-muted-foreground">本月交易胜率</span>
        </div>
        {/* 卡片3 保留为空 */}
        <div className="rounded-xl bg-background shadow p-6 flex flex-col items-center min-h-[52px]">
          {error ? (
            <span className="text-red-500 text-base">{error}</span>
          ) : (
            <span className="text-2xl font-semibold text-orange-500">新功能</span>
          )}
          <span className="mt-2 text-muted-foreground">敬请期待</span>
        </div>
      </div>
    </div>
  );
}
