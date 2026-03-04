"use client";

import React from "react";
import Link from "next/link";
import TradePageShell from "../../../components/trade-page-shell";
import { Button } from "@/components/ui/button";
import {
  clearFlashcardSession,
  getFlashcardSession,
  type FlashcardDrillSession,
} from "@/store/flashcard-session";
import { FLASHCARD_LABELS } from "../../types";
import { ImagePreviewDialog } from "../../components/ImagePreviewDialog";

export default function FlashcardDrillPlayPage() {
  const [session, setSession] = React.useState<FlashcardDrillSession | null>(null);
  const [index, setIndex] = React.useState(0);
  const [revealed, setRevealed] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    setSession(getFlashcardSession());
  }, []);

  const cards = session?.cards || [];
  const total = cards.length;
  const current = cards[index];
  const isCompleted = total > 0 && index >= total;

  const handleAdvance = React.useCallback(() => {
    if (!cards.length || isCompleted) return;

    if (!revealed) {
      setRevealed(true);
      return;
    }

    if (index + 1 >= cards.length) {
      setIndex(cards.length);
      setRevealed(false);
      return;
    }

    setIndex((prev) => prev + 1);
    setRevealed(false);
  }, [cards.length, index, isCompleted, revealed]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      event.preventDefault();
      handleAdvance();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleAdvance]);

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
        <div className="w-full rounded-xl border border-[#27272a] bg-[#121212] p-6 text-center text-[#9ca3af] shadow-sm">
          <div className="text-lg font-semibold text-white">训练完成</div>
          <div className="mt-2">共完成 {total} 题。</div>
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
            <Link href="/trade/flashcard/drill/setup">
              <Button type="button" className="bg-[#00c2b2] text-black hover:bg-[#009e91]">
                再来一组
              </Button>
            </Link>
          </div>
        </div>
      </TradePageShell>
    );
  }

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
            <div className="mb-2 text-xs text-[#9ca3af]">Question Image</div>
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
            <div className="mb-2 text-xs text-[#9ca3af]">Answer Image</div>
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
                点击 Reveal Answer 或空格键揭晓
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4 shadow-sm">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded bg-[#1f2937] px-2 py-1 text-[#cbd5e1]">
              {FLASHCARD_LABELS[current.direction]}
            </span>
            <span className="rounded bg-[#1f2937] px-2 py-1 text-[#cbd5e1]">
              {FLASHCARD_LABELS[current.context]}
            </span>

            {revealed ? (
              <>
                <span className="rounded bg-[#1e1e1e] px-2 py-1 text-[#9ca3af] border border-[#27272a]">
                  {FLASHCARD_LABELS[current.orderFlowFeature]}
                </span>
                <span className="rounded bg-[#00c2b2]/15 px-2 py-1 text-[#00c2b2] border border-[#00c2b2]/30">
                  {FLASHCARD_LABELS[current.result]}
                </span>
              </>
            ) : null}
          </div>

          {revealed && current.notes ? (
            <div className="mt-3 rounded border border-[#27272a] bg-[#1e1e1e] p-3 text-sm text-[#e5e7eb]">
              {current.notes}
            </div>
          ) : null}
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleAdvance}
            className="bg-[#00c2b2] text-black hover:bg-[#009e91]"
          >
            {revealed ? "Next Card" : "Reveal Answer"}
          </Button>
        </div>
      </div>

      <ImagePreviewDialog previewUrl={previewUrl} onClose={() => setPreviewUrl(null)} />
    </TradePageShell>
  );
}
