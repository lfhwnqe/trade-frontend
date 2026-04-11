"use client";

import React from "react";
import TradePageShell from "../../components/trade-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUploader } from "@/components/common/ImageUploader";
import { DateCalendarPicker } from "@/components/common/DateCalendarPicker";
import { useAlert } from "@/components/common/alert";
import { ImagePreviewDialog } from "../../flashcard/components/ImagePreviewDialog";
import type { ImageResource } from "../../config";
import { TRADE_PERIOD_PRESETS } from "../../config";
import { fetchFlashcardTagOptions, fetchPlaybookTypeOptions } from "../../dictionary";
import { FLASHCARD_DIRECTIONS, FLASHCARD_LABELS, FLASHCARD_SYSTEM_OUTCOME_TYPES, type FlashcardDirection, type FlashcardSystemOutcomeType } from "../../flashcard/types";
import { convertTradeFlashcardToFlashcard, deleteTradeFlashcardCard, listTradeFlashcardCards, updateTradeFlashcardCard } from "../request";
import {
  TRADE_FLASHCARD_CARD_SORT_BYS,
  TRADE_FLASHCARD_CARD_SORT_ORDERS,
  TRADE_FLASHCARD_LABELS,
  TRADE_FLASHCARD_LIFECYCLE_STATUSES,
  TRADE_FLASHCARD_PROCESS_RESULTS,
  TRADE_FLASHCARD_TYPES,
  type TradeFlashcardCard,
  type TradeFlashcardCardSortBy,
  type TradeFlashcardCardSortOrder,
  type TradeFlashcardLifecycleStatus,
  type TradeFlashcardProcessResult,
  type TradeFlashcardType,
} from "../types";

const EMPTY_SELECT_VALUE = "__NONE__";
const SYMBOL_PAIR_HISTORY_KEY = "flashcard-symbol-pair-history";
const NOTE_TEMPLATE = `【交易前】
- 背景 / 市场环境：
- 核心观察：
- 计划剧本 / 触发条件：
- 风险点：

【交易中】
- 实际入场原因：
- 持仓过程中的变化：
- 是否有加减仓 / 调整止损：

【交易后】
- 实际结果：
- 做得好的地方：
- 可以改进的地方：`;

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

type TradeFlashcardQuery = {
  tradeFlashcardType: TradeFlashcardType | "";
  lifecycleStatus: TradeFlashcardLifecycleStatus | "";
  symbolPairInfo: string;
  playbookType: string;
  marketTimeInfo: string;
  sortBy: TradeFlashcardCardSortBy;
  sortOrder: TradeFlashcardCardSortOrder;
};

