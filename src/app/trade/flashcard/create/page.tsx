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
  FLASHCARD_DIRECTIONS,
  FLASHCARD_LABELS,
  FLASHCARD_SYSTEM_OUTCOME_TYPES,
  type FlashcardAction,
  type FlashcardDictionaryOptionItem,
  type FlashcardSystemOutcomeType,
} from "../types";
import { useAlert } from "@/components/common/alert";
import { ImageUploader } from "@/components/common/ImageUploader";
import type { ImageResource } from "../../config";
import { FlashcardChecklistGuide } from "../components/FlashcardChecklistGuide";
import { fetchFlashcardTagOptions, fetchPlaybookTypeOptions } from "../../dictionary";

const SYMBOL_PAIR_HISTORY_KEY = "flashcard-symbol-pair-history";

export default function FlashcardCreatePage() {
  const [successAlert, errorAlert] = useAlert();

  const [questionImages, setQuestionImages] = React.useState<ImageResource[]>([]);
  const [answerImages, setAnswerImages] = React.useState<ImageResource[]>([]);
  const [expectedAction, setExpectedAction] = React.useState<FlashcardAction | "">("");
  const [systemOutcomeType, setSystemOutcomeType] = React.useState<FlashcardSystemOutcomeType | "">("");
  const [earlyExitTag, setEarlyExitTag] = React.useState(false);
  const [earlyExitReason, setEarlyExitReason] = React.useState("");
  const [earlyExitImages, setEarlyExitImages] = React.useState<ImageResource[]>([]);
  const [orderFlowImages, setOrderFlowImages] = React.useState<ImageResource[]>([]);
  const [orderFlowRemark, setOrderFlowRemark] = React.useState("");
  const [marketTimeInfo, setMarketTimeInfo] = React.useState("");
  const [symbolPairInfo, setSymbolPairInfo] = React.useState<string>("");
  const [symbolPairOptions, setSymbolPairOptions] = React.useState<string[]>([
    ...TRADE_PERIOD_PRESETS,
  ]);
  const [playbookType, setPlaybookType] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [tagOptions, setTagOptions] = React.useState<Array<{ code: string; label: string; color?: string }>>([]);
  const [playbookTypeOptions, setPlaybookTypeOptions] = React.useState<FlashcardDictionaryOptionItem[]>([]);
  const [tagCodes, setTagCodes] = React.useState<string[]>([]);
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

  React.useEffect(() => {
    let mounted = true;
    fetchFlashcardTagOptions()
      .then((items) => {
        if (mounted) setTagOptions(items);
      })
      .catch(() => {
        if (mounted) setTagOptions([]);
      });
    fetchPlaybookTypeOptions()
      .then((items) => {
        if (mounted) setPlaybookTypeOptions(items);
      })
      .catch(() => {
        if (mounted) setPlaybookTypeOptions([]);
      });
    return () => {
      mounted = false;
    };
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
    const missingFields: string[] = [];
    if (!questionImageUrl) missingFields.push("入场前截图");
    if (!answerImageUrl) missingFields.push("入场后截图");
    if (!expectedAction) missingFields.push("标准动作");
    if (!systemOutcomeType) missingFields.push("系统结果分类");
    if (!marketTimeInfo.trim()) missingFields.push("行情时间信息");
    if (!symbolPairInfo.trim()) missingFields.push("币对信息");
    if (!playbookType) missingFields.push("剧本类型");

    if (missingFields.length > 0) {
      errorAlert(`请补全：${missingFields.join("、")}`);
      return;
    }

    if (earlyExitTag && !earlyExitReason.trim()) {
      errorAlert("如果标记为提前离场，请填写提前离场原因");
      return;
    }

    const nextExpectedAction = expectedAction as FlashcardAction;
    const nextSystemOutcomeType = systemOutcomeType as FlashcardSystemOutcomeType;

    setSubmitting(true);
    try {
      await createFlashcardCard({
        questionImageUrl,
        answerImageUrl,
        expectedAction: nextExpectedAction,
        systemOutcomeType: nextSystemOutcomeType,
        earlyExitTag,
        earlyExitReason: earlyExitTag ? earlyExitReason.trim() || undefined : undefined,
        earlyExitImageUrls: earlyExitTag
          ? earlyExitImages.map((item) => item.url).filter(Boolean)
          : undefined,
        orderFlowImageUrls: orderFlowImages.map((item) => item.url).filter(Boolean),
        orderFlowRemark: orderFlowRemark.trim() || undefined,
        marketTimeInfo: marketTimeInfo.trim() || undefined,
        symbolPairInfo: symbolPairInfo.trim() || undefined,
        playbookType: playbookType || undefined,
        notes: notes.trim() || undefined,
        tagCodes: tagCodes.length ? tagCodes : undefined,
      });

      rememberSymbolPair(symbolPairInfo);

      setQuestionImages([]);
      setAnswerImages([]);
      setExpectedAction("");
      setSystemOutcomeType("");
      setEarlyExitTag(false);
      setEarlyExitReason("");
      setEarlyExitImages([]);
      setOrderFlowImages([]);
      setOrderFlowRemark("");
      setMarketTimeInfo("");
      setSymbolPairInfo("");
      setPlaybookType("");
      setNotes("");
      setTagCodes([]);

      successAlert("闪卡保存成功");
    } catch (error) {
      const message = error instanceof Error ? error.message : "保存失败";
      errorAlert(message);
    } finally {
      setSubmitting(false);
    }
  }, [
    answerImageUrl,
    earlyExitImages,
    earlyExitReason,
    earlyExitTag,
    errorAlert,
    orderFlowImages,
    orderFlowRemark,
    expectedAction,
    systemOutcomeType,
    marketTimeInfo,
    notes,
    playbookType,
    questionImageUrl,
    rememberSymbolPair,
    symbolPairInfo,
    successAlert,
    tagCodes,
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
                    className={`cursor-pointer h-10 rounded-md border text-sm font-medium transition-colors ${
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
            <div className="text-xs font-medium text-[#9ca3af]">行情时间信息（必填）</div>
            <DateCalendarPicker
              analysisTime={marketTimeInfo}
              updateForm={(patch) => setMarketTimeInfo(patch.analysisTime)}
              showSeconds={false}
              placeholder="选择行情时间"
            />
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-[#9ca3af]">币对信息（必填）</div>
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
            <div className="text-xs font-medium text-[#9ca3af]">剧本类型（必填）</div>
            <Select
              value={playbookType}
              onValueChange={setPlaybookType}
            >
              <SelectTrigger className="cursor-pointer h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]">
                <SelectValue placeholder="选择剧本类型" />
              </SelectTrigger>
              <SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                {playbookTypeOptions.map((item) => (
                  <SelectItem key={item.code} value={item.code}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <div className="text-xs font-medium text-[#9ca3af]">字典标签（选填）</div>
            <div className="flex flex-wrap gap-2 rounded-xl border border-[#27272a] bg-[#1e1e1e] p-3">
              {tagOptions.length === 0 ? (
                <span className="text-xs text-[#9ca3af]">暂无可用 flashcard_tag，可先到后台字典管理中维护</span>
              ) : (
                tagOptions.map((item) => {
                  const active = tagCodes.includes(item.code);
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() =>
                        setTagCodes((prev) =>
                          prev.includes(item.code)
                            ? prev.filter((code) => code !== item.code)
                            : [...prev, item.code],
                        )
                      }
                      className={`cursor-pointer inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition ${
                        active
                          ? "border-[#00c2b2] bg-[#00c2b2]/20 text-[#00c2b2]"
                          : "border-[#27272a] bg-[#121212] text-[#e5e7eb] hover:bg-[#242424]"
                      }`}
                    >
                      {item.color ? (
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full border border-white/20"
                          style={{ backgroundColor: item.color }}
                        />
                      ) : null}
                      {item.label}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-[#9ca3af]">系统结果分类（必填）</div>
            <Select
              value={systemOutcomeType}
              onValueChange={(value) =>
                setSystemOutcomeType(value as FlashcardSystemOutcomeType)
              }
            >
              <SelectTrigger className="cursor-pointer h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]">
                <SelectValue placeholder="选择系统结果分类" />
              </SelectTrigger>
              <SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                {FLASHCARD_SYSTEM_OUTCOME_TYPES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {FLASHCARD_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 rounded-lg border border-[#27272a] bg-[#18181b] p-3 md:col-span-2">
            <label className="cursor-pointer flex items-center gap-3 text-sm text-[#e5e7eb]">
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
                className="cursor-pointer h-4 w-4 rounded border-[#3f3f46] bg-[#111827]"
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

          <div className="space-y-4 rounded-lg border border-[#27272a] bg-[#18181b] p-3 md:col-span-2">
            <div>
              <div className="text-xs font-medium text-[#9ca3af]">订单流图片（选填，最多 5 张）</div>
              <div className="mt-1 text-xs text-[#6b7280]">方便补充订单流截图、footprint 或成交量细节。</div>
            </div>
            <ImageUploader value={orderFlowImages} onChange={setOrderFlowImages} max={5} />
            <div className="space-y-2">
              <div className="text-xs font-medium text-[#9ca3af]">订单流备注（选填）</div>
              <Textarea
                value={orderFlowRemark}
                onChange={(event) => setOrderFlowRemark(event.target.value)}
                placeholder="记录这组订单流图想表达的关键信号"
                className="min-h-20 border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <FlashcardChecklistGuide />
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
