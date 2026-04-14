"use client";

import React from "react";
import Link from "next/link";
import TradePageShell from "../../../components/trade-page-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  clearFlashcardSession,
  getFlashcardSession,
  type FlashcardDrillSession,
} from "@/store/flashcard-session";
import {
  FLASHCARD_DIRECTIONS,
  FLASHCARD_LABELS,
  type FlashcardAction,
  type FlashcardDrillStats,
} from "../../types";
import { ImagePreviewDialog } from "../../components/ImagePreviewDialog";
import {
  finishFlashcardDrillSession,
  rateFlashcardCard,
  submitFlashcardDrillAttempt,
  updateFlashcardNote,
} from "../../request";
import { useAlert } from "@/components/common/alert";

const WHEEL_REVEAL_STEP = 0.00033;
const REVEAL_EPSILON = 0.001;

function clampRevealProgress(value: number) {
  return Math.min(1, Math.max(0, value));
}

function FlashcardQuestionReveal({
  src,
  revealProgress,
  onRevealProgressChange,
  onPreview,
}: {
  src: string;
  revealProgress: number;
  onRevealProgressChange: (next: number) => void;
  onPreview: () => void;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const maskRef = React.useRef<HTMLDivElement | null>(null);
  const frameRef = React.useRef<number | null>(null);
  const currentRevealRef = React.useRef(revealProgress);
  const targetRevealRef = React.useRef(revealProgress);
  const [isHovered, setIsHovered] = React.useState(false);

  const syncMask = React.useCallback(
    (progress: number) => {
      const maskNode = maskRef.current;
      if (!maskNode) return;
      const hiddenRatio = 1 - progress;
      maskNode.style.transform = `scaleX(${Math.max(hiddenRatio, 0)})`;
      onRevealProgressChange(progress);
    },
    [onRevealProgressChange],
  );

  const animateReveal = React.useCallback(() => {
    const current = currentRevealRef.current;
    const target = targetRevealRef.current;
    const delta = target - current;

    if (Math.abs(delta) <= REVEAL_EPSILON) {
      currentRevealRef.current = target;
      syncMask(target);
      frameRef.current = null;
      return;
    }

    const next = current + delta * 0.18;
    currentRevealRef.current = next;
    syncMask(next);
    frameRef.current = window.requestAnimationFrame(animateReveal);
  }, [syncMask]);

  const ensureAnimation = React.useCallback(() => {
    if (frameRef.current !== null) return;
    frameRef.current = window.requestAnimationFrame(animateReveal);
  }, [animateReveal]);

  React.useEffect(() => {
    currentRevealRef.current = 0;
    targetRevealRef.current = 0;
    syncMask(0);
  }, [src, syncMask]);

  React.useEffect(() => {
    currentRevealRef.current = revealProgress;
    targetRevealRef.current = revealProgress;
    syncMask(revealProgress);
  }, [revealProgress, syncMask]);

  React.useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const onWheel = (event: WheelEvent) => {
      if (!isHovered) return;
      event.preventDefault();
      const direction = Math.sign(event.deltaY);
      if (!direction) return;

      const nextTarget = clampRevealProgress(
        targetRevealRef.current + direction * WHEEL_REVEAL_STEP * Math.max(Math.abs(event.deltaY), 12),
      );
      targetRevealRef.current = nextTarget;
      ensureAnimation();
    };

    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [ensureAnimation, isHovered]);

  return (
    <div className="space-y-2">
      <button type="button" className="w-full" onClick={onPreview}>
        <div
          ref={containerRef}
          className="group relative overflow-hidden rounded bg-[#050816]"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="question" className="max-h-[70vh] w-full rounded object-contain" />
          <div
            ref={maskRef}
            className="pointer-events-none absolute inset-y-0 right-0 origin-right rounded-r bg-[#050816]"
            style={{ width: "100%", transform: "scaleX(1)", willChange: "transform" }}
          >
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 via-black/20 to-transparent px-3 py-3 text-xs text-white/85">
            <span>{isHovered ? "滚轮向下逐步揭开，向上重新遮住" : "悬停后可滚轮推演 K 线"}</span>
            <span>{Math.round(revealProgress * 100)}%</span>
          </div>
        </div>
      </button>
      <div className="flex items-center justify-between text-xs text-[#6b7280]">
        <span>从左到右逐步显示真实图片，适合按时间顺序训练盘感</span>
        <span>点击图片可放大</span>
      </div>
    </div>
  );
}

