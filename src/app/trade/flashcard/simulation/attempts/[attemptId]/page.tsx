"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import TradePageShell from "../../../../components/trade-page-shell";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/components/common/alert";
import { getFlashcardSimulationAttempt } from "../../../request";
import { FLASHCARD_LABELS, type FlashcardSimulationAttemptDetail } from "../../../types";
import { ImagePreviewDialog } from "../../../components/ImagePreviewDialog";

function formatDateTime(value?: string) {
  if (!value) return "--";
  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FlashcardSimulationAttemptDetailPage() {
  const params = useParams<{ attemptId: string }>();
  const [, errorAlert] = useAlert();
  const [attempt, setAttempt] = React.useState<FlashcardSimulationAttemptDetail | null>(null);
  const [previewMode, setPreviewMode] = React.useState<"question" | "answer" | null>(null);

  React.useEffect(() => {
    const attemptId = params?.attemptId;
    if (!attemptId || typeof attemptId !== "string") return;
    getFlashcardSimulationAttempt(attemptId)
      .then(setAttempt)
      .catch((error) => errorAlert(error instanceof Error ? error.message : "获取 attempt 详情失败"));
  }, [errorAlert, params]);

  if (!attempt) {
    return (
      <TradePageShell title="Attempt 详情" subtitle="正在加载" showAddButton={false}>
        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-6 text-sm text-[#9ca3af]">正在加载...</div>
      </TradePageShell>
    );
  }

  return (
    <TradePageShell title="Attempt 详情" subtitle={`Attempt ${attempt.attemptId.slice(0, 8)}`} showAddButton={false}>
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <Link href="/trade/flashcard/simulation/attempts"><Button variant="outline" className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]">返回 attempts 管理</Button></Link>
          <Link href={`/trade/flashcard/${attempt.cardId}`}><Button variant="outline" className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]">查看对应闪卡</Button></Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <button type="button" className="overflow-hidden rounded-xl border border-[#27272a] bg-black text-left" onClick={() => setPreviewMode("question")}>
            <img src={attempt.questionImageUrlSnapshot} alt="question" className="h-[340px] w-full object-contain" />
            <div className="border-t border-[#27272a] px-4 py-3 text-sm text-[#9ca3af]">题目图快照</div>
          </button>
          <button type="button" className="overflow-hidden rounded-xl border border-[#27272a] bg-black text-left" onClick={() => setPreviewMode("answer")}>
            <img src={attempt.answerImageUrlSnapshot} alt="answer" className="h-[340px] w-full object-contain" />
            <div className="border-t border-[#27272a] px-4 py-3 text-sm text-[#9ca3af]">答案图快照</div>
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4"><div className="text-xs text-[#9ca3af]">状态</div><div className="mt-2 text-sm text-[#e5e7eb]">{attempt.status === "RESOLVED" ? (attempt.result === "SUCCESS" ? "已结算成功" : "已结算失败") : "待结算"}</div></div>
          <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4"><div className="text-xs text-[#9ca3af]">方向</div><div className="mt-2 text-sm text-[#e5e7eb]">{FLASHCARD_LABELS[attempt.entryDirection]}</div></div>
          <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4"><div className="text-xs text-[#9ca3af]">RR</div><div className="mt-2 text-sm text-[#e5e7eb]">{attempt.rrValue.toFixed(2)}</div></div>
          <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4"><div className="text-xs text-[#9ca3af]">推演位置</div><div className="mt-2 text-sm text-[#e5e7eb]">{(attempt.revealProgress * 100).toFixed(1)}%</div></div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4"><div className="text-xs text-[#9ca3af]">入场线</div><div className="mt-2 text-sm text-[#e5e7eb]">{(attempt.entryLineYPercent * 100).toFixed(1)}%</div></div>
          <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4"><div className="text-xs text-[#9ca3af]">止损线</div><div className="mt-2 text-sm text-[#e5e7eb]">{(attempt.stopLossLineYPercent * 100).toFixed(1)}%</div></div>
          <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4"><div className="text-xs text-[#9ca3af]">止盈线</div><div className="mt-2 text-sm text-[#e5e7eb]">{(attempt.takeProfitLineYPercent * 100).toFixed(1)}%</div></div>
        </div>

        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-5">
          <div className="text-sm font-medium text-[#e5e7eb]">入场理由</div>
          <div className="mt-3 whitespace-pre-wrap rounded-lg border border-[#27272a] bg-[#18181b] p-4 text-sm text-[#e5e7eb]">{attempt.entryReason}</div>
        </div>

        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-5">
          <div className="text-sm font-medium text-[#e5e7eb]">结算信息</div>
          <div className="mt-3 space-y-2 text-sm text-[#cbd5e1]">
            <div>保存时间：{formatDateTime(attempt.entrySavedAt)}</div>
            <div>结算时间：{formatDateTime(attempt.resolvedAt)}</div>
            <div>失败原因：{attempt.failureReason || "--"}</div>
            <div>主误判类型：{attempt.primaryMistakeCode || "--"}</div>
            <div>误判标签：{attempt.mistakeCodes?.length ? attempt.mistakeCodes.join("、") : "--"}</div>
            <div>纠正说明：{attempt.correctionNote || "--"}</div>
          </div>
        </div>

        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-[#e5e7eb]">结果图复盘</div>
              <div className="mt-1 text-xs text-[#9ca3af]">这里直接看结果图，复盘时不用来回切缩略图。</div>
            </div>
            <Button
              variant="outline"
              className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]"
              onClick={() => setPreviewMode("answer")}
            >
              放大结果图
            </Button>
          </div>

          <button
            type="button"
            className="w-full overflow-hidden rounded-lg border border-[#27272a] bg-black text-left"
            onClick={() => setPreviewMode("answer")}
          >
            <img src={attempt.answerImageUrlSnapshot} alt="answer-large" className="max-h-[520px] w-full object-contain" />
          </button>
        </div>
      </div>

      {previewMode === "question" ? (
        <ImagePreviewDialog
          previewUrl={attempt.questionImageUrlSnapshot ?? null}
          revealProgress={attempt.revealProgress}
          priceLineEditorEnabled
          priceLineEditorReadOnly
          priceLineEditorReadOnlyHint="只读回放：这里按保存时的入场线 / 止损线 / 止盈线，以及当时的 x 轴位置展示。"
          priceLineValue={{
            entry: attempt.entryLineYPercent,
            stopLoss: attempt.stopLossLineYPercent,
            takeProfit: attempt.takeProfitLineYPercent,
          }}
          onClose={() => setPreviewMode(null)}
        />
      ) : null}
      {previewMode === "answer" ? (
        <ImagePreviewDialog previewUrl={attempt.answerImageUrlSnapshot ?? null} onClose={() => setPreviewMode(null)} />
      ) : null}
    </TradePageShell>
  );
}
