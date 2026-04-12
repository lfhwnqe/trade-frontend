"use client";

import React from "react";
import Link from "next/link";
import TradePageShell from "../../../components/trade-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelectDropdown } from "@/components/common/MultiSelectDropdown";
import { useAlert } from "@/components/common/alert";
import { fetchMistakeTypeOptions } from "@/app/trade/dictionary";
import { deleteFlashcardSimulationAttempt, listFlashcardSimulationAttempts, updateFlashcardSimulationAttempt } from "../../request";
import type { FlashcardSimulationAttemptDetail } from "../../types";
import { FLASHCARD_LABELS } from "../../types";
import { ImagePreviewDialog } from "../../components/ImagePreviewDialog";

type ResultFilter = "ALL" | "SUCCESS" | "FAILURE";
type ResolutionDraft = {
  result: "SUCCESS" | "FAILURE" | "";
  failureReason: string;
  primaryMistakeCode: string;
  mistakeCodes: string[];
  correctionNote: string;
  cardQualityScore: number;
};

const EMPTY_SELECT_VALUE = "__NONE__";
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

export default function FlashcardSimulationAttemptsPage() {
  const [successAlert, errorAlert] = useAlert();
  const [filter, setFilter] = React.useState<ResultFilter>("ALL");
  const [items, setItems] = React.useState<FlashcardSimulationAttemptDetail[]>([]);
  const [drafts, setDrafts] = React.useState<Record<string, ResolutionDraft>>({});
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [previewAttempt, setPreviewAttempt] = React.useState<FlashcardSimulationAttemptDetail | null>(null);
  const [savingAttemptId, setSavingAttemptId] = React.useState<string | null>(null);
  const [deletingAttemptId, setDeletingAttemptId] = React.useState<string | null>(null);
  const [mistakeTypeOptions, setMistakeTypeOptions] = React.useState<Array<{ code: string; label: string; color?: string }>>([]);

  React.useEffect(() => {
    let mounted = true;
    fetchMistakeTypeOptions().then((items) => {
      if (mounted) setMistakeTypeOptions(items);
    }).catch(() => {
      if (mounted) setMistakeTypeOptions([]);
    });
    return () => { mounted = false; };
  }, []);

  const hydrateDraft = React.useCallback((attempt: FlashcardSimulationAttemptDetail): ResolutionDraft => ({
    result: attempt.result || "",
    failureReason: attempt.failureReason || "",
    primaryMistakeCode: attempt.primaryMistakeCode || "",
    mistakeCodes: attempt.mistakeCodes || [],
    correctionNote: attempt.correctionNote || "",
    cardQualityScore: attempt.cardQualityScore || 5,
  }), []);

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
      setDrafts((prev) => {
        const next = { ...prev };
        for (const attempt of res.items) {
          next[attempt.attemptId] = prev[attempt.attemptId] || hydrateDraft(attempt);
        }
        return next;
      });
      setNextCursor(res.nextCursor);
      if (reset) setExpandedId(res.items[0]?.attemptId || null);
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "获取模拟盘训练记录失败");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [errorAlert, filter, hydrateDraft]);

  React.useEffect(() => {
    setNextCursor(null);
    setExpandedId(null);
    void loadAttempts(true);
  }, [loadAttempts]);

  const updateDraft = React.useCallback((attemptId: string, patch: Partial<ResolutionDraft>) => {
    setDrafts((prev) => ({
      ...prev,
      [attemptId]: {
        result: prev[attemptId]?.result || "",
        failureReason: prev[attemptId]?.failureReason || "",
        primaryMistakeCode: prev[attemptId]?.primaryMistakeCode || "",
        mistakeCodes: prev[attemptId]?.mistakeCodes || [],
        correctionNote: prev[attemptId]?.correctionNote || "",
        cardQualityScore: prev[attemptId]?.cardQualityScore || 5,
        ...patch,
      },
    }));
  }, []);

  const handleSave = React.useCallback(async (attempt: FlashcardSimulationAttemptDetail) => {
    const draft = drafts[attempt.attemptId] || hydrateDraft(attempt);
    if (!draft.result) {
      errorAlert("请先选择结果");
      return;
    }
    if (draft.result === "FAILURE" && !draft.failureReason.trim()) {
      errorAlert("失败时必须填写失败原因");
      return;
    }
    if (draft.result === "FAILURE" && !draft.primaryMistakeCode) {
      errorAlert("失败时必须选择主误判类型");
      return;
    }
    if (draft.result === "FAILURE" && !draft.mistakeCodes.length) {
      errorAlert("失败时至少要选择一个误判标签");
      return;
    }

    setSavingAttemptId(attempt.attemptId);
    try {
      const updated = await updateFlashcardSimulationAttempt({
        attemptId: attempt.attemptId,
        result: draft.result,
        failureReason: draft.result === "FAILURE" ? draft.failureReason.trim() : undefined,
        primaryMistakeCode: draft.result === "FAILURE" ? draft.primaryMistakeCode : undefined,
        mistakeCodes: draft.result === "FAILURE" ? draft.mistakeCodes : undefined,
        correctionNote: draft.result === "FAILURE" ? draft.correctionNote.trim() || undefined : undefined,
        cardQualityScore: draft.cardQualityScore as 1 | 2 | 3 | 4 | 5,
      });
      setItems((prev) => prev.map((item) => item.attemptId === attempt.attemptId ? updated : item));
      setDrafts((prev) => ({ ...prev, [attempt.attemptId]: hydrateDraft(updated) }));
      successAlert("attempt 已更新");
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "更新 attempt 失败");
    } finally {
      setSavingAttemptId(null);
    }
  }, [drafts, errorAlert, hydrateDraft, successAlert]);

  const handleDelete = React.useCallback(async (attemptId: string) => {
    setDeletingAttemptId(attemptId);
    try {
      await deleteFlashcardSimulationAttempt(attemptId);
      setItems((prev) => prev.filter((item) => item.attemptId !== attemptId));
      setExpandedId((prev) => prev === attemptId ? null : prev);
      successAlert("attempt 已删除");
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "删除 attempt 失败");
    } finally {
      setDeletingAttemptId(null);
    }
  }, [errorAlert, successAlert]);

  return (
    <TradePageShell title="模拟盘训练记录管理" subtitle="支持查看、修改、删除 attempts，并快速跳到卡片详情 / attempt 详情" showAddButton={false}>
      <div className="space-y-6">
        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-medium text-[#e5e7eb]">训练记录筛选</div>
              <div className="mt-1 text-xs text-[#9ca3af]">这里可以直接处理待结算 attempt，也可以回看对应卡片和详情页。</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((option) => {
                const active = option.value === filter;
                return (
                  <Button key={option.value} type="button" variant={active ? "default" : "outline"} className={active ? "bg-[#00c2b2] text-black hover:bg-[#009e91]" : "border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]"} onClick={() => setFilter(option.value)}>
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {loading ? <div className="rounded-xl border border-[#27272a] bg-[#121212] p-6 text-sm text-[#9ca3af]">正在加载训练记录...</div> : null}

        {!loading && !items.length ? <div className="rounded-xl border border-dashed border-[#27272a] bg-[#121212] p-6 text-sm text-[#9ca3af]">当前筛选下还没有模拟盘训练记录。</div> : null}

        <div className="space-y-4">
          {items.map((attempt) => {
            const expanded = expandedId === attempt.attemptId;
            const draft = drafts[attempt.attemptId] || hydrateDraft(attempt);
            return (
              <div key={attempt.attemptId} className="rounded-xl border border-[#27272a] bg-[#121212] p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-medium text-[#e5e7eb]">Attempt {attempt.attemptId.slice(0, 8)}</div>
                      <div className={`text-xs font-medium ${attempt.result === "SUCCESS" ? "text-[#22c55e]" : attempt.result === "FAILURE" ? "text-[#ef4444]" : "text-[#fbbf24]"}`}>
                        {attempt.result === "SUCCESS" ? "成功" : attempt.result === "FAILURE" ? "失败" : "待结算"}
                      </div>
                    </div>
                    <div className="text-xs text-[#9ca3af]">保存时间 {formatDateTime(attempt.entrySavedAt)} · 卡片 {attempt.cardId.slice(0, 8)} · 会话 {attempt.simulationSessionId.slice(0, 8)}</div>
                    <div className="flex flex-wrap gap-3 text-xs text-[#cbd5e1]">
                      <span>点位 {Math.round(attempt.revealProgress * 100)}%</span>
                      <span>RR {attempt.rrValue.toFixed(2)}</span>
                      <span>{FLASHCARD_LABELS[attempt.entryDirection]}</span>
                      <span>质量分 {attempt.cardQualityScore ?? "--"}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/trade/flashcard/${attempt.cardId}`}><Button variant="outline" className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]">卡片详情</Button></Link>
                    <Link href={`/trade/flashcard/simulation/attempts/${attempt.attemptId}`}><Button variant="outline" className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]">attempt详情</Button></Link>
                    <Button type="button" variant="outline" className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]" onClick={() => setExpandedId((prev) => prev === attempt.attemptId ? null : attempt.attemptId)}>{expanded ? "收起" : "展开处理"}</Button>
                  </div>
                </div>

                {expanded ? (
                  <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
                    <div className="space-y-4">
                      <button type="button" className="overflow-hidden rounded-lg border border-[#27272a] bg-black text-left" onClick={() => setPreviewAttempt(attempt)}>
                        <img src={attempt.questionImageUrlSnapshot} alt="question" className="h-[220px] w-full object-contain" />
                        <div className="border-t border-[#27272a] px-3 py-2 text-xs text-[#9ca3af]">题目图快照，点击放大</div>
                      </button>
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3"><div className="text-xs text-[#9ca3af]">入场线</div><div className="mt-2 text-sm font-medium text-[#e5e7eb]">{(attempt.entryLineYPercent * 100).toFixed(1)}%</div></div>
                        <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3"><div className="text-xs text-[#9ca3af]">止损线</div><div className="mt-2 text-sm font-medium text-[#e5e7eb]">{(attempt.stopLossLineYPercent * 100).toFixed(1)}%</div></div>
                        <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3"><div className="text-xs text-[#9ca3af]">止盈线</div><div className="mt-2 text-sm font-medium text-[#e5e7eb]">{(attempt.takeProfitLineYPercent * 100).toFixed(1)}%</div></div>
                        <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3"><div className="text-xs text-[#9ca3af]">x轴位置</div><div className="mt-2 text-sm font-medium text-[#e5e7eb]">{(attempt.revealProgress * 100).toFixed(1)}%</div></div>
                      </div>
                      <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-4">
                        <div className="text-xs text-[#9ca3af]">入场理由</div>
                        <div className="mt-2 whitespace-pre-wrap text-sm text-[#e5e7eb]">{attempt.entryReason}</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Button type="button" variant={draft.result === "SUCCESS" ? "default" : "outline"} className={draft.result === "SUCCESS" ? "bg-[#22c55e] text-black hover:bg-[#16a34a]" : "border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]"} onClick={() => updateDraft(attempt.attemptId, { result: "SUCCESS" })}>成功</Button>
                        <Button type="button" variant={draft.result === "FAILURE" ? "default" : "outline"} className={draft.result === "FAILURE" ? "bg-[#ef4444] text-white hover:bg-[#dc2626]" : "border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]"} onClick={() => updateDraft(attempt.attemptId, { result: "FAILURE" })}>失败</Button>
                      </div>

                      {draft.result === "FAILURE" ? (
                        <>
                          <Textarea value={draft.failureReason} onChange={(e) => updateDraft(attempt.attemptId, { failureReason: e.target.value })} className="min-h-[110px] border-[#27272a] bg-[#121212] text-[#e5e7eb]" placeholder="失败原因" />
                          <Select value={draft.primaryMistakeCode || EMPTY_SELECT_VALUE} onValueChange={(value) => updateDraft(attempt.attemptId, { primaryMistakeCode: value === EMPTY_SELECT_VALUE ? "" : value, mistakeCodes: value === EMPTY_SELECT_VALUE ? draft.mistakeCodes : Array.from(new Set([value, ...draft.mistakeCodes])) })}>
                            <SelectTrigger className="border-[#27272a] bg-[#121212] text-[#e5e7eb]"><SelectValue placeholder="选择主误判类型" /></SelectTrigger>
                            <SelectContent className="border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                              <SelectItem value={EMPTY_SELECT_VALUE}>请选择</SelectItem>
                              {mistakeTypeOptions.map((item) => <SelectItem key={item.code} value={item.code}>{item.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <MultiSelectDropdown options={mistakeTypeOptions.map((item) => ({ value: item.code, label: item.label, color: item.color }))} value={draft.mistakeCodes} onChange={(next) => updateDraft(attempt.attemptId, { mistakeCodes: draft.primaryMistakeCode && !next.includes(draft.primaryMistakeCode) ? [draft.primaryMistakeCode, ...next] : next })} placeholder="选择误判标签" emptyText="暂无可用 mistake_type" className="border-[#27272a] bg-[#121212] text-[#e5e7eb] hover:bg-[#1a1a1a]" contentClassName="border-[#27272a] bg-[#121212] text-[#e5e7eb]" />
                          <Textarea value={draft.correctionNote} onChange={(e) => updateDraft(attempt.attemptId, { correctionNote: e.target.value })} className="min-h-[90px] border-[#27272a] bg-[#121212] text-[#e5e7eb]" placeholder="下次怎么改" />
                        </>
                      ) : null}

                      <div>
                        <div className="mb-2 text-sm font-medium text-[#e5e7eb]">质量评分</div>
                        <Input type="number" min={1} max={5} value={draft.cardQualityScore} onChange={(e) => updateDraft(attempt.attemptId, { cardQualityScore: Math.min(5, Math.max(1, Number(e.target.value || 5))) })} className="w-28 border-[#27272a] bg-[#121212] text-[#e5e7eb]" />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => void handleSave(attempt)} disabled={savingAttemptId === attempt.attemptId} className="bg-[#00c2b2] text-black hover:bg-[#009e91]">{savingAttemptId === attempt.attemptId ? "保存中..." : "保存修改"}</Button>
                        <Button variant="outline" className="border-[#7f1d1d] bg-[#2a1111] text-[#fecaca] hover:bg-[#3a1414]" onClick={() => void handleDelete(attempt.attemptId)} disabled={deletingAttemptId === attempt.attemptId}>{deletingAttemptId === attempt.attemptId ? "删除中..." : "删除这条 attempt"}</Button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {nextCursor ? (
          <div className="flex justify-center">
            <Button type="button" variant="outline" className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]" onClick={() => void loadAttempts(false, nextCursor)} disabled={loadingMore}>
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
          priceLineEditorReadOnlyHint="只读回放：按保存时的三条线和 x 轴位置展示。"
          priceLineValue={{
            entry: previewAttempt.entryLineYPercent,
            stopLoss: previewAttempt.stopLossLineYPercent,
            takeProfit: previewAttempt.takeProfitLineYPercent,
          }}
          onClose={() => setPreviewAttempt(null)}
        />
      ) : null}
    </TradePageShell>
  );
}
