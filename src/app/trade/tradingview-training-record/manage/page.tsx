"use client";

import React from "react";
import Link from "next/link";
import { Edit3, Eye, Plus, RefreshCw, Search, Star, Trash2 } from "lucide-react";
import TradePageShell from "../../components/trade-page-shell";
import { FitImagePreview } from "@/components/common/FitImagePreview";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAlert } from "@/components/common/alert";
import { fetchPlaybookTypeOptions } from "../../dictionary";
import {
  deleteTradingViewTrainingRecord,
  getTradingViewTrainingRecordUploadUrl,
  listTradingViewTrainingRecords,
  updateTradingViewTrainingRecord,
} from "../request";
import type {
  TradingViewTrainingRecord,
  TradingViewTrainingRecordResult,
} from "../types";
import { TRADINGVIEW_TRAINING_RECORD_LABELS } from "../types";
import {
  getRecordThumbnail,
  flattenStageImages,
  hasRequiredStageImages,
  hasStagedImages,
  recordToCarouselSlides,
  recordToStageImages,
  StageImageCarousel,
  StageImageEditor,
  stageImagesToPayload,
  type TvtrStageImagesState,
} from "../image-stages";

const ALL_VALUE = "__ALL__";
const EMPTY_SELECT_VALUE = "__NONE__";
const TVTR_SYMBOL_OPTIONS = ["BTCUSDT", "BTCUSDC", "ETHUSDT", "ETHUSDC"] as const;

type DictionaryOption = { code: string; label: string; color?: string };

type EditDraft = {
  stageImages: TvtrStageImagesState;
  symbolPair: string;
  playbookType: string;
  tradeResult: TradingViewTrainingRecordResult;
  entryConfidenceRating: 1 | 2 | 3 | 4 | 5;
  reviewCandleTime: string;
  notes: string;
};

