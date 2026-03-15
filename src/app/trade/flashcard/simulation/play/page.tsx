"use client";

import React from "react";
import Link from "next/link";
import TradePageShell from "../../../components/trade-page-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAlert } from "@/components/common/alert";
import { ImagePreviewDialog } from "../../components/ImagePreviewDialog";
import {
  clearFlashcardSimulationSession,
  getFlashcardSimulationSession,
  type FlashcardSimulationSession,
} from "@/store/flashcard-simulation-session";
import {
  finishFlashcardSimulationSession,
  submitFlashcardSimulationAttempt,
} from "../../request";
import type {
  FlashcardSimulationCardMetrics,
  FlashcardSimulationRunningStats,
} from "../../types";
import {
  FLASHCARD_LABELS,
} from "../../types";
import {
  FLASHCARD_PRICE_LINE_TYPES,
  type FlashcardPriceLineValue,
} from "../../components/FlashcardPriceLineEditor";

function getTradeSide(lines: FlashcardPriceLineValue) {
  const entry = lines.entry;
  const stopLoss = lines.stopLoss;
  const takeProfit = lines.takeProfit;
  if (typeof entry !== "number" || typeof stopLoss !== "number" || typeof takeProfit !== "number") {
    return null;
  }
  if (takeProfit < entry && stopLoss > entry) return "LONG" as const;
  if (takeProfit > entry && stopLoss < entry) return "SHORT" as const;
  return null;
}

function getRr(lines: FlashcardPriceLineValue) {
  const entry = lines.entry;
  const stopLoss = lines.stopLoss;
  const takeProfit = lines.takeProfit;
  const side = getTradeSide(lines);
  if (typeof entry !== "number" || typeof stopLoss !== "number" || typeof takeProfit !== "number" || !side) {
    return null;
  }
  let risk = 0;
  let reward = 0;
  if (side === "LONG") {
    risk = stopLoss - entry;
    reward = entry - takeProfit;
  } else {
    risk = entry - stopLoss;
    reward = takeProfit - entry;
  }
  if (risk <= 0 || reward <= 0) return null;
  return reward / risk;
}

