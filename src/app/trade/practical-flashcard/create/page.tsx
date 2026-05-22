"use client";

import React from "react";
import TradePageShell from "../../components/trade-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DateCalendarPicker } from "@/components/common/DateCalendarPicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAlert } from "@/components/common/alert";
import { fetchFlashcardTagOptions, fetchPlaybookTypeOptions } from "../../dictionary";
import { createPracticalFlashcardCard } from "../request";
import {
  PRACTICAL_FLASHCARD_DIRECTIONS,
  PRACTICAL_FLASHCARD_LABELS,
  PRACTICAL_FLASHCARD_VENUES,
  type PracticalFlashcardDirection,
  type PracticalFlashcardVenue,
} from "../types";

const EMPTY_SELECT_VALUE = "__NONE__";

export default function PracticalFlashcardCreatePage() {
  const [successAlert, errorAlert] = useAlert();
  const [venue, setVenue] = React.useState<PracticalFlashcardVenue>("BINANCE_UM_FUTURES");
  const [symbolPairInfo, setSymbolPairInfo] = React.useState("");
  const [entryTimeInfo, setEntryTimeInfo] = React.useState("");
  const [exitTimeInfo, setExitTimeInfo] = React.useState("");
  const [expectedDirection, setExpectedDirection] = React.useState<PracticalFlashcardDirection | "">("");
  const [standardEntryPrice, setStandardEntryPrice] = React.useState("");
  const [standardStopLossPrice, setStandardStopLossPrice] = React.useState("");
  const [standardTakeProfitPrice, setStandardTakeProfitPrice] = React.useState("");
  const [playbookType, setPlaybookType] = React.useState("");
  const [tagCodes, setTagCodes] = React.useState<string[]>([]);
  const [orderFlowImageUrls, setOrderFlowImageUrls] = React.useState("");
  const [orderFlowRemark, setOrderFlowRemark] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [playbookTypeOptions, setPlaybookTypeOptions] = React.useState<Array<{ code: string; label: string; color?: string }>>([]);
  const [tagOptions, setTagOptions] = React.useState<Array<{ code: string; label: string; color?: string }>>([]);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    fetchPlaybookTypeOptions().then((items) => mounted && setPlaybookTypeOptions(items)).catch(() => mounted && setPlaybookTypeOptions([]));
    fetchFlashcardTagOptions().then((items) => mounted && setTagOptions(items)).catch(() => mounted && setTagOptions([]));
    return () => {
      mounted = false;
    };
  }, []);

  const parseOptionalNumber = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const handleSubmit = React.useCallback(async () => {
    if (!symbolPairInfo.trim()) return errorAlert("请填写交易对");
    if (!entryTimeInfo.trim()) return errorAlert("请选择入场时间");
    if (!exitTimeInfo.trim()) return errorAlert("请选择离场 / 结果确认时间");
    if (!playbookType) return errorAlert("请选择剧本类型");

    setSubmitting(true);
    try {
      const created = await createPracticalFlashcardCard({
        venue,
        symbolPairInfo: symbolPairInfo.trim(),
        entryTimeInfo,
        exitTimeInfo,
        primaryInterval: "15m",
        expectedDirection: expectedDirection || undefined,
        standardEntryPrice: parseOptionalNumber(standardEntryPrice),
        standardStopLossPrice: parseOptionalNumber(standardStopLossPrice),
        standardTakeProfitPrice: parseOptionalNumber(standardTakeProfitPrice),
        playbookType,
        tagCodes: tagCodes.length ? tagCodes : undefined,
        orderFlowImageUrls: orderFlowImageUrls
          .split(/\n|,/)
          .map((item) => item.trim())
          .filter(Boolean),
        orderFlowRemark: orderFlowRemark.trim() || undefined,
        notes: notes.trim() || undefined,
        summary: summary.trim() || undefined,
      });
      successAlert(`实操闪卡已创建，冻结 ${created.candles.length} 根 15m K 线`);
      setSymbolPairInfo("");
      setEntryTimeInfo("");
      setExitTimeInfo("");
      setExpectedDirection("");
      setStandardEntryPrice("");
      setStandardStopLossPrice("");
      setStandardTakeProfitPrice("");
      setPlaybookType("");
      setTagCodes([]);
      setOrderFlowImageUrls("");
      setOrderFlowRemark("");
      setNotes("");
      setSummary("");
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "创建失败");
    } finally {
      setSubmitting(false);
    }
  }, [entryTimeInfo, errorAlert, exitTimeInfo, expectedDirection, notes, orderFlowImageUrls, orderFlowRemark, playbookType, standardEntryPrice, standardStopLossPrice, standardTakeProfitPrice, successAlert, summary, symbolPairInfo, tagCodes, venue]);

  return (
    <TradePageShell title="实操闪卡创建" subtitle="创建时拉取 Binance 公开 K 线并保存冻结快照" showAddButton={false}>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-xl border border-[#27272a] bg-[#121212] p-4 space-y-4">
              <Field label="行情源">
                <Select value={venue} onValueChange={(value) => setVenue(value as PracticalFlashcardVenue)}>
                  <SelectTrigger className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"><SelectValue /></SelectTrigger>
                  <SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                    {PRACTICAL_FLASHCARD_VENUES.map((item) => <SelectItem key={item} value={item}>{PRACTICAL_FLASHCARD_LABELS[item]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="交易对">
                <Input value={symbolPairInfo} onChange={(e) => setSymbolPairInfo(e.target.value)} placeholder="例：BTCUSDT / BTC/USDT" className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]" />
              </Field>
              <Field label="入场 / 考试开始时间">
                <DateCalendarPicker analysisTime={entryTimeInfo} updateForm={(patch) => setEntryTimeInfo(patch.analysisTime)} placeholder="选择入场时间" />
              </Field>
              <Field label="离场 / 结果确认时间">
                <DateCalendarPicker analysisTime={exitTimeInfo} updateForm={(patch) => setExitTimeInfo(patch.analysisTime)} placeholder="选择离场时间" />
              </Field>
            </section>

            <section className="rounded-xl border border-[#27272a] bg-[#121212] p-4 space-y-4">
              <Field label="剧本类型">
                <Select value={playbookType || EMPTY_SELECT_VALUE} onValueChange={(value) => setPlaybookType(value === EMPTY_SELECT_VALUE ? "" : value)}>
                  <SelectTrigger className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"><SelectValue placeholder="选择剧本" /></SelectTrigger>
                  <SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                    <SelectItem value={EMPTY_SELECT_VALUE}>未设置</SelectItem>
                    {playbookTypeOptions.map((item) => <SelectItem key={item.code} value={item.code}>{item.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="标准方向">
                <Select value={expectedDirection || EMPTY_SELECT_VALUE} onValueChange={(value) => setExpectedDirection(value === EMPTY_SELECT_VALUE ? "" : (value as PracticalFlashcardDirection))}>
                  <SelectTrigger className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"><SelectValue placeholder="未设置" /></SelectTrigger>
                  <SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                    <SelectItem value={EMPTY_SELECT_VALUE}>未设置</SelectItem>
                    {PRACTICAL_FLASHCARD_DIRECTIONS.map((item) => <SelectItem key={item} value={item}>{PRACTICAL_FLASHCARD_LABELS[item]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="入场价">
                  <Input value={standardEntryPrice} onChange={(e) => setStandardEntryPrice(e.target.value)} inputMode="decimal" className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]" />
                </Field>
                <Field label="止损价">
                  <Input value={standardStopLossPrice} onChange={(e) => setStandardStopLossPrice(e.target.value)} inputMode="decimal" className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]" />
                </Field>
                <Field label="止盈价">
                  <Input value={standardTakeProfitPrice} onChange={(e) => setStandardTakeProfitPrice(e.target.value)} inputMode="decimal" className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]" />
                </Field>
              </div>
            </section>
          </div>

          <section className="rounded-xl border border-[#27272a] bg-[#121212] p-4 space-y-4">
            <Field label="字典标签">
              <div className="flex flex-wrap gap-2 rounded-xl border border-[#27272a] bg-[#1e1e1e] p-3">
                {tagOptions.map((item) => {
                  const active = tagCodes.includes(item.code);
                  return (
                    <button key={item.code} type="button" onClick={() => setTagCodes((prev) => active ? prev.filter((code) => code !== item.code) : [...prev, item.code])} className={`rounded-md border px-2.5 py-1 text-xs transition ${active ? "border-[#00c2b2] bg-[#00c2b2]/15 text-[#00c2b2]" : "border-[#27272a] bg-[#121212] text-[#a1a1aa] hover:border-[#3f3f46]"}`}>
                      {item.label}
                    </button>
                  );
                })}
                {tagOptions.length === 0 ? <span className="text-xs text-[#71717a]">暂无标签</span> : null}
              </div>
            </Field>
            <Field label="足迹图 URL（逗号或换行分隔）">
              <Textarea value={orderFlowImageUrls} onChange={(e) => setOrderFlowImageUrls(e.target.value)} rows={3} className="border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]" />
            </Field>
            <Field label="足迹图说明">
              <Textarea value={orderFlowRemark} onChange={(e) => setOrderFlowRemark(e.target.value)} rows={3} className="border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]" />
            </Field>
            <Field label="备注">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} className="border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]" />
            </Field>
            <Field label="总结">
              <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} className="border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]" />
            </Field>
          </section>
        </div>

        <aside className="rounded-xl border border-[#27272a] bg-[#121212] p-4 h-fit space-y-4">
          <div>
            <div className="text-sm font-semibold text-white">PF-M1 创建口径</div>
            <div className="mt-2 text-sm leading-6 text-[#a1a1aa]">
              保存前会按入场时间向前 6 小时、离场时间向后 2 小时拉取 15m K 线，并把结果写入卡片快照。后续训练只读取本地快照。
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={submitting} className="w-full bg-[#00c2b2] text-black hover:bg-[#009e91]">
            {submitting ? "创建中..." : "创建实操闪卡"}
          </Button>
        </aside>
      </div>
    </TradePageShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-[#d4d4d8]">{label}</span>
      {children}
    </label>
  );
}