function encodeOffsetCursor(offset: number) {
  if (offset <= 0) return undefined;
  const json = JSON.stringify({ offset });
  if (typeof window === "undefined" || typeof window.btoa !== "function") return undefined;
  return window.btoa(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export default function TradingViewTrainingRecordManagePage() {
  const [successAlert, errorAlert] = useAlert();
  const [items, setItems] = React.useState<TradingViewTrainingRecord[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [playbookFilter, setPlaybookFilter] = React.useState(ALL_VALUE);
  const [symbolFilter, setSymbolFilter] = React.useState("");
  const [resultFilter, setResultFilter] = React.useState<"ALL" | TradingViewTrainingRecordResult>("ALL");
  const [confidenceFilter, setConfidenceFilter] = React.useState<"ALL" | "1" | "2" | "3" | "4" | "5">("ALL");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [keyword, setKeyword] = React.useState("");
  const [playbookOptions, setPlaybookOptions] = React.useState<DictionaryOption[]>([]);
  const [detailRecord, setDetailRecord] = React.useState<TradingViewTrainingRecord | null>(null);
  const [editingRecord, setEditingRecord] = React.useState<TradingViewTrainingRecord | null>(null);
  const [draft, setDraft] = React.useState<EditDraft | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const playbookLabelMap = React.useMemo(
    () => new Map(playbookOptions.map((item) => [item.code, item.label])),
    [playbookOptions],
  );

  const uploadUrlResolverFactory = React.useCallback(
    (scope: Parameters<typeof getTradingViewTrainingRecordUploadUrl>[0]["scope"] = "training-image") =>
    (params: { fileName: string; contentType: string }) =>
      getTradingViewTrainingRecordUploadUrl({
        fileName: params.fileName,
        contentType: params.contentType,
        scope,
      }),
    [],
  );

  const fetchPage = React.useCallback(async (targetPage: number, targetPageSize: number) => {
    setLoading(true);
    try {
      const res = await listTradingViewTrainingRecords({
        pageSize: targetPageSize,
        cursor: encodeOffsetCursor((targetPage - 1) * targetPageSize),
        playbookType: playbookFilter === ALL_VALUE ? undefined : playbookFilter,
        symbolPair: symbolFilter.trim() || undefined,
        tradeResult: resultFilter === "ALL" ? undefined : resultFilter,
        entryConfidenceRating: confidenceFilter === "ALL" ? undefined : (Number(confidenceFilter) as 1 | 2 | 3 | 4 | 5),
        from: from ? new Date(from).toISOString() : undefined,
        to: to ? new Date(to).toISOString() : undefined,
        keyword: keyword.trim() || undefined,
      });
      setItems(res.items);
      setTotalCount(res.totalCount);
      setPage(targetPage);
      setPageSize(targetPageSize);
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "查询失败");
    } finally {
      setLoading(false);
    }
  }, [confidenceFilter, errorAlert, from, keyword, playbookFilter, resultFilter, symbolFilter, to]);

  React.useEffect(() => {
    let mounted = true;
    fetchPlaybookTypeOptions()
      .then((items) => mounted && setPlaybookOptions(items))
      .catch(() => mounted && setPlaybookOptions([]));
    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    fetchPage(1, pageSize);
  }, [fetchPage, pageSize]);

  const openEdit = (record: TradingViewTrainingRecord) => {
    setEditingRecord(record);
    setDraft({
      stageImages: recordToStageImages(record),
      symbolPair: record.symbolPair || "",
      playbookType: record.playbookType,
      tradeResult: record.tradeResult,
      entryConfidenceRating: record.entryConfidenceRating,
      reviewCandleTime: toDatetimeLocalValue(record.reviewCandleTime),
      notes: record.notes || "",
    });
  };

  const handleSave = async () => {
    if (!editingRecord || !draft) return;
    const stagedPayloadIsComplete = hasRequiredStageImages(draft.stageImages);
    const existingRecordHasStages = hasStagedImages(editingRecord);
    if (existingRecordHasStages && !stagedPayloadIsComplete) {
      errorAlert("分析开始时图片、挂单图片、离场时图片都至少需要 1 张");
      return;
    }
    if (!draft.playbookType) {
      errorAlert("请选择剧本类型");
      return;
    }
    setSaving(true);
    try {
      const stagePayload = stageImagesToPayload(draft.stageImages);
      const legacyImage = stagePayload.analysisStartImages[0] || {
        imageUrl: editingRecord.imageUrl || "",
        imageKey: editingRecord.imageKey,
      };
      await updateTradingViewTrainingRecord(editingRecord.recordId, {
        ...(stagedPayloadIsComplete ? stagePayload : {}),
        imageUrl: legacyImage.imageUrl,
        imageKey: legacyImage.imageKey,
        symbolPair: draft.symbolPair.trim().toUpperCase(),
        playbookType: draft.playbookType,
        tradeResult: draft.tradeResult,
        entryConfidenceRating: draft.entryConfidenceRating,
        reviewCandleTime: draft.reviewCandleTime ? new Date(draft.reviewCandleTime).toISOString() : null,
        notes: draft.notes,
      });
      successAlert("已保存");
      setEditingRecord(null);
      setDraft(null);
      await fetchPage(page, pageSize);
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record: TradingViewTrainingRecord) => {
    if (!window.confirm("确认删除这条 TradingView 训练记录？")) return;
    try {
      await deleteTradingViewTrainingRecord(record.recordId);
      successAlert("已删除");
      await fetchPage(page, pageSize);
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "删除失败");
    }
  };

  return (
    <TradePageShell title="TradingView 训练记录管理" subtitle="分页管理手动复盘训练样本" showAddButton={false}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-[#27272a] bg-[#121212] p-4">
          <FilterSelect label="剧本" value={playbookFilter} onValueChange={setPlaybookFilter} widthClass="w-56">
            <SelectItem value={ALL_VALUE}>全部剧本</SelectItem>
            {playbookOptions.map((item) => (
              <SelectItem key={item.code} value={item.code}>{item.label}</SelectItem>
            ))}
          </FilterSelect>
          <div className="w-40">
            <label className="mb-2 block text-xs text-[#a1a1aa]">币对</label>
            <Input value={symbolFilter} onChange={(event) => setSymbolFilter(event.target.value.toUpperCase())} placeholder="BTCUSDT" className="border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]" />
          </div>
          <FilterSelect label="结果" value={resultFilter} onValueChange={(value) => setResultFilter(value as "ALL" | TradingViewTrainingRecordResult)} widthClass="w-36">
            <SelectItem value="ALL">全部结果</SelectItem>
            <SelectItem value="WIN">盈利</SelectItem>
            <SelectItem value="LOSS">亏损</SelectItem>
            <SelectItem value="BREAKEVEN">保本</SelectItem>
            <SelectItem value="NOT_ENTERED">暂未入场</SelectItem>
            <SelectItem value="NOT_EXITED">未离场</SelectItem>
          </FilterSelect>
          <FilterSelect label="把握度" value={confidenceFilter} onValueChange={(value) => setConfidenceFilter(value as typeof confidenceFilter)} widthClass="w-32">
            <SelectItem value="ALL">全部</SelectItem>
            {[1, 2, 3, 4, 5].map((rating) => <SelectItem key={rating} value={String(rating)}>{rating} 星</SelectItem>)}
          </FilterSelect>
          <div className="w-44">
            <label className="mb-2 block text-xs text-[#a1a1aa]">开始时间</label>
            <Input type="datetime-local" value={from} onChange={(event) => setFrom(event.target.value)} className="border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]" />
          </div>
          <div className="w-44">
            <label className="mb-2 block text-xs text-[#a1a1aa]">结束时间</label>
            <Input type="datetime-local" value={to} onChange={(event) => setTo(event.target.value)} className="border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]" />
          </div>
          <div className="w-56">
            <label className="mb-2 block text-xs text-[#a1a1aa]">备注关键词</label>
            <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索备注" className="border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]" />
          </div>
          <Button onClick={() => fetchPage(1, pageSize)} disabled={loading} className="bg-[#00c2b2] text-black hover:bg-[#14b8a6]">
            <Search className="mr-2 h-4 w-4" />查询
          </Button>
          <Button variant="outline" onClick={() => fetchPage(page, pageSize)} disabled={loading} className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1f1f22]">
            <RefreshCw className="mr-2 h-4 w-4" />刷新
          </Button>
          <Button asChild className="ml-auto bg-[#00c2b2] text-black hover:bg-[#14b8a6]">
            <Link href="/trade/tradingview-training-record/create"><Plus className="mr-2 h-4 w-4" />新增</Link>
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#27272a] bg-[#121212]">
          <div className="grid min-w-[1260px] grid-cols-[92px_110px_minmax(150px,190px)_100px_110px_minmax(220px,1fr)_150px_150px_150px_160px] border-b border-[#27272a] bg-[#18181b] px-4 py-3 text-xs font-medium text-[#a1a1aa]">
            <div>图片</div><div>币对</div><div>剧本</div><div>结果</div><div>把握度</div><div>备注</div><div>复盘 K 线时间</div><div>创建时间</div><div>更新时间</div><div className="text-right">操作</div>
          </div>
          {loading ? (
            <div className="p-8 text-center text-sm text-[#71717a]">加载中...</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#71717a]">暂无数据</div>
          ) : items.map((record) => {
            const thumbnailUrl = getRecordThumbnail(record);
            return (
            <div key={record.recordId} className="grid min-w-[1260px] grid-cols-[92px_110px_minmax(150px,190px)_100px_110px_minmax(220px,1fr)_150px_150px_150px_160px] items-center border-b border-[#27272a] px-4 py-3 text-sm last:border-0">
              <button type="button" onClick={() => thumbnailUrl && setPreviewUrl(thumbnailUrl)} className="h-16 w-16 overflow-hidden rounded-md border border-[#27272a] bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {thumbnailUrl ? <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" /> : null}
              </button>
              <div className="font-medium text-[#e5e7eb]">{record.symbolPair || "-"}</div>
              <div className="font-medium text-[#e5e7eb]">{record.playbookItem?.label || playbookLabelMap.get(record.playbookType) || record.playbookType}</div>
              <div className={`font-medium ${getResultTextClass(record.tradeResult)}`}>
                {TRADINGVIEW_TRAINING_RECORD_LABELS[record.tradeResult]}
              </div>
              <StarDisplay value={record.entryConfidenceRating} />
              <div className="line-clamp-2 pr-4 text-[#a1a1aa]">{record.notes || "无备注"}</div>
              <div className="text-xs text-[#a1a1aa]">{formatDateTime(record.reviewCandleTime)}</div>
              <div className="text-xs text-[#a1a1aa]">{formatDateTime(record.createdAt)}</div>
              <div className="text-xs text-[#a1a1aa]">{formatDateTime(record.updatedAt)}</div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setDetailRecord(record)} className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1f1f22]"><Eye className="h-4 w-4" /></Button>
                <Button size="sm" variant="outline" onClick={() => openEdit(record)} className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1f1f22]"><Edit3 className="h-4 w-4" /></Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(record)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[#a1a1aa]">
          <div>共 {totalCount} 条，当前第 {page} / {totalPages} 页</div>
          <div className="flex items-center gap-2">
            <Select value={String(pageSize)} onValueChange={(value) => fetchPage(1, Number(value))}>
              <SelectTrigger className="h-9 w-28 border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]"><SelectValue /></SelectTrigger>
              <SelectContent className="border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                {[10, 20, 50, 100].map((size) => <SelectItem key={size} value={String(size)}>{size} 条</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" disabled={page <= 1 || loading} onClick={() => fetchPage(page - 1, pageSize)} className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1f1f22]">上一页</Button>
            <Button variant="outline" disabled={page >= totalPages || loading} onClick={() => fetchPage(page + 1, pageSize)} className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1f1f22]">下一页</Button>
          </div>
        </div>
      </div>

      <Dialog open={!!editingRecord && !!draft} onOpenChange={(open) => !open && (setEditingRecord(null), setDraft(null))}>
        <DialogContent className="max-h-[calc(100vh-32px)] w-[min(1120px,calc(100vw-32px))] max-w-none overflow-y-auto border-[#27272a] bg-[#121212] text-[#e5e7eb] sm:max-w-none">
          <DialogHeader><DialogTitle>编辑 TradingView 训练记录</DialogTitle></DialogHeader>
          {draft ? (
            <div className="space-y-6">
              <StageImageCarousel slides={flattenStageImages(draft.stageImages)} onPreview={setPreviewUrl} />
              <div className="grid min-w-0 gap-4 md:grid-cols-2">
                <Field label="交易币对">
                  <Select value={draft.symbolPair || EMPTY_SELECT_VALUE} onValueChange={(value) => setDraft((prev) => prev ? { ...prev, symbolPair: value === EMPTY_SELECT_VALUE ? "" : value } : prev)}>
                    <SelectTrigger className="w-full border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]"><SelectValue /></SelectTrigger>
                    <SelectContent className="border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                      <SelectItem value={EMPTY_SELECT_VALUE}>不填写</SelectItem>
                      {TVTR_SYMBOL_OPTIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="剧本类型">
                  <Select value={draft.playbookType} onValueChange={(value) => setDraft((prev) => prev ? { ...prev, playbookType: value } : prev)}>
                    <SelectTrigger className="w-full border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]"><SelectValue /></SelectTrigger>
                    <SelectContent className="border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                      {playbookOptions.map((item) => <SelectItem key={item.code} value={item.code}>{item.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="交易结果">
                  <Select value={draft.tradeResult} onValueChange={(value) => setDraft((prev) => prev ? { ...prev, tradeResult: value as TradingViewTrainingRecordResult } : prev)}>
                    <SelectTrigger className="w-full border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]"><SelectValue /></SelectTrigger>
                    <SelectContent className="border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                      <SelectItem value="WIN">盈利</SelectItem>
                      <SelectItem value="LOSS">亏损</SelectItem>
                      <SelectItem value="BREAKEVEN">保本</SelectItem>
                      <SelectItem value="NOT_ENTERED">暂未入场</SelectItem>
                      <SelectItem value="NOT_EXITED">未离场</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="入场时把握度"><StarEditor value={draft.entryConfidenceRating} onChange={(value) => setDraft((prev) => prev ? { ...prev, entryConfidenceRating: value } : prev)} /></Field>
                <Field label="复盘 K 线时间"><Input type="datetime-local" value={draft.reviewCandleTime} onChange={(event) => setDraft((prev) => prev ? { ...prev, reviewCandleTime: event.target.value } : prev)} className="w-full border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]" /></Field>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium">备注</label>
                  <Textarea value={draft.notes} onChange={(event) => setDraft((prev) => prev ? { ...prev, notes: event.target.value } : prev)} className="min-h-36 border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]" />
                </div>
              </div>
              <div>
                <div className="mb-3 text-sm font-semibold text-white">过程图片编辑</div>
                <StageImageEditor
                  value={draft.stageImages}
                  onChange={(stageImages) => setDraft((prev) => prev ? { ...prev, stageImages } : prev)}
                  uploadUrlResolverFactory={uploadUrlResolverFactory}
                  compact
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => (setEditingRecord(null), setDraft(null))} className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1f1f22]">取消</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#00c2b2] text-black hover:bg-[#14b8a6]">{saving ? "保存中..." : "保存"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailRecord} onOpenChange={(open) => !open && setDetailRecord(null)}>
        <DialogContent className="max-h-[calc(100vh-32px)] w-[min(1120px,calc(100vw-32px))] max-w-none overflow-y-auto border-[#27272a] bg-[#121212] text-[#e5e7eb] sm:max-w-none">
          <DialogHeader>
            <DialogTitle>TradingView 训练记录详情</DialogTitle>
          </DialogHeader>
          {detailRecord ? (
            <div className="space-y-4">
              <StageImageCarousel slides={recordToCarouselSlides(detailRecord)} onPreview={setPreviewUrl} />
              <div className="grid gap-3 rounded-lg border border-[#27272a] bg-[#0f0f10] p-4 text-sm md:grid-cols-2">
                <div><span className="text-[#a1a1aa]">币对：</span>{detailRecord.symbolPair || "-"}</div>
                <div><span className="text-[#a1a1aa]">剧本：</span>{detailRecord.playbookItem?.label || playbookLabelMap.get(detailRecord.playbookType) || detailRecord.playbookType}</div>
                <div><span className="text-[#a1a1aa]">结果：</span>{TRADINGVIEW_TRAINING_RECORD_LABELS[detailRecord.tradeResult]}</div>
                <div><span className="text-[#a1a1aa]">把握度：</span>{detailRecord.entryConfidenceRating} 星</div>
                <div><span className="text-[#a1a1aa]">创建时间：</span>{formatDateTime(detailRecord.createdAt)}</div>
                <div><span className="text-[#a1a1aa]">复盘 K 线：</span>{formatDateTime(detailRecord.reviewCandleTime)}</div>
                <div className="md:col-span-2">
                  <div className="mb-1 text-[#a1a1aa]">整条备注</div>
                  <div className="whitespace-pre-wrap leading-6 text-[#e5e7eb]">{detailRecord.notes || "无备注"}</div>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="flex h-[calc(100vh-24px)] max-h-none w-[calc(100vw-24px)] max-w-none items-center justify-center gap-0 overflow-hidden border-[#27272a] bg-[#121212] p-1 sm:max-w-none">
          {previewUrl ? <FitImagePreview src={previewUrl} alt="TradingView 训练记录图片预览" /> : null}
        </DialogContent>
      </Dialog>
    </TradePageShell>
  );
}

function FilterSelect({ label, value, onValueChange, widthClass, children }: { label: string; value: string; onValueChange: (value: string) => void; widthClass: string; children: React.ReactNode }) {
  return (
    <div className={widthClass}>
      <label className="mb-2 block text-xs text-[#a1a1aa]">{label}</label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]"><SelectValue /></SelectTrigger>
        <SelectContent className="border-[#27272a] bg-[#121212] text-[#e5e7eb]">{children}</SelectContent>
      </Select>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="min-w-0"><label className="mb-2 block text-sm font-medium">{label}</label>{children}</div>;
}

function getResultTextClass(result: TradingViewTrainingRecordResult) {
  if (result === "WIN") return "text-[#22c55e]";
  if (result === "LOSS") return "text-[#ef4444]";
  if (result === "NOT_ENTERED") return "text-[#a1a1aa]";
  if (result === "NOT_EXITED") return "text-[#38bdf8]";
  return "text-[#f59e0b]";
}

function StarDisplay({ value }: { value: number }) {
  return <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((rating) => <Star key={rating} className={`h-4 w-4 ${rating <= value ? "fill-[#facc15] text-[#facc15]" : "text-[#52525b]"}`} />)}</div>;
}

function StarEditor({ value, onChange }: { value: 1 | 2 | 3 | 4 | 5; onChange: (value: 1 | 2 | 3 | 4 | 5) => void }) {
  return <div className="flex min-h-10 flex-wrap items-center gap-1">{[1, 2, 3, 4, 5].map((rating) => <button key={rating} type="button" onClick={() => onChange(rating as 1 | 2 | 3 | 4 | 5)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#27272a] bg-[#0f0f10] hover:bg-[#1f1f22]"><Star className={`h-5 w-5 ${rating <= value ? "fill-[#facc15] text-[#facc15]" : "text-[#71717a]"}`} /></button>)}</div>;
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", { hour12: false });
}

function toDatetimeLocalValue(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}
