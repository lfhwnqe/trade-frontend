"use client";

import React from "react";
import TradePageShell from "../../components/trade-page-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createFlashcardCard } from "../request";
import {
  FLASHCARD_CONTEXTS,
  FLASHCARD_DIRECTIONS,
  FLASHCARD_LABELS,
  FLASHCARD_ORDER_FLOW_FEATURES,
  FLASHCARD_RESULTS,
  type FlashcardContext,
  type FlashcardDirection,
  type FlashcardOrderFlowFeature,
  type FlashcardResult,
} from "../types";
import { useAlert } from "@/components/common/alert";
import { ImageUploader } from "@/components/common/ImageUploader";
import type { ImageResource } from "../../config";

export default function FlashcardCreatePage() {
  const [successAlert, errorAlert] = useAlert();

  const [questionImages, setQuestionImages] = React.useState<ImageResource[]>([]);
  const [answerImages, setAnswerImages] = React.useState<ImageResource[]>([]);
  const [direction, setDirection] = React.useState<FlashcardDirection | "">("");
  const [context, setContext] = React.useState<FlashcardContext | "">("");
  const [orderFlowFeature, setOrderFlowFeature] = React.useState<FlashcardOrderFlowFeature | "">("");
  const [result, setResult] = React.useState<FlashcardResult | "">("");
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const questionImageUrl = questionImages[0]?.url || "";
  const answerImageUrl = answerImages[0]?.url || "";

  const handleSubmit = React.useCallback(async () => {
    if (!questionImageUrl || !answerImageUrl || !direction || !context || !orderFlowFeature || !result) {
      errorAlert("请先填写全部必填项并上传两张图片");
      return;
    }

    setSubmitting(true);
    try {
      await createFlashcardCard({
        questionImageUrl,
        answerImageUrl,
        direction,
        context,
        orderFlowFeature,
        result,
        notes: notes.trim() || undefined,
      });

      setQuestionImages([]);
      setAnswerImages([]);
      setDirection("");
      setContext("");
      setOrderFlowFeature("");
      setResult("");
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
    context,
    direction,
    errorAlert,
    notes,
    orderFlowFeature,
    questionImageUrl,
    result,
    successAlert,
  ]);

  return (
    <TradePageShell
      title="闪卡录入"
      subtitle="题目图 + 答案图 + 标签，最快 15 秒/题"
      showAddButton={false}
    >
      <div className="w-full space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4 shadow-sm">
            <div className="mb-2 text-sm font-medium text-[#e5e7eb]">入场前截图（必填）</div>
            <ImageUploader value={questionImages} onChange={setQuestionImages} max={1} />
          </div>

          <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4 shadow-sm">
            <div className="mb-2 text-sm font-medium text-[#e5e7eb]">结果截图（必填）</div>
            <ImageUploader value={answerImages} onChange={setAnswerImages} max={1} />
          </div>
        </div>

        <div className="grid gap-4 rounded-xl border border-[#27272a] bg-[#121212] p-4 md:grid-cols-2 lg:grid-cols-3 shadow-sm">
          <div className="space-y-2">
            <div className="text-xs font-medium text-[#9ca3af]">方向（必填）</div>
            <Select value={direction} onValueChange={(v) => setDirection(v as FlashcardDirection)}>
              <SelectTrigger className="w-full h-9 bg-[#1e1e1e] border border-[#27272a] text-[#e5e7eb] focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400">
                <SelectValue placeholder="请选择" />
              </SelectTrigger>
              <SelectContent className="bg-[#121212] border border-[#27272a] text-[#e5e7eb]">
                {FLASHCARD_DIRECTIONS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {FLASHCARD_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-[#9ca3af]">1H 结构（必填）</div>
            <Select value={context} onValueChange={(v) => setContext(v as FlashcardContext)}>
              <SelectTrigger className="w-full h-9 bg-[#1e1e1e] border border-[#27272a] text-[#e5e7eb] focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400">
                <SelectValue placeholder="请选择" />
              </SelectTrigger>
              <SelectContent className="bg-[#121212] border border-[#27272a] text-[#e5e7eb]">
                {FLASHCARD_CONTEXTS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {FLASHCARD_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-[#9ca3af]">订单流特征（必填）</div>
            <Select
              value={orderFlowFeature}
              onValueChange={(v) => setOrderFlowFeature(v as FlashcardOrderFlowFeature)}
            >
              <SelectTrigger className="w-full h-9 bg-[#1e1e1e] border border-[#27272a] text-[#e5e7eb] focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400">
                <SelectValue placeholder="请选择" />
              </SelectTrigger>
              <SelectContent className="bg-[#121212] border border-[#27272a] text-[#e5e7eb]">
                {FLASHCARD_ORDER_FLOW_FEATURES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {FLASHCARD_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-[#9ca3af]">最终结果（必填）</div>
            <Select value={result} onValueChange={(v) => setResult(v as FlashcardResult)}>
              <SelectTrigger className="w-full h-9 bg-[#1e1e1e] border border-[#27272a] text-[#e5e7eb] focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400">
                <SelectValue placeholder="请选择" />
              </SelectTrigger>
              <SelectContent className="bg-[#121212] border border-[#27272a] text-[#e5e7eb]">
                {FLASHCARD_RESULTS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {FLASHCARD_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2 lg:col-span-3">
            <div className="text-xs font-medium text-[#9ca3af]">复盘笔记（选填）</div>
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
