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
  submitFlashcardDrillAttempt,
  updateFlashcardNote,
} from "../../request";
import { useAlert } from "@/components/common/alert";

export default function FlashcardDrillPlayPage() {
  const [, errorAlert] = useAlert();

  const [session, setSession] = React.useState<FlashcardDrillSession | null>(null);
  const [index, setIndex] = React.useState(0);
  const [revealed, setRevealed] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
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

  const cards = session?.cards || [];
  const total = cards.length;
  const current = cards[index];
  const isCompleted = total > 0 && index >= total;

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
  }, [handleNext, handleSubmitCurrent, revealed, submitting]);

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
            <div className="mt-2 text-[#00c2b2]">本次分数：{finalScore ?? 0} 分</div>
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
            <button
              type="button"
              className="w-full"
              onClick={() => setPreviewUrl(current.questionImageUrl)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.questionImageUrl}
                alt="question"
                className="max-h-[70vh] w-full rounded object-contain"
              />
            </button>
          </div>

          <div className="rounded-xl border border-[#27272a] bg-[#121212] p-3 shadow-sm">
            <div className="mb-2 text-xs text-[#9ca3af]">答案图</div>
            {revealed ? (
              <button
                type="button"
                className="w-full"
                onClick={() => setPreviewUrl(current.answerImageUrl)}
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
                  {FLASHCARD_LABELS[currentAttempt?.expectedAction || current.expectedAction || current.direction]}
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
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#262626]"
                  onClick={() => void toggleFavorite(current.cardId)}
                >
                  {favoriteMap[current.cardId] ? "取消收藏" : "收藏本题"}
                </Button>
              </div>
            </>
          ) : null}
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

      <ImagePreviewDialog previewUrl={previewUrl} onClose={() => setPreviewUrl(null)} />
    </TradePageShell>
  );
}
