"use client";

import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import TradePageShell from "../components/trade-page-shell";
import Chart from "chart.js/auto";
import { Skeleton } from "@/components/ui/skeleton";

import {
  PiggyBank,
  PieChart,
  Sigma,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Trade } from "../config";

function fetchDashboard() {
  return fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: "trade/dashboard",
      actualMethod: "GET",
    },
    actualBody: {},
  }).then(async (res) => {
    if (!res.ok) throw new Error(await res.text());
    const result = await res.json();
    return result.data || {};
  });
}

type WinRatePoint = {
  date: string;
  winRate: number;
};

type WinRateResponse = {
  range: "7d" | "30d" | "3m";
  simulation: WinRatePoint[];
  real: WinRatePoint[];
};

function fetchWinRate(range: "7d" | "30d" | "3m") {
  return fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: `trade/win-rate?range=${range}`,
      actualMethod: "GET",
    },
    actualBody: {},
  }).then(async (res) => {
    if (!res.ok) throw new Error(await res.text());
    const result = await res.json();
    return result.data as WinRateResponse;
  });
}

type FeaturedSummary = {
  transactionId: string;
  summary: string;
  summaryType: "pre" | "post";
};

function extractSummaryItems(payload: unknown): unknown[] {
  if (!payload || typeof payload !== "object") return [];
  if (Array.isArray(payload)) return payload;
  const candidate = payload as { data?: unknown; items?: unknown };
  if (Array.isArray(candidate.items)) return candidate.items;
  if (candidate.data && typeof candidate.data === "object") {
    const nested = candidate.data as { items?: unknown };
    if (Array.isArray(nested.items)) return nested.items;
  }
  return [];
}

function parseFeaturedSummaries(payload: unknown): FeaturedSummary[] {
  return extractSummaryItems(payload).reduce<FeaturedSummary[]>((acc, item) => {
    if (!item || typeof item !== "object") return acc;
    const entity = item as {
      transactionId?: string | number | null;
      summary?: string | null;
      summaryType?: string | null;
    };
    const transactionId = String(entity.transactionId ?? "").trim();
    if (!transactionId) return acc;
    const summaryType =
      entity.summaryType === "pre" || entity.summaryType === "post"
        ? entity.summaryType
        : undefined;
    if (!summaryType) return acc;
    const summary =
      typeof entity.summary === "string" && entity.summary.trim().length > 0
        ? entity.summary
        : "暂无总结";
    acc.push({ transactionId, summary, summaryType });
    return acc;
  }, []);
}

