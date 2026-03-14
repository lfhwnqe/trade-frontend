"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TradePageShell from "../../../components/trade-page-shell";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/components/common/alert";
import { startFlashcardSimulationSession } from "../../request";
import { saveFlashcardSimulationSession } from "@/store/flashcard-simulation-session";

export default function FlashcardSimulationSetupPage() {
  const router = useRouter();
  const [successAlert, errorAlert] = useAlert();
  const [loading, setLoading] = React.useState(false);

  const handleStart = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await startFlashcardSimulationSession({ count: 5 });
      if (!result.cards.length) {
        errorAlert("当前没有可用于模拟盘训练的闪卡");
        return;
      }

      saveFlashcardSimulationSession({
        simulationSessionId: result.simulationSessionId,
        cards: result.cards,
        count: result.count,
        startedAt: new Date().toISOString(),
      });
      successAlert(`已生成 ${result.cards.length} 张模拟盘训练卡片`);
      router.push("/trade/flashcard/simulation/play");
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "开始模拟盘训练失败");
    } finally {
      setLoading(false);
    }
  }, [errorAlert, router, successAlert]);

  return (
    <TradePageShell
      title="闪卡模拟盘训练"
      subtitle="每轮固定随机 5 张题，先模拟入场，再揭晓并复盘"
      showAddButton={false}
    >
      <div className="space-y-6">
        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="text-sm text-[#e5e7eb]">这轮训练会要求你：</div>
              <ul className="list-disc space-y-2 pl-5 text-sm text-[#9ca3af]">
                <li>在 question 图推进到某个位置后，用三条线设置入场 / 止损 / 止盈</li>
                <li>填写入场原因与盈亏比设置原因</li>
                <li>自行揭晓答案后，记录成功或失败</li>
                <li>失败时补充失败备注，并顺手给题目质量打分</li>
              </ul>
            </div>
            <Link href="/trade/flashcard/simulation/history" className="text-sm text-[#00c2b2] hover:underline">
              查看训练历史
            </Link>
          </div>

          <div className="mt-6 rounded-lg border border-[#27272a] bg-[#18181b] p-4 text-sm text-[#a7b0c0]">
            当前首版固定：<span className="font-medium text-[#e5e7eb]">5 张随机题 / 轮</span>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              type="button"
              onClick={handleStart}
              disabled={loading}
              className="bg-[#00c2b2] text-black hover:bg-[#009e91]"
            >
              {loading ? "生成中..." : "开始模拟盘训练"}
            </Button>
          </div>
        </div>
      </div>
    </TradePageShell>
  );
}
