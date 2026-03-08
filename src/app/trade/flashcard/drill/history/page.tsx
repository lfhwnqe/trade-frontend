"use client";

import React from "react";
import { format } from "date-fns";
import { Search, Bell, TrendingUp, TrendingDown, Minus, Star, Bolt, BarChart3, Siren } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAlert } from "@/components/common/alert";
import { getFlashcardDrillAnalytics, listFlashcardDrillSessions } from "../../request";
import {
  FLASHCARD_LABELS,
  type FlashcardDrillAnalytics,
  type FlashcardDrillAnalyticsDimensionStat,
  type FlashcardDrillAnalyticsWindow,
  type FlashcardDrillSessionHistoryItem,
} from "../../types";

type SessionStatus = "ALL" | "IN_PROGRESS" | "COMPLETED" | "ABANDONED";

const PAGE_SIZE = 20;
const RECENT_WINDOW = 30;

function formatDelta(delta: number | null) {
  if (delta === null) return "暂无上一组";
  if (delta === 0) return "持平";
  return `${delta > 0 ? "+" : ""}${delta}`;
}

function deltaTone(delta: number | null) {
  if (delta === null || delta === 0) return "text-slate-500";
  return delta > 0 ? "text-[#04D280]" : "text-[#E03F3F]";
}

function cardClass(extra?: string) {
  return `rounded-2xl border border-[#273a39] bg-[#161616] shadow-[0_4px_24px_rgba(0,0,0,0.22)] ${extra || ""}`;
}

function SourceBadge({ source }: { source: FlashcardDrillSessionHistoryItem["source"] }) {
  const tone =
    source === "WRONG_BOOK"
      ? "bg-[#00c2b2]/10 text-[#00c2b2] border-[#00c2b2]/20"
      : source === "FAVORITES"
        ? "bg-amber-400/10 text-amber-300 border-amber-400/20"
        : "bg-slate-800 text-slate-300 border-[#273a39]";

  return (
    <span className={`inline-flex rounded-md border px-2 py-1 text-[11px] font-bold uppercase tracking-tight ${tone}`}>
      {FLASHCARD_LABELS[source]}
    </span>
  );
}

function SessionStatusBadge({ status }: { status: FlashcardDrillSessionHistoryItem["status"] }) {
  const tone =
    status === "COMPLETED"
      ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-300"
      : status === "IN_PROGRESS"
        ? "border-sky-400/30 bg-sky-400/15 text-sky-300"
        : "border-amber-400/30 bg-amber-400/15 text-amber-300";

  const label = status === "COMPLETED" ? "已完成" : status === "IN_PROGRESS" ? "进行中" : "已中断";

  return <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${tone}`}>{label}</span>;
}

function SummaryCard(props: {
  label: string;
  value: string | number;
  sub?: string;
  trendText?: string;
  trendTone?: "up" | "down" | "flat" | "star" | "bolt";
  featured?: boolean;
}) {
  const trendToneClass =
    props.trendTone === "up"
      ? "text-[#04D280]"
      : props.trendTone === "down"
        ? "text-[#E03F3F]"
        : props.trendTone === "flat"
          ? "text-slate-500"
          : "text-[#04D280]";

  const icon =
    props.trendTone === "up" ? (
      <TrendingUp className="h-3.5 w-3.5" />
    ) : props.trendTone === "down" ? (
      <TrendingDown className="h-3.5 w-3.5" />
    ) : props.trendTone === "flat" ? (
      <Minus className="h-3.5 w-3.5" />
    ) : props.trendTone === "star" ? (
      <Star className="h-3.5 w-3.5" />
    ) : props.trendTone === "bolt" ? (
      <Bolt className="h-3.5 w-3.5" />
    ) : null;

  return (
    <div className={cardClass(`p-5 ${props.featured ? "border-[#00c2b2]/20 bg-[#0f1f1d]" : ""}`)}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">{props.label}</p>
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-bold leading-none ${props.featured ? "text-[#00c2b2]" : "text-white"}`}>{props.value}</span>
        {props.sub ? <span className="text-xs text-slate-500">{props.sub}</span> : null}
      </div>
      {props.trendText ? (
        <div className={`mt-3 flex items-center gap-1 text-xs font-bold ${trendToneClass}`}>
          {icon}
          <span>{props.trendText}</span>
        </div>
      ) : null}
    </div>
  );
}