export default function FlashcardSimulationPlayPage() {
  const [, errorAlert] = useAlert();
  const [session, setSession] = React.useState<FlashcardSimulationSession | null>(null);
  const [index, setIndex] = React.useState(0);
  const [questionRevealProgress, setQuestionRevealProgress] = React.useState(0);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [linesByCard, setLinesByCard] = React.useState<Record<string, FlashcardPriceLineValue>>({});
  const [entryReasonMap, setEntryReasonMap] = React.useState<Record<string, string>>({});
  const [rrReasonMap, setRrReasonMap] = React.useState<Record<string, string>>({});
  const [revealedMap, setRevealedMap] = React.useState<Record<string, boolean>>({});
  const [resultMap, setResultMap] = React.useState<Record<string, "SUCCESS" | "FAILURE" | "">>({});
  const [failureNoteMap, setFailureNoteMap] = React.useState<Record<string, string>>({});
  const [qualityScoreMap, setQualityScoreMap] = React.useState<Record<string, number>>({});
  const [attemptedMap, setAttemptedMap] = React.useState<Record<string, boolean>>({});
  const [runningStats, setRunningStats] = React.useState<FlashcardSimulationRunningStats | null>(null);
  const [cardMetricsMap, setCardMetricsMap] = React.useState<Record<string, FlashcardSimulationCardMetrics>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [finishing, setFinishing] = React.useState(false);
  const [finalStats, setFinalStats] = React.useState<{
    successCount: number;
    failureCount: number;
    successRate: number;
  } | null>(null);

  React.useEffect(() => {
    const loaded = getFlashcardSimulationSession();
    if (!loaded) return;
    setSession(loaded);
    const defaultScores = loaded.cards.reduce<Record<string, number>>((acc, card) => {
      acc[card.cardId] = 5;
      return acc;
    }, {});
    setQualityScoreMap(defaultScores);
  }, []);

  React.useEffect(() => {
    setQuestionRevealProgress(0);
    setPreviewOpen(false);
  }, [index]);

  const cards = session?.cards || [];
  const current = cards[index];
  const currentCardId = current?.cardId ?? null;
  const isCompleted = cards.length > 0 && index >= cards.length;
  const currentLines = currentCardId ? linesByCard[currentCardId] || {} : {};
  const currentTradeSide = getTradeSide(currentLines);
  const currentRr = getRr(currentLines);
  const handleCurrentPriceLineChange = React.useCallback(
    (next: FlashcardPriceLineValue) => {
      if (!currentCardId) return;
      setLinesByCard((prev) => ({ ...prev, [currentCardId]: next }));
    },
    [currentCardId],
  );

  const handleReveal = React.useCallback(() => {
    if (!current) return;
    const lines = linesByCard[current.cardId] || {};
    const rr = getRr(lines);
    const tradeSide = getTradeSide(lines);
    if (!tradeSide || rr === null || FLASHCARD_PRICE_LINE_TYPES.some((type) => typeof lines[type] !== "number")) {
      errorAlert("请先完整设置入场 / 止损 / 止盈三条线，且线位要能构成有效 RR");
      return;
    }
    if (!(entryReasonMap[current.cardId] || "").trim()) {
      errorAlert("请先填写入场原因");
      return;
    }
    if (!(rrReasonMap[current.cardId] || "").trim()) {
      errorAlert("请先填写盈亏比设置原因");
      return;
    }
    setRevealedMap((prev) => ({ ...prev, [current.cardId]: true }));
  }, [current, entryReasonMap, errorAlert, linesByCard, rrReasonMap]);

  const handleSubmit = React.useCallback(async () => {
    if (!session || !current) return;
    const result = resultMap[current.cardId];
    const lines = linesByCard[current.cardId] || {};
    const rr = getRr(lines);
    const tradeSide = getTradeSide(lines);
    if (!revealedMap[current.cardId]) {
      errorAlert("请先揭晓答案，再提交本题结果");
      return;
    }
    if (!tradeSide || rr === null) {
      errorAlert("当前三条线设置无效，请重新调整");
      return;
    }
    if (!result) {
      errorAlert("请先选择本题是成功还是失败");
      return;
    }
    if (result === "FAILURE" && !(failureNoteMap[current.cardId] || "").trim()) {
      errorAlert("失败题请补充失败备注");
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitFlashcardSimulationAttempt({
        sessionId: session.simulationSessionId,
        cardId: current.cardId,
        entryLineYPercent: lines.entry!,
        stopLossLineYPercent: lines.stopLoss!,
        takeProfitLineYPercent: lines.takeProfit!,
        rrValue: Number(rr.toFixed(4)),
        entryDirection: tradeSide,
        entryReason: (entryReasonMap[current.cardId] || "").trim(),
        rrReason: (rrReasonMap[current.cardId] || "").trim(),
        result,
        failureNote: result === "FAILURE" ? (failureNoteMap[current.cardId] || "").trim() : undefined,
        cardQualityScore: (qualityScoreMap[current.cardId] || 5) as 1 | 2 | 3 | 4 | 5,
      });

      setAttemptedMap((prev) => ({ ...prev, [current.cardId]: true }));
      setRunningStats(res.runningStats);
      setCardMetricsMap((prev) => ({ ...prev, [current.cardId]: res.cardMetrics }));

      if (index + 1 >= cards.length) {
        setFinishing(true);
        const finished = await finishFlashcardSimulationSession(session.simulationSessionId);
        setFinalStats({
          successCount: finished.successCount,
          failureCount: finished.failureCount,
          successRate: finished.successRate,
        });
        clearFlashcardSimulationSession();
        setIndex(cards.length);
      } else {
        setIndex((prev) => prev + 1);
      }
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "提交模拟盘结果失败");
    } finally {
      setSubmitting(false);
      setFinishing(false);
    }
  }, [cards.length, current, entryReasonMap, errorAlert, failureNoteMap, index, linesByCard, qualityScoreMap, resultMap, revealedMap, rrReasonMap, session]);

  if (!session) {
    return (
      <TradePageShell title="闪卡模拟盘训练" subtitle="未找到当前训练会话" showAddButton={false}>
        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-6 text-sm text-[#9ca3af]">
          当前没有可恢复的模拟盘训练会话，先去 <Link href="/trade/flashcard/simulation/setup" className="text-[#00c2b2] hover:underline">生成一轮训练</Link>。
        </div>
      </TradePageShell>
    );
  }

  if (isCompleted || !current) {
    return (
      <TradePageShell title="闪卡模拟盘训练完成" subtitle="这一轮的成功/失败统计已经收口" showAddButton={false}>
        <div className="space-y-4 rounded-xl border border-[#27272a] bg-[#121212] p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-4">
              <div className="text-xs text-[#9ca3af]">成功数</div>
              <div className="mt-2 text-2xl font-semibold text-[#22c55e]">{finalStats?.successCount ?? runningStats?.successCount ?? 0}</div>
            </div>
            <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-4">
              <div className="text-xs text-[#9ca3af]">失败数</div>
              <div className="mt-2 text-2xl font-semibold text-[#ef4444]">{finalStats?.failureCount ?? runningStats?.failureCount ?? 0}</div>
            </div>
            <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-4">
              <div className="text-xs text-[#9ca3af]">成功率</div>
              <div className="mt-2 text-2xl font-semibold text-[#e5e7eb]">{Math.round((finalStats?.successRate ?? runningStats?.successRate ?? 0) * 100)}%</div>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/trade/flashcard/simulation/history"><Button className="bg-[#00c2b2] text-black hover:bg-[#009e91]">查看训练历史</Button></Link>
            <Link href="/trade/flashcard/simulation/setup"><Button variant="outline" className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]">再来一轮</Button></Link>
          </div>
        </div>
      </TradePageShell>
    );
  }

  const currentRevealed = !!revealedMap[current.cardId];
  const currentResult = resultMap[current.cardId] || "";
  const currentMetrics = cardMetricsMap[current.cardId];

  return (
    <TradePageShell title="闪卡模拟盘训练" subtitle={`第 ${index + 1} / ${cards.length} 题`} showAddButton={false}>
      <div className="space-y-6">
        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-[#e5e7eb]">先推进 K 线，再在放大图里设置三条线</div>
              <div className="mt-1 text-xs text-[#9ca3af]">点击题目图放大后，可直接复用现有盈亏比辅助线工具。</div>
            </div>
            <Button variant="outline" className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]" onClick={() => setPreviewOpen(true)}>放大并设置三条线</Button>
          </div>

          <button type="button" className="w-full" onClick={() => setPreviewOpen(true)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.questionImageUrl} alt="question" className="max-h-[60vh] w-full rounded border border-[#27272a] bg-black object-contain" />
          </button>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3">
              <div className="text-xs text-[#9ca3af]">结构方向</div>
              <div className="mt-2 text-sm font-medium text-[#e5e7eb]">{currentTradeSide ? FLASHCARD_LABELS[currentTradeSide] : "未形成有效结构"}</div>
            </div>
            <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3">
              <div className="text-xs text-[#9ca3af]">当前 RR</div>
              <div className="mt-2 text-sm font-medium text-[#e5e7eb]">{currentRr !== null ? currentRr.toFixed(2) : "--"}</div>
            </div>
            <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3">
              <div className="text-xs text-[#9ca3af]">卡片平均评分</div>
              <div className="mt-2 text-sm font-medium text-[#e5e7eb]">{typeof currentMetrics?.qualityScoreAvg === "number" && currentMetrics.qualityScoreAvg > 0 ? currentMetrics.qualityScoreAvg.toFixed(2) : (typeof current.qualityScoreAvg === "number" ? current.qualityScoreAvg.toFixed(2) : "5.00")}</div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-[#27272a] bg-[#121212] p-5 space-y-4">
            <div>
              <div className="mb-2 text-sm font-medium text-[#e5e7eb]">入场原因</div>
              <Textarea value={entryReasonMap[current.cardId] || ""} onChange={(e) => setEntryReasonMap((prev) => ({ ...prev, [current.cardId]: e.target.value }))} className="min-h-[140px] border-[#27272a] bg-[#18181b] text-[#e5e7eb]" placeholder="为什么你会在这里入场？" />
            </div>
            <div>
              <div className="mb-2 text-sm font-medium text-[#e5e7eb]">盈亏比设置原因</div>
              <Textarea value={rrReasonMap[current.cardId] || ""} onChange={(e) => setRrReasonMap((prev) => ({ ...prev, [current.cardId]: e.target.value }))} className="min-h-[140px] border-[#27272a] bg-[#18181b] text-[#e5e7eb]" placeholder="为什么止损放这里、止盈看哪里？" />
            </div>
            {!currentRevealed ? (
              <Button onClick={handleReveal} className="bg-[#00c2b2] text-black hover:bg-[#009e91]">揭晓答案</Button>
            ) : null}
          </div>

          <div className="rounded-xl border border-[#27272a] bg-[#121212] p-5 space-y-4">
            {currentRevealed ? (
              <>
                <div>
                  <div className="mb-2 text-sm font-medium text-[#e5e7eb]">答案图</div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={current.answerImageUrl} alt="answer" className="max-h-[40vh] w-full rounded border border-[#27272a] bg-black object-contain" />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant={currentResult === "SUCCESS" ? "default" : "outline"} className={currentResult === "SUCCESS" ? "bg-[#22c55e] text-black hover:bg-[#16a34a]" : "border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]"} onClick={() => setResultMap((prev) => ({ ...prev, [current.cardId]: "SUCCESS" }))}>成功</Button>
                  <Button type="button" variant={currentResult === "FAILURE" ? "default" : "outline"} className={currentResult === "FAILURE" ? "bg-[#ef4444] text-white hover:bg-[#dc2626]" : "border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]"} onClick={() => setResultMap((prev) => ({ ...prev, [current.cardId]: "FAILURE" }))}>失败</Button>
                </div>
                {currentResult === "FAILURE" ? (
                  <div>
                    <div className="mb-2 text-sm font-medium text-[#e5e7eb]">失败备注</div>
                    <Textarea value={failureNoteMap[current.cardId] || ""} onChange={(e) => setFailureNoteMap((prev) => ({ ...prev, [current.cardId]: e.target.value }))} className="min-h-[120px] border-[#27272a] bg-[#18181b] text-[#e5e7eb]" placeholder="这次为什么失败？" />
                  </div>
                ) : null}
                <div>
                  <div className="mb-2 text-sm font-medium text-[#e5e7eb]">题目质量评分（默认 5）</div>
                  <Input type="number" min={1} max={5} value={qualityScoreMap[current.cardId] || 5} onChange={(e) => setQualityScoreMap((prev) => ({ ...prev, [current.cardId]: Math.min(5, Math.max(1, Number(e.target.value || 5))) }))} className="w-28 border-[#27272a] bg-[#18181b] text-[#e5e7eb]" />
                </div>
                <Button onClick={handleSubmit} disabled={submitting || finishing || attemptedMap[current.cardId]} className="bg-[#00c2b2] text-black hover:bg-[#009e91]">
                  {submitting || finishing ? "提交中..." : attemptedMap[current.cardId] ? "本题已提交" : index + 1 >= cards.length ? "提交并完成训练" : "提交并进入下一题"}
                </Button>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-[#27272a] p-6 text-sm text-[#9ca3af]">
                先完成三条线设置、写入场原因和 RR 原因，再揭晓答案。
              </div>
            )}
          </div>
        </div>

        {runningStats ? (
          <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4 text-sm text-[#9ca3af]">
            当前已完成 {runningStats.completedCount} / {cards.length} 题，成功 {runningStats.successCount}，失败 {runningStats.failureCount}，成功率 {Math.round(runningStats.successRate * 100)}%
          </div>
        ) : null}
      </div>

      {previewOpen ? (
        <ImagePreviewDialog
          previewUrl={current.questionImageUrl}
          answerPreviewUrl={current.answerImageUrl}
          onClose={() => setPreviewOpen(false)}
          revealProgress={questionRevealProgress}
          onRevealProgressChange={setQuestionRevealProgress}
          priceLineEditorEnabled
          priceLineValue={currentLines}
          onPriceLineChange={handleCurrentPriceLineChange}
        />
      ) : null}
    </TradePageShell>
  );
}
