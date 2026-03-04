"use client";

import React from "react";
import { format } from "date-fns";
import TradePageShell from "../../components/trade-page-shell";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAlert } from "@/components/common/alert";
import { deleteFlashcardCard, listFlashcardCards } from "../request";
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

type Option<T extends string> = T | "all";

export default function FlashcardManagePage() {
  const [, errorAlert] = useAlert();

  const [items, setItems] = React.useState<FlashcardCard[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

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

  const handleDelete = React.useCallback(
    async (cardId: string) => {
      const ok = window.confirm("确认删除这张闪卡吗？");
      if (!ok) return;

      setDeletingId(cardId);
      try {
        await deleteFlashcardCard(cardId);
        setItems((prev) => prev.filter((it) => it.cardId !== cardId));
      } catch (error) {
        const msg = error instanceof Error ? error.message : "删除失败";
        errorAlert(msg);
      } finally {
        setDeletingId(null);
      }
    },
    [errorAlert],
  );

  return (
    <TradePageShell title="闪卡管理" subtitle="参考交易列表：筛选、表格、分页、删除" showAddButton={false}>
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
            <Table className="min-w-[980px]">
              <TableHeader>
                <TableRow className="bg-black/20 border-b border-[#27272a]">
                  <TableHead className="text-[#9ca3af] text-xs uppercase">时间</TableHead>
                  <TableHead className="text-[#9ca3af] text-xs uppercase">题目图</TableHead>
                  <TableHead className="text-[#9ca3af] text-xs uppercase">答案图</TableHead>
                  <TableHead className="text-[#9ca3af] text-xs uppercase">方向</TableHead>
                  <TableHead className="text-[#9ca3af] text-xs uppercase">结构</TableHead>
                  <TableHead className="text-[#9ca3af] text-xs uppercase">订单流</TableHead>
                  <TableHead className="text-[#9ca3af] text-xs uppercase">结果</TableHead>
                  <TableHead className="text-[#9ca3af] text-xs uppercase">备注</TableHead>
                  <TableHead className="text-[#9ca3af] text-xs uppercase">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-[#9ca3af]">加载中...</TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-[#9ca3af]">暂无数据</TableCell>
                  </TableRow>
                ) : (
                  items.map((card) => (
                    <TableRow key={card.cardId} className="border-b border-[#27272a] hover:bg-[#1e1e1e]">
                      <TableCell className="text-[#e5e7eb] text-sm min-w-[140px]">
                        {format(new Date(card.createdAt), "yyyy-MM-dd HH:mm")}
                      </TableCell>
                      <TableCell>
                        <button type="button" onClick={() => window.open(card.questionImageUrl, "_blank")}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={card.questionImageUrl} alt="question" className="h-14 w-20 rounded object-cover border border-[#27272a]" />
                        </button>
                      </TableCell>
                      <TableCell>
                        <button type="button" onClick={() => window.open(card.answerImageUrl, "_blank")}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={card.answerImageUrl} alt="answer" className="h-14 w-20 rounded object-cover border border-[#27272a]" />
                        </button>
                      </TableCell>
                      <TableCell className="text-[#e5e7eb] text-sm">{FLASHCARD_LABELS[card.direction]}</TableCell>
                      <TableCell className="text-[#e5e7eb] text-sm">{FLASHCARD_LABELS[card.context]}</TableCell>
                      <TableCell className="text-[#e5e7eb] text-sm max-w-[180px] truncate" title={FLASHCARD_LABELS[card.orderFlowFeature]}>
                        {FLASHCARD_LABELS[card.orderFlowFeature]}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#00c2b2]/15 text-[#00c2b2] border border-[#00c2b2]/30">
                          {FLASHCARD_LABELS[card.result]}
                        </span>
                      </TableCell>
                      <TableCell className="text-[#9ca3af] text-sm max-w-[220px] truncate" title={card.notes || ""}>
                        {card.notes || "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(card.cardId)}
                          disabled={deletingId === card.cardId}
                        >
                          {deletingId === card.cardId ? "删除中..." : "删除"}
                        </Button>
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
    </TradePageShell>
  );
}
