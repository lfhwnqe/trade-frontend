"use client";

import React from "react";
import { useRouter } from "next/navigation";
import TradePageShell from "../../../components/trade-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAlert } from "@/components/common/alert";
import { randomFlashcardCards } from "../../request";
import {
  FLASHCARD_CONTEXTS,
  FLASHCARD_DIRECTIONS,
  FLASHCARD_LABELS,
  FLASHCARD_ORDER_FLOW_FEATURES,
  FLASHCARD_RESULTS,
  type FlashcardContext,
  type FlashcardDirection,
  type FlashcardFilters,
  type FlashcardOrderFlowFeature,
  type FlashcardResult,
} from "../../types";
import { saveFlashcardSession } from "@/store/flashcard-session";

type OptionValue<T extends string> = T | "all";

export default function FlashcardDrillSetupPage() {
  const router = useRouter();
  const [successAlert, errorAlert] = useAlert();

  const [direction, setDirection] = React.useState<OptionValue<FlashcardDirection>>("all");
  const [context, setContext] = React.useState<OptionValue<FlashcardContext>>("all");
  const [orderFlowFeature, setOrderFlowFeature] = React.useState<OptionValue<FlashcardOrderFlowFeature>>("all");
  const [result, setResult] = React.useState<OptionValue<FlashcardResult>>("all");
  const [count, setCount] = React.useState(20);
  const [loading, setLoading] = React.useState(false);

  const handleStart = React.useCallback(async () => {
    setLoading(true);
    try {
      const filters: FlashcardFilters = {};
      if (direction !== "all") filters.direction = [direction];
      if (context !== "all") filters.context = [context];
      if (orderFlowFeature !== "all") filters.orderFlowFeature = [orderFlowFeature];
      if (result !== "all") filters.result = [result];

      const cards = await randomFlashcardCards({
        filters,
        count: Math.min(Math.max(count || 20, 1), 200),
      });

      if (!cards.length) {
        errorAlert("没有匹配的题目", "请调整筛选条件后重试");
        return;
      }

      saveFlashcardSession({
        cards,
        filters,
        count,
        startedAt: new Date().toISOString(),
      });
      successAlert(`已生成 ${cards.length} 张训练卡片`);
      router.push("/trade/flashcard/drill/play");
    } catch (error) {
      const message = error instanceof Error ? error.message : "生成练习失败";
      errorAlert(message);
    } finally {
      setLoading(false);
    }
  }, [
    context,
    count,
    direction,
    errorAlert,
    orderFlowFeature,
    result,
    router,
    successAlert,
  ]);

  return (
    <TradePageShell title="闪卡练习设置" subtitle="按标签筛题并生成训练会话" showAddButton={false}>
      <div className="w-full space-y-6">
        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-xs text-[#a7b0c0]">方向</div>
              <Select value={direction} onValueChange={(v) => setDirection(v as OptionValue<FlashcardDirection>)}>
                <SelectTrigger className="w-full h-9 bg-[#1e1e1e] border border-[#27272a] text-[#e5e7eb] focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400">
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent className="bg-[#121212] border border-[#27272a] text-[#e5e7eb]">
                  <SelectItem value="all">全部</SelectItem>
                  {FLASHCARD_DIRECTIONS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {FLASHCARD_LABELS[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-[#a7b0c0]">1H 结构</div>
              <Select value={context} onValueChange={(v) => setContext(v as OptionValue<FlashcardContext>)}>
                <SelectTrigger className="w-full h-9 bg-[#1e1e1e] border border-[#27272a] text-[#e5e7eb] focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400">
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent className="bg-[#121212] border border-[#27272a] text-[#e5e7eb]">
                  <SelectItem value="all">全部</SelectItem>
                  {FLASHCARD_CONTEXTS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {FLASHCARD_LABELS[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-[#a7b0c0]">订单流特征</div>
              <Select
                value={orderFlowFeature}
                onValueChange={(v) => setOrderFlowFeature(v as OptionValue<FlashcardOrderFlowFeature>)}
              >
                <SelectTrigger className="w-full h-9 bg-[#1e1e1e] border border-[#27272a] text-[#e5e7eb] focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400">
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent className="bg-[#121212] border border-[#27272a] text-[#e5e7eb]">
                  <SelectItem value="all">全部</SelectItem>
                  {FLASHCARD_ORDER_FLOW_FEATURES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {FLASHCARD_LABELS[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-[#a7b0c0]">结果</div>
              <Select value={result} onValueChange={(v) => setResult(v as OptionValue<FlashcardResult>)}>
                <SelectTrigger className="w-full h-9 bg-[#1e1e1e] border border-[#27272a] text-[#e5e7eb] focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400">
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent className="bg-[#121212] border border-[#27272a] text-[#e5e7eb]">
                  <SelectItem value="all">全部</SelectItem>
                  {FLASHCARD_RESULTS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {FLASHCARD_LABELS[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="text-xs text-[#a7b0c0]">抽题数量（默认 20）</div>
              <Input
                type="number"
                min={1}
                max={200}
                value={count}
                onChange={(event) => setCount(Number(event.target.value || 20))}
                className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              type="button"
              onClick={handleStart}
              disabled={loading}
              className="bg-[#00c2b2] text-black hover:bg-[#009e91]"
            >
              {loading ? "生成中..." : "开始练习"}
            </Button>
          </div>
        </div>
      </div>
    </TradePageShell>
  );
}
