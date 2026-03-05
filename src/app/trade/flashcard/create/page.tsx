"use client";

import React from "react";
import TradePageShell from "../../components/trade-page-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createFlashcardCard } from "../request";
import {
  FLASHCARD_DIRECTIONS,
  FLASHCARD_LABELS,
  type FlashcardAction,
} from "../types";
import { useAlert } from "@/components/common/alert";
import { ImageUploader } from "@/components/common/ImageUploader";
import type { ImageResource } from "../../config";

export default function FlashcardCreatePage() {
  const [successAlert, errorAlert] = useAlert();

  const [questionImages, setQuestionImages] = React.useState<ImageResource[]>([]);
  const [answerImages, setAnswerImages] = React.useState<ImageResource[]>([]);
  const [expectedAction, setExpectedAction] = React.useState<FlashcardAction | "">("");
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const questionImageUrl = questionImages[0]?.url || "";
  const answerImageUrl = answerImages[0]?.url || "";

  const handleSubmit = React.useCallback(async () => {
    if (!questionImageUrl || !answerImageUrl || !expectedAction) {
      errorAlert("请先填写全部必填项并上传两张图片");
      return;
    }

    setSubmitting(true);
    try {
      await createFlashcardCard({
        questionImageUrl,
        answerImageUrl,
        expectedAction,
        notes: notes.trim() || undefined,
      });

      setQuestionImages([]);
      setAnswerImages([]);
      setExpectedAction("");
      setNotes("");

      successAlert("闪卡保存成功");
    } catch (error) {
      const message = error instanceof Error ? error.message : "保存失败";
      errorAlert(message);
    } finally {
      setSubmitting(false);
    }
  }, [
    answerImageUrl,
    errorAlert,
    expectedAction,
    notes,
    questionImageUrl,
    successAlert,
  ]);

  return (
    <TradePageShell
      title="闪卡录入"
      subtitle="入场前图 + 入场后图 + 标准动作，最快 15 秒/题"
      showAddButton={false}
    >
      <div className="w-full space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4 shadow-sm">
            <div className="mb-2 text-sm font-medium text-[#e5e7eb]">入场前截图（必填）</div>
            <ImageUploader value={questionImages} onChange={setQuestionImages} max={1} />
          </div>

          <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4 shadow-sm">
            <div className="mb-2 text-sm font-medium text-[#e5e7eb]">入场后截图（必填）</div>
            <ImageUploader value={answerImages} onChange={setAnswerImages} max={1} />
          </div>
        </div>

        <div className="grid gap-4 rounded-xl border border-[#27272a] bg-[#121212] p-4 md:grid-cols-2 shadow-sm">
          <div className="space-y-2">
            <div className="text-xs font-medium text-[#9ca3af]">标准动作（必填）</div>
            <div className="grid grid-cols-3 gap-2">
              {FLASHCARD_DIRECTIONS.map((item) => {
                const isActive = expectedAction === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setExpectedAction(item as FlashcardAction)}
                    className={`h-10 rounded-md border text-sm font-medium transition-colors ${
                      isActive
                        ? "border-[#00c2b2] bg-[#00c2b2]/20 text-[#00c2b2]"
                        : "border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]"
                    }`}
                  >
                    {FLASHCARD_LABELS[item]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <div className="text-xs font-medium text-[#9ca3af]">题目备注（选填）</div>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="记录触发信号、执行偏差、后续改进"
              className="min-h-24 border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"
            />
          </div>
        </div>

        <div className="flex items-center justify-end">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-[#00c2b2] text-black hover:bg-[#009e91]"
          >
            {submitting ? "保存中..." : "保存并继续下一题"}
          </Button>
        </div>
      </div>
    </TradePageShell>
  );
}
