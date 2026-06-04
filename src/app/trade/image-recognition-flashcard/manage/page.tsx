"use client";

import React from "react";
import Link from "next/link";
import { Edit3, Eye, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import TradePageShell from "../../components/trade-page-shell";
import { FitImagePreview } from "@/components/common/FitImagePreview";
import { ImageUploader } from "@/components/common/ImageUploader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAlert } from "@/components/common/alert";
import { fetchPlaybookTypeOptions } from "../../dictionary";
import type { ImageResource } from "../../config";
import {
  deleteImageRecognitionFlashcardCard,
  getImageRecognitionFlashcardUploadUrl,
  listImageRecognitionFlashcardCards,
  updateImageRecognitionFlashcardCard,
} from "../request";
import type {
  ImageRecognitionFlashcardCard,
  ImageRecognitionFlashcardPlaybookStat,
  ImageRecognitionFlashcardSampleResult,
  ImageRecognitionFlashcardStatus,
  ImageRecognitionFlashcardStatusFilter,
} from "../types";
import { IMAGE_RECOGNITION_FLASHCARD_LABELS } from "../types";
import { useImageRecognitionFlashcardAdminAccess } from "../use-image-recognition-flashcard-admin-access";

const ALL_VALUE = "__ALL__";
const STATUS_FILTER_OPTIONS: Array<{ value: ImageRecognitionFlashcardStatusFilter; label: string }> = [
  { value: "ALL", label: "全部" },
  { value: "ACTIVE", label: "启用" },
  { value: "DISABLED", label: "停用" },
];

type DictionaryOption = { code: string; label: string; color?: string };

type EditDraft = {
  image: ImageResource[];
  playbookType: string;
  sampleResult: ImageRecognitionFlashcardSampleResult;
  notes: string;
  status: ImageRecognitionFlashcardStatus;
};

function encodeOffsetCursor(offset: number) {
  if (offset <= 0) return undefined;
  const json = JSON.stringify({ offset });
  if (typeof window === "undefined" || typeof window.btoa !== "function") return undefined;
  return window.btoa(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export default function ImageRecognitionFlashcardManagePage() {
  const { loaded, isAdmin } = useImageRecognitionFlashcardAdminAccess();

  if (!loaded) {
    return (
      <TradePageShell title="图片识别闪卡管理" subtitle="正在确认权限" showAddButton={false}>
        <div className="rounded-lg border border-[#27272a] bg-[#121212] p-6 text-sm text-[#a1a1aa]">加载中...</div>
      </TradePageShell>
    );
  }

  if (!isAdmin) {
    return (
      <TradePageShell title="无权限访问" subtitle="图片识别题库由管理员维护" showAddButton={false}>
        <div className="rounded-lg border border-[#27272a] bg-[#121212] p-6 text-sm text-[#a1a1aa]">
          当前账号不能管理图片识别闪卡。你仍然可以进入训练页浏览系统题库。
        </div>
      </TradePageShell>
    );
  }

  return <ImageRecognitionFlashcardManageContent />;
}

function ImageRecognitionFlashcardManageContent() {
  const [successAlert, errorAlert] = useAlert();
  const [items, setItems] = React.useState<ImageRecognitionFlashcardCard[]>([]);
  const [playbookStats, setPlaybookStats] = React.useState<ImageRecognitionFlashcardPlaybookStat[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [playbookFilter, setPlaybookFilter] = React.useState(ALL_VALUE);
  const [sampleResultFilter, setSampleResultFilter] = React.useState<"ALL" | ImageRecognitionFlashcardSampleResult>("ALL");
  const [statusFilter, setStatusFilter] = React.useState<ImageRecognitionFlashcardStatusFilter>("ALL");
  const [keyword, setKeyword] = React.useState("");
  const [playbookOptions, setPlaybookOptions] = React.useState<DictionaryOption[]>([]);
  const [editingCard, setEditingCard] = React.useState<ImageRecognitionFlashcardCard | null>(null);
  const [draft, setDraft] = React.useState<EditDraft | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const playbookLabelMap = React.useMemo(
    () => new Map(playbookOptions.map((item) => [item.code, item.label])),
    [playbookOptions],
  );

  const uploadUrlResolver = React.useCallback(
    (params: { fileName: string; contentType: string }) =>
      getImageRecognitionFlashcardUploadUrl({
        fileName: params.fileName,
        contentType: params.contentType,
        scope: "card-image",
      }),
    [],
  );

  const fetchPage = React.useCallback(async (targetPage: number, targetPageSize: number) => {
    setLoading(true);
    try {
      const res = await listImageRecognitionFlashcardCards({
        pageSize: targetPageSize,
        cursor: encodeOffsetCursor((targetPage - 1) * targetPageSize),
        playbookType: playbookFilter === ALL_VALUE ? undefined : playbookFilter,
        sampleResult: sampleResultFilter === "ALL" ? undefined : sampleResultFilter,
        status: statusFilter,
        keyword: keyword.trim() || undefined,
      });
      setItems(res.items);
      setPlaybookStats(res.playbookStats);
      setTotalCount(res.totalCount);
      setPage(targetPage);
      setPageSize(targetPageSize);
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "查询失败");
    } finally {
      setLoading(false);
    }
  }, [errorAlert, keyword, playbookFilter, sampleResultFilter, statusFilter]);

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

  const openEdit = (card: ImageRecognitionFlashcardCard) => {
    setEditingCard(card);
    setDraft({
      image: [{ key: card.imageKey || card.imageUrl, url: card.imageUrl }],
      playbookType: card.playbookType,
      sampleResult: card.sampleResult || "SUCCESS",
      notes: card.notes || "",
      status: card.status || "ACTIVE",
    });
  };

  const handleSave = async () => {
    if (!editingCard || !draft) return;
    const image = draft.image.find((item) => item.url && !item.key.startsWith("__loading__"));
    if (!image) {
      errorAlert("请上传图片");
      return;
    }
    if (!draft.playbookType) {
      errorAlert("请选择剧本类型");
      return;
    }

    setSaving(true);
    try {
      await updateImageRecognitionFlashcardCard(editingCard.cardId, {
        imageUrl: image.url,
        imageKey: image.key,
        playbookType: draft.playbookType,
        sampleResult: draft.sampleResult,
        notes: draft.notes,
        status: draft.status,
      });
      successAlert("已保存");
      setEditingCard(null);
      setDraft(null);
      await fetchPage(page, pageSize);
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (card: ImageRecognitionFlashcardCard) => {
    if (!window.confirm("确认删除这张图片识别闪卡？")) return;
    try {
      await deleteImageRecognitionFlashcardCard(card.cardId);
      successAlert("已删除");
      await fetchPage(page, pageSize);
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "删除失败");
    }
  };

  return (
    <TradePageShell title="图片识别闪卡管理" subtitle="分页管理图片识别样本" showAddButton={false}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-[#27272a] bg-[#121212] p-4">
          <div className="w-56">
            <label className="mb-2 block text-xs text-[#a1a1aa]">剧本</label>
            <Select value={playbookFilter} onValueChange={setPlaybookFilter}>
              <SelectTrigger className="border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                <SelectItem value={ALL_VALUE}>全部剧本</SelectItem>
                {playbookOptions.map((item) => (
                  <SelectItem key={item.code} value={item.code}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-40">
            <label className="mb-2 block text-xs text-[#a1a1aa]">结果</label>
            <Select value={sampleResultFilter} onValueChange={(value) => setSampleResultFilter(value as "ALL" | ImageRecognitionFlashcardSampleResult)}>
              <SelectTrigger className="border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                <SelectItem value="ALL">全部结果</SelectItem>
                <SelectItem value="SUCCESS">成功</SelectItem>
                <SelectItem value="FAIL">失败</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-40">
            <label className="mb-2 block text-xs text-[#a1a1aa]">状态</label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ImageRecognitionFlashcardStatusFilter)}>
              <SelectTrigger className="border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                {STATUS_FILTER_OPTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-64">
            <label className="mb-2 block text-xs text-[#a1a1aa]">备注关键词</label>
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索备注"
              className="border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]"
            />
          </div>
          <Button onClick={() => fetchPage(1, pageSize)} disabled={loading} className="bg-[#00c2b2] text-black hover:bg-[#14b8a6]">
            <Search className="mr-2 h-4 w-4" />
            查询
          </Button>
          <Button variant="outline" onClick={() => fetchPage(page, pageSize)} disabled={loading} className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1f1f22]">
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新
          </Button>
          <Button asChild className="ml-auto bg-[#00c2b2] text-black hover:bg-[#14b8a6]">
            <Link href="/trade/image-recognition-flashcard/create">
              <Plus className="mr-2 h-4 w-4" />
              新增
            </Link>
          </Button>
        </div>

        {playbookStats.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {playbookStats.slice(0, 8).map((stat) => (
              <div key={stat.playbookType} className="rounded-lg border border-[#27272a] bg-[#121212] p-4">
                <div className="truncate text-sm font-medium text-[#e5e7eb]">
                  {stat.playbookItem?.label || playbookLabelMap.get(stat.playbookType) || stat.playbookType}
                </div>
                <div className="mt-3 text-2xl font-semibold text-white">
                  {stat.successRate === null ? "-" : `${Math.round(stat.successRate * 100)}%`}
                </div>
                <div className="mt-2 text-xs text-[#a1a1aa]">
                  成功 {stat.successCount} / 失败 {stat.failCount} / 总样本 {stat.totalCount}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-lg border border-[#27272a] bg-[#121212]">
          <div className="grid grid-cols-[96px_minmax(140px,220px)_120px_minmax(220px,1fr)_120px_150px_180px] border-b border-[#27272a] bg-[#18181b] px-4 py-3 text-xs font-medium text-[#a1a1aa]">
            <div>图片</div>
            <div>剧本</div>
            <div>结果</div>
            <div>备注</div>
            <div>状态</div>
            <div>更新时间</div>
            <div className="text-right">操作</div>
          </div>
          {loading ? (
            <div className="p-8 text-center text-sm text-[#71717a]">加载中...</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#71717a]">暂无数据</div>
          ) : (
            items.map((card) => (
              <div key={card.cardId} className="grid grid-cols-[96px_minmax(140px,220px)_120px_minmax(220px,1fr)_120px_150px_180px] items-center border-b border-[#27272a] px-4 py-3 text-sm last:border-0">
                <button type="button" onClick={() => setPreviewUrl(card.imageUrl)} className="h-16 w-16 overflow-hidden rounded-md border border-[#27272a] bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={card.imageUrl} alt="" className="h-full w-full object-cover" />
                </button>
                <div className="font-medium text-[#e5e7eb]">{card.playbookItem?.label || playbookLabelMap.get(card.playbookType) || card.playbookType}</div>
                <div className={card.sampleResult === "FAIL" ? "font-medium text-[#ef4444]" : "font-medium text-[#22c55e]"}>
                  {card.sampleResult ? IMAGE_RECOGNITION_FLASHCARD_LABELS[card.sampleResult] : "-"}
                </div>
                <div className="line-clamp-2 pr-4 text-[#a1a1aa]">{card.notes || "无备注"}</div>
                <div>
                  <span className={card.status === "DISABLED" ? "text-[#f59e0b]" : "text-[#00c2b2]"}>
                    {IMAGE_RECOGNITION_FLASHCARD_LABELS[card.status || "ACTIVE"]}
                  </span>
                </div>
                <div className="text-xs text-[#a1a1aa]">{formatDateTime(card.updatedAt)}</div>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => setPreviewUrl(card.imageUrl)} className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1f1f22]">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(card)} className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1f1f22]">
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(card)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[#a1a1aa]">
          <div>共 {totalCount} 条，当前第 {page} / {totalPages} 页</div>
          <div className="flex items-center gap-2">
            <Select value={String(pageSize)} onValueChange={(value) => fetchPage(1, Number(value))}>
              <SelectTrigger className="h-9 w-28 border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                {[10, 20, 50, 100].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size} 条
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" disabled={page <= 1 || loading} onClick={() => fetchPage(page - 1, pageSize)} className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1f1f22]">上一页</Button>
            <Button variant="outline" disabled={page >= totalPages || loading} onClick={() => fetchPage(page + 1, pageSize)} className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1f1f22]">下一页</Button>
          </div>
        </div>
      </div>

      <Dialog open={!!editingCard && !!draft} onOpenChange={(open) => !open && (setEditingCard(null), setDraft(null))}>
        <DialogContent className="max-w-3xl border-[#27272a] bg-[#121212] text-[#e5e7eb]">
          <DialogHeader>
            <DialogTitle>编辑图片识别闪卡</DialogTitle>
          </DialogHeader>
          {draft ? (
            <div className="grid gap-5 md:grid-cols-[260px_minmax(0,1fr)]">
              <div>
                <div className="mb-2 text-sm font-medium">图片</div>
                <ImageUploader
                  value={draft.image}
                  onChange={(image) => setDraft((prev) => prev ? { ...prev, image } : prev)}
                  max={1}
                  uploadUrlResolver={uploadUrlResolver}
                />
                {draft.image[0]?.url ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPreviewUrl(draft.image[0]?.url || null)}
                    className="mt-2 w-full border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1f1f22]"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    放大查看当前图片
                  </Button>
                ) : null}
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">剧本类型</label>
                  <Select value={draft.playbookType} onValueChange={(value) => setDraft((prev) => prev ? { ...prev, playbookType: value } : prev)}>
                    <SelectTrigger className="border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                      {playbookOptions.map((item) => (
                        <SelectItem key={item.code} value={item.code}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">状态</label>
                  <Select value={draft.status} onValueChange={(value) => setDraft((prev) => prev ? { ...prev, status: value as ImageRecognitionFlashcardStatus } : prev)}>
                    <SelectTrigger className="border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                      <SelectItem value="ACTIVE">启用</SelectItem>
                      <SelectItem value="DISABLED">停用</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">样本结果</label>
                  <Select value={draft.sampleResult} onValueChange={(value) => setDraft((prev) => prev ? { ...prev, sampleResult: value as ImageRecognitionFlashcardSampleResult } : prev)}>
                    <SelectTrigger className="border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                      <SelectItem value="SUCCESS">成功</SelectItem>
                      <SelectItem value="FAIL">失败</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">备注</label>
                  <Textarea
                    value={draft.notes}
                    onChange={(event) => setDraft((prev) => prev ? { ...prev, notes: event.target.value } : prev)}
                    className="min-h-40 border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]"
                  />
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => (setEditingCard(null), setDraft(null))} className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1f1f22]">取消</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#00c2b2] text-black hover:bg-[#14b8a6]">
              {saving ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="flex h-[calc(100vh-24px)] max-h-none w-[calc(100vw-24px)] max-w-none items-center justify-center gap-0 overflow-hidden border-[#27272a] bg-[#121212] p-1 sm:max-w-none">
          {previewUrl ? (
            <FitImagePreview src={previewUrl} alt="图片预览" />
          ) : null}
        </DialogContent>
      </Dialog>
    </TradePageShell>
  );
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", { hour12: false });
}
