"use client";

import React from "react";
import Link from "next/link";
import { Ban, CheckCircle2, Edit3, Play, Plus, RefreshCw, Trash2 } from "lucide-react";
import TradePageShell from "../../components/trade-page-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DateCalendarPicker } from "@/components/common/DateCalendarPicker";
import { ImageUploader } from "@/components/common/ImageUploader";
import { useAlert } from "@/components/common/alert";
import { fetchFlashcardTagOptions, fetchPlaybookTypeOptions } from "../../dictionary";
import { deletePracticalFlashcardCard, getBrowserTimeZone, listPracticalFlashcardCards, updatePracticalFlashcardCard } from "../request";
import type { ImageResource } from "../../config";
import {
  PRACTICAL_FLASHCARD_DIRECTIONS,
  PRACTICAL_FLASHCARD_INTERVALS,
  PRACTICAL_FLASHCARD_LABELS,
  type PracticalFlashcardCard,
  type PracticalFlashcardDirection,
  type PracticalFlashcardInterval,
  type PracticalFlashcardStatus,
} from "../types";
import { usePracticalFlashcardAdminAccess } from "../use-practical-flashcard-admin-access";

const EMPTY_SELECT_VALUE = "__NONE__";
const PRACTICAL_FLASHCARD_STATUSES: PracticalFlashcardStatus[] = ["ACTIVE", "DISABLED"];
const STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "全部闪卡" },
  { value: "ACTIVE", label: "未停用闪卡" },
  { value: "DISABLED", label: "已停用闪卡" },
] as const;
type StatusFilter = (typeof STATUS_FILTER_OPTIONS)[number]["value"];

type DictionaryOption = { code: string; label: string; color?: string };

type EditDraft = {
  status: PracticalFlashcardStatus;
  primaryInterval: PracticalFlashcardInterval;
  entryTimeInfo: string;
  exitTimeInfo: string;
  expectedDirection: PracticalFlashcardDirection | "";
  standardEntryPrice: string;
  standardStopLossPrice: string;
  standardTakeProfitPrice: string;
  playbookType: string;
  tagCodes: string[];
  orderFlowImages: ImageResource[];
  orderFlowRemark: string;
  notes: string;
  summary: string;
};

