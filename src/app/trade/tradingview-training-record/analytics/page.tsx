"use client";

import React from "react";
import { RefreshCw, Search, Star } from "lucide-react";
import TradePageShell from "../../components/trade-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAlert } from "@/components/common/alert";
import { fetchPlaybookTypeOptions } from "../../dictionary";
import { getTradingViewTrainingRecordAnalytics } from "../request";
import type {
  TradingViewTrainingRecordPlaybookAnalytics,
  TradingViewTrainingRecordSummary,
} from "../types";

const ALL_VALUE = "__ALL__";

type DictionaryOption = { code: string; label: string; color?: string };

const EMPTY_SUMMARY: TradingViewTrainingRecordSummary = {
  totalCount: 0,
  winCount: 0,
  lossCount: 0,
  breakevenCount: 0,
  decisiveCount: 0,
  winRate: null,
  avgEntryConfidenceRating: null,
};

export default function TradingViewTrainingRecordAnalyticsPage() {
  const [, errorAlert] = useAlert();
  const [summary, setSummary] = React.useState<TradingViewTrainingRecordSummary>(EMPTY_SUMMARY);
  const [playbookItems, setPlaybookItems] = React.useState<TradingViewTrainingRecordPlaybookAnalytics[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [playbookOptions, setPlaybookOptions] = React.useState<DictionaryOption[]>([]);
  const [playbookFilter, setPlaybookFilter] = React.useState(ALL_VALUE);
  const [symbolFilter, setSymbolFilter] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");

  const playbookLabelMap = React.useMemo(
    () => new Map(playbookOptions.map((item) => [item.code, item.label])),
    [playbookOptions],
  );

  const fetchAnalytics = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTradingViewTrainingRecordAnalytics({
        playbookType: playbookFilter === ALL_VALUE ? undefined : playbookFilter,
        symbolPair: symbolFilter.trim() || undefined,
        from: from ? new Date(from).toISOString() : undefined,
        to: to ? new Date(to).toISOString() : undefined,
      });
      setSummary(res.summary || EMPTY_SUMMARY);
      setPlaybookItems(res.playbookItems || []);
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "查询统计失败");
    } finally {
      setLoading(false);
    }
  }, [errorAlert, from, playbookFilter, symbolFilter, to]);

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
    fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <TradePageShell title="TradingView 训练统计" subtitle="只统计 TradingView 手动复盘训练记录" showAddButton={false}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-[#27272a] bg-[#121212] p-4">
          <div className="w-56">
            <label className="mb-2 block text-xs text-[#a1a1aa]">剧本</label>
            <Select value={playbookFilter} onValueChange={setPlaybookFilter}>
              <SelectTrigger className="border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]"><SelectValue /></SelectTrigger>
              <SelectContent className="border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                <SelectItem value={ALL_VALUE}>全部剧本</SelectItem>
                {playbookOptions.map((item) => <SelectItem key={item.code} value={item.code}>{item.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-40">
            <label className="mb-2 block text-xs text-[#a1a1aa]">币对</label>
            <Input value={symbolFilter} onChange={(event) => setSymbolFilter(event.target.value.toUpperCase())} placeholder="BTCUSDT" className="border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]" />
          </div>
          <div className="w-44">
            <label className="mb-2 block text-xs text-[#a1a1aa]">开始时间</label>
            <Input type="datetime-local" value={from} onChange={(event) => setFrom(event.target.value)} className="border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]" />
          </div>
          <div className="w-44">
            <label className="mb-2 block text-xs text-[#a1a1aa]">结束时间</label>
            <Input type="datetime-local" value={to} onChange={(event) => setTo(event.target.value)} className="border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]" />
          </div>
          <Button onClick={fetchAnalytics} disabled={loading} className="bg-[#00c2b2] text-black hover:bg-[#14b8a6]">
            <Search className="mr-2 h-4 w-4" />查询
          </Button>
          <Button variant="outline" onClick={fetchAnalytics} disabled={loading} className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1f1f22]">
            <RefreshCw className="mr-2 h-4 w-4" />刷新
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <Metric title="总记录" value={summary.totalCount} />
          <Metric title="胜率" value={formatRate(summary.winRate)} highlight />
          <Metric title="盈利" value={summary.winCount} tone="green" />
          <Metric title="亏损" value={summary.lossCount} tone="red" />
          <Metric title="保本" value={summary.breakevenCount} tone="amber" />
          <Metric title="平均把握度" value={formatRating(summary.avgEntryConfidenceRating)} />
        </div>

        <div className="overflow-hidden rounded-lg border border-[#27272a] bg-[#121212]">
          <div className="grid grid-cols-[minmax(180px,1fr)_110px_110px_110px_110px_120px_150px] border-b border-[#27272a] bg-[#18181b] px-4 py-3 text-xs font-medium text-[#a1a1aa]">
            <div>剧本</div><div>总样本</div><div>盈利</div><div>亏损</div><div>保本</div><div>胜率</div><div>平均把握度</div>
          </div>
          {loading ? (
            <div className="p-8 text-center text-sm text-[#71717a]">加载中...</div>
          ) : playbookItems.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#71717a]">暂无统计数据</div>
          ) : playbookItems.map((item) => (
            <div key={item.playbookType} className="grid grid-cols-[minmax(180px,1fr)_110px_110px_110px_110px_120px_150px] items-center border-b border-[#27272a] px-4 py-3 text-sm last:border-0">
              <div className="font-medium text-[#e5e7eb]">{item.playbookItem?.label || playbookLabelMap.get(item.playbookType) || item.playbookType}</div>
              <div className="text-[#e5e7eb]">{item.totalCount}</div>
              <div className="text-[#22c55e]">{item.winCount}</div>
              <div className="text-[#ef4444]">{item.lossCount}</div>
              <div className="text-[#f59e0b]">{item.breakevenCount}</div>
              <div className="font-medium text-white">{formatRate(item.winRate)}</div>
              <div className="flex items-center gap-2 text-[#e5e7eb]"><Star className="h-4 w-4 fill-[#facc15] text-[#facc15]" />{formatRating(item.avgEntryConfidenceRating)}</div>
            </div>
          ))}
        </div>
      </div>
    </TradePageShell>
  );
}

function Metric({ title, value, highlight, tone }: { title: string; value: React.ReactNode; highlight?: boolean; tone?: "green" | "red" | "amber" }) {
  const color = highlight ? "text-white" : tone === "green" ? "text-[#22c55e]" : tone === "red" ? "text-[#ef4444]" : tone === "amber" ? "text-[#f59e0b]" : "text-[#e5e7eb]";
  return (
    <div className="rounded-lg border border-[#27272a] bg-[#121212] p-4">
      <div className="text-xs text-[#a1a1aa]">{title}</div>
      <div className={`mt-2 text-2xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function formatRate(value: number | null) {
  return value === null ? "-" : `${Math.round(value * 100)}%`;
}

function formatRating(value: number | null) {
  return value === null ? "-" : value.toFixed(1);
}
