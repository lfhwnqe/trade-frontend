"use client";

import React from "react";
import TradePageShell from "../../components/trade-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateCalendarPicker } from "@/components/common/DateCalendarPicker";
import { createFlashcardCard } from "../request";
import { TRADE_PERIOD_PRESETS } from "../../config";
import {
  FLASHCARD_BEHAVIOR_TYPES,
  FLASHCARD_DIRECTIONS,
  FLASHCARD_INVALIDATION_TYPES,
  FLASHCARD_LABELS,
  type FlashcardAction,
  type FlashcardBehaviorType,
  type FlashcardInvalidationType,
} from "../types";
import { useAlert } from "@/components/common/alert";
import { ImageUploader } from "@/components/common/ImageUploader";
import type { ImageResource } from "../../config";
import { FlashcardFieldGuide } from "../components/FlashcardFieldGuide";

const SYMBOL_PAIR_HISTORY_KEY = "flashcard-symbol-pair-history";
const EMPTY_SELECT_VALUE = "__NONE__";

export default function FlashcardCreatePage() {
  const [successAlert, errorAlert] = useAlert();

  const [questionImages, setQuestionImages] = React.useState<ImageResource[]>([]);
  const [answerImages, setAnswerImages] = React.useState<ImageResource[]>([]);
  const [expectedAction, setExpectedAction] = React.useState<FlashcardAction | "">("");
  const [behaviorType, setBehaviorType] = React.useState<FlashcardBehaviorType | "">("");
  const [invalidationType, setInvalidationType] = React.useState<FlashcardInvalidationType | "">("");
  const [marketTimeInfo, setMarketTimeInfo] = React.useState("");
  const [symbolPairInfo, setSymbolPairInfo] = React.useState<string>("");
  const [symbolPairOptions, setSymbolPairOptions] = React.useState<string[]>([
    ...TRADE_PERIOD_PRESETS,
  ]);
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const questionImageUrl = questionImages[0]?.url || "";
  const answerImageUrl = answerImages[0]?.url || "";

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(SYMBOL_PAIR_HISTORY_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return;
      const history = parsed
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);
      const merged = Array.from(new Set([...TRADE_PERIOD_PRESETS, ...history]));
      setSymbolPairOptions(merged);
    } catch {}
  }, []);

  const rememberSymbolPair = React.useCallback((value: string) => {
    const nextValue = value.trim();
    if (!nextValue || typeof window === "undefined") return;

    setSymbolPairOptions((prev) => {
      const merged = Array.from(
        new Set([nextValue, ...prev, ...TRADE_PERIOD_PRESETS]),
      ).slice(0, 20);
      window.localStorage.setItem(SYMBOL_PAIR_HISTORY_KEY, JSON.stringify(merged));
      return merged;
    });
  }, []);

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
        behaviorType: behaviorType || undefined,
        invalidationType: invalidationType || undefined,
        marketTimeInfo: marketTimeInfo.trim() || undefined,
        symbolPairInfo: symbolPairInfo.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      rememberSymbolPair(symbolPairInfo);

      setQuestionImages([]);
      setAnswerImages([]);
      setExpectedAction("");
      setBehaviorType("");
      setInvalidationType("");
      setMarketTimeInfo("");
      setSymbolPairInfo("");
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
    behaviorType,
    errorAlert,
    expectedAction,
    invalidationType,
    marketTimeInfo,
    notes,
    questionImageUrl,
    rememberSymbolPair,
    symbolPairInfo,
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

          <div className="space-y-2">
            <div className="text-xs font-medium text-[#9ca3af]">行情时间信息（选填）</div>
            <DateCalendarPicker
              analysisTime={marketTimeInfo}
              updateForm={(patch) => setMarketTimeInfo(patch.analysisTime)}
              showSeconds={false}
              placeholder="选择行情时间"
            />
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-[#9ca3af]">行为类型（选填）</div>
            <Select
              value={behaviorType || EMPTY_SELECT_VALUE}
              onValueChange={(value) =>
                setBehaviorType(
                  value === EMPTY_SELECT_VALUE
                    ? ""
                    : (value as FlashcardBehaviorType),
                )
              }
            >
              <SelectTrigger className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]">
                <SelectValue placeholder="选择价格行为依据" />
              </SelectTrigger>
              <SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                <SelectItem value={EMPTY_SELECT_VALUE}>未设置</SelectItem>
                {FLASHCARD_BEHAVIOR_TYPES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {FLASHCARD_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-[#9ca3af]">失效类型（选填）</div>
            <Select
              value={invalidationType || EMPTY_SELECT_VALUE}
              onValueChange={(value) =>
                setInvalidationType(
                  value === EMPTY_SELECT_VALUE
                    ? ""
                    : (value as FlashcardInvalidationType),
                )
              }
            >
              <SelectTrigger className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]">
                <SelectValue placeholder="选择止损/失效逻辑" />
              </SelectTrigger>
              <SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                <SelectItem value={EMPTY_SELECT_VALUE}>未设置</SelectItem>
                {FLASHCARD_INVALIDATION_TYPES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {FLASHCARD_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-[#9ca3af]">币对信息（选填）</div>
            <Input
              value={symbolPairInfo}
              onChange={(event) => setSymbolPairInfo(event.target.value)}
              onBlur={(event) => rememberSymbolPair(event.target.value)}
              list="flashcard-symbol-pair-presets"
              placeholder="例：BTC/USDT"
              className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"
            />
            <datalist id="flashcard-symbol-pair-presets">
              {symbolPairOptions.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </div>

          <div className="md:col-span-2">
            <FlashcardFieldGuide
              behaviorType={behaviorType}
              invalidationType={invalidationType}
            />
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
