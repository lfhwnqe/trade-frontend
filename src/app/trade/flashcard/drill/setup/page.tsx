"use client";

import React from "react";
import Link from "next/link";
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
import { startFlashcardDrillSession } from "../../request";
import {
  FLASHCARD_LABELS,
  FLASHCARD_SOURCES,
  type FlashcardSource,
} from "../../types";
import { saveFlashcardSession } from "@/store/flashcard-session";

export default function FlashcardDrillSetupPage() {
  const router = useRouter();
  const [successAlert, errorAlert] = useAlert();

  const [source, setSource] = React.useState<FlashcardSource>("ALL");
  const [count, setCount] = React.useState(20);
  const [loading, setLoading] = React.useState(false);

  const handleStart = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await startFlashcardDrillSession({
        source,
        count: Math.min(Math.max(count || 20, 1), 200),
      });

      if (!result.cards.length) {
        errorAlert("没有匹配的题目", "请调整筛选条件后重试");
        return;
      }

      saveFlashcardSession({
        sessionId: result.sessionId,
        source: result.source,
        cards: result.cards,
        count,
        startedAt: new Date().toISOString(),
      });
      successAlert(`已生成 ${result.cards.length} 张训练卡片`);
      router.push("/trade/flashcard/drill/play");
    } catch (error) {
      const message = error instanceof Error ? error.message : "生成练习失败";
      errorAlert(message);
    } finally {
      setLoading(false);
    }
  }, [
    count,
    errorAlert,
    router,
    source,
    successAlert,
  ]);

  return (
    <TradePageShell title="闪卡练习设置" subtitle="按题源筛题并生成训练会话" showAddButton={false}>
      <div className="w-full space-y-6">
        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-5 shadow-sm">
          <div className="mb-4 flex justify-end">
            <Link
              href="/trade/flashcard/review"
              className="text-sm text-[#00c2b2] hover:underline"
            >
              前往复盘中心
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-xs text-[#a7b0c0]">题源</div>
              <Select value={source} onValueChange={(v) => setSource(v as FlashcardSource)}>
                <SelectTrigger className="w-full h-9 bg-[#1e1e1e] border border-[#27272a] text-[#e5e7eb] focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#121212] border border-[#27272a] text-[#e5e7eb]">
                  {FLASHCARD_SOURCES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {FLASHCARD_LABELS[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
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
