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
import type { ImageResource } from "../../config";
import { fetchFlashcardTagOptions, fetchPlaybookTypeOptions } from "../../dictionary";
import { deleteTradeFlashcardCard, listTradeFlashcardCards, updateTradeFlashcardCard } from "../request";
import {
  TRADE_FLASHCARD_CARD_SORT_BYS,
  TRADE_FLASHCARD_CARD_SORT_ORDERS,
  TRADE_FLASHCARD_LABELS,
  TRADE_FLASHCARD_STATUSES,
  TRADE_FLASHCARD_TYPES,
  type TradeFlashcardCard,
  type TradeFlashcardCardSortBy,
  type TradeFlashcardCardSortOrder,
  type TradeFlashcardStatus,
  type TradeFlashcardType,
} from "../types";

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

const EMPTY_SELECT_VALUE = "__NONE__";

type TradeFlashcardQuery = {
  tradeFlashcardType: TradeFlashcardType | "";
  status: TradeFlashcardStatus | "";
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
  const [editingCard, setEditingCard] = React.useState<TradeFlashcardCard | null>(null);
  const [preEntryImages, setPreEntryImages] = React.useState<ImageResource[]>([]);
  const [postEntryImages, setPostEntryImages] = React.useState<ImageResource[]>([]);
  const [progressImages, setProgressImages] = React.useState<ImageResource[]>([]);
  const [tradeFlashcardType, setTradeFlashcardType] = React.useState<TradeFlashcardType | "">("");
  const [marketTimeInfo, setMarketTimeInfo] = React.useState("");
  const [symbolPairInfo, setSymbolPairInfo] = React.useState("");
  const [playbookType, setPlaybookType] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [tagCodes, setTagCodes] = React.useState<string[]>([]);
  const [tagOptions, setTagOptions] = React.useState<Array<{ code: string; label: string; color?: string }>>([]);
  const [playbookTypeOptions, setPlaybookTypeOptions] = React.useState<Array<{ code: string; label: string; color?: string }>>([]);

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [totalItems, setTotalItems] = React.useState(0);

  const [queryForm, setQueryForm] = React.useState<TradeFlashcardQuery>({
    tradeFlashcardType: "",
    status: "",
    symbolPairInfo: "",
    playbookType: "",
    marketTimeInfo: "",
    sortBy: "CREATED_AT",
    sortOrder: "desc",
  });
  const [activeQuery, setActiveQuery] = React.useState<TradeFlashcardQuery>({
    tradeFlashcardType: "",
    status: "",
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
        status: query.status || undefined,
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

  React.useEffect(() => {
    void fetchPage(1, activeQuery);
  }, [activeQuery, fetchPage]);

  React.useEffect(() => {
    let mounted = true;
    fetchFlashcardTagOptions().then((items) => mounted && setTagOptions(items)).catch(() => mounted && setTagOptions([]));
    fetchPlaybookTypeOptions().then((items) => mounted && setPlaybookTypeOptions(items)).catch(() => mounted && setPlaybookTypeOptions([]));
    return () => {
      mounted = false;
    };
  }, []);

  const openEdit = React.useCallback((card: TradeFlashcardCard) => {
    setEditingCard(card);
    setTradeFlashcardType(card.tradeFlashcardType);
    setPreEntryImages(card.preEntryImageUrl ? [{ key: card.preEntryImageUrl, url: card.preEntryImageUrl }] : []);
    setPostEntryImages(card.postEntryImageUrl ? [{ key: card.postEntryImageUrl, url: card.postEntryImageUrl }] : []);
    setProgressImages((card.progressImageUrls || []).map((url) => ({ key: url, url })));
    setMarketTimeInfo(card.marketTimeInfo || "");
    setSymbolPairInfo(card.symbolPairInfo || "");
    setPlaybookType(card.playbookType || "");
    setNotes(card.notes || "");
    setTagCodes(card.tagCodes || []);
  }, []);

  const handleSave = React.useCallback(async () => {
    if (!editingCard) return;
    if (!tradeFlashcardType || !preEntryImages[0]?.url) {
      errorAlert("类型和入场前截图不能为空");
      return;
    }
    try {
      await updateTradeFlashcardCard(editingCard.cardId, {
        tradeFlashcardType,
        preEntryImageUrl: preEntryImages[0].url,
        postEntryImageUrl: postEntryImages[0]?.url || "",
        progressImageUrls: progressImages.map((item) => item.url).filter(Boolean),
        marketTimeInfo: marketTimeInfo.trim() || "",
        symbolPairInfo: symbolPairInfo.trim() || "",
        playbookType: playbookType || "",
        notes: notes.trim() || "",
        tagCodes,
      });
      setEditingCard(null);
      successAlert("交易闪卡更新成功");
      await fetchPage(page, activeQuery);
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "保存失败");
    }
  }, [activeQuery, editingCard, errorAlert, fetchPage, marketTimeInfo, notes, page, playbookType, postEntryImages, preEntryImages, progressImages, successAlert, symbolPairInfo, tagCodes, tradeFlashcardType]);

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

  const handleQuerySubmit = React.useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActiveQuery({ ...queryForm });
  }, [queryForm]);

  const handleQueryReset = React.useCallback(() => {
    const emptyQuery: TradeFlashcardQuery = {
      tradeFlashcardType: "",
      status: "",
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
    <TradePageShell title="交易闪卡管理" subtitle="查看、筛选和编辑实盘 / 模拟盘生命周期闪卡" showAddButton={false}>
      <div className="space-y-6">
        <form onSubmit={handleQuerySubmit} className="grid gap-4 rounded-xl border border-[#27272a] bg-[#121212] p-4 md:grid-cols-4 xl:grid-cols-7">
          <Select value={queryForm.tradeFlashcardType || EMPTY_SELECT_VALUE} onValueChange={(value) => setQueryForm((prev) => ({ ...prev, tradeFlashcardType: value === EMPTY_SELECT_VALUE ? "" : (value as TradeFlashcardType) }))}>
            <SelectTrigger className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"><SelectValue placeholder="全部类型" /></SelectTrigger>
            <SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]"><SelectItem value={EMPTY_SELECT_VALUE}>全部类型</SelectItem>{TRADE_FLASHCARD_TYPES.map((item) => <SelectItem key={item} value={item}>{TRADE_FLASHCARD_LABELS[item]}</SelectItem>)}</SelectContent>
          </Select>

          <Select value={queryForm.status || EMPTY_SELECT_VALUE} onValueChange={(value) => setQueryForm((prev) => ({ ...prev, status: value === EMPTY_SELECT_VALUE ? "" : (value as TradeFlashcardStatus) }))}>
            <SelectTrigger className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"><SelectValue placeholder="全部状态" /></SelectTrigger>
            <SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]"><SelectItem value={EMPTY_SELECT_VALUE}>全部状态</SelectItem>{TRADE_FLASHCARD_STATUSES.map((item) => <SelectItem key={item} value={item}>{TRADE_FLASHCARD_LABELS[item]}</SelectItem>)}</SelectContent>
          </Select>

          <Input value={queryForm.symbolPairInfo} onChange={(e) => setQueryForm((prev) => ({ ...prev, symbolPairInfo: e.target.value }))} placeholder="币对模糊筛选" className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]" />

          <Select value={queryForm.playbookType || EMPTY_SELECT_VALUE} onValueChange={(value) => setQueryForm((prev) => ({ ...prev, playbookType: value === EMPTY_SELECT_VALUE ? "" : value }))}>
            <SelectTrigger className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"><SelectValue placeholder="全部剧本" /></SelectTrigger>
            <SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]"><SelectItem value={EMPTY_SELECT_VALUE}>全部剧本</SelectItem>{playbookTypeOptions.map((item) => <SelectItem key={item.code} value={item.code}>{item.label}</SelectItem>)}</SelectContent>
          </Select>

          <Input value={queryForm.marketTimeInfo} onChange={(e) => setQueryForm((prev) => ({ ...prev, marketTimeInfo: e.target.value }))} placeholder="时间模糊筛选" className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]" />

          <Select value={queryForm.sortBy} onValueChange={(value) => setQueryForm((prev) => ({ ...prev, sortBy: value as TradeFlashcardCardSortBy }))}>
            <SelectTrigger className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"><SelectValue /></SelectTrigger>
            <SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]">{TRADE_FLASHCARD_CARD_SORT_BYS.map((item) => <SelectItem key={item} value={item}>{TRADE_FLASHCARD_LABELS[item]}</SelectItem>)}</SelectContent>
          </Select>

          <Select value={queryForm.sortOrder} onValueChange={(value) => setQueryForm((prev) => ({ ...prev, sortOrder: value as TradeFlashcardCardSortOrder }))}>
            <SelectTrigger className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"><SelectValue /></SelectTrigger>
            <SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]">{TRADE_FLASHCARD_CARD_SORT_ORDERS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
          </Select>

          <div className="md:col-span-4 xl:col-span-7 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-[#71717a]">共 {totalItems} 条，当前第 {page} / {totalPages} 页</div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]" onClick={handleQueryReset}>重置</Button>
              <Button type="submit" className="bg-[#00c2b2] text-black hover:bg-[#009e91]">查询</Button>
            </div>
          </div>
        </form>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-[#27272a] bg-[#121212] px-4 py-3">
          <div className="text-sm text-[#a1a1aa]">支持按类型、状态、币对、剧本、时间分页查看</div>
          <div className="flex items-center gap-2 text-sm text-[#e5e7eb]">
            <span className="text-[#9ca3af]">每页</span>
            <Select value={String(pageSize)} onValueChange={(value) => void fetchPage(1, activeQuery, Number(value))}>
              <SelectTrigger className="h-9 w-[90px] border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"><SelectValue /></SelectTrigger>
              <SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]">{[10, 20, 50, 100].map((size) => <SelectItem key={size} value={String(size)}>{size}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? <div className="text-sm text-[#9ca3af]">加载中...</div> : null}
          {!loading && items.length === 0 ? <div className="rounded-xl border border-dashed border-[#27272a] bg-[#121212] p-8 text-center text-sm text-[#9ca3af]">暂无交易闪卡</div> : null}
          {items.map((card) => (
            <div key={card.cardId} className="rounded-xl border border-[#27272a] bg-[#121212] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-[#e5e7eb]">
                    <span className="rounded-full bg-[#1e1e1e] px-2 py-1 text-xs">{TRADE_FLASHCARD_LABELS[card.tradeFlashcardType]}</span>
                    <span className="rounded-full bg-[#1e1e1e] px-2 py-1 text-xs">{TRADE_FLASHCARD_LABELS[card.status]}</span>
                    {card.symbolPairInfo ? <span className="text-xs text-[#9ca3af]">{card.symbolPairInfo}</span> : null}
                    {card.playbookType ? <span className="text-xs text-[#9ca3af]">剧本：{playbookTypeOptions.find((item) => item.code === card.playbookType)?.label || card.playbookType}</span> : null}
                  </div>
                  <div className="text-xs text-[#71717a]">创建于 {formatDateTime(card.createdAt)}，更新于 {formatDateTime(card.updatedAt)}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]" onClick={() => openEdit(card)}>编辑</Button>
                  <Button variant="outline" className="border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20" onClick={() => void handleDelete(card.cardId)}>删除</Button>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <ImageBlock title="入场前" url={card.preEntryImageUrl} />
                <ImageBlock title="入场后" url={card.postEntryImageUrl} />
                <div className="space-y-2">
                  <div className="text-sm font-medium text-[#e5e7eb]">走势截图</div>
                  <div className="grid grid-cols-3 gap-2">
                    {(card.progressImageUrls || []).map((url) => (
                      <div key={url} className="relative aspect-video overflow-hidden rounded border border-[#27272a] bg-[#0f0f10]">
                        <img src={url} alt="progress" className="h-full w-full object-cover" />
                      </div>
                    ))}
                    {(card.progressImageUrls || []).length === 0 ? <div className="text-xs text-[#71717a]">暂无</div> : null}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-2 text-sm text-[#cbd5e1] md:grid-cols-2">
                <div>时间：{card.marketTimeInfo || "--"}</div>
                <div>剧本：{playbookTypeOptions.find((item) => item.code === card.playbookType)?.label || card.playbookType || "--"}</div>
                <div className="md:col-span-2">备注：{card.notes || "--"}</div>
                <div className="md:col-span-2 flex flex-wrap gap-2">
                  {(card.tagItems || []).map((item) => (
                    <span key={item.code} className="inline-flex items-center gap-2 rounded-full border border-[#27272a] bg-[#1e1e1e] px-3 py-1 text-xs text-[#e5e7eb]">
                      {item.color ? <span className="inline-block h-2.5 w-2.5 rounded-full border border-white/20" style={{ backgroundColor: item.color }} /> : null}
                      {item.label}
                    </span>
                  ))}
                  {!(card.tagItems || []).length ? <span className="text-xs text-[#71717a]">无标签</span> : null}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#27272a] bg-[#121212] px-4 py-3">
          <div className="text-sm text-[#9ca3af]">第 {page} / {totalPages} 页，共 {totalItems} 条</div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]" disabled={loading || page <= 1} onClick={() => void fetchPage(page - 1, activeQuery)}>上一页</Button>
            <Button type="button" variant="outline" className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]" disabled={loading || page >= totalPages} onClick={() => void fetchPage(page + 1, activeQuery)}>下一页</Button>
          </div>
        </div>
      </div>

      <Dialog open={!!editingCard} onOpenChange={(open) => !open && setEditingCard(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border border-[#27272a] bg-[#121212] text-[#e5e7eb] sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>编辑交易闪卡</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-xs text-[#9ca3af]">类型</div>
                <Select value={tradeFlashcardType} onValueChange={(value) => setTradeFlashcardType(value as TradeFlashcardType)}>
                  <SelectTrigger className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"><SelectValue /></SelectTrigger>
                  <SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]">{TRADE_FLASHCARD_TYPES.map((item) => <SelectItem key={item} value={item}>{TRADE_FLASHCARD_LABELS[item]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="text-xs text-[#9ca3af]">行情时间</div>
                <DateCalendarPicker analysisTime={marketTimeInfo} updateForm={(patch) => setMarketTimeInfo(patch.analysisTime)} showSeconds={false} placeholder="选择行情时间" />
              </div>
              <div className="space-y-2">
                <div className="text-xs text-[#9ca3af]">币对</div>
                <Input value={symbolPairInfo} onChange={(e) => setSymbolPairInfo(e.target.value)} className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]" />
              </div>
              <div className="space-y-2">
                <div className="text-xs text-[#9ca3af]">剧本类型</div>
                <Select value={playbookType || EMPTY_SELECT_VALUE} onValueChange={(value) => setPlaybookType(value === EMPTY_SELECT_VALUE ? "" : value)}>
                  <SelectTrigger className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"><SelectValue placeholder="选择剧本类型" /></SelectTrigger>
                  <SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]"><SelectItem value={EMPTY_SELECT_VALUE}>未设置</SelectItem>{playbookTypeOptions.map((item) => <SelectItem key={item.code} value={item.code}>{item.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-[#9ca3af]">字典标签</div>
              <div className="flex flex-wrap gap-2 rounded-xl border border-[#27272a] bg-[#1e1e1e] p-3">
                {tagOptions.map((item) => {
                  const active = tagCodes.includes(item.code);
                  return (
                    <button key={item.code} type="button" onClick={() => setTagCodes((prev) => prev.includes(item.code) ? prev.filter((code) => code !== item.code) : [...prev, item.code])} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition ${active ? "border-[#00c2b2] bg-[#00c2b2]/20 text-[#00c2b2]" : "border-[#27272a] bg-[#121212] text-[#e5e7eb] hover:bg-[#242424]"}`}>
                      {item.color ? <span className="inline-block h-2.5 w-2.5 rounded-full border border-white/20" style={{ backgroundColor: item.color }} /> : null}
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div><div className="mb-2 text-sm font-medium">入场前截图</div><ImageUploader value={preEntryImages} onChange={setPreEntryImages} max={1} /></div>
              <div><div className="mb-2 text-sm font-medium">入场后截图</div><ImageUploader value={postEntryImages} onChange={setPostEntryImages} max={1} /></div>
              <div><div className="mb-2 text-sm font-medium">走势截图</div><ImageUploader value={progressImages} onChange={setProgressImages} max={5} /></div>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-[#9ca3af]">备注</div>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-24 border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]" onClick={() => setEditingCard(null)}>取消</Button>
            <Button className="bg-[#00c2b2] text-black hover:bg-[#009e91]" onClick={() => void handleSave()}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TradePageShell>
  );
}

function ImageBlock({ title, url }: { title: string; url?: string }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-[#e5e7eb]">{title}</div>
      <div className="relative aspect-video overflow-hidden rounded border border-[#27272a] bg-[#0f0f10]">
        {url ? <img src={url} alt={title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-[#71717a]">暂无</div>}
      </div>
    </div>
  );
}
