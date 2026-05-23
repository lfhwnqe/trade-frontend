"use client";

import Link from "next/link";
import * as React from "react";
import { ArrowRight, BarChart3, RefreshCw, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TradePageShell from "../../components/trade-page-shell";
import { fetchPlaybookTypeOptions } from "../../dictionary";
import { getPracticalFlashcardDashboardAnalytics } from "../request";
import type {
  PracticalFlashcardAnalyticsAttemptSample,
  PracticalFlashcardAnalyticsGroup,
  PracticalFlashcardDashboardAnalytics,
} from "../types";
import { PRACTICAL_FLASHCARD_LABELS } from "../types";

type DictionaryOption = { code: string; label: string };

const SYMBOL_OPTIONS = ["", "BTCUSDT", "BTCUSDC", "ETHUSDT", "ETHUSDC"];

export default function PracticalFlashcardDashboardPage() {
  const [analytics, setAnalytics] = React.useState<PracticalFlashcardDashboardAnalytics | null>(null);
  const [playbookOptions, setPlaybookOptions] = React.useState<DictionaryOption[]>([]);
  const [filters, setFilters] = React.useState({ from: "", to: "", playbookType: "", symbolPairInfo: "" });
  const [loading, setLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState("");

  const playbookLabelMap = React.useMemo(
    () => new Map(playbookOptions.map((item) => [item.code, item.label])),
    [playbookOptions],
  );

  const loadAnalytics = React.useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const data = await getPracticalFlashcardDashboardAnalytics({
        from: filters.from ? `${filters.from}T00:00:00` : undefined,
        to: filters.to ? `${filters.to}T23:59:59` : undefined,
        playbookType: filters.playbookType || undefined,
        symbolPairInfo: filters.symbolPairInfo || undefined,
      });
      setAnalytics(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "获取实操闪卡训练统计失败");
    } finally {
      setLoading(false);
    }
  }, [filters.from, filters.playbookType, filters.symbolPairInfo, filters.to]);

  React.useEffect(() => {
    fetchPlaybookTypeOptions()
      .then((items) => setPlaybookOptions(items.map((item) => ({ code: item.code, label: item.label }))))
      .catch(() => setPlaybookOptions([]));
  }, []);

  React.useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const resolvePlaybookLabel = React.useCallback(
    (value?: string) => (value ? playbookLabelMap.get(value) || value : "未知剧本"),
    [playbookLabelMap],
  );

  return (
    <TradePageShell title="实操闪卡训练统计" subtitle="基于已完成实操训练记录聚合" showAddButton={false}>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 rounded-lg border border-[#27272a] bg-[#121212] p-4 lg:flex-row lg:items-end">
          <label className="space-y-1">
            <span className="text-xs text-[#a1a1aa]">开始日期</span>
            <Input
              type="date"
              value={filters.from}
              onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))}
              className="w-full border-[#27272a] bg-[#18181b] text-[#e5e7eb] lg:w-[160px]"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-[#a1a1aa]">结束日期</span>
            <Input
              type="date"
              value={filters.to}
              onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))}
              className="w-full border-[#27272a] bg-[#18181b] text-[#e5e7eb] lg:w-[160px]"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-[#a1a1aa]">剧本</span>
            <select
              value={filters.playbookType}
              onChange={(event) => setFilters((prev) => ({ ...prev, playbookType: event.target.value }))}
              className="h-10 w-full rounded-md border border-[#27272a] bg-[#18181b] px-3 text-sm text-[#e5e7eb] lg:w-[220px]"
            >
              <option value="">全部剧本</option>
              {playbookOptions.map((item) => (
                <option key={item.code} value={item.code}>{item.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs text-[#a1a1aa]">币对</span>
            <select
              value={filters.symbolPairInfo}
              onChange={(event) => setFilters((prev) => ({ ...prev, symbolPairInfo: event.target.value }))}
              className="h-10 w-full rounded-md border border-[#27272a] bg-[#18181b] px-3 text-sm text-[#e5e7eb] lg:w-[160px]"
            >
              {SYMBOL_OPTIONS.map((item) => (
                <option key={item || "ALL"} value={item}>{item || "全部币对"}</option>
              ))}
            </select>
          </label>
          <Button
            type="button"
            onClick={() => void loadAnalytics()}
            disabled={loading}
            className="bg-[#00c2b2] text-black hover:bg-[#00a89a]"
          >
            <RefreshCw className="size-4" />刷新
          </Button>
        </div>

        {errorMessage ? (
          <div className="rounded-lg border border-[#7f1d1d] bg-[#2a1111] p-4 text-sm text-[#fecaca]">{errorMessage}</div>
        ) : null}

        {loading && !analytics ? (
          <div className="rounded-lg border border-[#27272a] bg-[#121212] p-8 text-center text-sm text-[#a1a1aa]">读取统计中...</div>
        ) : null}

        {analytics ? (
          <>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <MetricCard label="已完成训练" value={analytics.resolvedCount.toString()} icon={<Target className="size-4" />} />
              <MetricCard label="胜率" value={formatPercent(analytics.winRate)} icon={<TrendingUp className="size-4" />} />
              <MetricCard label="平均 R" value={formatSignedNumber(analytics.avgRealizedR)} icon={<BarChart3 className="size-4" />} />
              <MetricCard label="总 R" value={formatSignedNumber(analytics.totalRealizedR)} icon={<BarChart3 className="size-4" />} />
              <MetricCard label="平均计划 RR" value={formatNumber(analytics.avgPlannedRr)} icon={<Target className="size-4" />} />
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <section className="rounded-lg border border-[#27272a] bg-[#121212] p-4">
                <div className="mb-4 text-sm font-medium text-[#e5e7eb]">分析维度</div>
                <div className="space-y-3">
                  {analytics.analysisDimensions.map((item) => (
                    <div key={item.key}>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-[#e5e7eb]">{item.label}</span>
                        <span className="text-[#a1a1aa]">{item.correctCount}/{item.reviewedCount} · {formatPercent(item.correctRate)}</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#27272a]">
                        <div className="h-full bg-[#00c2b2]" style={{ width: `${Math.max(Math.round((item.correctRate || 0) * 100), item.reviewedCount ? 4 : 0)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-[#27272a] bg-[#121212] p-4">
                <div className="mb-4 text-sm font-medium text-[#e5e7eb]">最近错误样本</div>
                <AttemptList items={analytics.recentWrongAttempts} resolvePlaybookLabel={resolvePlaybookLabel} emptyText="暂无错误样本" />
              </section>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              <GroupTable title="剧本统计" items={analytics.playbookStats} labelResolver={resolvePlaybookLabel} />
              <GroupTable title="币对统计" items={analytics.symbolStats} />
              <GroupTable title="单卡统计" items={analytics.cardStats} />
            </div>

            <section className="rounded-lg border border-[#27272a] bg-[#121212] p-4">
              <div className="mb-4 text-sm font-medium text-[#e5e7eb]">最近训练记录</div>
              <AttemptList items={analytics.recentAttempts} resolvePlaybookLabel={resolvePlaybookLabel} emptyText="暂无训练记录" />
            </section>
          </>
        ) : null}
      </div>
    </TradePageShell>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#27272a] bg-[#121212] p-4">
      <div className="flex items-center justify-between text-xs text-[#a1a1aa]">
        <span>{label}</span>
        <span className="text-[#00c2b2]">{icon}</span>
      </div>
      <div className="mt-3 text-2xl font-semibold text-[#f4f4f5]">{value}</div>
    </div>
  );
}

function GroupTable({
  title,
  items,
  labelResolver,
}: {
  title: string;
  items: PracticalFlashcardAnalyticsGroup[];
  labelResolver?: (value?: string) => string;
}) {
  return (
    <section className="rounded-lg border border-[#27272a] bg-[#121212] p-4">
      <div className="mb-4 text-sm font-medium text-[#e5e7eb]">{title}</div>
      <div className="space-y-3">
        {items.length ? items.map((item) => (
          <div key={item.key} className="rounded-md border border-[#27272a] bg-[#18181b] p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 text-sm font-medium text-[#e5e7eb]">{labelResolver ? labelResolver(item.key) : item.label}</div>
              <div className="shrink-0 text-xs text-[#a1a1aa]">{item.resolvedCount} 次</div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <MiniStat label="胜率" value={formatPercent(item.winRate)} />
              <MiniStat label="均 R" value={formatSignedNumber(item.avgRealizedR)} />
              <MiniStat label="总 R" value={formatSignedNumber(item.totalRealizedR)} />
            </div>
          </div>
        )) : <div className="text-sm text-[#71717a]">暂无数据</div>}
      </div>
    </section>
  );
}

function AttemptList({
  items,
  resolvePlaybookLabel,
  emptyText,
}: {
  items: PracticalFlashcardAnalyticsAttemptSample[];
  resolvePlaybookLabel: (value?: string) => string;
  emptyText: string;
}) {
  if (!items.length) return <div className="text-sm text-[#71717a]">{emptyText}</div>;
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.attemptId} className="flex flex-col gap-3 rounded-md border border-[#27272a] bg-[#18181b] p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-sm text-[#e5e7eb]">
              <span>{item.symbolPairInfo || "未知币对"}</span>
              <span className="text-[#52525b]">/</span>
              <span>{resolvePlaybookLabel(item.playbookType)}</span>
              <span className={item.isWin ? "text-[#22c55e]" : "text-[#ef4444]"}>{item.isWin ? "胜" : "负"}</span>
            </div>
            <div className="mt-1 text-xs text-[#a1a1aa]">
              {formatDateTime(item.resolvedAt)} · {PRACTICAL_FLASHCARD_LABELS[item.tradeDirection || ""] || "-"} · R {formatSignedNumber(item.realizedR)}
            </div>
          </div>
          <Link href={`/trade/practical-flashcard/${item.targetCardId}/play?attemptId=${item.attemptId}`} prefetch={false}>
            <Button variant="outline" className="w-full border-[#27272a] bg-[#121212] text-[#e5e7eb] hover:bg-[#242424] sm:w-auto">
              详情<ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      ))}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[#27272a] bg-[#121212] px-2 py-1.5">
      <div className="text-[#71717a]">{label}</div>
      <div className="mt-1 font-medium text-[#e5e7eb]">{value}</div>
    </div>
  );
}

function formatPercent(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return `${Math.round(value * 100)}%`;
}

function formatNumber(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return value.toFixed(2);
}

function formatSignedNumber(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  const fixed = value.toFixed(2);
  return value > 0 ? `+${fixed}` : fixed;
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", { hour12: false });
}
