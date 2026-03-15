"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TradePageShell from "../../../components/trade-page-shell";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/components/common/alert";
import { startFlashcardSimulationSession } from "../../request";
import { saveFlashcardSimulationSession } from "@/store/flashcard-simulation-session";

type SimulationMode = "STANDARD" | "ATTEMPT_REPLAY";
type ReplayResultFilter = "ALL" | "FAILURE" | "SUCCESS";

const MODE_OPTIONS: Array<{
  value: SimulationMode;
  title: string;
  description: string;
}> = [
  {
    value: "STANDARD",
    title: "标准推演模式",
    description: "从题库随机抽 5 张，从 0 开始手动推进蒙层。",
  },
  {
    value: "ATTEMPT_REPLAY",
    title: "历史点位快速复训",
    description: "直接抽历史 simulation attempt，并定位到当时保存的蒙层点位。",
  },
];

const REPLAY_FILTER_OPTIONS: Array<{
  value: ReplayResultFilter;
  title: string;
  description: string;
}> = [
  { value: "ALL", title: "全部历史 attempts", description: "不区分之前做对还是做错。" },
  { value: "FAILURE", title: "仅历史失败记录", description: "优先复训以前判定失败的点位。" },
  { value: "SUCCESS", title: "仅历史成功记录", description: "回看自己做对的点位是否还能快速识别。" },
];

export default function FlashcardSimulationSetupPage() {
  const router = useRouter();
  const [successAlert, errorAlert] = useAlert();
  const [loading, setLoading] = React.useState(false);
  const [mode, setMode] = React.useState<SimulationMode>("STANDARD");
  const [replayResultFilter, setReplayResultFilter] = React.useState<ReplayResultFilter>("ALL");

  const handleStart = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await startFlashcardSimulationSession({
        count: 5,
        mode,
        filters:
          mode === "ATTEMPT_REPLAY" && replayResultFilter !== "ALL"
            ? { result: [replayResultFilter] }
            : undefined,
      });
      if (!result.cards.length) {
        errorAlert(
          mode === "ATTEMPT_REPLAY"
            ? "当前筛选下没有可用于快速复训的历史点位"
            : "当前没有可用于模拟盘训练的闪卡",
        );
        return;
      }

      saveFlashcardSimulationSession({
        simulationSessionId: result.simulationSessionId,
        mode: result.mode || mode,
        cards: result.cards,
        count: result.count,
        startedAt: new Date().toISOString(),
      });
      successAlert(
        mode === "ATTEMPT_REPLAY"
          ? `已生成 ${result.cards.length} 张历史点位复训卡片`
          : `已生成 ${result.cards.length} 张模拟盘训练卡片`,
      );
      router.push("/trade/flashcard/simulation/play");
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "开始模拟盘训练失败");
    } finally {
      setLoading(false);
    }
  }, [errorAlert, mode, replayResultFilter, router, successAlert]);

  return (
    <TradePageShell
      title="闪卡模拟盘训练"
      subtitle="M3：setup 页支持标准推演 / 历史点位快速复训两种入口"
      showAddButton={false}
    >
      <div className="space-y-6">
        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="text-sm text-[#e5e7eb]">这轮训练会要求你：</div>
              <ul className="list-disc space-y-2 pl-5 text-sm text-[#9ca3af]">
                <li>在 question 图推进到某个位置后，用三条线设置入场 / 止损 / 止盈</li>
                <li>填写入场理由，并把这次入场作为独立 attempt 保存</li>
                <li>自行揭晓答案后，记录成功或失败</li>
                <li>失败时补充失败原因，并顺手给题目质量打分</li>
              </ul>
            </div>
            <Link href="/trade/flashcard/simulation/history" className="text-sm text-[#00c2b2] hover:underline">
              查看训练历史
            </Link>
          </div>

          <div className="mt-6 rounded-lg border border-[#27272a] bg-[#18181b] p-4 text-sm text-[#a7b0c0]">
            当前首版固定：<span className="font-medium text-[#e5e7eb]">5 张 / 轮</span>
          </div>
        </div>

        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-6 shadow-sm space-y-4">
          <div>
            <div className="text-sm font-medium text-[#e5e7eb]">训练模式</div>
            <div className="mt-1 text-xs text-[#9ca3af]">先决定这轮是从头推演，还是直接复训历史保存过的点位。</div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {MODE_OPTIONS.map((option) => {
              const active = mode === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMode(option.value)}
                  className={`rounded-xl border p-4 text-left transition ${
                    active
                      ? "border-[#00c2b2] bg-[#0f1f1d]"
                      : "border-[#27272a] bg-[#18181b] hover:border-[#3f3f46]"
                  }`}
                >
                  <div className="text-sm font-medium text-[#e5e7eb]">{option.title}</div>
                  <div className="mt-2 text-sm text-[#9ca3af]">{option.description}</div>
                </button>
              );
            })}
          </div>

          {mode === "ATTEMPT_REPLAY" ? (
            <div className="rounded-xl border border-[#27272a] bg-[#18181b] p-4 space-y-4">
              <div>
                <div className="text-sm font-medium text-[#e5e7eb]">历史点位筛选</div>
                <div className="mt-1 text-xs text-[#9ca3af]">至少支持全部 / 失败 / 成功三种历史 attempt 入口。</div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {REPLAY_FILTER_OPTIONS.map((option) => {
                  const active = replayResultFilter === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setReplayResultFilter(option.value)}
                      className={`rounded-lg border p-3 text-left transition ${
                        active
                          ? "border-[#00c2b2] bg-[#0f1f1d]"
                          : "border-[#27272a] bg-[#121212] hover:border-[#3f3f46]"
                      }`}
                    >
                      <div className="text-sm font-medium text-[#e5e7eb]">{option.title}</div>
                      <div className="mt-1 text-xs text-[#9ca3af]">{option.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleStart}
              disabled={loading}
              className="bg-[#00c2b2] text-black hover:bg-[#009e91]"
            >
              {loading
                ? "生成中..."
                : mode === "ATTEMPT_REPLAY"
                  ? "开始历史点位复训"
                  : "开始模拟盘训练"}
            </Button>
          </div>
        </div>
      </div>
    </TradePageShell>
  );
}
