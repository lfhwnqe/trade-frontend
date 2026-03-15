"use client";

import React from "react";
import Link from "next/link";
import TradePageShell from "../../../components/trade-page-shell";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/components/common/alert";
import { listFlashcardSimulationAttempts } from "../../request";
import type { FlashcardSimulationAttemptDetail } from "../../types";
import { FLASHCARD_LABELS } from "../../types";
import { ImagePreviewDialog } from "../../components/ImagePreviewDialog";

type ResultFilter = "ALL" | "SUCCESS" | "FAILURE";

type ReviewOverlayProps = {
  attempt: FlashcardSimulationAttemptDetail;
  onOpenQuestion: () => void;
};

const FILTERS: Array<{ value: ResultFilter; label: string }> = [
  { value: "ALL", label: "全部" },
  { value: "SUCCESS", label: "成功" },
  { value: "FAILURE", label: "失败" },
];

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

function ReviewOverlay({ attempt, onOpenQuestion }: ReviewOverlayProps) {
  const lineItems = [
    { key: "entry", label: "入场", color: "#22d3ee", y: attempt.entryLineYPercent },
    { key: "stopLoss", label: "止损", color: "#ef4444", y: attempt.stopLossLineYPercent },
    { key: "takeProfit", label: "止盈", color: "#22c55e", y: attempt.takeProfitLineYPercent },
  ];

  return (
    <div className="rounded-xl border border-[#27272a] bg-[#18181b] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-[#e5e7eb]">只读复盘画板</div>
          <div className="mt-1 text-xs text-[#9ca3af]">直接把三条线和当前推演位置叠回题图上，按真实训练页的方式回看。</div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]"
          onClick={onOpenQuestion}
        >
          放大题目图
        </Button>
      </div>

      <div className="relative overflow-hidden rounded-lg border border-[#27272a] bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={attempt.questionImageUrlSnapshot} alt="question-review" className="max-h-[420px] w-full object-contain" />

        <div className="pointer-events-none absolute inset-0">
          {lineItems.map((line) => (
            <div key={line.key} className="absolute inset-x-0 -translate-y-1/2" style={{ top: `${line.y * 100}%` }}>
              <div className="relative h-0.5 w-full" style={{ backgroundColor: line.color }}>
                <div
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border px-2 py-0.5 text-[11px] font-medium"
                  style={{
                    color: line.color,
                    borderColor: `${line.color}88`,
                    backgroundColor: "rgba(9,9,11,0.92)",
                  }}
                >
                  {line.label}
                </div>
              </div>
            </div>
          ))}

          <div className="absolute inset-y-0 w-0 border-l-2 border-dashed border-[#fbbf24]" style={{ left: `${attempt.revealProgress * 100}%` }}>
            <div className="absolute -top-1 left-1 -translate-y-full rounded bg-[#fbbf24] px-2 py-1 text-[11px] font-medium text-black">
              当前推演位置 / x轴
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent px-3 py-3 text-xs text-white/90">
          <span>x 轴定位：{Math.round(attempt.revealProgress * 100)}%</span>
          <span>入场 / 止损 / 止盈已按保存时位置回放</span>
        </div>
      </div>
    </div>
  );
}