function MiniWindowCard({ title, window }: { title: string; window: FlashcardDrillAnalyticsWindow }) {
  return (
    <div className={cardClass("p-5")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-white">{title}</div>
          <div className="mt-1 text-xs text-slate-500">样本 {window.sampleSize} 轮</div>
        </div>
        <div className={`text-xs font-bold ${deltaTone(window.deltaFromPrevious)}`}>{formatDelta(window.deltaFromPrevious)}</div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3">
        <div>
          <div className="text-xs text-slate-500">均分</div>
          <div className="mt-2 text-2xl font-bold text-white">{window.averageScore}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">最高</div>
          <div className="mt-2 text-2xl font-bold text-white">{window.bestScore}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">最低</div>
          <div className="mt-2 text-2xl font-bold text-white">{window.lowestScore}</div>
        </div>
      </div>
    </div>
  );
}

function LineChartCard(props: {
  title: string;
  bottomLabels: [string, string, string];
  points: { sessionId: string; value: number; startedAt: string }[];
  stroke: string;
  loading: boolean;
}) {
  const width = 1000;
  const height = 100;
  const max = props.points.length ? Math.max(...props.points.map((point) => point.value), 100) : 100;

  const path = props.points
    .map((point, index) => {
      const x = props.points.length === 1 ? 0 : (index / (props.points.length - 1)) * width;
      const y = height - (point.value / max) * 85 - 5;
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  const areaPath = path ? `${path} L${width},100 L0,100 Z` : "";

  return (
    <div className={cardClass("p-6")}>
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-[28px] leading-none font-bold tracking-tight text-white sm:text-lg">{props.title}</h3>
        <span className="text-slate-500">•••</span>
      </div>
      {props.loading ? (
        <div className="flex h-64 items-center justify-center text-sm text-slate-500">加载中...</div>
      ) : props.points.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-[#273a39] text-sm text-slate-500">
          暂无趋势数据
        </div>
      ) : (
        <>
          <div className="relative h-64">
            <div className="absolute inset-0 flex flex-col justify-between opacity-20 pointer-events-none">
              <div className="h-0 w-full border-t border-slate-500" />
              <div className="h-0 w-full border-t border-slate-500" />
              <div className="h-0 w-full border-t border-slate-500" />
              <div className="h-0 w-full border-t border-slate-500" />
            </div>
            <svg className="h-full w-full" preserveAspectRatio="none" viewBox={`0 0 ${width} ${height}`}>
              <defs>
                <linearGradient id={`gradient-${props.title.replace(/\s+/g, "-")}`} x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor={props.stroke} stopOpacity="1" />
                  <stop offset="100%" stopColor={props.stroke} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={path} fill="none" stroke={props.stroke} strokeWidth="2.5" />
              <path d={areaPath} fill={`url(#gradient-${props.title.replace(/\s+/g, "-")})`} opacity="0.12" />
            </svg>
          </div>
          <div className="mt-4 flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
            <span>{props.bottomLabels[0]}</span>
            <span>{props.bottomLabels[1]}</span>
            <span>{props.bottomLabels[2]}</span>
          </div>
        </>
      )}
    </div>
  );
}

function BehaviorAccuracyCard(props: { items: FlashcardDrillAnalyticsDimensionStat[] }) {
  return (
    <div className={cardClass("p-6")}>
      <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-white">
        <BarChart3 className="h-5 w-5 text-[#00c2b2]" />
        行为类型命中率
      </h3>
      <div className="space-y-6">
        {props.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#273a39] px-4 py-10 text-center text-sm text-slate-500">
            暂无可展示数据
          </div>
        ) : (
          props.items.slice(0, 4).map((item) => (
            <div key={item.key}>
              <div className="mb-2 flex justify-between gap-3 text-sm">
                <span className="font-medium text-slate-300">{FLASHCARD_LABELS[item.key] || item.key}</span>
                <span className="font-bold text-[#00c2b2]">
                  {Math.round(item.accuracy * 100)}%
                  <span className="ml-2 text-xs font-normal text-slate-500">({item.total} samples)</span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-[#00c2b2]" style={{ width: `${Math.max(item.accuracy * 100, 6)}%` }} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ErrorRankingCard(props: { items: FlashcardDrillAnalyticsDimensionStat[] }) {
  const topItems = props.items.slice(0, 2);
  const totalWrong = props.items.reduce((sum, item) => sum + item.wrong, 0);
  const firstWrong = topItems[0]?.wrong || 0;
  const secondWrong = topItems[1]?.wrong || 0;
  const firstPercent = totalWrong ? Math.round((firstWrong / totalWrong) * 100) : 0;
  const secondPercent = totalWrong ? Math.round((secondWrong / totalWrong) * 100) : 0;
  const otherPercent = Math.max(100 - firstPercent - secondPercent, 0);

  return (
    <div className={cardClass("p-6")}>
      <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-white">
        <Siren className="h-5 w-5 text-[#E03F3F]" />
        高频错误排行
      </h3>
      {props.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#273a39] px-4 py-10 text-center text-sm text-slate-500">
          暂无可展示数据
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              {topItems.map((item, index) => {
                const isTop = index === 0;
                const cardTone = isTop
                  ? "bg-[#E03F3F]/5 border-[#E03F3F]/20"
                  : "bg-[#1a1a1a] border-[#273a39]";
                const wrongRate = totalWrong ? Math.round((item.wrong / totalWrong) * 100) : 0;
                return (
                  <div key={item.key} className={`rounded-lg border p-3 ${cardTone}`}>
                    <p className={`mb-1 text-[10px] font-bold uppercase tracking-wider ${isTop ? "text-[#E03F3F]" : "text-slate-500"}`}>
                      第 {index + 1} 位错误
                    </p>
                    <p className="text-sm font-bold text-slate-200">{FLASHCARD_LABELS[item.key] || item.key}</p>
                    <p className="mt-2 text-xs text-slate-500">错了 {item.wrong} 次（{wrongRate}%）</p>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center">
              <div className="relative h-40 w-40">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="100, 100" strokeWidth="3" className="text-slate-800" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${firstPercent}, 100`} strokeLinecap="round" strokeWidth="3" className="text-[#E03F3F]" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${secondPercent}, 100`} strokeDashoffset={`-${firstPercent}`} strokeLinecap="round" strokeWidth="3" className="text-[#00c2b2]" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${otherPercent}, 100`} strokeDashoffset={`-${firstPercent + secondPercent}`} strokeLinecap="round" strokeWidth="3" className="text-slate-700" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs font-bold text-slate-500">总错题</span>
                  <span className="text-xl font-bold text-white">{totalWrong}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#E03F3F]" />
              <span className="text-xs text-slate-400">第 1 高频错误</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#00c2b2]" />
              <span className="text-xs text-slate-400">第 2 高频错误</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-slate-700" />
              <span className="text-xs text-slate-400">其他失效类型</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function FlashcardDrillHistoryPage() {
  const [, errorAlert] = useAlert();

  const [status, setStatus] = React.useState<SessionStatus>("COMPLETED");
  const [items, setItems] = React.useState<FlashcardDrillSessionHistoryItem[]>([]);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [analytics, setAnalytics] = React.useState<FlashcardDrillAnalytics | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [analyticsLoading, setAnalyticsLoading] = React.useState(false);

  const fetchAnalytics = React.useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await getFlashcardDrillAnalytics({ recentWindow: RECENT_WINDOW });
      setAnalytics(res);
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "获取训练成绩分析失败");
    } finally {
      setAnalyticsLoading(false);
    }
  }, [errorAlert]);

  const fetchFirstPage = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await listFlashcardDrillSessions({
        pageSize: PAGE_SIZE,
        status: status === "ALL" ? undefined : status,
      });
      setItems(res.items);
      setNextCursor(res.nextCursor);
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "查询训练成绩失败");
    } finally {
      setLoading(false);
    }
  }, [errorAlert, status]);

  const fetchMore = React.useCallback(async () => {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const res = await listFlashcardDrillSessions({
        pageSize: PAGE_SIZE,
        cursor: nextCursor,
        status: status === "ALL" ? undefined : status,
      });
      setItems((prev) => [...prev, ...res.items]);
      setNextCursor(res.nextCursor);
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "查询训练成绩失败");
    } finally {
      setLoadingMore(false);
    }
  }, [errorAlert, nextCursor, status]);

  React.useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  React.useEffect(() => {
    void fetchFirstPage();
  }, [fetchFirstPage]);

  const trendPoints = analytics?.trend.points || [];
  const scoreDelta7 = analytics?.windows.recent7.deltaFromPrevious ?? null;
  const accuracy7 = trendPoints.length
    ? Math.round((trendPoints.slice(-7).reduce((sum, point) => sum + point.accuracy, 0) / Math.min(trendPoints.length, 7)) * 1000) / 10
    : null;
  const accuracy30 = trendPoints.length
    ? Math.round((trendPoints.slice(-30).reduce((sum, point) => sum + point.accuracy, 0) / Math.min(trendPoints.length, 30)) * 1000) / 10
    : null;
  const recentScore = analytics?.summary.recentScore ?? 0;
  const avg30 = analytics?.windows.recent30.averageScore ?? 0;
  const performanceTrend = avg30 ? `${(((recentScore - avg30) / avg30) * 100).toFixed(1)}%` : "-";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-100">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#273a39] bg-[#0a0a0a]/85 px-6 backdrop-blur-md lg:px-8">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-500">闪卡训练</span>
          <span className="text-slate-700">/</span>
          <span className="font-semibold text-slate-100">训练成绩分析</span>
        </div>
        <div className="flex items-center gap-4 lg:gap-6">
          <div className="relative hidden sm:block">
            <Bell className="h-4 w-4 cursor-pointer text-slate-400 hover:text-[#00c2b2]" />
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full border border-[#0a0a0a] bg-[#E03F3F]" />
          </div>
          <button className="hidden items-center gap-2 rounded-xl border border-[#273a39] bg-[#1a1a1a] px-3 py-2 transition-all hover:bg-[#273a39] lg:flex">
            <Search className="h-4 w-4 text-[#00c2b2]" />
            <span className="text-xs text-slate-400">搜索训练模式...</span>
            <kbd className="ml-3 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-500">⌘K</kbd>
          </button>
        </div>
      </header>

      <div className="p-6 lg:p-8">
        <div className="mx-auto max-w-[1600px] space-y-8">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <h1 className="mb-2 text-4xl font-black tracking-tight text-white">闪卡训练成绩</h1>
              <p className="max-w-xl text-base text-slate-400">
                查看最近 30 轮训练的详细表现，追踪稳定性变化，识别你的结构性盲点，并持续优化训练判断质量。
              </p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 rounded-xl border border-[#273a39] bg-[#1a1a1a] px-6 py-2.5 text-sm font-bold text-slate-100 transition-all hover:bg-[#273a39]">
                训练设置
              </button>
              <button className="flex items-center gap-2 rounded-xl bg-[#00c2b2] px-6 py-2.5 text-sm font-bold text-[#0a0a0a] transition-all hover:opacity-90">
                新建训练
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
            <SummaryCard
              label="最近 7 轮均分"
              value={analytics?.windows.recent7.averageScore ?? "-"}
              sub="/ 100"
              trendText={scoreDelta7 === null ? "暂无上一组" : `${formatDelta(scoreDelta7)} 分`}
              trendTone={scoreDelta7 === null || scoreDelta7 === 0 ? "flat" : scoreDelta7 > 0 ? "up" : "down"}
            />
            <SummaryCard
              label="最近 7 轮正确率"
              value={accuracy7 === null ? "-" : `${accuracy7}%`}
              trendText={analyticsLoading ? "加载中" : "最近 7 轮"}
              trendTone="up"
            />
            <SummaryCard
              label="最近一轮得分"
              value={analytics?.summary.recentScore ?? "-"}
              sub="/ 100"
              trendText="最近成绩"
              trendTone="star"
              featured
            />
            <SummaryCard
              label="最近 30 轮均分"
              value={analytics?.windows.recent30.averageScore ?? "-"}
              sub="/ 100"
              trendText={analytics?.windows.recent30.deltaFromPrevious === null ? "暂无上一组" : `${formatDelta(analytics?.windows.recent30.deltaFromPrevious ?? 0)} 分`}
              trendTone={analytics?.windows.recent30.deltaFromPrevious === null || analytics?.windows.recent30.deltaFromPrevious === 0 ? "flat" : (analytics?.windows.recent30.deltaFromPrevious ?? 0) > 0 ? "up" : "down"}
            />
            <SummaryCard
              label="最近 30 轮正确率"
              value={accuracy30 === null ? "-" : `${accuracy30}%`}
              trendText="最近 30 轮"
              trendTone="flat"
            />
            <SummaryCard
              label="整体趋势"
              value={performanceTrend}
              trendText="趋势变化"
              trendTone="bolt"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <LineChartCard
              title="最近 30 轮分数走势"
              bottomLabels={["第 1 轮", "第 15 轮", "第 30 轮"]}
              points={trendPoints.map((point) => ({ sessionId: point.sessionId, value: point.score, startedAt: point.startedAt }))}
              stroke="#00c2b2"
              loading={analyticsLoading}
            />
            <LineChartCard
              title="正确率走势"
              bottomLabels={["0%", "50%", "100%"]}
              points={trendPoints.map((point) => ({ sessionId: point.sessionId, value: Math.round(point.accuracy * 100), startedAt: point.startedAt }))}
              stroke="#04D280"
              loading={analyticsLoading}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <BehaviorAccuracyCard items={analytics?.weaknesses.behaviorTypes || []} />
            <ErrorRankingCard items={analytics?.weaknesses.invalidationTypes || []} />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
            <div className={cardClass("overflow-hidden")}>
              <div className="flex items-center justify-between border-b border-[#273a39] bg-[#1a1a1a]/60 px-6 py-4">
                <h3 className="text-lg font-bold text-white">训练记录</h3>
                <div className="flex items-center gap-3">
                  <Select value={status} onValueChange={(v) => setStatus(v as SessionStatus)}>
                    <SelectTrigger className="h-9 w-[160px] border border-[#273a39] bg-[#111] text-[#e5e7eb]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border border-[#273a39] bg-[#121212] text-[#e5e7eb]">
                      <SelectItem value="ALL">全部状态</SelectItem>
                      <SelectItem value="COMPLETED">仅已完成</SelectItem>
                      <SelectItem value="IN_PROGRESS">仅进行中</SelectItem>
                      <SelectItem value="ABANDONED">仅中断</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table className="min-w-[920px] text-left">
                  <TableHeader>
                    <TableRow className="bg-[#0f0f0f]/60 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-[#0f0f0f]/60">
                      <TableHead className="px-6 py-4">时间</TableHead>
                      <TableHead className="px-6 py-4">题源</TableHead>
                      <TableHead className="px-6 py-4 text-right">得分</TableHead>
                      <TableHead className="px-6 py-4 text-center">总 / 对 / 错</TableHead>
                      <TableHead className="px-6 py-4 text-right">正确率</TableHead>
                      <TableHead className="px-6 py-4 text-right">状态</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-slate-500">加载中...</TableCell>
                      </TableRow>
                    ) : items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-slate-500">暂无训练记录</TableCell>
                      </TableRow>
                    ) : (
                      items.map((item) => (
                        <TableRow key={item.sessionId} className="group border-t border-[#273a39]/60 transition-colors hover:bg-[#00c2b2]/5">
                          <TableCell className="whitespace-nowrap px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-200">{format(new Date(item.startedAt), "yyyy年MM月dd日 HH:mm")}</span>
                              <span className="text-[10px] text-slate-500">
                                {item.endedAt ? `结束于 ${format(new Date(item.endedAt), "yyyy年MM月dd日 HH:mm")}` : "进行中"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4"><SourceBadge source={item.source} /></TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <span className="text-sm font-bold text-slate-200">{item.score}<span className="font-normal text-slate-500">/{item.total}</span></span>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-center text-sm tracking-widest text-slate-400">
                            {item.total} / <span className="text-[#04D280]">{item.correct}</span> / <span className="text-[#E03F3F]">{item.wrong}</span>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <span className={`text-sm font-bold ${item.accuracy >= 0.85 ? "text-[#04D280]" : item.accuracy < 0.65 ? "text-[#E03F3F]" : "text-slate-200"}`}>
                              {Math.round(item.accuracy * 100)}%
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right"><SessionStatusBadge status={item.status} /></TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between border-t border-[#273a39] bg-[#1a1a1a]/30 px-6 py-4">
                <span className="text-xs text-slate-500">已加载 {items.length} 条训练记录</span>
                <Button
                  type="button"
                  variant="outline"
                  className="border-[#273a39] bg-transparent text-[#e5e7eb] hover:bg-[#1e1e1e]"
                  disabled={!nextCursor || loadingMore || loading}
                  onClick={() => void fetchMore()}
                >
                  {loadingMore ? "加载中..." : nextCursor ? "加载更多" : "没有更多数据"}
                </Button>
              </div>
            </div>

            <div className="grid gap-6">
              <MiniWindowCard
                title="最近 7 轮"
                window={analytics?.windows.recent7 || { sampleSize: 0, averageScore: 0, bestScore: 0, lowestScore: 0, deltaFromPrevious: null }}
              />
              <MiniWindowCard
                title="最近 30 轮"
                window={analytics?.windows.recent30 || { sampleSize: 0, averageScore: 0, bestScore: 0, lowestScore: 0, deltaFromPrevious: null }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
