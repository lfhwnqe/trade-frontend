"use client";

import React from "react";
import Link from "next/link";
import TradePageShell from "../../../components/trade-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAlert } from "@/components/common/alert";
import {
  getFlashcardSimulationCardHistory,
  listFlashcardSimulationSessions,
} from "../../request";
import type {
  FlashcardSimulationCardHistoryResponse,
  FlashcardSimulationSessionHistoryItem,
} from "../../types";

export default function FlashcardSimulationHistoryPage() {
  const [, errorAlert] = useAlert();
  const [sessions, setSessions] = React.useState<FlashcardSimulationSessionHistoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [cardId, setCardId] = React.useState("");
  const [cardHistory, setCardHistory] = React.useState<FlashcardSimulationCardHistoryResponse | null>(null);
  const [historyLoading, setHistoryLoading] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await listFlashcardSimulationSessions({ pageSize: 20, status: "COMPLETED" });
        setSessions(res.items);
      } catch (error) {
        errorAlert(error instanceof Error ? error.message : "获取模拟盘训练历史失败");
      } finally {
        setLoading(false);
      }
    })();
  }, [errorAlert]);

  const handleQueryCard = React.useCallback(async () => {
    if (!cardId.trim()) {
      errorAlert("请输入要查询的 cardId");
      return;
    }
    setHistoryLoading(true);
    try {
      const res = await getFlashcardSimulationCardHistory({ cardId: cardId.trim(), pageSize: 20 });
      setCardHistory(res);
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "获取卡片训练历史失败");
    } finally {
      setHistoryLoading(false);
    }
  }, [cardId, errorAlert]);

  return (
    <TradePageShell title="闪卡模拟盘训练历史" subtitle="看每轮结果，也可以按卡片查询失败备注" showAddButton={false}>
      <div className="space-y-6">
        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-[#e5e7eb]">最近训练轮次</div>
              <div className="mt-1 text-xs text-[#9ca3af]">先把整轮统计沉淀下来，后面再细看某张卡的失败备注。</div>
            </div>
            <Link href="/trade/flashcard/simulation/setup" className="text-sm text-[#00c2b2] hover:underline">再开一轮训练</Link>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-[#9ca3af]">
                  <th className="py-2 pr-4">Session</th>
                  <th className="py-2 pr-4">成功</th>
                  <th className="py-2 pr-4">失败</th>
                  <th className="py-2 pr-4">成功率</th>
                  <th className="py-2 pr-4">开始时间</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="py-6 text-[#9ca3af]">加载中...</td></tr>
                ) : sessions.length === 0 ? (
                  <tr><td colSpan={5} className="py-6 text-[#9ca3af]">还没有已完成的模拟盘训练记录</td></tr>
                ) : sessions.map((item) => (
                  <tr key={item.simulationSessionId} className="border-t border-[#27272a] text-[#e5e7eb]">
                    <td className="py-3 pr-4">{item.simulationSessionId}</td>
                    <td className="py-3 pr-4">{item.successCount}</td>
                    <td className="py-3 pr-4">{item.failureCount}</td>
                    <td className="py-3 pr-4">{Math.round(item.successRate * 100)}%</td>
                    <td className="py-3 pr-4">{item.startedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-5 space-y-4">
          <div>
            <div className="text-sm font-medium text-[#e5e7eb]">按卡片查询失败备注</div>
            <div className="mt-1 text-xs text-[#9ca3af]">输入 cardId，就能看到这张题历史上被怎么做错过。</div>
          </div>
          <div className="flex gap-3">
            <Input value={cardId} onChange={(e) => setCardId(e.target.value)} placeholder="输入 cardId，例如 7d5d..." className="border-[#27272a] bg-[#18181b] text-[#e5e7eb]" />
            <Button onClick={handleQueryCard} disabled={historyLoading} className="bg-[#00c2b2] text-black hover:bg-[#009e91]">{historyLoading ? "查询中..." : "查询"}</Button>
          </div>

          {cardHistory ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3"><div className="text-xs text-[#9ca3af]">总训练次数</div><div className="mt-2 text-lg font-semibold text-[#e5e7eb]">{cardHistory.summary.simulationAttemptCount}</div></div>
                <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3"><div className="text-xs text-[#9ca3af]">成功次数</div><div className="mt-2 text-lg font-semibold text-[#22c55e]">{cardHistory.summary.simulationSuccessCount}</div></div>
                <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3"><div className="text-xs text-[#9ca3af]">失败次数</div><div className="mt-2 text-lg font-semibold text-[#ef4444]">{cardHistory.summary.simulationFailureCount}</div></div>
                <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3"><div className="text-xs text-[#9ca3af]">平均评分</div><div className="mt-2 text-lg font-semibold text-[#e5e7eb]">{cardHistory.summary.qualityScoreAvg.toFixed(2)}</div></div>
              </div>
              <div className="space-y-3">
                {cardHistory.items.length === 0 ? (
                  <div className="text-sm text-[#9ca3af]">这张卡还没有 simulation 记录</div>
                ) : cardHistory.items.map((item) => (
                  <div key={item.attemptId} className="rounded-lg border border-[#27272a] bg-[#18181b] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-[#e5e7eb]">{item.result === "SUCCESS" ? "成功" : "失败"}</div>
                      <div className="text-xs text-[#9ca3af]">{item.createdAt}</div>
                    </div>
                    <div className="mt-3 space-y-2 text-sm">
                      <div><span className="text-[#9ca3af]">入场原因：</span><span className="text-[#e5e7eb]">{item.entryReason}</span></div>
                      <div><span className="text-[#9ca3af]">RR 原因：</span><span className="text-[#e5e7eb]">{item.rrReason}</span></div>
                      <div><span className="text-[#9ca3af]">失败备注：</span><span className="text-[#e5e7eb]">{item.failureNote || "-"}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </TradePageShell>
  );
}