export default function FlashcardSimulationAttemptsPage() {
  const [, errorAlert] = useAlert();
  const [filter, setFilter] = React.useState<ResultFilter>("ALL");
  const [items, setItems] = React.useState<FlashcardSimulationAttemptDetail[]>([]);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [previewAttempt, setPreviewAttempt] = React.useState<FlashcardSimulationAttemptDetail | null>(null);
  const [answerPreviewUrl, setAnswerPreviewUrl] = React.useState<string | null>(null);

  const loadAttempts = React.useCallback(async (reset: boolean, cursor?: string | null) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const res = await listFlashcardSimulationAttempts({
        pageSize: 20,
        cursor: reset ? undefined : cursor || undefined,
        result: filter,
      });
      setItems((prev) => (reset ? res.items : [...prev, ...res.items]));
      setNextCursor(res.nextCursor);
      if (reset) setExpandedId(res.items[0]?.attemptId || null);
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "获取模拟盘训练记录失败");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [errorAlert, filter]);

  React.useEffect(() => {
    setNextCursor(null);
    setExpandedId(null);
    void loadAttempts(true);
  }, [loadAttempts]);

  return (
    <TradePageShell title="模拟盘训练记录管理" subtitle="M5：按用户维度查看、筛选并展开复盘已保存的 simulation attempts" showAddButton={false}>
      <div className="space-y-6">
        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-medium text-[#e5e7eb]">训练记录筛选</div>
              <div className="mt-1 text-xs text-[#9ca3af]">支持查看全部 / 成功 / 失败记录，并展开查看题图、答案图和三条线参数。</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((option) => {
                const active = option.value === filter;
                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant={active ? "default" : "outline"}
                    className={active ? "bg-[#00c2b2] text-black hover:bg-[#009e91]" : "border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]"}
                    onClick={() => setFilter(option.value)}
                  >
                    {option.label}
                  </Button>
                );
              })}
              <Link href="/trade/flashcard/simulation/setup">
                <Button variant="outline" className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]">开始新训练</Button>
              </Link>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-[#27272a] bg-[#121212] p-6 text-sm text-[#9ca3af]">正在加载训练记录...</div>
        ) : !items.length ? (
          <div className="rounded-xl border border-dashed border-[#27272a] bg-[#121212] p-6 text-sm text-[#9ca3af]">当前筛选下还没有模拟盘训练记录。</div>
        ) : (
          <div className="space-y-4">
            {items.map((attempt) => {
              const expanded = expandedId === attempt.attemptId;
              return (
                <div key={attempt.attemptId} className="rounded-xl border border-[#27272a] bg-[#121212] p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-medium text-[#e5e7eb]">Attempt {attempt.attemptId.slice(0, 8)}</div>
                        <div className={`text-xs font-medium ${attempt.result === "SUCCESS" ? "text-[#22c55e]" : attempt.result === "FAILURE" ? "text-[#ef4444]" : "text-[#fbbf24]"}`}>
                          {attempt.result === "SUCCESS" ? "成功" : attempt.result === "FAILURE" ? "失败" : "待结算"}
                        </div>
                        {attempt.replaySourceAttemptId ? <div className="text-xs text-[#00c2b2]">基于历史点位复训</div> : null}
                      </div>
                      <div className="text-xs text-[#9ca3af]">保存时间 {formatDateTime(attempt.entrySavedAt)} · 会话 {attempt.simulationSessionId.slice(0, 8)} · 卡片 {attempt.cardId.slice(0, 8)}</div>
                      <div className="flex flex-wrap gap-3 text-xs text-[#cbd5e1]">
                        <span>点位 {Math.round(attempt.revealProgress * 100)}%</span>
                        <span>RR {attempt.rrValue.toFixed(2)}</span>
                        <span>{FLASHCARD_LABELS[attempt.entryDirection]}</span>
                        <span>质量分 {attempt.cardQualityScore ?? "--"}</span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]"
                      onClick={() => setExpandedId((prev) => (prev === attempt.attemptId ? null : attempt.attemptId))}
                    >
                      {expanded ? "收起" : "展开复盘"}
                    </Button>
                  </div>

                  {expanded ? (
                    <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                      <div className="space-y-4">
                        <ReviewOverlay attempt={attempt} onOpenQuestion={() => setPreviewAttempt(attempt)} />

                        <div className="grid gap-4 md:grid-cols-2">
                          <button type="button" className="overflow-hidden rounded-lg border border-[#27272a] bg-black text-left" onClick={() => setPreviewAttempt(attempt)}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={attempt.questionImageUrlSnapshot} alt="question" className="h-[200px] w-full object-contain" />
                            <div className="border-t border-[#27272a] px-3 py-2 text-xs text-[#9ca3af]">题目图原图 · 点击放大</div>
                          </button>
                          <button type="button" className="overflow-hidden rounded-lg border border-[#27272a] bg-black text-left" onClick={() => setAnswerPreviewUrl(attempt.answerImageUrlSnapshot || null)}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={attempt.answerImageUrlSnapshot} alt="answer" className="h-[200px] w-full object-contain" />
                            <div className="border-t border-[#27272a] px-3 py-2 text-xs text-[#9ca3af]">答案图 · 点击放大</div>
                          </button>
                        </div>

                        <div className="grid gap-3 md:grid-cols-4">
                          <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3">
                            <div className="text-xs text-[#9ca3af]">入场线</div>
                            <div className="mt-2 text-sm font-medium text-[#e5e7eb]">{(attempt.entryLineYPercent * 100).toFixed(1)}%</div>
                          </div>
                          <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3">
                            <div className="text-xs text-[#9ca3af]">止损线</div>
                            <div className="mt-2 text-sm font-medium text-[#e5e7eb]">{(attempt.stopLossLineYPercent * 100).toFixed(1)}%</div>
                          </div>
                          <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3">
                            <div className="text-xs text-[#9ca3af]">止盈线</div>
                            <div className="mt-2 text-sm font-medium text-[#e5e7eb]">{(attempt.takeProfitLineYPercent * 100).toFixed(1)}%</div>
                          </div>
                          <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3">
                            <div className="text-xs text-[#9ca3af]">x 轴位置</div>
                            <div className="mt-2 text-sm font-medium text-[#e5e7eb]">{(attempt.revealProgress * 100).toFixed(1)}%</div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-4">
                          <div className="text-xs text-[#9ca3af]">入场理由</div>
                          <div className="mt-2 whitespace-pre-wrap text-sm text-[#e5e7eb]">{attempt.entryReason}</div>
                        </div>
                        <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-4">
                          <div className="text-xs text-[#9ca3af]">结果与复盘</div>
                          <div className="mt-2 space-y-2 text-sm text-[#e5e7eb]">
                            <div>结果：{attempt.result === "SUCCESS" ? "成功" : attempt.result === "FAILURE" ? "失败" : "待结算"}</div>
                            <div>保存时间：{formatDateTime(attempt.entrySavedAt)}</div>
                            <div>结算时间：{formatDateTime(attempt.resolvedAt)}</div>
                            <div>来源 replayId：{attempt.replaySourceAttemptId || "--"}</div>
                            {attempt.failureReason ? <div className="text-[#fca5a5]">失败原因：{attempt.failureReason}</div> : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        {nextCursor ? (
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]"
              onClick={() => void loadAttempts(false, nextCursor)}
              disabled={loadingMore}
            >
              {loadingMore ? "加载中..." : "加载更多"}
            </Button>
          </div>
        ) : null}
      </div>

      {previewAttempt ? (
        <ImagePreviewDialog
          previewUrl={previewAttempt.questionImageUrlSnapshot ?? null}
          revealProgress={previewAttempt.revealProgress}
          priceLineEditorEnabled
          priceLineEditorReadOnly
          priceLineEditorReadOnlyHint="只读回放：这里直接复用模拟盘训练页同一套放大画板，按保存时的三条线和 x 轴位置展示。"
          priceLineValue={{
            entry: previewAttempt.entryLineYPercent,
            stopLoss: previewAttempt.stopLossLineYPercent,
            takeProfit: previewAttempt.takeProfitLineYPercent,
          }}
          onClose={() => setPreviewAttempt(null)}
        />
      ) : null}
      {answerPreviewUrl ? (
        <ImagePreviewDialog previewUrl={answerPreviewUrl} onClose={() => setAnswerPreviewUrl(null)} />
      ) : null}
    </TradePageShell>
  );
}