export default function FlashcardDrillPlayPage() {
  const [, errorAlert] = useAlert();

  const [session, setSession] = React.useState<FlashcardDrillSession | null>(null);
  const [index, setIndex] = React.useState(0);
  const [revealed, setRevealed] = React.useState(false);
  const [questionRevealProgress, setQuestionRevealProgress] = React.useState(0);
  const [previewState, setPreviewState] = React.useState<{
    url: string;
    answerUrl?: string | null;
    revealEnabled: boolean;
    priceLineEditorEnabled: boolean;
  } | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [finishing, setFinishing] = React.useState(false);
  const [selectedAction, setSelectedAction] = React.useState<FlashcardAction | "">("");
  const [runningStats, setRunningStats] = React.useState<FlashcardDrillStats | null>(
    null,
  );
  const [finalScore, setFinalScore] = React.useState<number | null>(null);
  const [attemptResults, setAttemptResults] = React.useState<
    Record<string, { isCorrect: boolean; expectedAction: FlashcardAction }>
  >({});
  const [favoriteMap, setFavoriteMap] = React.useState<Record<string, boolean>>({});
  const [noteMap, setNoteMap] = React.useState<Record<string, string>>({});
  const [ratingMap, setRatingMap] = React.useState<Record<string, number>>({});
  const [ratingSubmittingMap, setRatingSubmittingMap] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const loaded = getFlashcardSession();
    if (!loaded) return;

    setSession(loaded);
    const initialNotes = loaded.cards.reduce<Record<string, string>>((acc, card) => {
      acc[card.cardId] = card.notes || "";
      return acc;
    }, {});
    setNoteMap(initialNotes);
  }, []);

  React.useEffect(() => {
    setQuestionRevealProgress(0);
    setPreviewState(null);
  }, [index]);

  const cards = session?.cards || [];
  const total = cards.length;
  const current = cards[index];
  const isCompleted = total > 0 && index >= total;
  const answeredCount = runningStats?.answered ?? 0;
  const correctCount = runningStats?.correct ?? 0;
  const displayedScore =
    finalScore ??
    runningStats?.score ??
    Math.round((correctCount / Math.max(answeredCount, 1)) * 100);

  const handleSubmitCurrent = React.useCallback(async () => {
    if (!session || !current || !selectedAction) {
      errorAlert("请先选择本题动作");
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitFlashcardDrillAttempt({
        sessionId: session.sessionId,
        cardId: current.cardId,
        userAction: selectedAction,
        isFavorite: !!favoriteMap[current.cardId],
        note: noteMap[current.cardId] || undefined,
      });

      setAttemptResults((prev) => ({
        ...prev,
        [current.cardId]: {
          isCorrect: res.isCorrect,
          expectedAction: res.expectedAction,
        },
      }));
      setRunningStats(res.runningStats);
      setRevealed(true);
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  }, [
    current,
    errorAlert,
    favoriteMap,
    noteMap,
    selectedAction,
    session,
  ]);

  const handleNext = React.useCallback(() => {
    if (index + 1 >= cards.length) {
      setIndex(cards.length);
      setRevealed(false);
      return;
    }

    setIndex((prev) => prev + 1);
    setRevealed(false);
    setSelectedAction("");
  }, [cards.length, index]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      if (previewState) return;
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      if (
        target?.isContentEditable ||
        tagName === "textarea" ||
        tagName === "input" ||
        tagName === "select"
      ) {
        return;
      }
      event.preventDefault();

      if (!revealed) {
        if (!submitting) {
          void handleSubmitCurrent();
        }
        return;
      }

      handleNext();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleNext, handleSubmitCurrent, previewState, revealed, submitting]);

  React.useEffect(() => {
    if (!session || !isCompleted || finalScore !== null || finishing) return;

    let cancelled = false;

    const run = async () => {
      setFinishing(true);
      try {
        const res = await finishFlashcardDrillSession(session.sessionId);
        if (cancelled) return;
        setFinalScore(res.score);
        setRunningStats(res.stats);
      } catch (error) {
        if (!cancelled) {
          errorAlert(error instanceof Error ? error.message : "结束练习失败");
        }
      } finally {
        if (!cancelled) {
          setFinishing(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [errorAlert, finalScore, finishing, isCompleted, session]);

  const handleSaveNote = React.useCallback(
    async (cardId: string) => {
      const nextNote = (noteMap[cardId] || "").trim();
      try {
        await updateFlashcardNote(cardId, nextNote);
      } catch (error) {
        errorAlert(error instanceof Error ? error.message : "保存备注失败");
      }
    },
    [errorAlert, noteMap],
  );

  const handleRateCard = React.useCallback(
    async (cardId: string, score: number) => {
      setRatingSubmittingMap((prev) => ({ ...prev, [cardId]: true }));
      try {
        await rateFlashcardCard(cardId, score);
        setRatingMap((prev) => ({ ...prev, [cardId]: score }));
      } catch (error) {
        errorAlert(error instanceof Error ? error.message : "闪卡评分失败");
      } finally {
        setRatingSubmittingMap((prev) => ({ ...prev, [cardId]: false }));
      }
    },
    [errorAlert],
  );

  const toggleFavorite = React.useCallback(
    async (cardId: string) => {
      const next = !favoriteMap[cardId];
      setFavoriteMap((prev) => ({ ...prev, [cardId]: next }));

      if (!session) return;

      try {
        await submitFlashcardDrillAttempt({
          sessionId: session.sessionId,
          cardId,
          userAction:
            attemptResults[cardId]?.expectedAction || selectedAction || "NO_TRADE",
          isFavorite: next,
        });
      } catch (error) {
        errorAlert(error instanceof Error ? error.message : "更新收藏失败");
        setFavoriteMap((prev) => ({ ...prev, [cardId]: !next }));
      }
    },
    [attemptResults, errorAlert, favoriteMap, selectedAction, session],
  );

  if (!session || cards.length === 0) {
    return (
      <TradePageShell title="闪卡练习" subtitle="当前没有可练习会话" showAddButton={false}>
        <div className="w-full rounded-xl border border-[#27272a] bg-[#121212] p-6 text-center text-[#9ca3af] shadow-sm">
          <div>还没有训练会话，请先到设置页抽题。</div>
          <div className="mt-4">
            <Link href="/trade/flashcard/drill/setup" className="text-[#00c2b2] hover:underline">
              前往练习设置
            </Link>
          </div>
        </div>
      </TradePageShell>
    );
  }

  if (isCompleted) {
    return (
      <TradePageShell title="闪卡练习" subtitle="本轮训练已完成" showAddButton={false}>
        <div className="w-full space-y-4">
          <div className="rounded-xl border border-[#27272a] bg-[#121212] p-6 text-center text-[#9ca3af] shadow-sm">
            <div className="text-lg font-semibold text-white">训练完成</div>
            <div className="mt-2">共完成 {total} 题。</div>
            <div className="mt-2 text-[#00c2b2]">本次分数：{displayedScore} 分</div>
            <div className="mt-2 text-sm text-[#cbd5e1]">
              正确 {runningStats?.correct ?? 0} / {runningStats?.answered ?? 0}，正确率
              {` ${Math.round((runningStats?.accuracy ?? 0) * 100)}%`}
            </div>
            <div className="mt-6 flex justify-center gap-3">
              <Button
                type="button"
                onClick={() => {
                  clearFlashcardSession();
                  setSession(null);
                }}
                className="bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#232323]"
              >
                清空会话
              </Button>
              <Link href="/trade/flashcard/drill/history">
                <Button type="button" className="bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#262626]">
                  查看训练成绩
                </Button>
              </Link>
              <Link href="/trade/flashcard/drill/setup">
                <Button type="button" className="bg-[#00c2b2] text-black hover:bg-[#009e91]">
                  再来一组
                </Button>
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4 shadow-sm">
            <div className="mb-3 text-sm font-medium text-white">题目备注复盘</div>
            <div className="space-y-3">
              {cards.map((card, i) => (
                <div key={card.cardId} className="rounded border border-[#27272a] bg-[#1e1e1e] p-3">
                  <div className="mb-2 text-xs text-[#9ca3af]">第 {i + 1} 题</div>
                  <Textarea
                    value={noteMap[card.cardId] || ""}
                    onChange={(event) =>
                      setNoteMap((prev) => ({
                        ...prev,
                        [card.cardId]: event.target.value,
                      }))
                    }
                    className="min-h-20 border-[#27272a] bg-[#121212] text-[#e5e7eb]"
                  />
                  <div className="mt-2 flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      className="bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#262626]"
                      onClick={() => void handleSaveNote(card.cardId)}
                    >
                      保存备注
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </TradePageShell>
    );
  }

  const currentAttempt = current ? attemptResults[current.cardId] : undefined;

  return (
    <TradePageShell
      title="闪卡练习"
      subtitle={`第 ${index + 1}/${total} 题 · ${revealed ? "揭晓态" : "思考态"}`}
      showAddButton={false}
    >
      <div className="w-full space-y-4">
        <div className="h-2 overflow-hidden rounded-full bg-[#1f2937]">
          <div
            className="h-full bg-[#00c2b2] transition-all"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-[#27272a] bg-[#121212] p-3 shadow-sm">
            <div className="mb-2 text-xs text-[#9ca3af]">题目图</div>
            <FlashcardQuestionReveal
              src={current.questionImageUrl}
              revealProgress={questionRevealProgress}
              onRevealProgressChange={setQuestionRevealProgress}
              onPreview={() =>
                setPreviewState({
                  url: current.questionImageUrl,
                  answerUrl: current.answerImageUrl,
                  revealEnabled: true,
                  priceLineEditorEnabled: true,
                })
              }
            />
          </div>

          <div className="rounded-xl border border-[#27272a] bg-[#121212] p-3 shadow-sm">
            <div className="mb-2 text-xs text-[#9ca3af]">答案图</div>
            {revealed ? (
              <button
                type="button"
                className="w-full"
                onClick={() =>
                  setPreviewState({
                    url: current.answerImageUrl,
                    revealEnabled: false,
                    priceLineEditorEnabled: false,
                  })
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={current.answerImageUrl}
                  alt="answer"
                  className="max-h-[70vh] w-full rounded object-contain"
                />
              </button>
            ) : (
              <div className="flex h-[260px] items-center justify-center rounded border border-dashed border-[#27272a] text-sm text-[#9ca3af] bg-[#1e1e1e]">
                先选择你的动作，再揭晓答案
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4 shadow-sm space-y-3">
          <div className="text-xs text-[#9ca3af]">你的动作</div>
          <div className="grid grid-cols-3 gap-2">
            {FLASHCARD_DIRECTIONS.map((item) => {
              const isActive = selectedAction === item;
              return (
                <button
                  key={item}
                  type="button"
                  disabled={revealed}
                  onClick={() => setSelectedAction(item as FlashcardAction)}
                  className={`h-10 rounded-md border text-sm font-medium transition-colors ${
                    isActive
                      ? "border-[#00c2b2] bg-[#00c2b2]/20 text-[#00c2b2]"
                      : "border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]"
                  } ${revealed ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  {FLASHCARD_LABELS[item]}
                </button>
              );
            })}
          </div>

          {revealed ? (
            <>
              <div className="text-sm text-[#cbd5e1]">
                标准动作：
                <span className="ml-1 text-[#00c2b2]">
                  {FLASHCARD_LABELS[
                    currentAttempt?.expectedAction ||
                      current.expectedAction ||
                      current.direction ||
                      "NO_TRADE"
                  ]}
                </span>
              </div>
              <div className="text-sm">
                判定：
                <span
                  className={`ml-1 ${currentAttempt?.isCorrect ? "text-emerald-400" : "text-rose-400"}`}
                >
                  {currentAttempt?.isCorrect ? "正确" : "错误"}
                </span>
              </div>
              {(current.behaviorType || current.invalidationType || current.systemOutcomeType) ? (
                <div className="flex flex-wrap gap-2">
                  {current.behaviorType ? (
                    <span className="inline-flex items-center rounded-full border border-sky-400/20 bg-sky-400/10 px-2 py-0.5 text-xs text-sky-200">
                      行为: {FLASHCARD_LABELS[current.behaviorType]}
                    </span>
                  ) : null}
                  {current.invalidationType ? (
                    <span className="inline-flex items-center rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-xs text-amber-200">
                      失效: {FLASHCARD_LABELS[current.invalidationType]}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-200">
                    系统结果: {current.systemOutcomeType ? FLASHCARD_LABELS[current.systemOutcomeType] : FLASHCARD_LABELS.FLASHCARD_SYSTEM_OUTCOME_UNSET}
                  </span>
                </div>
              ) : null}
              <div className="flex gap-2">
                <Link href={`/trade/flashcard/${current.cardId}`}>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#262626]"
                  >
                    查看详情
                  </Button>
                </Link>
                <Button
                  type="button"
                  size="sm"
                  className="bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#262626]"
                  onClick={() => void toggleFavorite(current.cardId)}
                >
                  {favoriteMap[current.cardId] ? "取消收藏" : "收藏本题"}
                </Button>
              </div>
              <div className="space-y-2 rounded-lg border border-[#27272a] bg-[#18181b] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs text-[#9ca3af]">给这张闪卡打分</div>
                    <div className="mt-1 text-sm text-[#cbd5e1]">
                      复用管理页平均评分口径，当前显示 {typeof current.qualityScoreAvg === "number" ? current.qualityScoreAvg.toFixed(2) : "5.00"}
                    </div>
                  </div>
                  <div className="text-xs text-[#9ca3af]">
                    {ratingMap[current.cardId] ? `本次已打 ${ratingMap[current.cardId]} 分` : "未打分"}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((score) => {
                    const isActive = ratingMap[current.cardId] === score;
                    return (
                      <Button
                        key={score}
                        type="button"
                        size="sm"
                        disabled={ratingSubmittingMap[current.cardId]}
                        onClick={() => void handleRateCard(current.cardId, score)}
                        className={isActive
                          ? "bg-[#00c2b2] text-black hover:bg-[#00b3a4]"
                          : "bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#262626]"}
                      >
                        {score} 分
                      </Button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}
          <div className="space-y-2">
            <div className="text-xs text-[#9ca3af]">
              闪卡备注{revealed ? "（可编辑）" : "（内容已隐藏，提交后显示）"}
            </div>
            {revealed ? (
              <>
                <Textarea
                  value={noteMap[current.cardId] || ""}
                  onChange={(event) =>
                    setNoteMap((prev) => ({
                      ...prev,
                      [current.cardId]: event.target.value,
                    }))
                  }
                  placeholder="记录本题复盘要点"
                  className="min-h-20 border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    className="bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#262626]"
                    onClick={() => void handleSaveNote(current.cardId)}
                  >
                    保存备注
                  </Button>
                </div>
              </>
            ) : (
              <div className="rounded-md border border-dashed border-[#27272a] bg-[#1e1e1e] px-3 py-3 text-sm text-[#9ca3af]">
                ********（提交本题后展示）
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-[#9ca3af]">
            已答 {runningStats?.answered || 0}/{runningStats?.total || total}，当前分数 {runningStats?.score || 0}
          </div>
          <Button
            type="button"
            disabled={submitting || (!revealed && !selectedAction)}
            onClick={() => {
              if (!revealed) {
                void handleSubmitCurrent();
                return;
              }
              handleNext();
            }}
            className="bg-[#00c2b2] text-black hover:bg-[#009e91]"
          >
            {submitting ? "提交中..." : revealed ? "下一题" : "揭晓答案"}
          </Button>
        </div>
      </div>

      <ImagePreviewDialog
        previewUrl={previewState?.url ?? null}
        answerPreviewUrl={previewState?.answerUrl ?? null}
        onClose={() => setPreviewState(null)}
        revealProgress={previewState?.revealEnabled ? questionRevealProgress : undefined}
        onRevealProgressChange={previewState?.revealEnabled ? setQuestionRevealProgress : undefined}
        priceLineEditorEnabled={previewState?.priceLineEditorEnabled}
      />
    </TradePageShell>
  );
}
