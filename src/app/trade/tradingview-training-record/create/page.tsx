"use client";

import React from "react";
import Link from "next/link";
import { Save, Star } from "lucide-react";
import TradePageShell from "../../components/trade-page-shell";
import { ImageUploader } from "@/components/common/ImageUploader";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAlert } from "@/components/common/alert";
import { fetchPlaybookTypeOptions } from "../../dictionary";
import type { ImageResource } from "../../config";
import {
  createTradingViewTrainingRecord,
  getTradingViewTrainingRecordUploadUrl,
} from "../request";
import type { TradingViewTrainingRecordResult } from "../types";
import { TRADINGVIEW_TRAINING_RECORD_LABELS } from "../types";

type DictionaryOption = { code: string; label: string; color?: string };

const EMPTY_SELECT_VALUE = "__NONE__";
const TVTR_SYMBOL_OPTIONS = ["BTCUSDT", "BTCUSDC", "ETHUSDT", "ETHUSDC"] as const;

export default function TradingViewTrainingRecordCreatePage() {
  const [successAlert, errorAlert] = useAlert();
  const [images, setImages] = React.useState<ImageResource[]>([]);
  const [symbolPair, setSymbolPair] = React.useState("BTCUSDC");
  const [playbookType, setPlaybookType] = React.useState("");
  const [tradeResult, setTradeResult] = React.useState<TradingViewTrainingRecordResult | "">("");
  const [entryConfidenceRating, setEntryConfidenceRating] = React.useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [playbookOptions, setPlaybookOptions] = React.useState<DictionaryOption[]>([]);

  React.useEffect(() => {
    let mounted = true;
    fetchPlaybookTypeOptions()
      .then((items) => mounted && setPlaybookOptions(items))
      .catch(() => mounted && setPlaybookOptions([]));
    return () => {
      mounted = false;
    };
  }, []);

  const uploadUrlResolver = React.useCallback(
    (params: { fileName: string; contentType: string }) =>
      getTradingViewTrainingRecordUploadUrl({
        fileName: params.fileName,
        contentType: params.contentType,
        scope: "training-image",
      }),
    [],
  );

  const handleSubmit = async () => {
    const image = images.find((item) => item.url && !item.key.startsWith("__loading__"));
    if (!image) {
      errorAlert("请先上传 TradingView 训练图片");
      return;
    }
    if (!playbookType) {
      errorAlert("请选择剧本类型");
      return;
    }
    if (!tradeResult) {
      errorAlert("请选择交易结果");
      return;
    }
    if (!entryConfidenceRating) {
      errorAlert("请选择入场时把握度");
      return;
    }

    setSaving(true);
    try {
      await createTradingViewTrainingRecord({
        symbolPair: symbolPair.trim().toUpperCase() || undefined,
        imageUrl: image.url,
        imageKey: image.key,
        tradeResult,
        playbookType,
        entryConfidenceRating,
        notes,
      });
      successAlert("TradingView 训练记录已保存");
      setImages([]);
      setTradeResult("");
      setEntryConfidenceRating(null);
      setNotes("");
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <TradePageShell title="TradingView 训练记录录入" subtitle="保存 TradingView 手动复盘训练样本" showAddButton={false}>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-lg border border-[#27272a] bg-[#121212] p-5">
          <div className="mb-4 text-sm font-semibold text-white">交易图片</div>
          <ImageUploader value={images} onChange={setImages} max={1} uploadUrlResolver={uploadUrlResolver} />
        </section>

        <aside className="space-y-4 rounded-lg border border-[#27272a] bg-[#121212] p-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#e5e7eb]">交易币对</label>
            <Select value={symbolPair || EMPTY_SELECT_VALUE} onValueChange={(value) => setSymbolPair(value === EMPTY_SELECT_VALUE ? "" : value)}>
              <SelectTrigger className="border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]">
                <SelectValue placeholder="选择币对" />
              </SelectTrigger>
              <SelectContent className="border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                <SelectItem value={EMPTY_SELECT_VALUE}>不填写</SelectItem>
                {TVTR_SYMBOL_OPTIONS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#e5e7eb]">剧本类型</label>
            <Select value={playbookType} onValueChange={setPlaybookType}>
              <SelectTrigger className="border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]">
                <SelectValue placeholder="选择 playbook_type" />
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
            <label className="mb-2 block text-sm font-medium text-[#e5e7eb]">交易结果</label>
            <Select value={tradeResult} onValueChange={(value) => setTradeResult(value as TradingViewTrainingRecordResult)}>
              <SelectTrigger className="border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]">
                <SelectValue placeholder="选择盈利 / 亏损 / 保本 / 暂未入场 / 未离场" />
              </SelectTrigger>
              <SelectContent className="border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                <SelectItem value="WIN">{TRADINGVIEW_TRAINING_RECORD_LABELS.WIN}</SelectItem>
                <SelectItem value="LOSS">{TRADINGVIEW_TRAINING_RECORD_LABELS.LOSS}</SelectItem>
                <SelectItem value="BREAKEVEN">{TRADINGVIEW_TRAINING_RECORD_LABELS.BREAKEVEN}</SelectItem>
                <SelectItem value="NOT_ENTERED">{TRADINGVIEW_TRAINING_RECORD_LABELS.NOT_ENTERED}</SelectItem>
                <SelectItem value="NOT_EXITED">{TRADINGVIEW_TRAINING_RECORD_LABELS.NOT_EXITED}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#e5e7eb]">入场时把握度</label>
            <StarRating value={entryConfidenceRating} onChange={setEntryConfidenceRating} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#e5e7eb]">备注</label>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="记录复盘结论、执行问题或下次注意事项"
              className="min-h-36 border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={saving} className="bg-[#00c2b2] text-black hover:bg-[#14b8a6]">
              <Save className="mr-2 h-4 w-4" />
              {saving ? "保存中..." : "保存"}
            </Button>
            <Button asChild variant="outline" className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1f1f22]">
              <Link href="/trade/tradingview-training-record/manage">管理页</Link>
            </Button>
          </div>
        </aside>
      </div>
    </TradePageShell>
  );
}

function StarRating({
  value,
  onChange,
}: {
  value: 1 | 2 | 3 | 4 | 5 | null;
  onChange: (value: 1 | 2 | 3 | 4 | 5) => void;
}) {
  return (
    <div className="flex h-10 items-center gap-1">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => onChange(rating as 1 | 2 | 3 | 4 | 5)}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-[#27272a] bg-[#0f0f10] text-[#71717a] hover:bg-[#1f1f22]"
        >
          <Star className={`h-5 w-5 ${value && rating <= value ? "fill-[#facc15] text-[#facc15]" : ""}`} />
        </button>
      ))}
    </div>
  );
}
