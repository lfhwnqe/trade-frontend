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
  deletePlaybookTemplate,
  getPlaybookTemplateUploadUrl,
  listPlaybookTemplates,
  updatePlaybookTemplate,
} from "../request";
import type {
  PlaybookTemplate,
  PlaybookTemplateCountItem,
  PlaybookTemplateStatus,
  PlaybookTemplateStatusFilter,
} from "../types";
import { PLAYBOOK_TEMPLATE_LABELS } from "../types";

const ALL_VALUE = "__ALL__";

type DictionaryOption = { code: string; label: string; color?: string };

type EditDraft = {
  playbookType: string;
  title: string;
  analysisImage: ImageResource[];
  inProgressImage: ImageResource[];
  completedTrendImage: ImageResource[];
  notes: string;
  sortOrder: string;
  status: PlaybookTemplateStatus;
};

function encodeOffsetCursor(offset: number) {
  if (offset <= 0) return undefined;
  const json = JSON.stringify({ offset });
  if (typeof window === "undefined" || typeof window.btoa !== "function") return undefined;
  return window.btoa(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export default function PlaybookTemplateManagePage() {
  const [successAlert, errorAlert] = useAlert();
  const [items, setItems] = React.useState<PlaybookTemplate[]>([]);
  const [counts, setCounts] = React.useState<PlaybookTemplateCountItem[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [playbookFilter, setPlaybookFilter] = React.useState(ALL_VALUE);
  const [statusFilter, setStatusFilter] = React.useState<PlaybookTemplateStatusFilter>("ALL");
  const [keyword, setKeyword] = React.useState("");
  const [playbookOptions, setPlaybookOptions] = React.useState<DictionaryOption[]>([]);
  const [editingTemplate, setEditingTemplate] = React.useState<PlaybookTemplate | null>(null);
  const [draft, setDraft] = React.useState<EditDraft | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const playbookLabelMap = React.useMemo(
    () => new Map(playbookOptions.map((item) => [item.code, item.label])),
    [playbookOptions],
  );
  const countMap = React.useMemo(
    () => new Map(counts.map((item) => [item.playbookType, item])),
    [counts],
  );

  const buildUploadResolver = React.useCallback(
    (scope: "analysis" | "in-progress" | "completed-trend") =>
      (params: { fileName: string; contentType: string }) =>
        getPlaybookTemplateUploadUrl({
          fileName: params.fileName,
          contentType: params.contentType,
          scope,
        }),
    [],
  );

  const fetchPage = React.useCallback(async (targetPage: number, targetPageSize: number) => {
    setLoading(true);
    try {
      const res = await listPlaybookTemplates({
        pageSize: targetPageSize,
        cursor: encodeOffsetCursor((targetPage - 1) * targetPageSize),
        playbookType: playbookFilter === ALL_VALUE ? undefined : playbookFilter,
        status: statusFilter,
        keyword: keyword.trim() || undefined,
      });
      setItems(res.items);
      setTotalCount(res.totalCount);
      setCounts(res.playbookTemplateCounts);
      setPage(targetPage);
      setPageSize(targetPageSize);
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "查询失败");
    } finally {
      setLoading(false);
    }
  }, [errorAlert, keyword, playbookFilter, statusFilter]);

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

  const openEdit = (template: PlaybookTemplate) => {
    setEditingTemplate(template);
    setDraft({
      playbookType: template.playbookType,
      title: template.title,
      analysisImage: [{ key: template.analysisImageKey || template.analysisImageUrl, url: template.analysisImageUrl }],
      inProgressImage: [{ key: template.inProgressImageKey || template.inProgressImageUrl, url: template.inProgressImageUrl }],
      completedTrendImage: [{ key: template.completedTrendImageKey || template.completedTrendImageUrl, url: template.completedTrendImageUrl }],
      notes: template.notes || "",
      sortOrder: typeof template.sortOrder === "number" ? String(template.sortOrder) : "",
      status: template.status || "ACTIVE",
    });
  };

  const handleSave = async () => {
    if (!editingTemplate || !draft) return;
    const analysisImage = getReadyImage(draft.analysisImage);
    const inProgressImage = getReadyImage(draft.inProgressImage);
    const completedTrendImage = getReadyImage(draft.completedTrendImage);
    if (!draft.playbookType) {
      errorAlert("请选择剧本类型");
      return;
    }
    if (!draft.title.trim()) {
      errorAlert("请填写模板名称");
      return;
    }
    if (!analysisImage || !inProgressImage || !completedTrendImage) {
      errorAlert("请上传分析时图片、走势中图片和完整走势图片");
      return;
    }

    setSaving(true);
    try {
      await updatePlaybookTemplate(editingTemplate.templateId, {
        playbookType: draft.playbookType,
        title: draft.title.trim(),
        analysisImageUrl: analysisImage.url,
        analysisImageKey: analysisImage.key,
        inProgressImageUrl: inProgressImage.url,
        inProgressImageKey: inProgressImage.key,
        completedTrendImageUrl: completedTrendImage.url,
        completedTrendImageKey: completedTrendImage.key,
        notes: draft.notes,
        sortOrder: draft.sortOrder.trim() ? Number(draft.sortOrder) : undefined,
        status: draft.status,
      });
      successAlert("已保存");
      setEditingTemplate(null);
      setDraft(null);
      await fetchPage(page, pageSize);
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (template: PlaybookTemplate) => {
    if (!window.confirm(`确认删除剧本模板「${template.title}」？`)) return;
    try {
      await deletePlaybookTemplate(template.templateId);
      successAlert("已删除");
      await fetchPage(page, pageSize);
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "删除失败");
    }
  };

  return (
    <TradePageShell title="剧本模板管理" subtitle="分页维护每个剧本最多 5 个对照模板" showAddButton={false}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-[#27272a] bg-[#121212] p-4">
          <FilterSelect label="剧本" value={playbookFilter} onValueChange={setPlaybookFilter} widthClass="w-56">
            <SelectItem value={ALL_VALUE}>全部剧本</SelectItem>
            {playbookOptions.map((item) => (
              <SelectItem key={item.code} value={item.code}>{item.label}</SelectItem>
            ))}
          </FilterSelect>
          <FilterSelect label="状态" value={statusFilter} onValueChange={(value) => setStatusFilter(value as PlaybookTemplateStatusFilter)} widthClass="w-36">
            <SelectItem value="ALL">全部</SelectItem>
            <SelectItem value="ACTIVE">启用</SelectItem>
            <SelectItem value="DISABLED">停用</SelectItem>
          </FilterSelect>
          <div className="w-64">
            <label className="mb-2 block text-xs text-[#a1a1aa]">关键词</label>
            <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索名称或备注" className="border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]" />
          </div>
          <Button onClick={() => fetchPage(1, pageSize)} disabled={loading} className="bg-[#00c2b2] text-black hover:bg-[#14b8a6]">
            <Search className="mr-2 h-4 w-4" />查询
          </Button>
          <Button variant="outline" onClick={() => fetchPage(page, pageSize)} disabled={loading} className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1f1f22]">
            <RefreshCw className="mr-2 h-4 w-4" />刷新
          </Button>
          <Button asChild className="ml-auto bg-[#00c2b2] text-black hover:bg-[#14b8a6]">
            <Link href="/trade/playbook-template/create"><Plus className="mr-2 h-4 w-4" />新增</Link>
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {counts.slice(0, 8).map((item) => (
            <div key={item.playbookType} className="rounded-lg border border-[#27272a] bg-[#121212] p-3">
              <div className="truncate text-sm font-medium text-[#e5e7eb]">{item.playbookItem?.label || playbookLabelMap.get(item.playbookType) || item.playbookType}</div>
              <div className="mt-1 text-xs text-[#a1a1aa]">模板 {item.totalCount}/{item.limit}，启用 {item.activeCount}</div>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#27272a] bg-[#121212]">
          <div className="grid min-w-[1280px] grid-cols-[170px_180px_270px_minmax(220px,1fr)_90px_90px_150px_150px_160px] border-b border-[#27272a] bg-[#18181b] px-4 py-3 text-xs font-medium text-[#a1a1aa]">
            <div>剧本</div><div>模板名称</div><div>三阶段图片</div><div>备注</div><div>状态</div><div>数量</div><div>创建时间</div><div>更新时间</div><div className="text-right">操作</div>
          </div>
          {loading ? (
            <div className="p-8 text-center text-sm text-[#71717a]">加载中...</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#71717a]">暂无数据</div>
          ) : items.map((template) => {
            const count = countMap.get(template.playbookType);
            return (
              <div key={template.templateId} className="grid min-w-[1280px] grid-cols-[170px_180px_270px_minmax(220px,1fr)_90px_90px_150px_150px_160px] items-center border-b border-[#27272a] px-4 py-3 text-sm last:border-0">
                <div className="font-medium text-[#e5e7eb]">{template.playbookItem?.label || playbookLabelMap.get(template.playbookType) || template.playbookType}</div>
                <div className="font-medium text-[#e5e7eb]">{template.title}</div>
                <div className="flex gap-2">
                  <Thumb label="分析" src={template.analysisImageUrl} onClick={() => setPreviewUrl(template.analysisImageUrl)} />
                  <Thumb label="走势中" src={template.inProgressImageUrl} onClick={() => setPreviewUrl(template.inProgressImageUrl)} />
                  <Thumb label="完整" src={template.completedTrendImageUrl} onClick={() => setPreviewUrl(template.completedTrendImageUrl)} />
                </div>
                <div className="line-clamp-2 pr-4 text-[#a1a1aa]">{template.notes || "无备注"}</div>
                <div className={template.status === "ACTIVE" ? "text-[#22c55e]" : "text-[#a1a1aa]"}>
                  {PLAYBOOK_TEMPLATE_LABELS[template.status]}
                </div>
                <div className="text-[#a1a1aa]">{count ? `${count.totalCount}/${count.limit}` : "-"}</div>
                <div className="text-xs text-[#a1a1aa]">{formatDateTime(template.createdAt)}</div>
                <div className="text-xs text-[#a1a1aa]">{formatDateTime(template.updatedAt)}</div>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => setPreviewUrl(template.analysisImageUrl)} className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1f1f22]"><Eye className="h-4 w-4" /></Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(template)} className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1f1f22]"><Edit3 className="h-4 w-4" /></Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(template)}><Trash2 className="h-4 w-4" /></Button>
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

      <Dialog open={!!editingTemplate && !!draft} onOpenChange={(open) => !open && (setEditingTemplate(null), setDraft(null))}>
        <DialogContent className="max-h-[calc(100vh-32px)] w-[min(1180px,calc(100vw-32px))] max-w-none overflow-y-auto border-[#27272a] bg-[#121212] text-[#e5e7eb] sm:max-w-none">
          <DialogHeader><DialogTitle>编辑剧本模板</DialogTitle></DialogHeader>
          {draft ? (
            <div className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-3">
                <EditUpload title="分析时图片" images={draft.analysisImage} onChange={(images) => setDraft((prev) => prev ? { ...prev, analysisImage: images } : prev)} resolver={buildUploadResolver("analysis")} onPreview={setPreviewUrl} />
                <EditUpload title="走势中图片" images={draft.inProgressImage} onChange={(images) => setDraft((prev) => prev ? { ...prev, inProgressImage: images } : prev)} resolver={buildUploadResolver("in-progress")} onPreview={setPreviewUrl} />
                <EditUpload title="完整走势图片" images={draft.completedTrendImage} onChange={(images) => setDraft((prev) => prev ? { ...prev, completedTrendImage: images } : prev)} resolver={buildUploadResolver("completed-trend")} onPreview={setPreviewUrl} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="剧本类型">
                  <Select value={draft.playbookType} onValueChange={(value) => setDraft((prev) => prev ? { ...prev, playbookType: value } : prev)}>
                    <SelectTrigger className="w-full border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]"><SelectValue /></SelectTrigger>
                    <SelectContent className="border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                      {playbookOptions.map((item) => <SelectItem key={item.code} value={item.code}>{item.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="模板名称"><Input value={draft.title} onChange={(event) => setDraft((prev) => prev ? { ...prev, title: event.target.value } : prev)} className="border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]" /></Field>
                <Field label="状态">
                  <Select value={draft.status} onValueChange={(value) => setDraft((prev) => prev ? { ...prev, status: value as PlaybookTemplateStatus } : prev)}>
                    <SelectTrigger className="w-full border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]"><SelectValue /></SelectTrigger>
                    <SelectContent className="border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                      <SelectItem value="ACTIVE">启用</SelectItem>
                      <SelectItem value="DISABLED">停用</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="排序值"><Input type="number" value={draft.sortOrder} onChange={(event) => setDraft((prev) => prev ? { ...prev, sortOrder: event.target.value } : prev)} className="border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]" /></Field>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium">备注</label>
                  <Textarea value={draft.notes} onChange={(event) => setDraft((prev) => prev ? { ...prev, notes: event.target.value } : prev)} className="min-h-32 border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]" />
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => (setEditingTemplate(null), setDraft(null))} className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1f1f22]">取消</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#00c2b2] text-black hover:bg-[#14b8a6]">{saving ? "保存中..." : "保存"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="flex h-[calc(100vh-24px)] max-h-none w-[calc(100vw-24px)] max-w-none items-center justify-center gap-0 overflow-hidden border-[#27272a] bg-[#121212] p-1 sm:max-w-none">
          {previewUrl ? <FitImagePreview src={previewUrl} alt="剧本模板图片预览" /> : null}
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

function Thumb({ label, src, onClick }: { label: string; src: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="relative h-16 w-20 overflow-hidden rounded-md border border-[#27272a] bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full object-cover" />
      <span className="absolute bottom-0 left-0 right-0 bg-black/65 py-0.5 text-[10px] text-white">{label}</span>
    </button>
  );
}

function EditUpload({ title, images, onChange, resolver, onPreview }: { title: string; images: ImageResource[]; onChange: (images: ImageResource[]) => void; resolver: (params: { fileName: string; contentType: string }) => Promise<{ uploadUrl: string; fileUrl: string; key: string }>; onPreview: (url: string) => void }) {
  const previewImage = images[0];
  return (
    <div className="min-w-0 rounded-lg border border-[#27272a] bg-[#0f0f10] p-3">
      <div className="mb-2 text-sm font-medium">{title}</div>
      <ImageUploader value={images} onChange={onChange} max={1} uploadUrlResolver={resolver} />
      {previewImage?.url ? (
        <Button type="button" variant="outline" onClick={() => onPreview(previewImage.url)} className="mt-2 w-full border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1f1f22]">
          <Eye className="mr-2 h-4 w-4" />放大查看
        </Button>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="min-w-0"><label className="mb-2 block text-sm font-medium">{label}</label>{children}</div>;
}

function getReadyImage(images: ImageResource[]) {
  return images.find((item) => item.url && !item.key.startsWith("__loading__"));
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", { hour12: false });
}