export default function TradeHomePage() {
  const [stats, setStats] = React.useState<{
    thisMonthTradeCount: number;
    lastMonthTradeCount: number;
    recent30WinRate: number;
    previous30WinRate: number;
    thisMonthSimulationTradeCount: number;
    lastMonthSimulationTradeCount: number;
    recent30SimulationWinRate: number;
    previous30SimulationWinRate: number;
  }>({
    thisMonthTradeCount: 0,
    lastMonthTradeCount: 0,
    recent30WinRate: 0,
    previous30WinRate: 0,
    thisMonthSimulationTradeCount: 0,
    lastMonthSimulationTradeCount: 0,
    recent30SimulationWinRate: 0,
    previous30SimulationWinRate: 0,
  });
  const [recentTrades, setRecentTrades] = React.useState<Trade[]>([]);
  const [tradesLoading, setTradesLoading] = React.useState(true);
  const [tradesError, setTradesError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [winRateRange, setWinRateRange] = React.useState<"7d" | "30d" | "3m">(
    "7d",
  );
  const [winRateData, setWinRateData] = React.useState<WinRateResponse | null>(
    null,
  );
  const [winRateLoading, setWinRateLoading] = React.useState(true);
  const [winRateError, setWinRateError] = React.useState<string | null>(null);
  const [featuredSummaries, setFeaturedSummaries] = React.useState<
    FeaturedSummary[]
  >([]);
  const [featuredLoading, setFeaturedLoading] = React.useState(true);
  const [featuredError, setFeaturedError] = React.useState<string | null>(null);
  const chartRef = React.useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = React.useRef<Chart | null>(null);

  React.useEffect(() => {
    setLoading(true);
    setFeaturedLoading(true);
    setTradesLoading(true);
    fetchDashboard()
      .then((data) => {
        const normalizeNumber = (value: unknown) => {
          const parsed = Number(value);
          return Number.isFinite(parsed) ? parsed : 0;
        };
        setStats({
          thisMonthTradeCount: normalizeNumber(data.thisMonthTradeCount),
          lastMonthTradeCount: normalizeNumber(data.lastMonthTradeCount),
          recent30WinRate: normalizeNumber(data.recent30WinRate),
          previous30WinRate: normalizeNumber(data.previous30WinRate),
          thisMonthSimulationTradeCount: normalizeNumber(
            data.thisMonthSimulationTradeCount,
          ),
          lastMonthSimulationTradeCount: normalizeNumber(
            data.lastMonthSimulationTradeCount,
          ),
          recent30SimulationWinRate: normalizeNumber(
            data.recent30SimulationWinRate,
          ),
          previous30SimulationWinRate: normalizeNumber(
            data.previous30SimulationWinRate,
          ),
        });
        setFeaturedSummaries(
          parseFeaturedSummaries(data.summaryHighlights).slice(0, 3),
        );
        setRecentTrades(
          Array.isArray(data.recentTrades)
            ? (data.recentTrades as Trade[])
            : [],
        );
        setError(null);
        setFeaturedError(null);
        setTradesError(null);
      })
      .catch((err) => {
        const message = err.message || "获取仪表盘数据失败";
        setError(message);
        setFeaturedError(message);
        setTradesError(message);
        setFeaturedSummaries([]);
        setRecentTrades([]);
      })
      .finally(() => {
        setLoading(false);
        setFeaturedLoading(false);
        setTradesLoading(false);
      });
  }, []);

  React.useEffect(() => {
    setWinRateLoading(true);
    fetchWinRate(winRateRange)
      .then((data) => {
        setWinRateData(data);
        setWinRateError(null);
      })
      .catch((err) => {
        const message = err.message || "获取胜率趋势失败";
        setWinRateError(message);
        setWinRateData(null);
      })
      .finally(() => {
        setWinRateLoading(false);
      });
  }, [winRateRange]);

  React.useEffect(() => {
    if (!chartRef.current) return;
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }
    if (!winRateData || winRateLoading || winRateError) return;

    const labelsSource =
      winRateData.simulation.length > 0
        ? winRateData.simulation
        : winRateData.real;
    const labels = labelsSource.map((point) => point.date);

    const buildMap = (series: WinRatePoint[]) =>
      new Map(series.map((point) => [point.date, point.winRate]));
    const simulationMap = buildMap(winRateData.simulation);
    const realMap = buildMap(winRateData.real);

    const simulationRates = labels.map((date) => simulationMap.get(date) ?? 0);
    const realRates = labels.map((date) => realMap.get(date) ?? 0);
    const displayLabels = labels.map((date) =>
      date.length >= 10 ? date.slice(5) : date,
    );

    const context = chartRef.current.getContext("2d");
    if (!context) return;

    chartInstanceRef.current = new Chart(context, {
      type: "line",
      data: {
        labels: displayLabels,
        datasets: [
          {
            label: "真实交易",
            data: realRates,
            borderColor: "#22c55e",
            backgroundColor: "rgba(34, 197, 94, 0.12)",
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 4,
            tension: 0.35,
            fill: "origin",
          },
          {
            label: "模拟交易",
            data: simulationRates,
            borderColor: "#60a5fa",
            backgroundColor: "rgba(96, 165, 250, 0.2)",
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 4,
            tension: 0.35,
            fill: "origin",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (event, _elements, chart) => {
          const points = chart.getElementsAtEventForMode(
            event as unknown as Event,
            "index",
            { intersect: false },
            true,
          );
          chart.setActiveElements(points);
          chart.tooltip?.setActiveElements(
            points,
            event as unknown as { x: number; y: number },
          );
          chart.update();
        },
        layout: {
          padding: {
            left: 20, // 左侧内边距
            right: 20, // 右侧内边距
            top: 30, // 上侧内边距
            bottom: 20, // 下侧内边距
          },
        },
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#9ca3af",
              usePointStyle: true,
              pointStyle: "circle",
            },
          },
          tooltip: {
            mode: "index",
            intersect: false,
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || "";
                const value =
                  typeof context.parsed.y === "number"
                    ? `${context.parsed.y}%`
                    : "-";
                return `${label}: ${value}`;
              },
            },
          },
        },
        interaction: {
          mode: "index",
          intersect: false,
        },
        scales: {
          x: {
            ticks: {
              color: "#9ca3af",
              maxTicksLimit: 8,
            },
            grid: {
              color: "rgba(255,255,255,0.05)",
            },
          },
          y: {
            suggestedMin: 0,
            suggestedMax: 100,
            ticks: {
              color: "#9ca3af",
              callback: (value) => `${value}%`,
              stepSize: 25,
            },
            grid: {
              color: "rgba(255,255,255,0.06)",
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [winRateData, winRateLoading, winRateError]);

  const formatDateTime = (value?: string) => {
    if (!value) return { date: "-", time: "-" };
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return { date: "-", time: "-" };
    return {
      date: format(parsed, "yyyy-MM-dd"),
      time: format(parsed, "HH:mm"),
    };
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "已分析":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case "待入场":
        return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
      case "已入场":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "已离场":
        return "bg-white/10 text-[#9ca3af] border border-white/10";
      default:
        return "bg-white/5 text-[#9ca3af] border border-white/10";
    }
  };

  const getDirectionBadge = (direction?: string) => {
    if (direction === "多") {
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    }
    if (direction === "空") {
      return "bg-red-500/10 text-red-400 border border-red-500/20";
    }
    return "bg-white/5 text-[#9ca3af] border border-white/10";
  };

  const formatPercent = (value?: string) => {
    if (value === undefined || value === null || value === "") return "-";
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return "-";
    return `${parsed}%`;
  };

  const formatAmount = (trade: Trade) => {
    const candidate =
      (trade as { profitLoss?: string | number }).profitLoss ??
      (trade as { profitLossAmount?: string | number }).profitLossAmount;
    if (candidate === undefined || candidate === null || candidate === "") {
      return "-";
    }
    const parsed = Number(candidate);
    if (Number.isNaN(parsed)) return "-";
    const sign = parsed > 0 ? "+" : "";
    return `${sign}$${parsed.toFixed(2)}`;
  };

  const formatPercentChange = (
    current: number,
    previous: number,
  ): { text: string; trend: "up" | "down" | "flat" } => {
    if (previous === 0) {
      if (current === 0) {
        return { text: "0.0%", trend: "flat" };
      }
      return { text: "—", trend: "flat" };
    }
    const change = ((current - previous) / previous) * 100;
    const text = `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
    const trend = change > 0 ? "up" : change < 0 ? "down" : "flat";
    return { text, trend };
  };

  const formatDelta = (current: number, previous: number) => {
    const delta = current - previous;
    const text = `${delta > 0 ? "+" : ""}${delta.toFixed(1)}%`;
    const trend = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
    return { text, trend };
  };

  const tradeCountChange = formatPercentChange(
    stats.thisMonthTradeCount,
    stats.lastMonthTradeCount,
  );
  const winRateChange = formatDelta(
    stats.recent30WinRate,
    stats.previous30WinRate,
  );
  const simulationTradeCountChange = formatPercentChange(
    stats.thisMonthSimulationTradeCount,
    stats.lastMonthSimulationTradeCount,
  );
  const simulationWinRateChange = formatDelta(
    stats.recent30SimulationWinRate,
    stats.previous30SimulationWinRate,
  );

  return (
    <TradePageShell title="主页">
      <div className="space-y-6">
        {error ? (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#121212] p-6 rounded-xl border border-[#27272a] shadow-sm hover:border-emerald-400/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[#9ca3af]">本月交易数</h3>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Wallet className="h-4 w-4 text-blue-400" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">
                {loading ? "..." : stats.thisMonthTradeCount}
              </span>
              <span
                className={`text-sm font-medium flex items-center ${
                  tradeCountChange.trend === "up"
                    ? "text-emerald-400"
                    : tradeCountChange.trend === "down"
                      ? "text-red-400"
                      : "text-[#9ca3af]"
                }`}
              >
                {loading ? "..." : tradeCountChange.text}
                {!loading && tradeCountChange.trend === "up" ? (
                  <TrendingUp className="ml-1 h-4 w-4" />
                ) : !loading && tradeCountChange.trend === "down" ? (
                  <TrendingDown className="ml-1 h-4 w-4" />
                ) : null}
              </span>
            </div>
            <p className="text-xs text-[#9ca3af] mt-1">较上月</p>
          </div>
          <div className="bg-[#121212] p-6 rounded-xl border border-[#27272a] shadow-sm hover:border-emerald-400/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[#9ca3af]">胜率</h3>
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <PieChart className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">
                {loading ? "..." : `${stats.recent30WinRate}%`}
              </span>
              <span
                className={`text-sm font-medium flex items-center ${
                  winRateChange.trend === "up"
                    ? "text-emerald-400"
                    : winRateChange.trend === "down"
                      ? "text-red-400"
                      : "text-[#9ca3af]"
                }`}
              >
                {loading ? "..." : winRateChange.text}
              </span>
            </div>
            <p className="text-xs text-[#9ca3af] mt-1">最近 30 笔交易</p>
          </div>
          <div className="bg-[#121212] p-6 rounded-xl border border-[#27272a] shadow-sm hover:border-emerald-400/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[#9ca3af]">
                本月模拟交易数
              </h3>
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Sigma className="h-4 w-4 text-purple-400" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">
                {loading ? "..." : stats.thisMonthSimulationTradeCount}
              </span>
              <span
                className={`text-sm font-medium flex items-center ${
                  simulationTradeCountChange.trend === "up"
                    ? "text-emerald-400"
                    : simulationTradeCountChange.trend === "down"
                      ? "text-red-400"
                      : "text-[#9ca3af]"
                }`}
              >
                {loading ? "..." : simulationTradeCountChange.text}
                {!loading && simulationTradeCountChange.trend === "up" ? (
                  <TrendingUp className="ml-1 h-4 w-4" />
                ) : !loading && simulationTradeCountChange.trend === "down" ? (
                  <TrendingDown className="ml-1 h-4 w-4" />
                ) : null}
              </span>
            </div>
            <p className="text-xs text-[#9ca3af] mt-1">较上月</p>
          </div>
          <div className="bg-[#121212] p-6 rounded-xl border border-[#27272a] shadow-sm hover:border-emerald-400/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[#9ca3af]">
                模拟胜率
              </h3>
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <PiggyBank className="h-4 w-4 text-yellow-400" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">
                {loading ? "..." : `${stats.recent30SimulationWinRate}%`}
              </span>
              <span
                className={`text-sm font-medium flex items-center ${
                  simulationWinRateChange.trend === "up"
                    ? "text-emerald-400"
                    : simulationWinRateChange.trend === "down"
                      ? "text-red-400"
                      : "text-[#9ca3af]"
                }`}
              >
                {loading ? "..." : simulationWinRateChange.text}
              </span>
            </div>
            <p className="text-xs text-[#9ca3af] mt-1">最近 30 笔模拟交易</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#121212] p-6 rounded-xl border border-[#27272a] shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">胜率曲线</h3>
              <select
                value={winRateRange}
                onChange={(event) =>
                  setWinRateRange(event.target.value as "7d" | "30d" | "3m")
                }
                className="bg-[#1e1e1e] border border-[#27272a] text-sm text-[#e5e7eb] rounded-md py-1 px-3 focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400 cursor-pointer outline-none"
              >
                <option value="7d">最近 7 天</option>
                <option value="30d">最近 30 天</option>
                <option value="3m">最近 3 个月</option>
              </select>
            </div>
            <div className="relative h-72 w-full overflow-hidden rounded-lg border border-[#27272a]">
              {/* <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1e1e1e,transparent_70%)]" />
              <div className="absolute inset-0 border border-white/5" /> */}
              <div className="relative z-10 h-full w-full">
                {winRateError ? (
                  <div className="flex h-full items-center justify-center text-sm text-red-300">
                    {winRateError}
                  </div>
                ) : winRateLoading ? (
                  <div className="flex h-full w-full items-center justify-center px-6">
                    <div className="w-full space-y-4">
                      <Skeleton className="h-40 w-full bg-white/5" />
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-20 bg-white/5" />
                        <Skeleton className="h-3 w-12 bg-white/5" />
                        <Skeleton className="h-3 w-16 bg-white/5" />
                        <Skeleton className="h-3 w-10 bg-white/5" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <canvas ref={chartRef} className="h-full w-full" />
                )}
              </div>
            </div>
          </div>
          <div className="bg-[#121212] p-6 rounded-xl border border-[#27272a] shadow-sm flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-6">日志精选</h3>
            <div className="space-y-4 flex-1 overflow-y-auto pr-2 min-h-[300px]">
              {featuredError ? (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {featuredError}
                </div>
              ) : null}
              {featuredLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={`featured-skeleton-${index}`}
                      className="p-4 rounded-lg bg-[#1e1e1e] border border-[#27272a]"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <Skeleton className="h-4 w-16 bg-white/10" />
                        <Skeleton className="h-3 w-10 bg-white/10" />
                      </div>
                      <Skeleton className="h-4 w-full bg-white/10" />
                      <Skeleton className="mt-2 h-4 w-5/6 bg-white/10" />
                    </div>
                  ))}
                </div>
              ) : featuredSummaries.length === 0 ? (
                <div className="text-sm text-[#9ca3af]">暂无精选日志</div>
              ) : (
                featuredSummaries.map((summary) => {
                  const badgeLabel =
                    summary.summaryType === "pre" ? "事前分析" : "事后分析";
                  const badgeClass =
                    summary.summaryType === "pre"
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/20"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/20";

                  return (
                    <Link
                      prefetch
                      key={`${summary.transactionId}-${summary.summaryType}`}
                      href={`/trade/detail?id=${summary.transactionId}`}
                      className="group block p-4 rounded-lg bg-[#1e1e1e] cursor-pointer hover:bg-white/5 transition-colors border border-transparent hover:border-[#27272a]"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded ${badgeClass}`}
                        >
                          {badgeLabel}
                        </span>
                        <span className="text-xs text-[#9ca3af]">5 星</span>
                      </div>
                      <p className="text-sm text-[#e5e7eb] line-clamp-2">
                        {summary.summary}
                      </p>
                    </Link>
                  );
                })
              )}
            </div>
            <Link href={"/trade/add"} prefetch>
              <button className="cursor-pointer mt-4 w-full py-2 text-sm text-center text-[#9ca3af] font-medium hover:text-white transition-colors border border-dashed border-[#27272a] rounded-lg hover:bg-[#1e1e1e] hover:border-[#9ca3af]">
                + 添加日志
              </button>
            </Link>
          </div>
        </div>
        <div className="bg-[#121212] rounded-xl border border-[#27272a] shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-[#27272a] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-white">最近交易</h3>
            {tradesError ? (
              <span className="text-sm text-red-300">{tradesError}</span>
            ) : null}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-black/20 text-[#9ca3af] font-medium border-b border-[#27272a]">
                <tr>
                  <th className="px-6 py-3 whitespace-nowrap uppercase text-xs tracking-wider">
                    日期时间
                  </th>
                  <th className="px-6 py-3 whitespace-nowrap uppercase text-xs tracking-wider">
                    标的
                  </th>
                  <th className="px-6 py-3 whitespace-nowrap uppercase text-xs tracking-wider">
                    类型
                  </th>
                  <th className="px-6 py-3 whitespace-nowrap uppercase text-xs tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 whitespace-nowrap text-right uppercase text-xs tracking-wider">
                    收益率 %
                  </th>
                  <th className="px-6 py-3 whitespace-nowrap text-right uppercase text-xs tracking-wider">
                    盈亏（$）
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {tradesLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={`trade-skeleton-${index}`}>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-32 bg-white/10" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-24 bg-white/10" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-16 bg-white/10" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-20 bg-white/10" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Skeleton className="ml-auto h-4 w-16 bg-white/10" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Skeleton className="ml-auto h-4 w-20 bg-white/10" />
                      </td>
                    </tr>
                  ))
                ) : recentTrades.length === 0 ? (
                  <tr>
                    <td
                      className="px-6 py-6 text-center text-[#9ca3af]"
                      colSpan={7}
                    >
                      暂无交易记录
                    </td>
                  </tr>
                ) : (
                  recentTrades.map((trade) => {
                    const dateTime = formatDateTime(
                      trade.analysisTime ??
                        trade.entryTime ??
                        trade.exitTime ??
                        trade.createdAt ??
                        trade.updatedAt,
                    );
                    const percent = formatPercent(trade.profitLossPercentage);
                    const percentValue =
                      percent !== "-" ? Number(trade.profitLossPercentage) : 0;
                    const percentClass =
                      percent === "-"
                        ? "text-[#9ca3af]"
                        : percentValue > 0
                          ? "text-emerald-400 font-semibold"
                          : percentValue < 0
                            ? "text-red-400 font-semibold"
                            : "text-[#9ca3af]";
                    const amount = formatAmount(trade);
                    const amountValue =
                      amount !== "-"
                        ? Number(amount.replace(/[^0-9.-]/g, ""))
                        : 0;
                    const amountClass =
                      amount === "-"
                        ? "text-[#9ca3af]"
                        : amountValue > 0
                          ? "text-emerald-400 font-semibold"
                          : amountValue < 0
                            ? "text-red-400 font-semibold"
                            : "text-[#9ca3af]";

                    return (
                      <tr
                        key={
                          trade.transactionId ??
                          `${trade.tradeSubject}-${dateTime.date}-${dateTime.time}`
                        }
                        className="hover:bg-[#1e1e1e] transition-colors"
                      >
                        <td className="px-6 py-4 text-white whitespace-nowrap">
                          {dateTime.date}{" "}
                          <span className="text-[#9ca3af] text-xs ml-1">
                            {dateTime.time}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-white">
                          {trade.tradeSubject || "-"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDirectionBadge(
                              trade.entryDirection,
                            )}`}
                          >
                            {trade.entryDirection || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                              trade.status,
                            )}`}
                          >
                            {trade.status || "-"}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-right ${percentClass}`}>
                          {percent}
                        </td>
                        <td className={`px-6 py-4 text-right ${amountClass}`}>
                          {amount}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        <footer className="text-center text-xs text-[#9ca3af] mt-8 mb-4 opacity-50">
          © 2026 MMC Trading System. 保留所有权利。
        </footer>
      </div>
    </TradePageShell>
  );
}