export default function PracticalFlashcardManagePage() {
  const { loaded, isAdmin } = usePracticalFlashcardAdminAccess();

  if (!loaded) {
    return (
      <TradePageShell title="实操闪卡管理" subtitle="正在确认权限" showAddButton={false}>
        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-6 text-sm text-[#a1a1aa]">加载中...</div>
      </TradePageShell>
    );
  }

  if (!isAdmin) {
    return (
      <TradePageShell title="无权限访问" subtitle="实操闪卡题库由管理员维护" showAddButton={false}>
        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-6 text-sm text-[#a1a1aa]">
          当前账号不能管理实操闪卡。你仍然可以从训练统计页进入实操训练。
        </div>
      </TradePageShell>
    );
  }

  return <PracticalFlashcardManageContent />;
}

function PracticalFlashcardManageContent() {
  const [successAlert, errorAlert] = useAlert();
  const [items, setItems] = React.useState<PracticalFlashcardCard[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [symbolPairInfo, setSymbolPairInfo] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("ALL");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [actionCardId, setActionCardId] = React.useState<string | null>(null);
  const [editingCard, setEditingCard] = React.useState<PracticalFlashcardCard | null>(null);
  const [draft, setDraft] = React.useState<EditDraft | null>(null);
  const [playbookTypeOptions, setPlaybookTypeOptions] = React.useState<DictionaryOption[]>([]);
  const [tagOptions, setTagOptions] = React.useState<DictionaryOption[]>([]);

  const playbookLabelMap = React.useMemo(
    () => new Map(playbookTypeOptions.map((item) => [item.code, item.label])),
    [playbookTypeOptions],
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await listPracticalFlashcardCards({
        pageSize: 50,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        symbolPairInfo: symbolPairInfo.trim() || undefined,
      });
      setItems(res.items);
      setTotalCount(res.totalCount);
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "查询失败");
    } finally {
      setLoading(false);
    }
  }, [errorAlert, statusFilter, symbolPairInfo]);

  React.useEffect(() => {
    let mounted = true;
    fetchPlaybookTypeOptions().then((res) => mounted && setPlaybookTypeOptions(res)).catch(() => mounted && setPlaybookTypeOptions([]));
    fetchFlashcardTagOptions().then((res) => mounted && setTagOptions(res)).catch(() => mounted && setTagOptions([]));
    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const openEdit = React.useCallback((card: PracticalFlashcardCard) => {
    setEditingCard(card);
    setDraft({
      status: card.status,
      primaryInterval: card.primaryInterval || "15m",
      entryTimeInfo: card.entryTimeInfo,
      exitTimeInfo: card.exitTimeInfo,
      expectedDirection: card.expectedDirection || "",
      standardEntryPrice: stringifyNumber(card.standardEntryPrice),
      standardStopLossPrice: stringifyNumber(card.standardStopLossPrice),
      standardTakeProfitPrice: stringifyNumber(card.standardTakeProfitPrice),
      playbookType: card.playbookType || "",
      tagCodes: Array.isArray(card.tagCodes) ? card.tagCodes : [],
      orderFlowImages: imageResourcesFromUrls(card.orderFlowImageUrls || []),
      orderFlowRemark: card.orderFlowRemark || "",
      notes: card.notes || "",
      summary: card.summary || "",
    });
  }, []);

  const updateDraft = React.useCallback((patch: Partial<EditDraft>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }, []);

  const handleSave = React.useCallback(async () => {
    if (!editingCard || !draft) return;
    if (!draft.playbookType) {
      errorAlert("请选择剧本类型");
      return;
    }
    if (!draft.entryTimeInfo.trim()) {
      errorAlert("请选择入场时间");
      return;
    }
    if (!draft.exitTimeInfo.trim()) {
      errorAlert("请选择离场 / 结果确认时间");
      return;
    }

    setSaving(true);
    try {
      const updated = await updatePracticalFlashcardCard(editingCard.cardId, {
        status: draft.status,
        primaryInterval: draft.primaryInterval,
        entryTimeInfo: draft.entryTimeInfo,
        exitTimeInfo: draft.exitTimeInfo,
        timeZone: getBrowserTimeZone(),
        expectedDirection: draft.expectedDirection || null,
        standardEntryPrice: parseOptionalNumber(draft.standardEntryPrice),
        standardStopLossPrice: parseOptionalNumber(draft.standardStopLossPrice),
        standardTakeProfitPrice: parseOptionalNumber(draft.standardTakeProfitPrice),
        playbookType: draft.playbookType,
        tagCodes: draft.tagCodes,
        orderFlowImageUrls: draft.orderFlowImages.map((item) => item.url).filter(Boolean),
        orderFlowRemark: draft.orderFlowRemark.trim() || null,
        notes: draft.notes.trim() || null,
        summary: draft.summary.trim() || null,
      });
      setItems((current) => current.map((item) => (item.cardId === updated.cardId ? updated : item)));
      setEditingCard(null);
      setDraft(null);
      successAlert("实操闪卡已更新");
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }, [draft, editingCard, errorAlert, successAlert]);

  const handleToggleStatus = React.useCallback(async (card: PracticalFlashcardCard) => {
    const nextStatus: PracticalFlashcardStatus = card.status === "DISABLED" ? "ACTIVE" : "DISABLED";
    const message = nextStatus === "DISABLED" ? "确认停用这张实操闪卡？停用后不会进入随机训练。" : "确认启用这张实操闪卡？";
    if (!window.confirm(message)) return;
    setActionCardId(card.cardId);
    try {
      const updated = await updatePracticalFlashcardCard(card.cardId, { status: nextStatus });
      setItems((current) => current
        .map((item) => (item.cardId === updated.cardId ? updated : item))
        .filter((item) => statusFilter === "ALL" || item.status === statusFilter));
      if (statusFilter !== "ALL") {
        setTotalCount((current) => Math.max(0, current - 1));
      }
      successAlert(nextStatus === "DISABLED" ? "实操闪卡已停用" : "实操闪卡已启用");
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "状态更新失败");
    } finally {
      setActionCardId(null);
    }
  }, [errorAlert, statusFilter, successAlert]);

  const handleDelete = React.useCallback(async (card: PracticalFlashcardCard) => {
    if (!window.confirm(`确认删除 ${card.symbolPairInfo} 这张实操闪卡？`)) return;
    setActionCardId(card.cardId);
    try {
      await deletePracticalFlashcardCard(card.cardId);
      setItems((current) => current.filter((item) => item.cardId !== card.cardId));
      setTotalCount((current) => Math.max(0, current - 1));
      successAlert("实操闪卡已删除");
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "删除失败");
    } finally {
      setActionCardId(null);
    }
  }, [errorAlert, successAlert]);

  return (
    <TradePageShell title="实操闪卡管理" subtitle="查看和编辑已冻结行情快照的实操闪卡" showAddButton={false}>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-xl border border-[#27272a] bg-[#121212] p-4 md:flex-row md:items-end md:justify-between">
          <div className="grid gap-3 md:grid-cols-[260px_180px]">
            <label className="space-y-2">
              <span className="text-sm font-medium text-[#d4d4d8]">交易对筛选</span>
              <Input value={symbolPairInfo} onChange={(e) => setSymbolPairInfo(e.target.value)} placeholder="BTCUSDT" className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-[#d4d4d8]">状态筛选</span>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <SelectTrigger className="h-9 w-full border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"><SelectValue /></SelectTrigger>
                <SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                  {STATUS_FILTER_OPTIONS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </label>
          </div>
          <div className="flex gap-2">
            <Button onClick={load} disabled={loading} variant="secondary" className="gap-2 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#27272a]">
              <RefreshCw className="size-4" />
              {loading ? "刷新中..." : "刷新"}
            </Button>
            <Button asChild variant="secondary" className="gap-2 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#27272a]">
              <Link href="/trade/practical-flashcard/train" prefetch={false}>
                <Play className="size-4" />开始训练
              </Link>
            </Button>
            <Button asChild className="gap-2 bg-[#00c2b2] text-black hover:bg-[#009e91]">
              <Link href="/trade/practical-flashcard/create" prefetch={false}><Plus className="size-4" />新建实操闪卡</Link>
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#27272a] bg-[#121212]">
          <div className="border-b border-[#27272a] px-4 py-3 text-sm text-[#a1a1aa]">
            共 {totalCount} 张
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#18181b] text-left text-[#a1a1aa]">
                <tr>
                  <th className="px-4 py-3 font-medium">交易对</th>
                  <th className="px-4 py-3 font-medium">剧本</th>
                  <th className="px-4 py-3 font-medium">行情源</th>
                  <th className="px-4 py-3 font-medium">周期</th>
                  <th className="px-4 py-3 font-medium">时间范围</th>
                  <th className="px-4 py-3 font-medium">K 线数</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="px-4 py-8 text-center text-[#71717a]" colSpan={8}>加载中...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td className="px-4 py-8 text-center text-[#71717a]" colSpan={8}>暂无实操闪卡</td></tr>
                ) : items.map((item) => (
                  <tr key={item.cardId} className="border-t border-[#27272a] text-[#e5e7eb]">
                    <td className="px-4 py-3 font-medium">{item.symbolPairInfo}</td>
                    <td className="px-4 py-3">{playbookLabelMap.get(item.playbookType) || item.playbookType}</td>
                    <td className="px-4 py-3">{PRACTICAL_FLASHCARD_LABELS[item.venue] || item.venue}</td>
                    <td className="px-4 py-3">{PRACTICAL_FLASHCARD_LABELS[item.primaryInterval] || item.primaryInterval || "15m"}</td>
                    <td className="px-4 py-3 text-[#a1a1aa]">
                      {item.entryTimeInfo} {"->"} {item.exitTimeInfo}
                    </td>
                    <td className="px-4 py-3">{formatCandleCount(item)}</td>
                    <td className="px-4 py-3">{PRACTICAL_FLASHCARD_LABELS[item.status] || item.status}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="secondary" className="gap-2 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#27272a]">
                          <Link href={`/trade/practical-flashcard/${item.cardId}/play`} prefetch={false}>
                            <Play className="size-4" />
                            回放
                          </Link>
                        </Button>
                        <Button type="button" size="sm" variant="secondary" onClick={() => openEdit(item)} className="gap-2 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#27272a]">
                          <Edit3 className="size-4" />
                          编辑
                        </Button>
                        <Button type="button" size="sm" variant="secondary" disabled={actionCardId === item.cardId} onClick={() => void handleToggleStatus(item)} className="gap-2 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#27272a]">
                          {item.status === "DISABLED" ? <CheckCircle2 className="size-4" /> : <Ban className="size-4" />}
                          {item.status === "DISABLED" ? "启用" : "停用"}
                        </Button>
                        <Button type="button" size="sm" variant="outline" disabled={actionCardId === item.cardId} onClick={() => void handleDelete(item)} className="gap-2 border-[#7f1d1d] bg-[#1e1e1e] text-[#fecaca] hover:bg-[#2a1111]">
                          <Trash2 className="size-4" />
                          删除
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={Boolean(editingCard && draft)} onOpenChange={(open) => { if (!open) { setEditingCard(null); setDraft(null); } }}>
        <DialogContent className="max-h-[92vh] w-[min(98vw,1240px)] max-w-none overflow-y-auto border border-[#27272a] bg-[#121212] text-[#e5e7eb] sm:max-w-none">
          <DialogHeader>
            <DialogTitle>编辑实操闪卡</DialogTitle>
          </DialogHeader>
          {editingCard && draft ? (
            <div className="space-y-5">
              <div className="grid gap-3 rounded-lg border border-[#27272a] bg-[#18181b] p-3 text-sm text-[#a1a1aa] md:grid-cols-4">
                <ReadonlyField label="交易对" value={editingCard.symbolPairInfo} />
                <ReadonlyField label="行情源" value={PRACTICAL_FLASHCARD_LABELS[editingCard.venue] || editingCard.venue} />
                <ReadonlyField label="时间周期" value={PRACTICAL_FLASHCARD_LABELS[draft.primaryInterval] || draft.primaryInterval} />
                <ReadonlyField label="K 线快照" value={`${formatCandleCount(editingCard)}；修改时间或周期保存后会重新拉取`} />
                <ReadonlyField label="快照范围" value={`${editingCard.snapshotStartTime} -> ${editingCard.snapshotEndTime}`} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="入场 / 考试开始时间">
                  <DateCalendarPicker analysisTime={draft.entryTimeInfo} updateForm={(patch) => updateDraft({ entryTimeInfo: patch.analysisTime })} placeholder="选择入场时间" />
                </Field>
                <Field label="离场 / 结果确认时间">
                  <DateCalendarPicker analysisTime={draft.exitTimeInfo} updateForm={(patch) => updateDraft({ exitTimeInfo: patch.analysisTime })} placeholder="选择离场时间" />
                </Field>
                <Field label="时间周期 *">
                  <Select value={draft.primaryInterval} onValueChange={(value) => updateDraft({ primaryInterval: value as PracticalFlashcardInterval })}>
                    <SelectTrigger className="h-9 w-full border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"><SelectValue /></SelectTrigger>
                    <SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                      {PRACTICAL_FLASHCARD_INTERVALS.map((item) => <SelectItem key={item} value={item}>{PRACTICAL_FLASHCARD_LABELS[item]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="状态">
                  <Select value={draft.status} onValueChange={(value) => updateDraft({ status: value as PracticalFlashcardStatus })}>
                    <SelectTrigger className="h-9 w-full border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"><SelectValue /></SelectTrigger>
                    <SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                      {PRACTICAL_FLASHCARD_STATUSES.map((item) => <SelectItem key={item} value={item}>{PRACTICAL_FLASHCARD_LABELS[item]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="剧本类型">
                  <Select value={draft.playbookType || EMPTY_SELECT_VALUE} onValueChange={(value) => updateDraft({ playbookType: value === EMPTY_SELECT_VALUE ? "" : value })}>
                    <SelectTrigger className="h-9 w-full border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"><SelectValue placeholder="选择剧本" /></SelectTrigger>
                    <SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                      <SelectItem value={EMPTY_SELECT_VALUE}>未设置</SelectItem>
                      {playbookTypeOptions.map((item) => <SelectItem key={item.code} value={item.code}>{item.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="标准方向">
                  <Select value={draft.expectedDirection || EMPTY_SELECT_VALUE} onValueChange={(value) => updateDraft({ expectedDirection: value === EMPTY_SELECT_VALUE ? "" : (value as PracticalFlashcardDirection) })}>
                    <SelectTrigger className="h-9 w-full border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"><SelectValue placeholder="未设置" /></SelectTrigger>
                    <SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                      <SelectItem value={EMPTY_SELECT_VALUE}>未设置</SelectItem>
                      {PRACTICAL_FLASHCARD_DIRECTIONS.map((item) => <SelectItem key={item} value={item}>{PRACTICAL_FLASHCARD_LABELS[item]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="入场价">
                    <Input value={draft.standardEntryPrice} onChange={(e) => updateDraft({ standardEntryPrice: e.target.value })} inputMode="decimal" className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]" />
                  </Field>
                  <Field label="止损价">
                    <Input value={draft.standardStopLossPrice} onChange={(e) => updateDraft({ standardStopLossPrice: e.target.value })} inputMode="decimal" className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]" />
                  </Field>
                  <Field label="止盈价">
                    <Input value={draft.standardTakeProfitPrice} onChange={(e) => updateDraft({ standardTakeProfitPrice: e.target.value })} inputMode="decimal" className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]" />
                  </Field>
                </div>
              </div>

              <Field label="字典标签">
                <div className="flex flex-wrap gap-2 rounded-xl border border-[#27272a] bg-[#1e1e1e] p-3">
                  {tagOptions.map((item) => {
                    const active = draft.tagCodes.includes(item.code);
                    return (
                      <button key={item.code} type="button" onClick={() => updateDraft({ tagCodes: active ? draft.tagCodes.filter((code) => code !== item.code) : [...draft.tagCodes, item.code] })} className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs transition ${active ? "border-[#00c2b2] bg-[#00c2b2]/15 text-[#00c2b2]" : "border-[#27272a] bg-[#121212] text-[#a1a1aa] hover:border-[#3f3f46]"}`}>
                        {item.color ? <span className="inline-block size-2.5 rounded-full border border-white/20" style={{ backgroundColor: item.color }} /> : null}
                        {item.label}
                      </button>
                    );
                  })}
                  {tagOptions.length === 0 ? <span className="text-xs text-[#71717a]">暂无标签</span> : null}
                </div>
              </Field>

              <Field label="足迹图（选填，最多 5 张）">
                <ImageUploader
                  value={draft.orderFlowImages}
                  onChange={(value) => updateDraft({ orderFlowImages: value })}
                  max={5}
                />
              </Field>
              <Field label="足迹图说明">
                <Textarea value={draft.orderFlowRemark} onChange={(e) => updateDraft({ orderFlowRemark: e.target.value })} rows={3} className="border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]" />
              </Field>
              <Field label="备注">
                <Textarea value={draft.notes} onChange={(e) => updateDraft({ notes: e.target.value })} rows={4} className="border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]" />
              </Field>
              <Field label="总结">
                <Textarea value={draft.summary} onChange={(e) => updateDraft({ summary: e.target.value })} rows={3} className="border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]" />
              </Field>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]" onClick={() => { setEditingCard(null); setDraft(null); }}>取消</Button>
            <Button className="bg-[#00c2b2] text-black hover:bg-[#009e91]" disabled={saving} onClick={() => void handleSave()}>{saving ? "保存中..." : "保存"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TradePageShell>
  );
}

function stringifyNumber(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
}

function parseOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function imageResourcesFromUrls(urls: string[]): ImageResource[] {
  return urls
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url, index) => ({ key: `order-flow-${index}`, url }));
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="block space-y-2">
      <span className="text-sm font-medium text-[#d4d4d8]">{label}</span>
      {children}
    </div>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-[#71717a]">{label}</div>
      <div className="mt-1 break-words text-[#e5e7eb]">{value || "--"}</div>
    </div>
  );
}

function formatCandleCount(card: PracticalFlashcardCard) {
  if (!Array.isArray(card.candles) || card.candles.length === 0) {
    return "按需拉取";
  }
  return `${card.candles.length} 根`;
}
