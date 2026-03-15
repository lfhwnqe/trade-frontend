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

function formatDateTime(value?: string) {
  if (!value) return "--";
  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

  const sessionSummary = React.useMemo(() => {
    const completedCount = sessions.length;
    const totalAttempts = sessions.reduce((sum, item) => sum + (item.completedAttemptCount ?? 0), 0);
    const totalSuccess = sessions.reduce((sum, item) => sum + item.successCount, 0);
    const totalFailure = sessions.reduce((sum, item) => sum + item.failureCount, 0);
    const successRate = totalAttempts > 0 ? totalSuccess / totalAttempts : 0;
    return { completedCount, totalAttempts, totalSuccess, totalFailure, successRate };
  }, [sessions]);

  return (
    <TradePageShell title="闪卡模拟盘训练历史" subtitle="M6：同时看 session 维度统计与 card 维度聚合，和 attempts / manage 页口径保持一致" showAddButton={false}>
      <div className="space-y-6">
        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-medium text-[#e5e7eb]">最近训练轮次</div>
              <div className="mt-1 text-xs text-[#9ca3af]">按 session 聚合回看每轮训练效果，再继续下钻到单卡历史与 attempts 明细。</div>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link href="/trade/flashcard/simulation/setup" className="text-[#00c2b2] hover:underline">再开一轮训练</Link>
              <Link href="/trade/flashcard/simulation/attempts" className="text-[#00c2b2] hover:underline">查看训练记录管理</Link>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-5">
            <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3"><div className="text-xs text-[#9ca3af]">已完成 session</div><div className="mt-2 text-lg font-semibold text-[#e5e7eb]">{sessionSummary.completedCount}</div></div>
            <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3"><div className="text-xs text-[#9ca3af]">已闭环 attempts</div><div className="mt-2 text-lg font-semibold text-[#e5e7eb]">{sessionSummary.totalAttempts}</div></div>
            <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3"><div className="text-xs text-[#9ca3af]">总成功数</div><div className="mt-2 text-lg font-semibold text-[#22c55e]">{sessionSummary.totalSuccess}</div></div>
            <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3"><div className="text-xs text-[#9ca3af]">总失败数</div><div className="mt-2 text-lg font-semibold text-[#ef4444]">{sessionSummary.totalFailure}</div></div>
            <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3"><div className="text-xs text-[#9ca3af]">聚合成功率</div><div className="mt-2 text-lg font-semibold text-[#e5e7eb]">{Math.round(sessionSummary.successRate * 100)}%</div></div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-[#9ca3af]">
                  <th className="py-2 pr-4">Session</th>
                  <th className="py-2 pr-4">模式</th>
                  <th className="py-2 pr-4">题量 / 闭环</th>
                  <th className="py-2 pr-4">成功 / 失败</th>
                  <th className="py-2 pr-4">成功率</th>
                  <th className="py-2 pr-4">开始 / 结束</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="py-6 text-[#9ca3af]">加载中...</td></tr>
                ) : sessions.length === 0 ? (
                  <tr><td colSpan={6} className="py-6 text-[#9ca3af]">还没有已完成的模拟盘训练记录</td></tr>
                ) : sessions.map((item) => (
                  <tr key={item.simulationSessionId} className="border-t border-[#27272a] text-[#e5e7eb] align-top">
                    <td className="py-3 pr-4 break-all">{item.simulationSessionId}</td>
                    <td className="py-3 pr-4">{item.mode === "ATTEMPT_REPLAY" ? "历史点位复训" : "标准推演"}</td>
                    <td className="py-3 pr-4">{item.totalCards} / {item.completedAttemptCount ?? 0}</td>
                    <td className="py-3 pr-4">{item.successCount} / {item.failureCount}</td>
                    <td className="py-3 pr-4">{Math.round(item.successRate * 100)}%</td>
                    <td className="py-3 pr-4 text-xs text-[#9ca3af]">
                      <div>{formatDateTime(item.startedAt)}</div>
                      <div className="mt-1">{formatDateTime(item.endedAt)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-5 space-y-4">
          <div>
            <div className="text-sm font-medium text-[#e5e7eb]">按卡片查询 simulation 聚合</div>
            <div className="mt-1 text-xs text-[#9ca3af]">输入 cardId，就能看到这张题的 simulation 聚合统计与历史 attempt 摘要。</div>
          </div>
          <div className="flex gap-3">
            <Input value={cardId} onChange={(e) => setCardId(e.target.value)} placeholder="输入 cardId，例如 7d5d..." className="border-[#27272a] bg-[#18181b] text-[#e5e7eb]" />
            <Button onClick={handleQueryCard} disabled={historyLoading} className="bg-[#00c2b2] text-black hover:bg-[#009e91]">{historyLoading ? "查询中..." : "查询"}</Button>
          </div>

          {cardHistory ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-6">
                <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3"><div className="text-xs text-[#9ca3af]">总尝试数</div><div className="mt-2 text-lg font-semibold text-[#e5e7eb]">{cardHistory.summary.simulationAttemptCount}</div></div>
                <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3"><div className="text-xs text-[#9ca3af]">已闭环</div><div className="mt-2 text-lg font-semibold text-[#e5e7eb]">{cardHistory.summary.simulationResolvedCount ?? 0}</div></div>
                <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3"><div className="text-xs text-[#9ca3af]">成功次数</div><div className="mt-2 text-lg font-semibold text-[#22c55e]">{cardHistory.summary.simulationSuccessCount}</div></div>
                <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3"><div className="text-xs text-[#9ca3af]">失败次数</div><div className="mt-2 text-lg font-semibold text-[#ef4444]">{cardHistory.summary.simulationFailureCount}</div></div>
                <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3"><div className="text-xs text-[#9ca3af]">平均 RR</div><div className="mt-2 text-lg font-semibold text-[#e5e7eb]">{(cardHistory.summary.simulationAvgRr ?? 0).toFixed(2)}</div></div>
                <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3"><div className="text-xs text-[#9ca3af]">平均评分</div><div className="mt-2 text-lg font-semibold text-[#e5e7eb]">{cardHistory.summary.qualityScoreAvg.toFixed(2)}</div></div>
              </div>
              <div className="space-y-3">
                {cardHistory.items.length === 0 ? (
                  <div className="text-sm text-[#9ca3af]">这张卡还没有 simulation 记录</div>
                ) : cardHistory.items.map((item) => (
                  <div key={item.attemptId} className="rounded-lg border border-[#27272a] bg-[#18181b] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-[#e5e7eb]">
                        {item.status === "ENTRY_SAVED" ? "仅保存入场" : item.result === "SUCCESS" ? "成功" : "失败"}
                      </div>
                      <div className="text-xs text-[#9ca3af]">{formatDateTime(item.createdAt)}</div>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                      <div><span className="text-[#9ca3af]">入场原因：</span><span className="text-[#e5e7eb]">{item.entryReason}</span></div>
                      <div><span className="text-[#9ca3af]">保存点位：</span><span className="text-[#e5e7eb]">{Math.round(item.revealProgress * 100)}%</span></div>
                      <div><span className="text-[#9ca3af]">RR：</span><span className="text-[#e5e7eb]">{item.rrValue.toFixed(2)}</span></div>
                      <div><span className="text-[#9ca3af]">失败原因：</span><span className="text-[#e5e7eb]">{item.failureReason || "-"}</span></div>
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
