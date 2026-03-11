"use client";

import React from "react";
import TradePageShell from "../../components/trade-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateCalendarPicker } from "@/components/common/DateCalendarPicker";
import { createFlashcardCard } from "../request";
import { TRADE_PERIOD_PRESETS } from "../../config";
import {
  FLASHCARD_BEHAVIOR_SELECT_OPTION_GROUPS,
  FLASHCARD_DIRECTIONS,
  FLASHCARD_INVALIDATION_SELECT_OPTION_GROUPS,
  FLASHCARD_LABELS,
  FLASHCARD_SYSTEM_OUTCOME_TYPES,
  type FlashcardAction,
  type FlashcardBehaviorType,
  type FlashcardInvalidationType,
  type FlashcardSystemOutcomeType,
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
  const [systemOutcomeType, setSystemOutcomeType] = React.useState<FlashcardSystemOutcomeType | "">("");
  const [earlyExitTag, setEarlyExitTag] = React.useState(false);
  const [earlyExitReason, setEarlyExitReason] = React.useState("");
  const [earlyExitImages, setEarlyExitImages] = React.useState<ImageResource[]>([]);
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

    if (earlyExitTag && !earlyExitReason.trim()) {
      errorAlert("如果标记为提前离场，请填写提前离场原因");
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
        systemOutcomeType: systemOutcomeType || undefined,
        earlyExitTag,
        earlyExitReason: earlyExitTag ? earlyExitReason.trim() || undefined : undefined,
        earlyExitImageUrls: earlyExitTag
          ? earlyExitImages.map((item) => item.url).filter(Boolean)
          : undefined,
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
      setSystemOutcomeType("");
      setEarlyExitTag(false);
      setEarlyExitReason("");
      setEarlyExitImages([]);
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
    earlyExitImages,
    earlyExitReason,
    earlyExitTag,
    errorAlert,
    expectedAction,
    invalidationType,
    systemOutcomeType,
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
                {FLASHCARD_BEHAVIOR_SELECT_OPTION_GROUPS.map((group) => (
                  <React.Fragment key={group.label}>
                    <SelectSeparator />
                    <SelectGroup>
                      <SelectLabel>{group.label}</SelectLabel>
                      {group.items.map((item) => (
                        <SelectItem key={item} value={item}>
                          {FLASHCARD_LABELS[item]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </React.Fragment>
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
                {FLASHCARD_INVALIDATION_SELECT_OPTION_GROUPS.map((group) => (
                  <React.Fragment key={group.label}>
                    <SelectSeparator />
                    <SelectGroup>
                      <SelectLabel>{group.label}</SelectLabel>
                      {group.items.map((item) => (
                        <SelectItem key={item} value={item}>
                          {FLASHCARD_LABELS[item]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </React.Fragment>
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

          <div className="space-y-2">
            <div className="text-xs font-medium text-[#9ca3af]">系统结果分类（选填）</div>
            <Select
              value={systemOutcomeType || EMPTY_SELECT_VALUE}
              onValueChange={(value) =>
                setSystemOutcomeType(
                  value === EMPTY_SELECT_VALUE
                    ? ""
                    : (value as FlashcardSystemOutcomeType),
                )
              }
            >
              <SelectTrigger className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]">
                <SelectValue placeholder="未分类" />
              </SelectTrigger>
              <SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                <SelectItem value={EMPTY_SELECT_VALUE}>未分类</SelectItem>
                {FLASHCARD_SYSTEM_OUTCOME_TYPES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {FLASHCARD_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 rounded-lg border border-[#27272a] bg-[#18181b] p-3 md:col-span-2">
            <label className="flex items-center gap-3 text-sm text-[#e5e7eb]">
              <input
                type="checkbox"
                checked={earlyExitTag}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setEarlyExitTag(checked);
                  if (!checked) {
                    setEarlyExitReason("");
                    setEarlyExitImages([]);
                  }
                }}
                className="h-4 w-4 rounded border-[#3f3f46] bg-[#111827]"
              />
              <span>标记为提前离场题</span>
            </label>
            <div className="text-xs text-[#9ca3af]">
              用来记录“本来符合系统信号，但后续走势发展不如意，需要提前手动离场”的题。
            </div>
            {earlyExitTag ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-[#9ca3af]">提前离场原因（必填）</div>
                  <Textarea
                    value={earlyExitReason}
                    onChange={(event) => setEarlyExitReason(event.target.value)}
                    placeholder="例如：触发后没有扩张，回踩承接减弱，所以手动先离场"
                    className="min-h-20 border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-medium text-[#9ca3af]">提前离场截图（选填，最多 5 张）</div>
                  <ImageUploader value={earlyExitImages} onChange={setEarlyExitImages} max={5} />
                </div>
              </div>
            ) : null}
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