function encodeOffsetCursor(offset: number) {
  if (offset <= 0) return undefined;
  const json = JSON.stringify({ offset });
  if (typeof window !== "undefined" && typeof window.btoa === "function") {
    return window.btoa(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }
  return undefined;
}

export default function TradeFlashcardManagePage() {
  const [successAlert, errorAlert] = useAlert();
  const [items, setItems] = React.useState<TradeFlashcardCard[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [detailCard, setDetailCard] = React.useState<TradeFlashcardCard | null>(null);
  const [editingCard, setEditingCard] = React.useState<TradeFlashcardCard | null>(null);
  const [confirmConvertCardId, setConfirmConvertCardId] = React.useState<string | null>(null);
  const [preEntryImages, setPreEntryImages] = React.useState<ImageResource[]>([]);
  const [postEntryImages, setPostEntryImages] = React.useState<ImageResource[]>([]);
  const [progressImages, setProgressImages] = React.useState<ImageResource[]>([]);
  const [tradeFlashcardType, setTradeFlashcardType] = React.useState<TradeFlashcardType | "">("");
  const [processResult, setProcessResult] = React.useState<TradeFlashcardProcessResult | "">("");
  const [isSystemAligned, setIsSystemAligned] = React.useState<string>(EMPTY_SELECT_VALUE);
  const [marketTimeInfo, setMarketTimeInfo] = React.useState("");
  const [symbolPairInfo, setSymbolPairInfo] = React.useState("");
  const [symbolPairOptions, setSymbolPairOptions] = React.useState<string[]>([...TRADE_PERIOD_PRESETS]);
  const [playbookType, setPlaybookType] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [tagCodes, setTagCodes] = React.useState<string[]>([]);
  const [tagOptions, setTagOptions] = React.useState<Array<{ code: string; label: string; color?: string }>>([]);
  const [playbookTypeOptions, setPlaybookTypeOptions] = React.useState<Array<{ code: string; label: string; color?: string }>>([]);

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [totalItems, setTotalItems] = React.useState(0);

  const [convertingCard, setConvertingCard] = React.useState<TradeFlashcardCard | null>(null);
  const [convertExpectedAction, setConvertExpectedAction] = React.useState<FlashcardDirection>("LONG");
  const [convertSystemOutcomeType, setConvertSystemOutcomeType] = React.useState<FlashcardSystemOutcomeType>("SYSTEM_WIN");
  const [convertNotes, setConvertNotes] = React.useState("");
  const [converting, setConverting] = React.useState(false);
  const [copyingTemplate, setCopyingTemplate] = React.useState(false);

  const [queryForm, setQueryForm] = React.useState<TradeFlashcardQuery>({
    tradeFlashcardType: "",
    lifecycleStatus: "",
    symbolPairInfo: "",
    playbookType: "",
    marketTimeInfo: "",
    sortBy: "CREATED_AT",
    sortOrder: "desc",
  });
  const [activeQuery, setActiveQuery] = React.useState<TradeFlashcardQuery>({
    tradeFlashcardType: "",
    lifecycleStatus: "",
    symbolPairInfo: "",
    playbookType: "",
    marketTimeInfo: "",
    sortBy: "CREATED_AT",
    sortOrder: "desc",
  });

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const fetchPage = React.useCallback(async (targetPage: number, query: TradeFlashcardQuery, nextPageSize?: number) => {
    const resolvedPageSize = nextPageSize || pageSize;
    setLoading(true);
    try {
      const cursor = encodeOffsetCursor((targetPage - 1) * resolvedPageSize);
      const res = await listTradeFlashcardCards({
        pageSize: resolvedPageSize,
        cursor,
        tradeFlashcardType: query.tradeFlashcardType || undefined,
        lifecycleStatus: query.lifecycleStatus || undefined,
        symbolPairInfo: query.symbolPairInfo.trim() || undefined,
        playbookType: query.playbookType || undefined,
        marketTimeInfo: query.marketTimeInfo.trim() || undefined,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });
      setItems(res.items);
      setPage(targetPage);
      setPageSize(resolvedPageSize);
      setTotalItems(Math.max(res.totalCount, 0));
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "查询失败");
    } finally {
      setLoading(false);
    }
  }, [errorAlert, pageSize]);

  React.useEffect(() => { void fetchPage(1, activeQuery); }, [activeQuery, fetchPage]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(SYMBOL_PAIR_HISTORY_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return;
      const history = parsed
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);
      setSymbolPairOptions(Array.from(new Set([...TRADE_PERIOD_PRESETS, ...history])));
    } catch {}
  }, []);

  React.useEffect(() => {
    let mounted = true;
    fetchFlashcardTagOptions().then((items) => mounted && setTagOptions(items)).catch(() => mounted && setTagOptions([]));
    fetchPlaybookTypeOptions().then((items) => mounted && setPlaybookTypeOptions(items)).catch(() => mounted && setPlaybookTypeOptions([]));
    return () => { mounted = false; };
  }, []);

  const rememberSymbolPair = React.useCallback((value: string) => {
    const nextValue = value.trim();
    if (!nextValue || typeof window === "undefined") return;

    setSymbolPairOptions((prev) => {
      const merged = Array.from(new Set([nextValue, ...prev, ...TRADE_PERIOD_PRESETS])).slice(0, 20);
      window.localStorage.setItem(SYMBOL_PAIR_HISTORY_KEY, JSON.stringify(merged));
      return merged;
    });
  }, []);

  const handleCopyTemplate = React.useCallback(async () => {
    try {
      setCopyingTemplate(true);
      await navigator.clipboard.writeText(NOTE_TEMPLATE);
      if (!notes.trim()) setNotes(NOTE_TEMPLATE);
      successAlert("备注模板已复制");
    } catch {
      errorAlert("复制失败，请手动复制");
    } finally {
      setCopyingTemplate(false);
    }
  }, [errorAlert, notes, successAlert]);

  const openEdit = React.useCallback((card: TradeFlashcardCard) => {
    setEditingCard(card);
    setTradeFlashcardType(card.tradeFlashcardType);
    setProcessResult(card.processResult || "");
    setIsSystemAligned(typeof card.isSystemAligned === "boolean" ? String(card.isSystemAligned) : EMPTY_SELECT_VALUE);
    setPreEntryImages(card.preEntryImageUrl ? [{ key: card.preEntryImageUrl, url: card.preEntryImageUrl }] : []);
    setPostEntryImages(card.postEntryImageUrl ? [{ key: card.postEntryImageUrl, url: card.postEntryImageUrl }] : []);
    setProgressImages((card.progressImageUrls || []).map((url) => ({ key: url, url })));
    setMarketTimeInfo(card.marketTimeInfo || "");
    setSymbolPairInfo(card.symbolPairInfo || "");
    setPlaybookType(card.playbookType || "");
    setNotes(card.notes || "");
    setSummary(card.summary || "");
    setTagCodes(card.tagCodes || []);
  }, []);

  const handleSave = React.useCallback(async () => {
    if (!editingCard) return;
    if (!tradeFlashcardType || !preEntryImages[0]?.url) return errorAlert("类型和入场前截图不能为空");
    try {
      await updateTradeFlashcardCard(editingCard.cardId, {
        tradeFlashcardType,
        processResult: processResult || undefined,
        isSystemAligned: isSystemAligned === EMPTY_SELECT_VALUE ? undefined : isSystemAligned === "true",
        preEntryImageUrl: preEntryImages[0].url,
        postEntryImageUrl: postEntryImages[0]?.url || "",
        progressImageUrls: progressImages.map((item) => item.url).filter(Boolean),
        marketTimeInfo: marketTimeInfo.trim() || "",
        symbolPairInfo: symbolPairInfo.trim() || "",
        playbookType: playbookType || "",
        notes: notes.trim() || "",
        summary: summary.trim() || "",
        tagCodes,
      });
      rememberSymbolPair(symbolPairInfo);
      setEditingCard(null);
      successAlert("交易闪卡更新成功，过程状态已按图片自动重算");
      await fetchPage(page, activeQuery);
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "保存失败");
    }
  }, [activeQuery, editingCard, errorAlert, fetchPage, isSystemAligned, marketTimeInfo, notes, page, playbookType, postEntryImages, preEntryImages, processResult, progressImages, rememberSymbolPair, successAlert, summary, symbolPairInfo, tagCodes, tradeFlashcardType]);

  const handleDelete = React.useCallback(async (cardId: string) => {
    if (!window.confirm("确认删除这张交易闪卡吗？")) return;
    try {
      await deleteTradeFlashcardCard(cardId);
      successAlert("删除成功");
      const nextPage = items.length === 1 && page > 1 ? page - 1 : page;
      await fetchPage(nextPage, activeQuery);
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "删除失败");
    }
  }, [activeQuery, errorAlert, fetchPage, items.length, page, successAlert]);

  const handleConvert = React.useCallback(async () => {
    if (!convertingCard) return;
    setConverting(true);
    try {
      await convertTradeFlashcardToFlashcard(convertingCard.cardId, {
        expectedAction: convertExpectedAction,
        systemOutcomeType: convertSystemOutcomeType,
        notes: convertNotes.trim() || undefined,
      });
      setConvertingCard(null);
      setConfirmConvertCardId(null);
      setConvertNotes("");
      successAlert("已转换为常规训练闪卡");
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "转换失败");
    } finally {
      setConverting(false);
    }
  }, [convertExpectedAction, convertNotes, convertSystemOutcomeType, convertingCard, errorAlert, successAlert]);

  const handleQuerySubmit = React.useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActiveQuery({ ...queryForm });
  }, [queryForm]);

  const handleQueryReset = React.useCallback(() => {
    const emptyQuery: TradeFlashcardQuery = {
      tradeFlashcardType: "",
      lifecycleStatus: "",
      symbolPairInfo: "",
      playbookType: "",
      marketTimeInfo: "",
      sortBy: "CREATED_AT",
      sortOrder: "desc",
    };
    setQueryForm(emptyQuery);
    setActiveQuery(emptyQuery);
  }, []);

  return (
    <TradePageShell title="交易闪卡管理" subtitle="详情和编辑分开，避免误操作；转换动作也做二次确认" showAddButton={false}>
      <div className="space-y-6">
        <form onSubmit={handleQuerySubmit} className="grid gap-4 rounded-xl border border-[#27272a] bg-[#121212] p-4 md:grid-cols-4 xl:grid-cols-7">
          <Select value={queryForm.tradeFlashcardType || EMPTY_SELECT_VALUE} onValueChange={(value) => setQueryForm((prev) => ({ ...prev, tradeFlashcardType: value === EMPTY_SELECT_VALUE ? "" : (value as TradeFlashcardType) }))}>
            <SelectTrigger className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"><SelectValue placeholder="全部类型" /></SelectTrigger>
            <SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]"><SelectItem value={EMPTY_SELECT_VALUE}>全部类型</SelectItem>{TRADE_FLASHCARD_TYPES.map((item) => <SelectItem key={item} value={item}>{TRADE_FLASHCARD_LABELS[item]}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={queryForm.lifecycleStatus || EMPTY_SELECT_VALUE} onValueChange={(value) => setQueryForm((prev) => ({ ...prev, lifecycleStatus: value === EMPTY_SELECT_VALUE ? "" : (value as TradeFlashcardLifecycleStatus) }))}>
            <SelectTrigger className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"><SelectValue placeholder="全部状态" /></SelectTrigger>
            <SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]"><SelectItem value={EMPTY_SELECT_VALUE}>全部状态</SelectItem>{TRADE_FLASHCARD_LIFECYCLE_STATUSES.map((item) => <SelectItem key={item} value={item}>{TRADE_FLASHCARD_LABELS[item]}</SelectItem>)}</SelectContent>
          </Select>
          <Input value={queryForm.symbolPairInfo} onChange={(e) => setQueryForm((prev) => ({ ...prev, symbolPairInfo: e.target.value }))} placeholder="币对模糊筛选" className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]" />
          <Select value={queryForm.playbookType || EMPTY_SELECT_VALUE} onValueChange={(value) => setQueryForm((prev) => ({ ...prev, playbookType: value === EMPTY_SELECT_VALUE ? "" : value }))}>
            <SelectTrigger className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"><SelectValue placeholder="全部剧本" /></SelectTrigger>
            <SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]"><SelectItem value={EMPTY_SELECT_VALUE}>全部剧本</SelectItem>{playbookTypeOptions.map((item) => <SelectItem key={item.code} value={item.code}>{item.label}</SelectItem>)}</SelectContent>
          </Select>
          <Input value={queryForm.marketTimeInfo} onChange={(e) => setQueryForm((prev) => ({ ...prev, marketTimeInfo: e.target.value }))} placeholder="时间模糊筛选" className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]" />
          <Select value={queryForm.sortBy} onValueChange={(value) => setQueryForm((prev) => ({ ...prev, sortBy: value as TradeFlashcardCardSortBy }))}><SelectTrigger className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"><SelectValue /></SelectTrigger><SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]">{TRADE_FLASHCARD_CARD_SORT_BYS.map((item) => <SelectItem key={item} value={item}>{TRADE_FLASHCARD_LABELS[item]}</SelectItem>)}</SelectContent></Select>
          <Select value={queryForm.sortOrder} onValueChange={(value) => setQueryForm((prev) => ({ ...prev, sortOrder: value as TradeFlashcardCardSortOrder }))}><SelectTrigger className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"><SelectValue /></SelectTrigger><SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]">{TRADE_FLASHCARD_CARD_SORT_ORDERS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
          <div className="md:col-span-4 xl:col-span-7 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-[#71717a]">共 {totalItems} 条，当前第 {page} / {totalPages} 页</div>
            <div className="flex gap-2"><Button type="button" variant="outline" className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]" onClick={handleQueryReset}>重置</Button><Button type="submit" className="bg-[#00c2b2] text-black hover:bg-[#009e91]">查询</Button></div>
          </div>
        </form>

        <div className="space-y-4">
          {loading ? <div className="text-sm text-[#9ca3af]">加载中...</div> : null}
          {!loading && items.length === 0 ? <div className="rounded-xl border border-dashed border-[#27272a] bg-[#121212] p-8 text-center text-sm text-[#9ca3af]">暂无交易闪卡</div> : null}
          {items.map((card) => {
            const confirmMode = confirmConvertCardId === card.cardId;
            const canConvert = card.lifecycleStatus === "COMPLETED" && !card.convertedToFlashcardAt;
            const convertTitle = card.convertedToFlashcardAt
              ? `已于 ${formatDateTime(card.convertedToFlashcardAt)} 转为训练闪卡`
              : canConvert
                ? "把这条已完成记录转为常规训练闪卡"
                : "仅已完成的交易闪卡可转为常规训练闪卡";
            return (
              <div key={card.cardId} className="rounded-xl border border-[#27272a] bg-[#121212] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-[#e5e7eb]">
                      <span className="rounded-full bg-[#1e1e1e] px-2 py-1 text-xs">{TRADE_FLASHCARD_LABELS[card.tradeFlashcardType]}</span>
                      <span className="rounded-full bg-[#1e1e1e] px-2 py-1 text-xs">{TRADE_FLASHCARD_LABELS[card.lifecycleStatus]}</span>
                      {card.processResult ? <span className="rounded-full bg-[#1e1e1e] px-2 py-1 text-xs">结果：{TRADE_FLASHCARD_LABELS[card.processResult]}</span> : null}
                      {card.convertedToFlashcardAt ? <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">{TRADE_FLASHCARD_LABELS.CONVERTED_TO_FLASHCARD}</span> : null}
                    </div>
                    <div className="text-xs text-[#71717a]">创建于 {formatDateTime(card.createdAt)}，更新于 {formatDateTime(card.updatedAt)}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]" onClick={() => setDetailCard(card)}>详情</Button>
                    <Button variant="outline" className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]" onClick={() => openEdit(card)}>编辑</Button>
                    {confirmMode ? (
                      <>
                        <Button variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20" onClick={() => { setConvertingCard(card); setConfirmConvertCardId(null); }} disabled={!canConvert}>确认转换</Button>
                        <Button variant="outline" className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]" onClick={() => setConfirmConvertCardId(null)}>取消</Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        className={canConvert ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20" : "border-[#27272a] bg-[#1e1e1e] text-[#71717a] hover:bg-[#1e1e1e]"}
                        onClick={() => canConvert ? setConfirmConvertCardId(card.cardId) : undefined}
                        disabled={!canConvert}
                        title={convertTitle}
                      >
                        {card.convertedToFlashcardAt ? "已转训练闪卡" : "转训练闪卡"}
                      </Button>
                    )}
                    <Button variant="outline" className="border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20" onClick={() => void handleDelete(card.cardId)}>删除</Button>
                  </div>
                </div>
                <div className="mt-4 space-y-4">
                  <TradeFlashcardMetaSummary card={card} playbookTypeOptions={playbookTypeOptions} />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <ImageBlock title="入场前" url={card.preEntryImageUrl} onPreview={setPreviewUrl} compact />
                    <ImageBlock title="入场后" url={card.postEntryImageUrl} onPreview={setPreviewUrl} compact />
                    <ImageGalleryBlock title="走势截图" urls={card.progressImageUrls || []} onPreview={setPreviewUrl} compact />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#27272a] bg-[#121212] px-4 py-3">
          <div className="text-sm text-[#9ca3af]">第 {page} / {totalPages} 页，共 {totalItems} 条</div>
          <div className="flex items-center gap-2"><Select value={String(pageSize)} onValueChange={(value) => void fetchPage(1, activeQuery, Number(value))}><SelectTrigger className="h-9 w-[90px] border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"><SelectValue /></SelectTrigger><SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]">{[10, 20, 50, 100].map((size) => <SelectItem key={size} value={String(size)}>{size}</SelectItem>)}</SelectContent></Select><Button type="button" variant="outline" className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]" disabled={loading || page <= 1} onClick={() => void fetchPage(page - 1, activeQuery)}>上一页</Button><Button type="button" variant="outline" className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]" disabled={loading || page >= totalPages} onClick={() => void fetchPage(page + 1, activeQuery)}>下一页</Button></div>
        </div>
      </div>

      <Dialog open={!!detailCard} onOpenChange={(open) => !open && setDetailCard(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border border-[#27272a] bg-[#121212] text-[#e5e7eb] sm:max-w-4xl">
          <DialogHeader><DialogTitle>交易闪卡详情</DialogTitle></DialogHeader>
          {detailCard ? <ReadonlyContent card={detailCard} playbookTypeOptions={playbookTypeOptions} onPreview={setPreviewUrl} /> : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingCard} onOpenChange={(open) => !open && setEditingCard(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border border-[#27272a] bg-[#121212] text-[#e5e7eb] sm:max-w-4xl">
          <DialogHeader><DialogTitle>编辑交易闪卡</DialogTitle></DialogHeader>
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="类型"><Select value={tradeFlashcardType} onValueChange={(value) => setTradeFlashcardType(value as TradeFlashcardType)}><SelectTrigger className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"><SelectValue /></SelectTrigger><SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]">{TRADE_FLASHCARD_TYPES.map((item) => <SelectItem key={item} value={item}>{TRADE_FLASHCARD_LABELS[item]}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="自动状态"><div className="h-9 rounded-md border border-[#27272a] bg-[#1e1e1e] px-3 flex items-center text-sm text-[#9ca3af]">将根据截图自动计算</div></Field>
              <Field label="过程结果"><Select value={processResult || EMPTY_SELECT_VALUE} onValueChange={(value) => setProcessResult(value === EMPTY_SELECT_VALUE ? "" : (value as TradeFlashcardProcessResult))}><SelectTrigger className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"><SelectValue placeholder="未设置" /></SelectTrigger><SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]"><SelectItem value={EMPTY_SELECT_VALUE}>未设置</SelectItem>{TRADE_FLASHCARD_PROCESS_RESULTS.map((item) => <SelectItem key={item} value={item}>{TRADE_FLASHCARD_LABELS[item]}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="是否符合交易系统"><Select value={isSystemAligned} onValueChange={setIsSystemAligned}><SelectTrigger className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"><SelectValue placeholder="未设置" /></SelectTrigger><SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]"><SelectItem value={EMPTY_SELECT_VALUE}>未设置</SelectItem><SelectItem value="true">符合</SelectItem><SelectItem value="false">不符合</SelectItem></SelectContent></Select></Field>
              <Field label="行情时间"><DateCalendarPicker analysisTime={marketTimeInfo} updateForm={(patch) => setMarketTimeInfo(patch.analysisTime)} showSeconds={false} placeholder="选择行情时间" /></Field>
              <Field label="币对"><><Input value={symbolPairInfo} onChange={(e) => setSymbolPairInfo(e.target.value)} onBlur={(e) => rememberSymbolPair(e.target.value)} list="trade-flashcard-symbol-pair-presets" className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]" /><datalist id="trade-flashcard-symbol-pair-presets">{symbolPairOptions.map((item) => <option key={item} value={item} />)}</datalist></></Field>
              <Field label="剧本类型"><Select value={playbookType || EMPTY_SELECT_VALUE} onValueChange={(value) => setPlaybookType(value === EMPTY_SELECT_VALUE ? "" : value)}><SelectTrigger className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"><SelectValue placeholder="选择剧本类型" /></SelectTrigger><SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]"><SelectItem value={EMPTY_SELECT_VALUE}>未设置</SelectItem>{playbookTypeOptions.map((item) => <SelectItem key={item.code} value={item.code}>{item.label}</SelectItem>)}</SelectContent></Select></Field>
            </div>
            <Field label="字典标签"><div className="flex flex-wrap gap-2 rounded-xl border border-[#27272a] bg-[#1e1e1e] p-3">{tagOptions.map((item) => { const active = tagCodes.includes(item.code); return <button key={item.code} type="button" onClick={() => setTagCodes((prev) => prev.includes(item.code) ? prev.filter((code) => code !== item.code) : [...prev, item.code])} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition ${active ? "border-[#00c2b2] bg-[#00c2b2]/20 text-[#00c2b2]" : "border-[#27272a] bg-[#121212] text-[#e5e7eb] hover:bg-[#242424]"}`}>{item.color ? <span className="inline-block h-2.5 w-2.5 rounded-full border border-white/20" style={{ backgroundColor: item.color }} /> : null}{item.label}</button>; })}</div></Field>
            <div className="grid gap-6 md:grid-cols-3"><UploadCard title="入场前截图"><ImageUploader value={preEntryImages} onChange={setPreEntryImages} max={1} /></UploadCard><UploadCard title="入场后截图"><ImageUploader value={postEntryImages} onChange={setPostEntryImages} max={1} /></UploadCard><UploadCard title="走势截图"><ImageUploader value={progressImages} onChange={setProgressImages} max={5} /></UploadCard></div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-[#9ca3af]">备注</div>
                  <div className="mt-1 text-[11px] text-[#71717a]">编辑时也可以一键复制复盘模板</div>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]" onClick={() => setNotes((prev) => (prev.trim() ? `${prev.trim()}\n\n${NOTE_TEMPLATE}` : NOTE_TEMPLATE))}>插入模板</Button>
                  <Button type="button" variant="outline" className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]" onClick={() => void handleCopyTemplate()} disabled={copyingTemplate}>{copyingTemplate ? "复制中..." : "一键复制模板"}</Button>
                </div>
              </div>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-24 border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]" />
            </div>
            <Field label="总结"><Textarea value={summary} onChange={(e) => setSummary(e.target.value)} className="min-h-24 border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]" /></Field>
          </div>
          <DialogFooter><Button variant="outline" className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]" onClick={() => setEditingCard(null)}>取消</Button><Button className="bg-[#00c2b2] text-black hover:bg-[#009e91]" onClick={() => void handleSave()}>保存</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!convertingCard} onOpenChange={(open) => !open && setConvertingCard(null)}>
        <DialogContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb] sm:max-w-2xl">
          <DialogHeader><DialogTitle>转为常规训练闪卡</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Field label="标准动作"><Select value={convertExpectedAction} onValueChange={(value) => setConvertExpectedAction(value as FlashcardDirection)}><SelectTrigger className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"><SelectValue /></SelectTrigger><SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]">{FLASHCARD_DIRECTIONS.map((item) => <SelectItem key={item} value={item}>{FLASHCARD_LABELS[item]}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="系统结果分类"><Select value={convertSystemOutcomeType} onValueChange={(value) => setConvertSystemOutcomeType(value as FlashcardSystemOutcomeType)}><SelectTrigger className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"><SelectValue /></SelectTrigger><SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]">{FLASHCARD_SYSTEM_OUTCOME_TYPES.map((item) => <SelectItem key={item} value={item}>{FLASHCARD_LABELS[item]}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="补充说明"><Textarea value={convertNotes} onChange={(e) => setConvertNotes(e.target.value)} className="min-h-24 border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]" /></Field>
          </div>
          <DialogFooter><Button variant="outline" className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]" onClick={() => setConvertingCard(null)}>取消</Button><Button className="bg-[#00c2b2] text-black hover:bg-[#009e91]" disabled={converting} onClick={() => void handleConvert()}>{converting ? "转换中..." : "确认转换"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ImagePreviewDialog previewUrl={previewUrl} onClose={() => setPreviewUrl(null)} />
    </TradePageShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><div className="text-xs text-[#9ca3af]">{label}</div>{children}</div>;
}

function UploadCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><div className="mb-2 text-sm font-medium">{title}</div>{children}</div>;
}

function getPlaybookLabel(playbookTypeOptions: Array<{ code: string; label: string }>, playbookType?: string) {
  if (!playbookType) return "--";
  return playbookTypeOptions.find((item) => item.code === playbookType)?.label || playbookType;
}

function ImageBlock({ title, url, onPreview, compact = false }: { title: string; url?: string; onPreview: (url: string) => void; compact?: boolean }) {
  return <div className="space-y-2"><div className="text-sm font-medium text-[#e5e7eb]">{title}</div><button type="button" className={`relative aspect-video w-full overflow-hidden rounded border border-[#27272a] bg-[#0f0f10] ${compact ? "max-w-[320px]" : ""}`} onClick={() => url && onPreview(url)}>{url ? <img src={url} alt={title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-[#71717a]">暂无</div>}</button></div>;
}

function ImageGalleryBlock({ title, urls, onPreview, compact = false }: { title: string; urls: string[]; onPreview: (url: string) => void; compact?: boolean }) {
  return <div className="space-y-2"><div className="text-sm font-medium text-[#e5e7eb]">{title}</div><div className={`grid gap-2 ${compact ? "grid-cols-2" : "grid-cols-3"}`}>{urls.map((url) => <button key={url} type="button" className="relative aspect-video overflow-hidden rounded border border-[#27272a] bg-[#0f0f10]" onClick={() => onPreview(url)}><img src={url} alt="progress" className="h-full w-full object-cover" /></button>)}{!urls.length ? <div className="flex aspect-video items-center justify-center rounded border border-dashed border-[#27272a] bg-[#0f0f10] text-xs text-[#71717a]">暂无</div> : null}</div></div>;
}

function TradeFlashcardMetaSummary({ card, playbookTypeOptions }: { card: TradeFlashcardCard; playbookTypeOptions: Array<{ code: string; label: string }> }) {
  const metaItems = [
    { label: "币对", value: card.symbolPairInfo || "--" },
    { label: "时间", value: card.marketTimeInfo || "--" },
    { label: "剧本", value: getPlaybookLabel(playbookTypeOptions, card.playbookType) },
    { label: "系统一致性", value: typeof card.isSystemAligned === "boolean" ? (card.isSystemAligned ? "符合" : "不符合") : "--" },
    { label: "转换状态", value: card.convertedToFlashcardAt ? `已转换（${formatDateTime(card.convertedToFlashcardAt)}）` : "未转换" },
    { label: "标签", value: card.tagItems?.length ? card.tagItems.map((item) => item.label).join(" / ") : "--" },
    { label: "总结", value: card.summary || card.notes || "--" },
  ];

  return (
    <div className="grid gap-3 rounded-xl border border-[#27272a] bg-[#0f0f10] p-3 md:grid-cols-2 xl:grid-cols-3">
      {metaItems.map((item) => (
        <div key={item.label} className="min-w-0 space-y-1">
          <div className="text-xs text-[#71717a]">{item.label}</div>
          <div className="truncate text-sm text-[#d4d4d8]" title={item.value}>{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function ReadonlyContent({ card, playbookTypeOptions, onPreview }: { card: TradeFlashcardCard; playbookTypeOptions: Array<{ code: string; label: string }>; onPreview: (url: string) => void; }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 text-sm text-[#cbd5e1]">
        <div>类型：{TRADE_FLASHCARD_LABELS[card.tradeFlashcardType]}</div>
        <div>状态：{TRADE_FLASHCARD_LABELS[card.lifecycleStatus]}</div>
        <div>结果：{card.processResult ? TRADE_FLASHCARD_LABELS[card.processResult] : "--"}</div>
        <div>是否符合系统：{typeof card.isSystemAligned === "boolean" ? (card.isSystemAligned ? "符合" : "不符合") : "--"}</div>
        <div>时间：{card.marketTimeInfo || "--"}</div>
        <div>币对：{card.symbolPairInfo || "--"}</div>
        <div className="md:col-span-2">剧本：{getPlaybookLabel(playbookTypeOptions, card.playbookType)}</div>
        <div className="md:col-span-2">备注：{card.notes || "--"}</div>
        <div className="md:col-span-2">总结：{card.summary || "--"}</div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <ImageBlock title="入场前" url={card.preEntryImageUrl} onPreview={onPreview} />
        <ImageBlock title="入场后" url={card.postEntryImageUrl} onPreview={onPreview} />
        <ImageGalleryBlock title="走势截图" urls={card.progressImageUrls || []} onPreview={onPreview} />
      </div>
      <div className="flex flex-wrap gap-2">{(card.tagItems || []).map((item) => <span key={item.code} className="inline-flex items-center gap-2 rounded-full border border-[#27272a] bg-[#1e1e1e] px-3 py-1 text-xs text-[#e5e7eb]">{item.color ? <span className="inline-block h-2.5 w-2.5 rounded-full border border-white/20" style={{ backgroundColor: item.color }} /> : null}{item.label}</span>)}{!(card.tagItems || []).length ? <span className="text-xs text-[#71717a]">无标签</span> : null}</div>
    </div>
  );
}
