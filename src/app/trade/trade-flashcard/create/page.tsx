"use client";

import React from "react";
import TradePageShell from "../../components/trade-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/common/ImageUploader";
import { DateCalendarPicker } from "@/components/common/DateCalendarPicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAlert } from "@/components/common/alert";
import type { ImageResource } from "../../config";
import { TRADE_PERIOD_PRESETS } from "../../config";
import { fetchFlashcardTagOptions, fetchPlaybookTypeOptions } from "../../dictionary";
import { createTradeFlashcardCard } from "../request";
import {
  TRADE_FLASHCARD_LABELS,
  TRADE_FLASHCARD_PROCESS_RESULTS,
  TRADE_FLASHCARD_TYPES,
  type TradeFlashcardProcessResult,
  type TradeFlashcardType,
} from "../types";

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

const EMPTY_SELECT_VALUE = "__NONE__";
const SYMBOL_PAIR_HISTORY_KEY = "flashcard-symbol-pair-history";

export default function TradeFlashcardCreatePage() {
  const [successAlert, errorAlert] = useAlert();
  const [tradeFlashcardType, setTradeFlashcardType] = React.useState<TradeFlashcardType | "">("");
  const [processResult, setProcessResult] = React.useState<TradeFlashcardProcessResult | "">("");
  const [isSystemAligned, setIsSystemAligned] = React.useState<string>(EMPTY_SELECT_VALUE);
  const [preEntryImages, setPreEntryImages] = React.useState<ImageResource[]>([]);
  const [postEntryImages, setPostEntryImages] = React.useState<ImageResource[]>([]);
  const [progressImages, setProgressImages] = React.useState<ImageResource[]>([]);
  const [marketTimeInfo, setMarketTimeInfo] = React.useState("");
  const [symbolPairInfo, setSymbolPairInfo] = React.useState("");
  const [symbolPairOptions, setSymbolPairOptions] = React.useState<string[]>([...TRADE_PERIOD_PRESETS]);
  const [playbookType, setPlaybookType] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [tagCodes, setTagCodes] = React.useState<string[]>([]);
  const [tagOptions, setTagOptions] = React.useState<Array<{ code: string; label: string; color?: string }>>([]);
  const [playbookTypeOptions, setPlaybookTypeOptions] = React.useState<Array<{ code: string; label: string; color?: string }>>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [copyingTemplate, setCopyingTemplate] = React.useState(false);

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
    return () => {
      mounted = false;
    };
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

  const handleSubmit = React.useCallback(async () => {
    if (!tradeFlashcardType) return errorAlert("请选择交易闪卡类型");
    if (!preEntryImages[0]?.url) return errorAlert("请先上传入场前截图");

    setSubmitting(true);
    try {
      await createTradeFlashcardCard({
        tradeFlashcardType,
        processResult: processResult || undefined,
        isSystemAligned: isSystemAligned === EMPTY_SELECT_VALUE ? undefined : isSystemAligned === "true",
        preEntryImageUrl: preEntryImages[0].url,
        postEntryImageUrl: postEntryImages[0]?.url || undefined,
        progressImageUrls: progressImages.map((item) => item.url).filter(Boolean),
        marketTimeInfo: marketTimeInfo.trim() || undefined,
        symbolPairInfo: symbolPairInfo.trim() || undefined,
        playbookType: playbookType || undefined,
        notes: notes.trim() || undefined,
        summary: summary.trim() || undefined,
        tagCodes: tagCodes.length ? tagCodes : undefined,
      });

      rememberSymbolPair(symbolPairInfo);

      setTradeFlashcardType("");
      setProcessResult("");
      setIsSystemAligned(EMPTY_SELECT_VALUE);
      setPreEntryImages([]);
      setPostEntryImages([]);
      setProgressImages([]);
      setMarketTimeInfo("");
      setSymbolPairInfo("");
      setPlaybookType("");
      setNotes("");
      setSummary("");
      setTagCodes([]);
      successAlert("交易闪卡保存成功，过程状态会根据图片自动推导");
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSubmitting(false);
    }
  }, [errorAlert, isSystemAligned, marketTimeInfo, notes, playbookType, postEntryImages, preEntryImages, processResult, progressImages, rememberSymbolPair, successAlert, summary, symbolPairInfo, tagCodes, tradeFlashcardType]);

  return (
    <TradePageShell title="交易闪卡录入" subtitle="过程状态会根据图片自动推导，避免手动误操作" showAddButton={false}>
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4 shadow-sm space-y-4">
            <Field label="闪卡类型（必填）">
              <Select value={tradeFlashcardType} onValueChange={(value) => setTradeFlashcardType(value as TradeFlashcardType)}>
                <SelectTrigger className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"><SelectValue placeholder="选择类型" /></SelectTrigger>
                <SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                  {TRADE_FLASHCARD_TYPES.map((item) => <SelectItem key={item} value={item}>{TRADE_FLASHCARD_LABELS[item]}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="行情时间信息">
              <DateCalendarPicker analysisTime={marketTimeInfo} updateForm={(patch) => setMarketTimeInfo(patch.analysisTime)} showSeconds={false} placeholder="选择行情时间" />
            </Field>
            <Field label="币对信息">
              <>
                <Input value={symbolPairInfo} onChange={(e) => setSymbolPairInfo(e.target.value)} onBlur={(e) => rememberSymbolPair(e.target.value)} list="trade-flashcard-symbol-pair-presets" placeholder="例：BTC/USDT" className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]" />
                <datalist id="trade-flashcard-symbol-pair-presets">
                  {symbolPairOptions.map((item) => <option key={item} value={item} />)}
                </datalist>
              </>
            </Field>
            <Field label="剧本类型">
              <Select value={playbookType || EMPTY_SELECT_VALUE} onValueChange={(value) => setPlaybookType(value === EMPTY_SELECT_VALUE ? "" : value)}>
                <SelectTrigger className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"><SelectValue placeholder="选择剧本类型" /></SelectTrigger>
                <SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                  <SelectItem value={EMPTY_SELECT_VALUE}>未设置</SelectItem>
                  {playbookTypeOptions.map((item) => <SelectItem key={item.code} value={item.code}>{item.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4 shadow-sm space-y-4">
            <Field label="过程结果">
              <Select value={processResult || EMPTY_SELECT_VALUE} onValueChange={(value) => setProcessResult(value === EMPTY_SELECT_VALUE ? "" : (value as TradeFlashcardProcessResult))}>
                <SelectTrigger className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"><SelectValue placeholder="未设置" /></SelectTrigger>
                <SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                  <SelectItem value={EMPTY_SELECT_VALUE}>未设置</SelectItem>
                  {TRADE_FLASHCARD_PROCESS_RESULTS.map((item) => <SelectItem key={item} value={item}>{TRADE_FLASHCARD_LABELS[item]}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="是否符合交易系统">
              <Select value={isSystemAligned} onValueChange={setIsSystemAligned}>
                <SelectTrigger className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"><SelectValue placeholder="未设置" /></SelectTrigger>
                <SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                  <SelectItem value={EMPTY_SELECT_VALUE}>未设置</SelectItem>
                  <SelectItem value="true">符合</SelectItem>
                  <SelectItem value="false">不符合</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="字典标签">
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
            </Field>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-medium text-[#9ca3af]">备注</div>
                  <div className="mt-1 text-[11px] text-[#71717a]">可直接套用交易前 / 中 / 后复盘模板</div>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]" onClick={() => setNotes((prev) => (prev.trim() ? `${prev.trim()}\n\n${NOTE_TEMPLATE}` : NOTE_TEMPLATE))}>插入模板</Button>
                  <Button type="button" variant="outline" className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]" onClick={() => void handleCopyTemplate()} disabled={copyingTemplate}>{copyingTemplate ? "复制中..." : "一键复制模板"}</Button>
                </div>
              </div>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="记录入场前、入场中、入场后的判断变化" className="min-h-28 border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]" />
            </div>
            <Field label="总结">
              <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="沉淀这次交易闪卡的经验总结" className="min-h-24 border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]" />
            </Field>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <UploadCard title="入场前截图（必填）"><ImageUploader value={preEntryImages} onChange={setPreEntryImages} max={1} /></UploadCard>
          <UploadCard title="入场后截图（选填）"><ImageUploader value={postEntryImages} onChange={setPostEntryImages} max={1} /></UploadCard>
          <UploadCard title="走势截图（最多 5 张）"><ImageUploader value={progressImages} onChange={setProgressImages} max={5} /></UploadCard>
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={handleSubmit} disabled={submitting} className="bg-[#00c2b2] text-black hover:bg-[#009e91]">{submitting ? "保存中..." : "保存交易闪卡"}</Button>
        </div>
      </div>
    </TradePageShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><div className="text-xs font-medium text-[#9ca3af]">{label}</div>{children}</div>;
}

function UploadCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4 shadow-sm"><div className="mb-2 text-sm font-medium text-[#e5e7eb]">{title}</div>{children}</div>;
}
