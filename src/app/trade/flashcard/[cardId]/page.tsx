"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import TradePageShell from "../../components/trade-page-shell";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/components/common/alert";
import { getFlashcardCard, getFlashcardSimulationCardHistory } from "../request";
import { FLASHCARD_LABELS, type FlashcardCard, type FlashcardSimulationCardHistoryItem } from "../types";
import { ImagePreviewDialog } from "../components/ImagePreviewDialog";

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

export default function FlashcardDetailPage() {
  const params = useParams<{ cardId: string }>();
  const [, errorAlert] = useAlert();
  const [card, setCard] = React.useState<FlashcardCard | null>(null);
  const [history, setHistory] = React.useState<FlashcardSimulationCardHistoryItem[]>([]);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    const cardId = params?.cardId;
    if (!cardId || typeof cardId !== "string") return;
    Promise.all([
      getFlashcardCard(cardId),
      getFlashcardSimulationCardHistory({ cardId, pageSize: 10 }).catch(() => null),
    ]).then(([cardRes, historyRes]) => {
      setCard(cardRes);
      setHistory(historyRes?.items || []);
    }).catch((error) => {
      errorAlert(error instanceof Error ? error.message : "获取闪卡详情失败");
    });
  }, [errorAlert, params]);

  if (!card) {
    return (
      <TradePageShell title="闪卡详情" subtitle="正在加载卡片详情" showAddButton={false}>
        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-6 text-sm text-[#9ca3af]">正在加载...</div>
      </TradePageShell>
    );
  }

  return (
    <TradePageShell title="闪卡详情" subtitle={`卡片 ${card.cardId.slice(0, 8)}`} showAddButton={false}>
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <Link href={`/trade/flashcard/manage?cardId=${card.cardId}`}><Button variant="outline" className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]">回管理页并按本卡查询</Button></Link>
          <Link href="/trade/flashcard/simulation/attempts"><Button variant="outline" className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]">查看 attempt 管理</Button></Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <button type="button" className="overflow-hidden rounded-xl border border-[#27272a] bg-black text-left" onClick={() => setPreviewUrl(card.questionImageUrl)}>
            <img src={card.questionImageUrl} alt="question" className="h-[340px] w-full object-contain" />
            <div className="border-t border-[#27272a] px-4 py-3 text-sm text-[#9ca3af]">题目图，点击放大</div>
          </button>
          <button type="button" className="overflow-hidden rounded-xl border border-[#27272a] bg-black text-left" onClick={() => setPreviewUrl(card.answerImageUrl)}>
            <img src={card.answerImageUrl} alt="answer" className="h-[340px] w-full object-contain" />
            <div className="border-t border-[#27272a] px-4 py-3 text-sm text-[#9ca3af]">答案图，点击放大</div>
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4"><div className="text-xs text-[#9ca3af]">预期动作</div><div className="mt-2 text-sm text-[#e5e7eb]">{card.expectedAction ? FLASHCARD_LABELS[card.expectedAction] : "--"}</div></div>
          <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4"><div className="text-xs text-[#9ca3af]">剧本</div><div className="mt-2 text-sm text-[#e5e7eb]">{card.playbookType || "--"}</div></div>
          <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4"><div className="text-xs text-[#9ca3af]">交易对</div><div className="mt-2 text-sm text-[#e5e7eb]">{card.symbolPairInfo || "--"}</div></div>
          <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4"><div className="text-xs text-[#9ca3af]">系统结果</div><div className="mt-2 text-sm text-[#e5e7eb]">{card.systemOutcomeType ? FLASHCARD_LABELS[card.systemOutcomeType] : "--"}</div></div>
        </div>

        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-5">
          <div className="text-sm font-medium text-[#e5e7eb]">标签与备注</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {card.tagItems?.length ? card.tagItems.map((tag) => (
              <span key={tag.code} className="rounded-full border border-[#3f3f46] px-2 py-1 text-xs text-[#d4d4d8]">{tag.label}</span>
            )) : <span className="text-sm text-[#9ca3af]">暂无标签</span>}
          </div>
          <div className="mt-4 whitespace-pre-wrap rounded-lg border border-[#27272a] bg-[#18181b] p-4 text-sm text-[#e5e7eb]">{card.notes?.trim() || "暂无备注"}</div>
        </div>

        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-5">
          <div className="text-sm font-medium text-[#e5e7eb]">最近模拟盘 attempts</div>
          <div className="mt-4 space-y-3">
            {!history.length ? <div className="text-sm text-[#9ca3af]">还没有模拟盘历史。</div> : history.map((item) => (
              <div key={item.attemptId} className="rounded-lg border border-[#27272a] bg-[#18181b] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-[#e5e7eb]">Attempt {item.attemptId.slice(0, 8)} · RR {item.rrValue.toFixed(2)}</div>
                  <Link href={`/trade/flashcard/simulation/attempts/${item.attemptId}`} className="text-sm text-[#00c2b2] hover:underline">查看 attempt 详情</Link>
                </div>
                <div className="mt-2 text-xs text-[#9ca3af]">{formatDateTime(item.createdAt)} · {item.result === "SUCCESS" ? "成功" : item.result === "FAILURE" ? "失败" : "待结算"}</div>
                <div className="mt-3 whitespace-pre-wrap text-sm text-[#cbd5e1]">{item.entryReason}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {previewUrl ? <ImagePreviewDialog previewUrl={previewUrl} onClose={() => setPreviewUrl(null)} /> : null}
    </TradePageShell>
  );
}
