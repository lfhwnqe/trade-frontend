"use client";

import React from "react";
import Link from "next/link";
import TradePageShell from "../../../components/trade-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAlert } from "@/components/common/alert";
import {
  getFlashcardSimulationCardHistory,
  getFlashcardSimulationPlaybookAnalytics,
  listFlashcardSimulationSessions,
} from "../../request";
import type {
  FlashcardSimulationCardHistoryResponse,
  FlashcardSimulationPlaybookAnalyticsItem,
  FlashcardSimulationPlaybookAnalyticsResponse,
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
  const [activeTab, setActiveTab] = React.useState<"sessions" | "playbooks">("playbooks");
  const [sessions, setSessions] = React.useState<FlashcardSimulationSessionHistoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [playbookAnalytics, setPlaybookAnalytics] = React.useState<FlashcardSimulationPlaybookAnalyticsResponse | null>(null);
  const [playbookLoading, setPlaybookLoading] = React.useState(true);
  const [recentWindow, setRecentWindow] = React.useState("30");
  const [minResolved, setMinResolved] = React.useState("5");
  const [selectedPlaybook, setSelectedPlaybook] = React.useState<FlashcardSimulationPlaybookAnalyticsItem | null>(null);
  const [cardId, setCardId] = React.useState("");
  const [cardHistory, setCardHistory] = React.useState<FlashcardSimulationCardHistoryResponse | null>(null);
  const [historyLoading, setHistoryLoading] = React.useState(false);

  const loadPlaybookAnalytics = React.useCallback(async (params?: { recentWindow?: number; minResolved?: number }) => {
    setPlaybookLoading(true);
    try {
      const res = await getFlashcardSimulationPlaybookAnalytics(params);
      setPlaybookAnalytics(res);
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "获取薄弱剧本统计失败");
    } finally {
      setPlaybookLoading(false);
    }
  }, [errorAlert]);

  React.useEffect(() => {
    (async () => {
      try {
        const [sessionRes] = await Promise.all([
          listFlashcardSimulationSessions({ pageSize: 20, status: "COMPLETED" }),
          loadPlaybookAnalytics({ recentWindow: 30, minResolved: 5 }),
        ]);
        setSessions(sessionRes.items);
      } catch (error) {
        errorAlert(error instanceof Error ? error.message : "获取模拟盘训练历史失败");
      } finally {
        setLoading(false);
      }
    })();
  }, [errorAlert, loadPlaybookAnalytics]);

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

  const handleRefreshPlaybookAnalytics = React.useCallback(async () => {
    const recent = Number(recentWindow) || 30;
    const min = Number(minResolved) || 5;
    await loadPlaybookAnalytics({ recentWindow: recent, minResolved: min });
  }, [loadPlaybookAnalytics, minResolved, recentWindow]);

  const sessionSummary = React.useMemo(() => {
    const completedCount = sessions.length;
    const totalAttempts = sessions.reduce((sum, item) => sum + (item.completedAttemptCount ?? 0), 0);
    const totalSuccess = sessions.reduce((sum, item) => sum + item.successCount, 0);
    const totalFailure = sessions.reduce((sum, item) => sum + item.failureCount, 0);
    const successRate = totalAttempts > 0 ? totalSuccess / totalAttempts : 0;
    return { completedCount, totalAttempts, totalSuccess, totalFailure, successRate };
  }, [sessions]);

  const selectedPlaybookSuggestion = React.useMemo(() => {
    if (!selectedPlaybook) return "";
    if (selectedPlaybook.flags.includes("LOW_SAMPLE")) {
      return "这个剧本当前更像是样本不足，建议先补足训练次数，再判断是否真的是稳定弱点。";
    }
    if (selectedPlaybook.flags.includes("REPEATED_FAILURE") && selectedPlaybook.topFailureReasons[0]) {
      return `这个剧本当前不是随机出错，而是在“${selectedPlaybook.topFailureReasons[0].reason}”上重复犯错，建议优先围绕这个失败点做定向复训。`;
    }
    if (selectedPlaybook.avgRr < 1.5) {
      return "这个剧本当前成功率和 RR 都偏弱，更像是入场质量或结构筛选问题，建议先收紧出手条件。";
    }
    return "这个剧本已经形成可观察弱点，建议结合失败原因分布继续复盘最近样本。";
  }, [selectedPlaybook?.playbookType, selectedPlaybook?.flags, selectedPlaybook?.topFailureReasons, selectedPlaybook?.avgRr]);

  return (
    <TradePageShell title="闪卡模拟盘训练历史" subtitle="一边回看 session / card 历史，一边看主剧本薄弱项统计" showAddButton={false}>
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeTab === "playbooks" ? "default" : "outline"}
            onClick={() => setActiveTab("playbooks")}
            className={activeTab === "playbooks" ? "bg-[#00c2b2] text-black hover:bg-[#009e91]" : "border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#18181b]"}
          >
            薄弱剧本
          </Button>
          <Button
            variant={activeTab === "sessions" ? "default" : "outline"}
            onClick={() => setActiveTab("sessions")}
            className={activeTab === "sessions" ? "bg-[#00c2b2] text-black hover:bg-[#009e91]" : "border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#18181b]"}
          >
            Session / Card 历史
          </Button>
        </div>

        {activeTab === "playbooks" ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-[#27272a] bg-[#121212] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="text-sm font-medium text-[#e5e7eb]">薄弱剧本统计面板</div>
                  <div className="mt-1 text-xs text-[#9ca3af]">基于 Simulation 已闭环 attempts，按主剧本聚合成功率、平均 RR 与失败原因集中度，识别当前最该优先复训的剧本。</div>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <div className="mb-1 text-xs text-[#9ca3af]">最近窗口</div>
                    <Input value={recentWindow} onChange={(e) => setRecentWindow(e.target.value)} className="w-28 border-[#27272a] bg-[#18181b] text-[#e5e7eb]" />
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-[#9ca3af]">最小闭环数</div>
                    <Input value={minResolved} onChange={(e) => setMinResolved(e.target.value)} className="w-28 border-[#27272a] bg-[#18181b] text-[#e5e7eb]" />
                  </div>
                  <Button onClick={handleRefreshPlaybookAnalytics} disabled={playbookLoading} className="bg-[#00c2b2] text-black hover:bg-[#009e91]">
                    {playbookLoading ? "刷新中..." : "刷新统计"}
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3"><div className="text-xs text-[#9ca3af]">剧本总数</div><div className="mt-2 text-lg font-semibold text-[#e5e7eb]">{playbookAnalytics?.summary.totalPlaybooks ?? 0}</div></div>
                <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3"><div className="text-xs text-[#9ca3af]">可上榜剧本</div><div className="mt-2 text-lg font-semibold text-[#e5e7eb]">{playbookAnalytics?.summary.rankedPlaybooks ?? 0}</div></div>
                <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3"><div className="text-xs text-[#9ca3af]">已闭环 attempts</div><div className="mt-2 text-lg font-semibold text-[#e5e7eb]">{playbookAnalytics?.summary.totalResolvedAttempts ?? 0}</div></div>
                <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3"><div className="text-xs text-[#9ca3af]">低样本阈值</div><div className="mt-2 text-lg font-semibold text-[#e5e7eb]">{playbookAnalytics?.summary.minResolved ?? 0}</div></div>
              </div>
            </div>

            <div className="rounded-xl border border-[#27272a] bg-[#121212] p-5">
              <div className="text-sm font-medium text-[#e5e7eb]">Top 3 薄弱剧本</div>
              <div className="mt-1 text-xs text-[#9ca3af]">只展示达到最小闭环数要求的剧本，避免被低样本误导。</div>
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                {playbookLoading ? (
                  <div className="text-sm text-[#9ca3af]">加载中...</div>
                ) : !playbookAnalytics || playbookAnalytics.weakest.length === 0 ? (
                  <div className="text-sm text-[#9ca3af]">当前没有达到上榜阈值的剧本</div>
                ) : playbookAnalytics.weakest.map((item) => (
                  <button key={item.playbookType} type="button" onClick={() => setSelectedPlaybook(item)} className="rounded-lg border border-[#27272a] bg-[#18181b] p-4 text-left transition hover:border-[#00c2b2]/50 hover:bg-[#1a1a1d]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-[#e5e7eb]">{item.label}</div>
                        <div className="mt-1 text-xs text-[#9ca3af] break-all">{item.playbookType}</div>
                      </div>
                      <div className="text-xs text-[#f59e0b]">弱点分 {item.weaknessScore.toFixed(0)}</div>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                      <div><span className="text-[#9ca3af]">成功率：</span><span className="text-[#e5e7eb]">{Math.round(item.successRate * 100)}%</span></div>
                      <div><span className="text-[#9ca3af]">闭环数：</span><span className="text-[#e5e7eb]">{item.resolvedCount}</span></div>
                      <div><span className="text-[#9ca3af]">平均 RR：</span><span className="text-[#e5e7eb]">{item.avgRr.toFixed(2)}</span></div>
                      <div><span className="text-[#9ca3af]">平均评分：</span><span className="text-[#e5e7eb]">{item.qualityScoreAvg.toFixed(2)}</span></div>
                    </div>
                    <div className="mt-3 text-xs text-[#9ca3af]">主失败原因：<span className="text-[#e5e7eb]">{item.topFailureReasons[0] ? `${item.topFailureReasons[0].reason}（${Math.round(item.topFailureReasons[0].share * 100)}%）` : "-"}</span></div>
                    <div className="mt-3 flex flex-wrap gap-2">{item.flags.map((flag) => <span key={flag} className="rounded-full border border-[#3f3f46] px-2 py-1 text-[11px] text-[#d4d4d8]">{flag}</span>)}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[#27272a] bg-[#121212] p-5">
              <div className="text-sm font-medium text-[#e5e7eb]">全量剧本明细</div>
              <div className="mt-1 text-xs text-[#9ca3af]">低样本剧本会保留在列表中，但不会进入 Top 3 排行。点击行可查看这个剧本为什么弱。</div>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-[#9ca3af]">
                      <th className="py-2 pr-4">剧本</th>
                      <th className="py-2 pr-4">闭环数</th>
                      <th className="py-2 pr-4">成功率</th>
                      <th className="py-2 pr-4">平均 RR</th>
                      <th className="py-2 pr-4">平均评分</th>
                      <th className="py-2 pr-4">主失败原因</th>
                      <th className="py-2 pr-4">标签</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playbookLoading ? (
                      <tr><td colSpan={7} className="py-6 text-[#9ca3af]">加载中...</td></tr>
                    ) : !playbookAnalytics || playbookAnalytics.items.length === 0 ? (
                      <tr><td colSpan={7} className="py-6 text-[#9ca3af]">还没有可用于聚合的 simulation 数据</td></tr>
                    ) : playbookAnalytics.items.map((item) => (
                      <tr key={item.playbookType} className="border-t border-[#27272a] text-[#e5e7eb] align-top cursor-pointer hover:bg-[#18181b]" onClick={() => setSelectedPlaybook(item)}>
                        <td className="py-3 pr-4">
                          <div className="font-medium">{item.label}</div>
                          <div className="mt-1 text-xs text-[#9ca3af] break-all">{item.playbookType}</div>
                        </td>
                        <td className="py-3 pr-4">{item.resolvedCount}</td>
                        <td className="py-3 pr-4">{Math.round(item.successRate * 100)}%</td>
                        <td className="py-3 pr-4">{item.avgRr.toFixed(2)}</td>
                        <td className="py-3 pr-4">{item.qualityScoreAvg.toFixed(2)}</td>
                        <td className="py-3 pr-4 text-xs text-[#9ca3af]">{item.topFailureReasons[0] ? `${item.topFailureReasons[0].reason}（${item.topFailureReasons[0].count}）` : "-"}</td>
                        <td className="py-3 pr-4"><div className="flex flex-wrap gap-2">{item.flags.map((flag) => <span key={flag} className="rounded-full border border-[#3f3f46] px-2 py-1 text-[11px] text-[#d4d4d8]">{flag}</span>)}</div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}

        <Dialog open={Boolean(selectedPlaybook)} onOpenChange={(open) => { if (!open) setSelectedPlaybook(null); }}>
          <DialogContent className="w-[min(96vw,900px)] max-w-none border-[#27272a] bg-[#121212] text-[#e5e7eb]">
            <DialogHeader>
              <DialogTitle>{selectedPlaybook?.label || "剧本详情"}</DialogTitle>
              <DialogDescription className="text-[#9ca3af]">{selectedPlaybook?.playbookType || ""}</DialogDescription>
            </DialogHeader>
            {selectedPlaybook ? (
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-5">
                  <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3"><div className="text-xs text-[#9ca3af]">弱点分</div><div className="mt-2 text-lg font-semibold text-[#f59e0b]">{selectedPlaybook.weaknessScore.toFixed(0)}</div></div>
                  <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3"><div className="text-xs text-[#9ca3af]">闭环数</div><div className="mt-2 text-lg font-semibold text-[#e5e7eb]">{selectedPlaybook.resolvedCount}</div></div>
                  <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3"><div className="text-xs text-[#9ca3af]">成功率</div><div className="mt-2 text-lg font-semibold text-[#e5e7eb]">{Math.round(selectedPlaybook.successRate * 100)}%</div></div>
                  <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3"><div className="text-xs text-[#9ca3af]">平均 RR</div><div className="mt-2 text-lg font-semibold text-[#e5e7eb]">{selectedPlaybook.avgRr.toFixed(2)}</div></div>
                  <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3"><div className="text-xs text-[#9ca3af]">平均评分</div><div className="mt-2 text-lg font-semibold text-[#e5e7eb]">{selectedPlaybook.qualityScoreAvg.toFixed(2)}</div></div>
                </div>

                <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-4">
                  <div className="text-sm font-medium text-[#e5e7eb]">失败原因分布</div>
                  <div className="mt-3 space-y-3">
                    {selectedPlaybook.topFailureReasons.length === 0 ? (
                      <div className="text-sm text-[#9ca3af]">当前没有可用的失败原因样本</div>
                    ) : selectedPlaybook.topFailureReasons.map((reason) => (
                      <div key={reason.reason}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#e5e7eb]">{reason.reason}</span>
                          <span className="text-[#9ca3af]">{reason.count} 次 / {Math.round(reason.share * 100)}%</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-[#27272a]">
                          <div className="h-2 rounded-full bg-[#00c2b2]" style={{ width: `${Math.max(6, Math.round(reason.share * 100))}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                  <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-4">
                    <div className="text-sm font-medium text-[#e5e7eb]">复训建议</div>
                    <div className="mt-3 text-sm leading-6 text-[#d4d4d8]">{selectedPlaybookSuggestion}</div>
                  </div>
                  <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-4">
                    <div className="text-sm font-medium text-[#e5e7eb]">当前标签</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedPlaybook.flags.length === 0 ? (
                        <span className="text-sm text-[#9ca3af]">暂无标签</span>
                      ) : selectedPlaybook.flags.map((flag) => (
                        <span key={flag} className="rounded-full border border-[#3f3f46] px-2 py-1 text-[11px] text-[#d4d4d8]">{flag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        {activeTab === "sessions" ? (
          <>
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
                        <td className="py-3 pr-4 text-xs text-[#9ca3af]"><div>{formatDateTime(item.startedAt)}</div><div className="mt-1">{formatDateTime(item.endedAt)}</div></td>
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
                          <div className="text-sm font-medium text-[#e5e7eb]">{item.status === "ENTRY_SAVED" ? "仅保存入场" : item.result === "SUCCESS" ? "成功" : "失败"}</div>
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
          </>
        ) : null}
      </div>
    </TradePageShell>
  );
}
