"use client";

import React from "react";
import TradePageShell from "../../components/trade-page-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAlert } from "@/components/common/alert";
import {
  deleteFlashcardCard,
  listFlashcardCards,
  updateFlashcardNote,
} from "../request";
import {
  FLASHCARD_CONTEXTS,
  FLASHCARD_DIRECTIONS,
  FLASHCARD_LABELS,
  FLASHCARD_ORDER_FLOW_FEATURES,
  FLASHCARD_RESULTS,
  type FlashcardCard,
  type FlashcardContext,
  type FlashcardDirection,
  type FlashcardOrderFlowFeature,
  type FlashcardResult,
} from "../types";
import { ImagePreviewDialog } from "../components/ImagePreviewDialog";

type Option<T extends string> = T | "all";

export default function FlashcardManagePage() {
  const [successAlert, errorAlert] = useAlert();

  const [items, setItems] = React.useState<FlashcardCard[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [editingCard, setEditingCard] = React.useState<FlashcardCard | null>(null);
  const [editingNote, setEditingNote] = React.useState("");
  const [savingNote, setSavingNote] = React.useState(false);

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);

  // page N 的起始 cursor 存在 index N-1；只放 ref，避免触发 useEffect 循环
  const cursorStackRef = React.useRef<(string | undefined)[]>([undefined]);

  const [direction, setDirection] = React.useState<Option<FlashcardDirection>>("all");
  const [context, setContext] = React.useState<Option<FlashcardContext>>("all");
  const [orderFlowFeature, setOrderFlowFeature] = React.useState<Option<FlashcardOrderFlowFeature>>("all");
  const [result, setResult] = React.useState<Option<FlashcardResult>>("all");

  const fetchPage = React.useCallback(
    async (targetPage: number, opts?: { resetCursor?: boolean; resetFilters?: boolean }) => {
      const resetCursor = opts?.resetCursor === true;
      const resetFilters = opts?.resetFilters === true;

      setLoading(true);
      try {
        const cursor = resetCursor
          ? undefined
          : cursorStackRef.current[targetPage - 1];

        const res = await listFlashcardCards({
          pageSize,
          cursor,
          direction: resetFilters || direction === "all" ? undefined : direction,
          context: resetFilters || context === "all" ? undefined : context,
          orderFlowFeature:
            resetFilters || orderFlowFeature === "all"
              ? undefined
              : orderFlowFeature,
          result: resetFilters || result === "all" ? undefined : result,
        });

        setItems(res.items);
        setNextCursor(res.nextCursor);
        setPage(targetPage);

        if (resetCursor) {
          cursorStackRef.current = [undefined, res.nextCursor || undefined];
        } else {
          const nextStack = [...cursorStackRef.current];
          if (res.nextCursor) {
            nextStack[targetPage] = res.nextCursor;
          } else {
            nextStack.length = targetPage;
          }
          cursorStackRef.current = nextStack;
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : "查询失败";
        errorAlert(msg);
      } finally {
        setLoading(false);
      }
    },
    [context, direction, errorAlert, orderFlowFeature, pageSize, result],
  );

  React.useEffect(() => {
    void fetchPage(1, { resetCursor: true });
  }, [fetchPage]);

  const handleApplyFilters = React.useCallback(async () => {
    await fetchPage(1, { resetCursor: true });
  }, [fetchPage]);

  const handleResetFilters = React.useCallback(async () => {
    setDirection("all");
    setContext("all");
    setOrderFlowFeature("all");
    setResult("all");
    await fetchPage(1, { resetCursor: true, resetFilters: true });
  }, [fetchPage]);

  const openNoteDialog = React.useCallback((card: FlashcardCard) => {
    setEditingCard(card);
    setEditingNote(card.notes || "");
  }, []);

  const handleSaveNote = React.useCallback(async () => {
    if (!editingCard) return;

    setSavingNote(true);
    try {
      const updated = await updateFlashcardNote(editingCard.cardId, editingNote);
      setItems((prev) =>
        prev.map((item) => (item.cardId === updated.cardId ? { ...item, ...updated } : item)),
      );
      setEditingCard(null);
      successAlert("备注已保存");
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "保存备注失败");
    } finally {
      setSavingNote(false);
    }
  }, [editingCard, editingNote, errorAlert, successAlert]);

  const handleDeleteCard = React.useCallback(
    async (card: FlashcardCard) => {
      const confirmed = window.confirm("确认删除这张闪卡吗？删除后不可恢复。");
      if (!confirmed) return;

      try {
        await deleteFlashcardCard(card.cardId);
        setItems((prev) => prev.filter((item) => item.cardId !== card.cardId));
        successAlert("闪卡已删除");
      } catch (error) {
        errorAlert(error instanceof Error ? error.message : "删除闪卡失败");
      }
    },
    [errorAlert, successAlert],
  );

  return (
    <TradePageShell title="闪卡管理" subtitle="题目图 / 答案图 / 后续方向 / 闪卡备注" showAddButton={false}>
      <div className="w-full space-y-4">
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Select value={direction} onValueChange={(v) => setDirection(v as Option<FlashcardDirection>)}>
              <SelectTrigger className="w-full h-9 bg-[#1e1e1e] border border-[#27272a] text-[#e5e7eb] focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400">
                <SelectValue placeholder="方向" />
              </SelectTrigger>
              <SelectContent className="bg-[#121212] border border-[#27272a] text-[#e5e7eb]">
                <SelectItem value="all">方向：全部</SelectItem>
                {FLASHCARD_DIRECTIONS.map((item) => (
                  <SelectItem key={item} value={item}>{FLASHCARD_LABELS[item]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={context} onValueChange={(v) => setContext(v as Option<FlashcardContext>)}>
              <SelectTrigger className="w-full h-9 bg-[#1e1e1e] border border-[#27272a] text-[#e5e7eb] focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400">
                <SelectValue placeholder="结构" />
              </SelectTrigger>
              <SelectContent className="bg-[#121212] border border-[#27272a] text-[#e5e7eb]">
                <SelectItem value="all">结构：全部</SelectItem>
                {FLASHCARD_CONTEXTS.map((item) => (
                  <SelectItem key={item} value={item}>{FLASHCARD_LABELS[item]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={orderFlowFeature} onValueChange={(v) => setOrderFlowFeature(v as Option<FlashcardOrderFlowFeature>)}>
              <SelectTrigger className="w-full h-9 bg-[#1e1e1e] border border-[#27272a] text-[#e5e7eb] focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400">
                <SelectValue placeholder="订单流" />
              </SelectTrigger>
              <SelectContent className="bg-[#121212] border border-[#27272a] text-[#e5e7eb]">
                <SelectItem value="all">订单流：全部</SelectItem>
                {FLASHCARD_ORDER_FLOW_FEATURES.map((item) => (
                  <SelectItem key={item} value={item}>{FLASHCARD_LABELS[item]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={result} onValueChange={(v) => setResult(v as Option<FlashcardResult>)}>
              <SelectTrigger className="w-full h-9 bg-[#1e1e1e] border border-[#27272a] text-[#e5e7eb] focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400">
                <SelectValue placeholder="结果" />
              </SelectTrigger>
              <SelectContent className="bg-[#121212] border border-[#27272a] text-[#e5e7eb]">
                <SelectItem value="all">结果：全部</SelectItem>
                {FLASHCARD_RESULTS.map((item) => (
                  <SelectItem key={item} value={item}>{FLASHCARD_LABELS[item]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
            <select
              className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] px-2 rounded text-sm"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              {[10, 20, 50].map((sz) => (
                <option key={sz} value={sz}>{sz}条/页</option>
              ))}
            </select>
            <Button type="button" variant="outline" className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1e1e1e]" onClick={handleResetFilters}>
              重置
            </Button>
            <Button type="button" className="bg-[#00c2b2] text-black hover:bg-[#009e91]" onClick={handleApplyFilters}>
              查询
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-[#27272a] bg-[#121212] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[860px]">
              <TableHeader>
                <TableRow className="bg-black/20 border-b border-[#27272a]">
                  <TableHead className="text-[#9ca3af] text-xs uppercase">题目图</TableHead>
                  <TableHead className="text-[#9ca3af] text-xs uppercase">答案图</TableHead>
                  <TableHead className="text-[#9ca3af] text-xs uppercase">后续方向</TableHead>
                  <TableHead className="text-[#9ca3af] text-xs uppercase">闪卡备注</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-[#9ca3af]">加载中...</TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-[#9ca3af]">暂无数据</TableCell>
                  </TableRow>
                ) : (
                  items.map((card) => (
                    <TableRow key={card.cardId} className="border-b border-[#27272a] hover:bg-[#1e1e1e]">
                      <TableCell>
                        <button type="button" onClick={() => setPreviewUrl(card.questionImageUrl)}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={card.questionImageUrl} alt="question" className="h-14 w-20 rounded object-cover border border-[#27272a]" />
                        </button>
                      </TableCell>
                      <TableCell>
                        <button type="button" onClick={() => setPreviewUrl(card.answerImageUrl)}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={card.answerImageUrl} alt="answer" className="h-14 w-20 rounded object-cover border border-[#27272a]" />
                        </button>
                      </TableCell>
                      <TableCell className="text-[#e5e7eb] text-sm">
                        {FLASHCARD_LABELS[card.expectedAction || card.direction]}
                      </TableCell>
                      <TableCell className="max-w-[320px]">
                        <div className="flex items-center justify-between gap-3">
                          <div className="truncate text-sm text-[#9ca3af]" title={card.notes || ""}>
                            {card.notes?.trim() || "-"}
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1e1e1e]"
                            onClick={() => openNoteDialog(card)}
                          >
                            编辑
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 border-rose-700/40 bg-transparent text-rose-300 hover:bg-rose-900/20"
                            onClick={() => void handleDeleteCard(card)}
                          >
                            删除
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between gap-2 px-3 py-3 border-t border-[#27272a] bg-[#121212]">
            <div className="text-sm text-[#9ca3af]">第 {page} 页</div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1e1e1e]"
                disabled={page <= 1 || loading}
                onClick={() => fetchPage(page - 1)}
              >
                上一页
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1e1e1e]"
                disabled={!nextCursor || loading}
                onClick={() => fetchPage(page + 1)}
              >
                下一页
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ImagePreviewDialog previewUrl={previewUrl} onClose={() => setPreviewUrl(null)} />
      <Dialog
        open={Boolean(editingCard)}
        onOpenChange={(open) => {
          if (!open && !savingNote) {
            setEditingCard(null);
          }
        }}
      >
        <DialogContent className="border-[#27272a] bg-[#121212] text-[#e5e7eb]">
          <DialogHeader>
            <DialogTitle>编辑闪卡备注</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-xs text-[#9ca3af]">
              卡片 ID：{editingCard?.cardId}
            </div>
            <Textarea
              value={editingNote}
              onChange={(event) => setEditingNote(event.target.value)}
              placeholder="输入备注内容（留空表示清空）"
              className="min-h-28 border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"
              disabled={savingNote}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1e1e1e]"
              onClick={() => setEditingCard(null)}
              disabled={savingNote}
            >
              取消
            </Button>
            <Button
              type="button"
              className="bg-[#00c2b2] text-black hover:bg-[#009e91]"
              onClick={() => void handleSaveNote()}
              disabled={savingNote}
            >
              {savingNote ? "保存中..." : "保存备注"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TradePageShell>
  );
}
