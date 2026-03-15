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
  createFlashcardSimulationAttempt,
  finishFlashcardSimulationSession,
  resolveFlashcardSimulationAttempt,
} from "../../request";
import type {
  FlashcardSimulationAttemptDetail,
  FlashcardSimulationCardMetrics,
  FlashcardSimulationRunningStats,
} from "../../types";
import { FLASHCARD_LABELS } from "../../types";
import {
  type FlashcardPriceLineValue,
} from "../../components/FlashcardPriceLineEditor";

function clampRevealProgress(value: number) {
  return Math.min(1, Math.max(0, value));
}

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

const PREVIEW_WHEEL_REVEAL_STEP = 0.00033;

type AttemptResolutionDraft = {
  result: "SUCCESS" | "FAILURE" | "";
  failureReason: string;
  cardQualityScore: number;
};

export default function FlashcardSimulationPlayPage() {
  const [, errorAlert] = useAlert();
  const [session, setSession] = React.useState<FlashcardSimulationSession | null>(null);
  const [index, setIndex] = React.useState(0);
  const [questionRevealProgress, setQuestionRevealProgress] = React.useState(0);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [answerVisible, setAnswerVisible] = React.useState(false);
  const [answerPreviewOpen, setAnswerPreviewOpen] = React.useState(false);
  const [entryReasonInput, setEntryReasonInput] = React.useState("");
  const [linesByCard, setLinesByCard] = React.useState<Record<string, FlashcardPriceLineValue>>({});
  const [attemptsByCard, setAttemptsByCard] = React.useState<Record<string, FlashcardSimulationAttemptDetail[]>>({});
  const [resolutionDrafts, setResolutionDrafts] = React.useState<Record<string, AttemptResolutionDraft>>({});
  const [runningStats, setRunningStats] = React.useState<FlashcardSimulationRunningStats | null>(null);
  const [cardMetricsMap, setCardMetricsMap] = React.useState<Record<string, FlashcardSimulationCardMetrics>>({});
  const [savingAttempt, setSavingAttempt] = React.useState(false);
  const [resolvingAttemptId, setResolvingAttemptId] = React.useState<string | null>(null);
  const [finishing, setFinishing] = React.useState(false);
  const [finalStats, setFinalStats] = React.useState<{
    completedAttemptCount?: number;
    successCount: number;
    failureCount: number;
    successRate: number;
  } | null>(null);

  React.useEffect(() => {
    const loaded = getFlashcardSimulationSession();
    if (!loaded) return;
    setSession(loaded);
  }, []);

  const cards = session?.cards || [];
  const current = cards[index];
  const currentCardId = current?.cardId ?? null;
  const isCompleted = cards.length > 0 && index >= cards.length;
  const currentLines = currentCardId ? linesByCard[currentCardId] || {} : {};
  const currentTradeSide = getTradeSide(currentLines);
  const currentRr = getRr(currentLines);
  const currentAttempts = currentCardId ? attemptsByCard[currentCardId] || [] : [];
  const currentMetrics = currentCardId ? cardMetricsMap[currentCardId] : undefined;

  React.useEffect(() => {
    setQuestionRevealProgress(current?.prefilledRevealProgress ?? 0);
    setPreviewOpen(false);
    setAnswerVisible(false);
    setAnswerPreviewOpen(false);
    setEntryReasonInput("");
  }, [current?.prefilledRevealProgress, index]);

  const handleCurrentPriceLineChange = React.useCallback(
    (next: FlashcardPriceLineValue) => {
      if (!currentCardId) return;
      setLinesByCard((prev) => ({ ...prev, [currentCardId]: next }));
    },
    [currentCardId],
  );

  const handleMainImageWheel = React.useCallback((event: React.WheelEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const direction = Math.sign(event.deltaY);
    if (!direction) return;
    setQuestionRevealProgress((prev) =>
      clampRevealProgress(prev + direction * PREVIEW_WHEEL_REVEAL_STEP * Math.max(Math.abs(event.deltaY), 12)),
    );
  }, []);

  const updateResolutionDraft = React.useCallback((attemptId: string, patch: Partial<AttemptResolutionDraft>) => {
    setResolutionDrafts((prev) => ({
      ...prev,
      [attemptId]: {
        result: prev[attemptId]?.result || "",
        failureReason: prev[attemptId]?.failureReason || "",
        cardQualityScore: prev[attemptId]?.cardQualityScore || 5,
        ...patch,
      },
    }));
  }, []);

  const handleSaveAttempt = React.useCallback(async () => {
    if (!session || !current || !currentCardId) return;
    const rr = getRr(currentLines);
    const tradeSide = getTradeSide(currentLines);
    if (!tradeSide || rr === null) {
      errorAlert("请先完整设置入场 / 止损 / 止盈三条线，且线位要能构成有效 RR");
      return;
    }
    if (!entryReasonInput.trim()) {
      errorAlert("请先填写本次入场理由");
      return;
    }

    setSavingAttempt(true);
    try {
      const res = await createFlashcardSimulationAttempt({
        sessionId: session.simulationSessionId,
        cardId: currentCardId,
        revealProgress: questionRevealProgress,
        entryLineYPercent: currentLines.entry!,
        stopLossLineYPercent: currentLines.stopLoss!,
        takeProfitLineYPercent: currentLines.takeProfit!,
        rrValue: Number(rr.toFixed(4)),
        entryDirection: tradeSide,
        entryReason: entryReasonInput.trim(),
        replaySourceAttemptId: current.replaySourceAttemptId,
      });

      setAttemptsByCard((prev) => ({
        ...prev,
        [currentCardId]: [...(prev[currentCardId] || []), res.attempt],
      }));
      setCardMetricsMap((prev) => ({ ...prev, [currentCardId]: res.cardMetrics }));
      setEntryReasonInput("");
      setPreviewOpen(false);
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "保存模拟盘入场失败");
    } finally {
      setSavingAttempt(false);
    }
  }, [current, currentCardId, currentLines, entryReasonInput, errorAlert, questionRevealProgress, session]);

  const handleResolveAttempt = React.useCallback(async (attemptId: string) => {
    if (!currentCardId) return;
    const draft = resolutionDrafts[attemptId] || {
      result: "",
      failureReason: "",
      cardQualityScore: 5,
    };
    if (!draft.result) {
      errorAlert("请先选择这次尝试是成功还是失败");
      return;
    }
    if (draft.result === "FAILURE" && !draft.failureReason.trim()) {
      errorAlert("失败时必须填写失败原因");
      return;
    }

    setResolvingAttemptId(attemptId);
    try {
      const res = await resolveFlashcardSimulationAttempt({
        attemptId,
        result: draft.result,
        failureReason: draft.result === "FAILURE" ? draft.failureReason.trim() : undefined,
        cardQualityScore: draft.cardQualityScore as 1 | 2 | 3 | 4 | 5,
      });

      setAttemptsByCard((prev) => ({
        ...prev,
        [currentCardId]: (prev[currentCardId] || []).map((attempt) =>
          attempt.attemptId === attemptId
            ? {
                ...attempt,
                status: "RESOLVED",
                result: res.result,
                failureReason: draft.result === "FAILURE" ? draft.failureReason.trim() : undefined,
                cardQualityScore: draft.cardQualityScore,
                resolvedAt: new Date().toISOString(),
              }
            : attempt,
        ),
      }));
      setRunningStats(res.runningStats);
      setCardMetricsMap((prev) => ({ ...prev, [currentCardId]: res.cardMetrics }));
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "保存模拟盘结果失败");
    } finally {
      setResolvingAttemptId(null);
    }
  }, [currentCardId, errorAlert, resolutionDrafts]);

  const handleFinish = React.useCallback(async () => {
    if (!session) return;
    setFinishing(true);
    try {
      const finished = await finishFlashcardSimulationSession(session.simulationSessionId);
      setFinalStats({
        completedAttemptCount: finished.completedAttemptCount,
        successCount: finished.successCount,
        failureCount: finished.failureCount,
        successRate: finished.successRate,
      });
      clearFlashcardSimulationSession();
      setIndex(cards.length);
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "结束模拟盘训练失败");
    } finally {
      setFinishing(false);
    }
  }, [cards.length, errorAlert, session]);

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
      <TradePageShell title="闪卡模拟盘训练完成" subtitle="标准模式最小闭环已完成" showAddButton={false}>
        <div className="space-y-4 rounded-xl border border-[#27272a] bg-[#121212] p-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-4">
              <div className="text-xs text-[#9ca3af]">已闭环尝试数</div>
              <div className="mt-2 text-2xl font-semibold text-[#e5e7eb]">{finalStats?.completedAttemptCount ?? runningStats?.completedCount ?? 0}</div>
            </div>
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

  return (
    <TradePageShell title="闪卡模拟盘训练" subtitle={`第 ${index + 1} / ${cards.length} 题 · ${session.mode === "ATTEMPT_REPLAY" ? "历史点位快速复训" : "标准推演模式"}`} showAddButton={false}>
      <div className="space-y-6">
        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-5">
          {session.mode === "ATTEMPT_REPLAY" ? (
            <div className="mb-4 rounded-xl border border-[#00c2b2]/30 bg-[#0f1f1d] p-4">
              <div className="text-sm font-medium text-[#e5e7eb]">当前是历史点位快速复训模式</div>
              <div className="mt-1 text-xs text-[#9ca3af]">
                已自动把题目定位到历史保存的蒙层点位。你可以直接基于这个位置继续推演、重画三条线，并保存新的 attempt。
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-4">
                <div className="rounded-lg border border-[#27272a] bg-[#121212] p-3">
                  <div className="text-xs text-[#9ca3af]">历史保存点位</div>
                  <div className="mt-2 text-sm font-medium text-[#e5e7eb]">
                    {typeof current.prefilledRevealProgress === "number"
                      ? `${Math.round(current.prefilledRevealProgress * 100)}%`
                      : "--"}
                  </div>
                </div>
                <div className="rounded-lg border border-[#27272a] bg-[#121212] p-3">
                  <div className="text-xs text-[#9ca3af]">历史方向</div>
                  <div className="mt-2 text-sm font-medium text-[#e5e7eb]">
                    {current.previousEntryDirection ? FLASHCARD_LABELS[current.previousEntryDirection] : "--"}
                  </div>
                </div>
                <div className="rounded-lg border border-[#27272a] bg-[#121212] p-3">
                  <div className="text-xs text-[#9ca3af]">历史 RR</div>
                  <div className="mt-2 text-sm font-medium text-[#e5e7eb]">
                    {typeof current.previousRrValue === "number" ? current.previousRrValue.toFixed(2) : "--"}
                  </div>
                </div>
                <div className="rounded-lg border border-[#27272a] bg-[#121212] p-3">
                  <div className="text-xs text-[#9ca3af]">历史结果</div>
                  <div className={`mt-2 text-sm font-medium ${current.previousAttemptResult === "SUCCESS" ? "text-[#22c55e]" : current.previousAttemptResult === "FAILURE" ? "text-[#ef4444]" : "text-[#e5e7eb]"}`}>
                    {current.previousAttemptResult === "SUCCESS"
                      ? "成功"
                      : current.previousAttemptResult === "FAILURE"
                        ? "失败"
                        : "--"}
                  </div>
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-[#27272a] bg-[#121212] p-3">
                  <div className="text-xs text-[#9ca3af]">历史入场理由</div>
                  <div className="mt-2 whitespace-pre-wrap text-sm text-[#e5e7eb]">
                    {current.previousEntryReason?.trim() || "--"}
                  </div>
                </div>
                <div className="rounded-lg border border-[#27272a] bg-[#121212] p-3">
                  <div className="text-xs text-[#9ca3af]">历史失败原因 / 来源 attemptId</div>
                  <div className="mt-2 whitespace-pre-wrap text-sm text-[#e5e7eb]">
                    {current.previousFailureReason?.trim() || "无失败原因记录"}
                  </div>
                  <div className="mt-3 break-all text-xs text-[#9ca3af]">
                    source: {current.replaySourceAttemptId || "--"}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-[#e5e7eb]">主页面默认只展示带蒙层的问题图</div>
              <div className="mt-1 text-xs text-[#9ca3af]">{session.mode === "ATTEMPT_REPLAY" ? "当前默认停在历史保存点位；你可以直接在这个位置继续复训，也可以继续滚轮微调后再入场。结果图片默认隐藏，手动点开再看。" : "滚轮推演到合适时机后，点击图片放大，在弹窗里保存一次入场尝试。结果图片默认隐藏，手动点开再看。"}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]" onClick={() => setAnswerVisible((prev) => !prev)}>
                {answerVisible ? "隐藏结果图" : "查看结果图"}
              </Button>
              <Button variant="outline" className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]" onClick={() => setPreviewOpen(true)}>放大并保存入场</Button>
            </div>
          </div>

          <button type="button" className="relative w-full overflow-hidden rounded border border-[#27272a] bg-black" onClick={() => setPreviewOpen(true)} onWheel={handleMainImageWheel}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.questionImageUrl} alt="question" className="max-h-[60vh] w-full object-contain" />
            <div
              className="pointer-events-none absolute inset-y-0 right-0 origin-right bg-[#050816]"
              style={{ width: "100%", transform: `scaleX(${Math.max(1 - questionRevealProgress, 0)})` }}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent px-3 py-3 text-xs text-white/85">
              <span>滚轮向下逐步揭开，向上重新遮住；点击放大图进入入场编辑</span>
              <span>{Math.round(questionRevealProgress * 100)}%</span>
            </div>
          </button>

          {answerVisible ? (
            <div className="mt-4 rounded-xl border border-[#27272a] bg-[#18181b] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-[#e5e7eb]">结果图片</div>
                  <div className="mt-1 text-xs text-[#9ca3af]">默认隐藏；需要时手动展开查看，可再次放大。</div>
                </div>
                <Button variant="outline" className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]" onClick={() => setAnswerPreviewOpen(true)}>
                  放大查看结果图
                </Button>
              </div>
              <button
                type="button"
                className="relative w-full overflow-hidden rounded border border-[#27272a] bg-black"
                onClick={() => setAnswerPreviewOpen(true)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={current.answerImageUrl} alt="answer" className="max-h-[45vh] w-full object-contain" />
              </button>
            </div>
          ) : null}

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3">
              <div className="text-xs text-[#9ca3af]">当前结构方向</div>
              <div className="mt-2 text-sm font-medium text-[#e5e7eb]">{currentTradeSide ? FLASHCARD_LABELS[currentTradeSide] : "未形成有效结构"}</div>
            </div>
            <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3">
              <div className="text-xs text-[#9ca3af]">当前 RR</div>
              <div className="mt-2 text-sm font-medium text-[#e5e7eb]">{currentRr !== null ? currentRr.toFixed(2) : "--"}</div>
            </div>
            <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3">
              <div className="text-xs text-[#9ca3af]">卡片平均质量分</div>
              <div className="mt-2 text-sm font-medium text-[#e5e7eb]">{typeof currentMetrics?.qualityScoreAvg === "number" && currentMetrics.qualityScoreAvg > 0 ? currentMetrics.qualityScoreAvg.toFixed(2) : (typeof current.qualityScoreAvg === "number" ? current.qualityScoreAvg.toFixed(2) : "5.00")}</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-[#e5e7eb]">当前卡已保存 attempts</div>
              <div className="mt-1 text-xs text-[#9ca3af]">先在弹窗里保存入场，再在这里为某条 attempt 保存最终结果。</div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]" onClick={() => setIndex((prev) => Math.min(prev + 1, cards.length))}>下一题</Button>
              <Button className="bg-[#00c2b2] text-black hover:bg-[#009e91]" onClick={handleFinish} disabled={finishing}>{finishing ? "结束中..." : "结束本轮训练"}</Button>
            </div>
          </div>

          {!currentAttempts.length ? (
            <div className="rounded-lg border border-dashed border-[#27272a] p-6 text-sm text-[#9ca3af]">
              这张卡还没有保存任何 attempt。先滚动主图，再放大图保存一条入场尝试。
            </div>
          ) : (
            <div className="space-y-4">
              {currentAttempts.map((attempt, idx) => {
                const draft = resolutionDrafts[attempt.attemptId] || { result: "", failureReason: "", cardQualityScore: 5 };
                const isResolved = attempt.status === "RESOLVED";
                return (
                  <div key={attempt.attemptId} className="rounded-lg border border-[#27272a] bg-[#18181b] p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-[#e5e7eb]">Attempt #{idx + 1}</div>
                        <div className="mt-1 text-xs text-[#9ca3af]">保存点位 {Math.round(attempt.revealProgress * 100)}% · RR {attempt.rrValue.toFixed(2)} · {FLASHCARD_LABELS[attempt.entryDirection]}{attempt.replaySourceAttemptId ? " · 基于历史点位复训" : ""}</div>
                      </div>
                      <div className={`text-xs font-medium ${isResolved ? (attempt.result === "SUCCESS" ? "text-[#22c55e]" : "text-[#ef4444]") : "text-[#fbbf24]"}`}>
                        {isResolved ? (attempt.result === "SUCCESS" ? "已判定成功" : "已判定失败") : "待保存结果"}
                      </div>
                    </div>

                    <div className="rounded-md border border-[#27272a] bg-[#121212] p-3 text-sm text-[#cbd5e1] whitespace-pre-wrap">{attempt.entryReason}</div>

                    {isResolved ? (
                      <div className="space-y-2 text-sm">
                        <div className="text-[#e5e7eb]">结果：{attempt.result === "SUCCESS" ? "成功" : "失败"}</div>
                        {attempt.failureReason ? <div className="text-[#9ca3af]">失败原因：{attempt.failureReason}</div> : null}
                        <div className="text-[#9ca3af]">质量评分：{attempt.cardQualityScore ?? 5}</div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Button type="button" variant={draft.result === "SUCCESS" ? "default" : "outline"} className={draft.result === "SUCCESS" ? "bg-[#22c55e] text-black hover:bg-[#16a34a]" : "border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]"} onClick={() => updateResolutionDraft(attempt.attemptId, { result: "SUCCESS" })}>成功</Button>
                          <Button type="button" variant={draft.result === "FAILURE" ? "default" : "outline"} className={draft.result === "FAILURE" ? "bg-[#ef4444] text-white hover:bg-[#dc2626]" : "border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]"} onClick={() => updateResolutionDraft(attempt.attemptId, { result: "FAILURE" })}>失败</Button>
                        </div>
                        {draft.result === "FAILURE" ? (
                          <Textarea value={draft.failureReason} onChange={(e) => updateResolutionDraft(attempt.attemptId, { failureReason: e.target.value })} className="min-h-[110px] border-[#27272a] bg-[#121212] text-[#e5e7eb]" placeholder="失败原因" />
                        ) : null}
                        <div>
                          <div className="mb-2 text-sm font-medium text-[#e5e7eb]">题目质量评分（默认 5）</div>
                          <Input type="number" min={1} max={5} value={draft.cardQualityScore} onChange={(e) => updateResolutionDraft(attempt.attemptId, { cardQualityScore: Math.min(5, Math.max(1, Number(e.target.value || 5))) })} className="w-28 border-[#27272a] bg-[#121212] text-[#e5e7eb]" />
                        </div>
                        <Button onClick={() => handleResolveAttempt(attempt.attemptId)} disabled={resolvingAttemptId === attempt.attemptId} className="bg-[#00c2b2] text-black hover:bg-[#009e91]">
                          {resolvingAttemptId === attempt.attemptId ? "保存中..." : "保存本次结果"}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {runningStats ? (
          <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4 text-sm text-[#9ca3af]">
            当前已闭环 {runningStats.completedCount} 次尝试，成功 {runningStats.successCount}，失败 {runningStats.failureCount}，成功率 {Math.round(runningStats.successRate * 100)}%
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
          footer={
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <div className="flex-1">
                <div className="mb-2 text-sm font-medium text-[#e5e7eb]">本次入场理由</div>
                <Textarea value={entryReasonInput} onChange={(e) => setEntryReasonInput(e.target.value)} className="min-h-[100px] border-[#27272a] bg-[#18181b] text-[#e5e7eb]" placeholder={session.mode === "ATTEMPT_REPLAY" ? "基于这个历史点位，这次你为什么还会 / 不会这么入场？" : "这一次为什么在这个蒙层位置入场？"} />
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]" onClick={() => setPreviewOpen(false)}>关闭弹窗</Button>
                <Button className="bg-[#00c2b2] text-black hover:bg-[#009e91]" onClick={handleSaveAttempt} disabled={savingAttempt}>{savingAttempt ? "保存中..." : "保存入场"}</Button>
              </div>
            </div>
          }
        />
      ) : null}

      {answerPreviewOpen ? (
        <ImagePreviewDialog
          previewUrl={current.answerImageUrl}
          onClose={() => setAnswerPreviewOpen(false)}
        />
      ) : null}
    </TradePageShell>
  );
}
