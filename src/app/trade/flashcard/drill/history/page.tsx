"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Search, Bell, TrendingUp, TrendingDown, Minus, Star, Bolt, Siren, ExternalLink } from "lucide-react";
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
import {
  getFlashcardDrillAnalytics,
  getFlashcardDrillCardErrorRanking,
  listFlashcardDrillSessions,
  startFlashcardDrillSession,
} from "../../request";
import { saveFlashcardSession } from "@/store/flashcard-session";
import {
  FLASHCARD_LABELS,
  type FlashcardDrillAnalytics,
  type FlashcardDrillAnalyticsWindow,
  type FlashcardDrillCardErrorRanking,
  type FlashcardDrillCardErrorRankingItem,
  type FlashcardDrillPlaybookErrorRankingItem,
  type FlashcardDrillSessionHistoryItem,
} from "../../types";

type SessionStatus = "ALL" | "IN_PROGRESS" | "COMPLETED" | "ABANDONED";

const PAGE_SIZE = 5;
const DEFAULT_DRILL_COUNT = 20;
const RECENT_WINDOW = 30;
const CARD_ERROR_MIN_ANSWERED = 3;
const CARD_ERROR_LIMIT = 5;

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
    <div className={cardClass("p-4")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-white">{title}</div>
          <div className="mt-1 text-xs text-slate-500">样本 {window.sampleSize} 轮</div>
        </div>
        <div className={`text-xs font-bold ${deltaTone(window.deltaFromPrevious)}`}>{formatDelta(window.deltaFromPrevious)}</div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div>
          <div className="text-xs text-slate-500">均分</div>
          <div className="mt-1 text-xl font-bold text-white">{window.averageScore}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">最高</div>
          <div className="mt-1 text-xl font-bold text-white">{window.bestScore}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">最低</div>
          <div className="mt-1 text-xl font-bold text-white">{window.lowestScore}</div>
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
    <div className={cardClass("p-4")}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold tracking-tight text-white">{props.title}</h3>
        <span className="text-slate-500">•••</span>
      </div>
      {props.loading ? (
        <div className="flex h-40 items-center justify-center text-sm text-slate-500">加载中...</div>
      ) : props.points.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-[#273a39] text-sm text-slate-500">
          暂无趋势数据
        </div>
      ) : (
        <>
          <div className="relative h-40">
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

function formatPercent(value: number) {
  return `${Math.round(value * 1000) / 10}%`;
}

function PlaybookErrorRankingCard(props: {
  ranking: FlashcardDrillCardErrorRanking | null;
  loading: boolean;
}) {
  const rateItems = (props.ranking?.playbookItems || []).slice(0, 5);
  const wrongCountItems = (props.ranking?.playbookWrongCountItems || []).slice(0, 5);
  const hasItems = rateItems.length > 0 || wrongCountItems.length > 0;
  const minAnswered = props.ranking?.summary.minAnswered || CARD_ERROR_MIN_ANSWERED;

  return (
    <div className={cardClass("p-5")}>
      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-white">
            <Siren className="h-5 w-5 text-amber-300" />
            剧本出错 Top5
          </h3>
          <p className="mt-2 text-xs text-slate-500">
            只统计启用中的闪卡，同时按错误率和错误数排序。
          </p>
        </div>
        <span className="rounded-full border border-[#273a39] px-3 py-1 text-xs font-bold text-slate-400">
          作答 &gt;= {minAnswered} 次
        </span>
      </div>

      {props.loading ? (
        <div className="flex h-64 items-center justify-center text-sm text-slate-500">加载中...</div>
      ) : !hasItems ? (
        <div className="rounded-xl border border-dashed border-[#273a39] px-4 py-12 text-center text-sm text-slate-500">
          暂无达到样本门槛的剧本
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <PlaybookErrorRankingList title="按错误率" items={rateItems} rankType="rate" />
          <PlaybookErrorRankingList title="按错误数" items={wrongCountItems} rankType="count" />
        </div>
      )}
    </div>
  );
}

function PlaybookErrorRankingList(props: {
  title: string;
  items: FlashcardDrillPlaybookErrorRankingItem[];
  rankType: "rate" | "count";
}) {
  return (
    <div className="space-y-3">
      <div className="text-xs font-bold uppercase tracking-wider text-slate-500">{props.title}</div>
      {props.items.map((item, index) => (
        <PlaybookErrorRankingRow
          key={`${props.rankType}-${item.playbookType || "__UNSPECIFIED__"}`}
          item={item}
          index={index}
          rankType={props.rankType}
        />
      ))}
    </div>
  );
}

function PlaybookErrorRankingRow({
  item,
  index,
  rankType,
}: {
  item: FlashcardDrillPlaybookErrorRankingItem;
  index: number;
  rankType: "rate" | "count";
}) {
  const errorRatePercent = Math.round(item.errorRate * 100);
  const rankLabel =
    rankType === "rate"
      ? `错误率 ${formatPercent(item.errorRate)}`
      : `错误数 ${item.wrongCount}`;

  return (
    <div className="rounded-xl border border-[#273a39] bg-[#101010] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber-300/15 px-2 py-1 text-xs font-bold text-amber-200">
              #{index + 1} {rankLabel}
            </span>
            <span className="rounded-full border border-[#273a39] px-2 py-1 text-xs text-slate-400">
              {item.cardCount} 张卡
            </span>
          </div>
          <div className="mt-3 truncate text-base font-bold text-white">{item.playbookLabel || "--"}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-sm font-bold text-white">{item.wrongCount} / {item.answeredCount}</div>
          <div className="text-xs text-slate-500">错误 / 作答</div>
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-amber-300" style={{ width: `${Math.max(errorRatePercent, 4)}%` }} />
      </div>
    </div>
  );
}

function CardErrorRankingCard(props: {
  ranking: FlashcardDrillCardErrorRanking | null;
  loading: boolean;
}) {
  const items = (props.ranking?.items || []).slice(0, 5);
  const minAnswered = props.ranking?.summary.minAnswered || CARD_ERROR_MIN_ANSWERED;

  return (
    <div className={cardClass("p-5")}>
      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-white">
            <Siren className="h-5 w-5 text-[#E03F3F]" />
            闪卡错误 Top5
          </h3>
          <p className="mt-2 text-xs text-slate-500">
            只统计启用中的闪卡，按错误率从高到低排序。
          </p>
        </div>
        <div className="rounded-full border border-[#273a39] px-3 py-1 text-xs font-bold text-slate-400">
          作答 &gt;= {minAnswered} 次
        </div>
      </div>

      {props.loading ? (
        <div className="flex h-64 items-center justify-center text-sm text-slate-500">加载中...</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#273a39] px-4 py-12 text-center text-sm text-slate-500">
          暂无达到样本门槛的闪卡
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <CardErrorRankingRow key={item.cardId} item={item} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}

function CardErrorRankingRow({ item, index }: { item: FlashcardDrillCardErrorRankingItem; index: number }) {
  const errorRatePercent = Math.round(item.errorRate * 100);
  const mistakeReasonCountMap = new Map((item.mistakeReasonCounts || []).map((stat) => [stat.reason, stat.count]));
  const marketStructureWrongCount = mistakeReasonCountMap.get("MARKET_STRUCTURE_ANALYSIS_WRONG") || 0;
  const priceActionWrongCount = mistakeReasonCountMap.get("PRICE_ACTION_ANALYSIS_WRONG") || 0;

  return (
    <div className="grid gap-4 rounded-xl border border-[#273a39] bg-[#101010] p-3 transition-colors hover:border-[#00c2b2]/40 hover:bg-[#111c1b] md:grid-cols-[96px_1fr_auto]">
      <Link href={`/trade/flashcard/${item.cardId}`} className="block overflow-hidden rounded-lg border border-[#273a39] bg-black">
        <img src={item.questionImageUrl} alt="question" className="h-20 w-full object-cover" />
      </Link>
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#E03F3F]/15 px-2 py-1 text-xs font-bold text-[#f87171]">
            #{index + 1} 错误率 {formatPercent(item.errorRate)}
          </span>
        </div>
        <div className="grid gap-2 text-xs text-slate-500 sm:grid-cols-3">
          <div>
            <span className="block text-slate-600">币对</span>
            <span className="font-medium text-slate-200">{item.symbolPairInfo || "--"}</span>
          </div>
          <div>
            <span className="block text-slate-600">行情时间</span>
            <span className="font-medium text-slate-200">{item.marketTimeInfo || "--"}</span>
          </div>
          <div>
            <span className="block text-slate-600">剧本</span>
            <span className="font-medium text-slate-200">{item.playbookLabel || item.playbookType || "--"}</span>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-[#273a39] bg-[#181818] px-2 py-1 text-xs text-slate-300">
            {FLASHCARD_LABELS.MARKET_STRUCTURE_ANALYSIS_WRONG}：{marketStructureWrongCount}
          </span>
          <span className="rounded-full border border-[#273a39] bg-[#181818] px-2 py-1 text-xs text-slate-300">
            {FLASHCARD_LABELS.PRICE_ACTION_ANALYSIS_WRONG}：{priceActionWrongCount}
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-[#E03F3F]" style={{ width: `${Math.max(errorRatePercent, 4)}%` }} />
        </div>
      </div>
      <div className="flex items-end justify-between gap-3 md:flex-col md:items-end">
        <div className="text-right">
          <div className="text-sm font-bold text-white">{item.wrongCount} / {item.answeredCount}</div>
          <div className="text-xs text-slate-500">错误 / 作答</div>
        </div>
        <div className="flex gap-2">
          <Link href={`/trade/flashcard/${item.cardId}`}>
            <Button size="sm" variant="outline" className="border-[#273a39] bg-[#1a1a1a] text-slate-100 hover:bg-[#273a39]">
              <ExternalLink className="mr-1 h-3.5 w-3.5" />
              详情
            </Button>
          </Link>
          <Link href={`/trade/flashcard/manage?cardId=${encodeURIComponent(item.cardId)}`}>
            <Button size="sm" variant="outline" className="border-[#273a39] bg-[#1a1a1a] text-slate-100 hover:bg-[#273a39]">
              管理
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function FlashcardDrillHistoryPage() {
  const router = useRouter();
  const [successAlert, errorAlert] = useAlert();

  const [status, setStatus] = React.useState<SessionStatus>("COMPLETED");
  const [items, setItems] = React.useState<FlashcardDrillSessionHistoryItem[]>([]);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [analytics, setAnalytics] = React.useState<FlashcardDrillAnalytics | null>(null);
  const [cardErrorRanking, setCardErrorRanking] = React.useState<FlashcardDrillCardErrorRanking | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [startingNewTraining, setStartingNewTraining] = React.useState(false);
  const [analyticsLoading, setAnalyticsLoading] = React.useState(false);
  const [cardRankingLoading, setCardRankingLoading] = React.useState(false);
  const pageCursorRef = React.useRef<Record<number, string | null>>({ 1: null });

  const fetchAnalytics = React.useCallback(async () => {
    setAnalyticsLoading(true);
    setCardRankingLoading(true);
    try {
      const [analyticsRes, cardRankingRes] = await Promise.all([
        getFlashcardDrillAnalytics({ recentWindow: RECENT_WINDOW }),
        getFlashcardDrillCardErrorRanking({
          recentWindow: RECENT_WINDOW,
          minAnswered: CARD_ERROR_MIN_ANSWERED,
          limit: CARD_ERROR_LIMIT,
        }),
      ]);
      setAnalytics(analyticsRes);
      setCardErrorRanking(cardRankingRes);
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "获取训练成绩分析失败");
    } finally {
      setAnalyticsLoading(false);
      setCardRankingLoading(false);
    }
  }, [errorAlert]);

  const fetchPage = React.useCallback(async (pageNumber: number) => {
    setLoading(true);
    try {
      const cursor = pageCursorRef.current[pageNumber] || undefined;
      const res = await listFlashcardDrillSessions({
        pageSize: PAGE_SIZE,
        cursor,
        status: status === "ALL" ? undefined : status,
      });
      setItems(res.items);
      setNextCursor(res.nextCursor);
      setCurrentPage(pageNumber);
      if (res.nextCursor) {
        pageCursorRef.current[pageNumber + 1] = res.nextCursor;
      }
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "查询训练成绩失败");
    } finally {
      setLoading(false);
    }
  }, [errorAlert, status]);

  const handleStartDefaultTraining = React.useCallback(async () => {
    setStartingNewTraining(true);
    try {
      const result = await startFlashcardDrillSession({
        source: "ALL",
        count: DEFAULT_DRILL_COUNT,
      });

      if (!result.cards.length) {
        errorAlert("没有可训练题目", "请先录入或启用闪卡后重试");
        return;
      }

      saveFlashcardSession({
        sessionId: result.sessionId,
        source: result.source,
        cards: result.cards,
        count: result.count,
        startedAt: new Date().toISOString(),
      });
      successAlert(`已生成 ${result.cards.length} 张训练卡片`);
      router.push(`/trade/flashcard/drill/play?sessionId=${result.sessionId}`);
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "开始训练失败");
    } finally {
      setStartingNewTraining(false);
    }
  }, [errorAlert, router, successAlert]);

  React.useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  React.useEffect(() => {
    pageCursorRef.current = { 1: null };
    void fetchPage(1);
  }, [fetchPage]);

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
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl bg-[#00c2b2] px-6 py-2.5 text-sm font-bold text-[#0a0a0a] transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={startingNewTraining}
                onClick={() => void handleStartDefaultTraining()}
              >
                {startingNewTraining ? "创建中..." : "新建训练"}
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

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.8fr_1.2fr]">
            <PlaybookErrorRankingCard ranking={cardErrorRanking} loading={cardRankingLoading} />
            <CardErrorRankingCard ranking={cardErrorRanking} loading={cardRankingLoading} />
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
              <div className="h-[360px] overflow-auto">
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
                <span className="text-xs text-slate-500">第 {currentPage} 页 · 每页 {PAGE_SIZE} 条</span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-[#273a39] bg-transparent text-[#e5e7eb] hover:bg-[#1e1e1e]"
                    disabled={currentPage <= 1 || loading}
                    onClick={() => void fetchPage(currentPage - 1)}
                  >
                    上一页
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-[#273a39] bg-transparent text-[#e5e7eb] hover:bg-[#1e1e1e]"
                    disabled={!nextCursor || loading}
                    onClick={() => void fetchPage(currentPage + 1)}
                  >
                    下一页
                  </Button>
                </div>
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
