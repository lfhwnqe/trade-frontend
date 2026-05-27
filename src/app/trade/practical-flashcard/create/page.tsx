"use client";

import React from "react";
import TradePageShell from "../../components/trade-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DateCalendarPicker } from "@/components/common/DateCalendarPicker";
import { ImageUploader } from "@/components/common/ImageUploader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAlert } from "@/components/common/alert";
import { fetchFlashcardTagOptions, fetchPlaybookTypeOptions } from "../../dictionary";
import { createPracticalFlashcardCard, getBrowserTimeZone } from "../request";
import type { ImageResource } from "../../config";
import {
  PRACTICAL_FLASHCARD_BINANCE_UM_SYMBOLS,
  PRACTICAL_FLASHCARD_DIRECTIONS,
  PRACTICAL_FLASHCARD_LABELS,
  type PracticalFlashcardDirection,
} from "../types";
import { usePracticalFlashcardAdminAccess } from "../use-practical-flashcard-admin-access";

const EMPTY_SELECT_VALUE = "__NONE__";

export default function PracticalFlashcardCreatePage() {
  const { loaded, isAdmin } = usePracticalFlashcardAdminAccess();

  if (!loaded) {
    return (
      <TradePageShell title="实操闪卡创建" subtitle="正在确认权限" showAddButton={false}>
        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-6 text-sm text-[#a1a1aa]">加载中...</div>
      </TradePageShell>
    );
  }

  if (!isAdmin) {
    return (
      <TradePageShell title="无权限访问" subtitle="实操闪卡题库由管理员维护" showAddButton={false}>
        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-6 text-sm text-[#a1a1aa]">
          当前账号不能创建实操闪卡。你仍然可以从训练统计页进入实操训练。
        </div>
      </TradePageShell>
    );
  }

  return <PracticalFlashcardCreateForm />;
}

function PracticalFlashcardCreateForm() {
  const [successAlert, errorAlert] = useAlert();
  const [symbolPairInfo, setSymbolPairInfo] = React.useState("");
  const [entryTimeInfo, setEntryTimeInfo] = React.useState("");
  const [exitTimeInfo, setExitTimeInfo] = React.useState("");
  const [expectedDirection, setExpectedDirection] = React.useState<PracticalFlashcardDirection | "">("");
  const [standardEntryPrice, setStandardEntryPrice] = React.useState("");
  const [standardStopLossPrice, setStandardStopLossPrice] = React.useState("");
  const [standardTakeProfitPrice, setStandardTakeProfitPrice] = React.useState("");
  const [playbookType, setPlaybookType] = React.useState("");
  const [tagCodes, setTagCodes] = React.useState<string[]>([]);
  const [orderFlowImages, setOrderFlowImages] = React.useState<ImageResource[]>([]);
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
        venue: "BINANCE_UM_FUTURES",
        symbolPairInfo: symbolPairInfo.trim(),
        entryTimeInfo,
        exitTimeInfo,
        primaryInterval: "15m",
        timeZone: getBrowserTimeZone(),
        expectedDirection: expectedDirection || undefined,
        standardEntryPrice: parseOptionalNumber(standardEntryPrice),
        standardStopLossPrice: parseOptionalNumber(standardStopLossPrice),
        standardTakeProfitPrice: parseOptionalNumber(standardTakeProfitPrice),
        playbookType,
        tagCodes: tagCodes.length ? tagCodes : undefined,
        orderFlowImageUrls: orderFlowImages.map((item) => item.url).filter(Boolean),
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
      setOrderFlowImages([]);
      setOrderFlowRemark("");
      setNotes("");
      setSummary("");
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "创建失败");
    } finally {
      setSubmitting(false);
    }
  }, [entryTimeInfo, errorAlert, exitTimeInfo, expectedDirection, notes, orderFlowImages, orderFlowRemark, playbookType, standardEntryPrice, standardStopLossPrice, standardTakeProfitPrice, successAlert, summary, symbolPairInfo, tagCodes]);

  return (
    <TradePageShell title="实操闪卡创建" subtitle="创建时拉取 Binance U 本位合约公开 K 线并保存冻结快照" showAddButton={false}>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-xl border border-[#27272a] bg-[#121212] p-4 space-y-4">
              <Field label="行情源">
                <div className="flex h-9 items-center rounded-md border border-[#27272a] bg-[#1e1e1e] px-3 text-sm text-[#e5e7eb]">
                  {PRACTICAL_FLASHCARD_LABELS.BINANCE_UM_FUTURES}
                </div>
              </Field>
              <Field label="交易对 *">
                <Select value={symbolPairInfo || EMPTY_SELECT_VALUE} onValueChange={(value) => setSymbolPairInfo(value === EMPTY_SELECT_VALUE ? "" : value)}>
                  <SelectTrigger className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"><SelectValue placeholder="选择 Binance 合约币对" /></SelectTrigger>
                  <SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                    <SelectItem value={EMPTY_SELECT_VALUE}>请选择</SelectItem>
                    {PRACTICAL_FLASHCARD_BINANCE_UM_SYMBOLS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                  </SelectContent>
                </Select>
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
                {tagOptions.length === 0 ? (
                  <span className="text-xs text-[#9ca3af]">暂无可用 flashcard_tag，可先到后台字典管理中维护</span>
                ) : (
                  tagOptions.map((item) => {
                    const active = tagCodes.includes(item.code);
                    return (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => setTagCodes((prev) => active ? prev.filter((code) => code !== item.code) : [...prev, item.code])}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition ${
                          active
                            ? "border-[#00c2b2] bg-[#00c2b2]/20 text-[#00c2b2]"
                            : "border-[#27272a] bg-[#121212] text-[#e5e7eb] hover:bg-[#242424]"
                        }`}
                      >
                        {item.color ? (
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full border border-white/20"
                            style={{ backgroundColor: item.color }}
                          />
                        ) : null}
                        {item.label}
                      </button>
                    );
                  })
                )}
              </div>
            </Field>
            <Field label="足迹图（选填，最多 5 张）">
              <ImageUploader value={orderFlowImages} onChange={setOrderFlowImages} max={5} />
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
              保存前会固定使用 Binance U 本位合约 15m K 线，按入场时间向前 5 天、离场时间向后 2 小时拉取，并把结果写入卡片快照。当前可选币对：BTCUSDT、BTCUSDC、ETHUSDT、ETHUSDC。
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
    <div className="block space-y-2">
      <span className="text-sm font-medium text-[#d4d4d8]">{label}</span>
      {children}
    </div>
  );
}
