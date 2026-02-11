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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  total: number;
  profit: number;
  loss: number;
};

type WinRateResponse = {
  range: "7d" | "30d" | "3m";
  simulation: WinRatePoint[];
  real: WinRatePoint[];
};

type WinRateTooltipState = {
  x: number;
  y: number;
  title: string;
  real?: WinRatePoint;
  simulation?: WinRatePoint;
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
    // dashboard v2
    recent30RealTradeCount: number;
    recent30SimulationTradeCount: number;
    recent30ProfitLossAvg: number;
    previous30ProfitLossAvg: number;
    recent30SimulationProfitLossAvg: number;
    previous30SimulationProfitLossAvg: number;
    recent30RStats: {
      expectancyR: number;
      avgPlannedRR: number;
      avgRealizedR: number;
      avgREfficiency: number;
      emotionalLeakageR: number;
      qualityDistribution: {
        TECHNICAL: number;
        EMOTIONAL: number;
        SYSTEM: number;
        UNKNOWN: number;
      };
    };
    recent30SimulationRStats: {
      expectancyR: number;
      avgPlannedRR: number;
      avgRealizedR: number;
      avgREfficiency: number;
      emotionalLeakageR: number;
      qualityDistribution: {
        TECHNICAL: number;
        EMOTIONAL: number;
        SYSTEM: number;
        UNKNOWN: number;
      };
    };
  }>({
    thisMonthTradeCount: 0,
    lastMonthTradeCount: 0,
    recent30WinRate: 0,
    previous30WinRate: 0,
    thisMonthSimulationTradeCount: 0,
    lastMonthSimulationTradeCount: 0,
    recent30SimulationWinRate: 0,
    previous30SimulationWinRate: 0,
    recent30RealTradeCount: 0,
    recent30SimulationTradeCount: 0,
    recent30ProfitLossAvg: 0,
    previous30ProfitLossAvg: 0,
    recent30SimulationProfitLossAvg: 0,
    previous30SimulationProfitLossAvg: 0,
    recent30RStats: {
      expectancyR: 0,
      avgPlannedRR: 0,
      avgRealizedR: 0,
      avgREfficiency: 0,
      emotionalLeakageR: 0,
      qualityDistribution: { TECHNICAL: 0, EMOTIONAL: 0, SYSTEM: 0, UNKNOWN: 0 },
    },
    recent30SimulationRStats: {
      expectancyR: 0,
      avgPlannedRR: 0,
      avgRealizedR: 0,
      avgREfficiency: 0,
      emotionalLeakageR: 0,
      qualityDistribution: { TECHNICAL: 0, EMOTIONAL: 0, SYSTEM: 0, UNKNOWN: 0 },
    },
  });
  const [recentTrades, setRecentTrades] = React.useState<Trade[]>([]);
  const [tradesLoading, setTradesLoading] = React.useState(true);
  const [tradesError, setTradesError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [winRateRange, setWinRateRange] = React.useState<"7d" | "30d" | "3m">(
    "7d",
  );
  const [chartMode, setChartMode] = React.useState<"winRate" | "count">(
    "winRate",
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
  const [winRateTooltip, setWinRateTooltip] =
    React.useState<WinRateTooltipState | null>(null);
  const winRateContainerRef = React.useRef<HTMLDivElement | null>(null);
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
        const normalizeRStats = (raw: unknown) => {
          const input = (raw ?? {}) as {
            expectancyR?: unknown;
            avgPlannedRR?: unknown;
            avgRealizedR?: unknown;
            avgREfficiency?: unknown;
            emotionalLeakageR?: unknown;
            qualityDistribution?: {
              TECHNICAL?: unknown;
              EMOTIONAL?: unknown;
              SYSTEM?: unknown;
              UNKNOWN?: unknown;
            };
          };

          return {
            expectancyR: normalizeNumber(input.expectancyR),
            avgPlannedRR: normalizeNumber(input.avgPlannedRR),
            avgRealizedR: normalizeNumber(input.avgRealizedR),
            avgREfficiency: normalizeNumber(input.avgREfficiency),
            emotionalLeakageR: normalizeNumber(input.emotionalLeakageR),
            qualityDistribution: {
              TECHNICAL: normalizeNumber(input.qualityDistribution?.TECHNICAL),
              EMOTIONAL: normalizeNumber(input.qualityDistribution?.EMOTIONAL),
              SYSTEM: normalizeNumber(input.qualityDistribution?.SYSTEM),
              UNKNOWN: normalizeNumber(input.qualityDistribution?.UNKNOWN),
            },
          };
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
          recent30RealTradeCount: normalizeNumber(data.recent30RealTradeCount),
          recent30SimulationTradeCount: normalizeNumber(
            data.recent30SimulationTradeCount,
          ),
          recent30ProfitLossAvg: normalizeNumber(data.recent30ProfitLossAvg),
          previous30ProfitLossAvg: normalizeNumber(
            data.previous30ProfitLossAvg,
          ),
          recent30SimulationProfitLossAvg: normalizeNumber(
            data.recent30SimulationProfitLossAvg,
          ),
          previous30SimulationProfitLossAvg: normalizeNumber(
            data.previous30SimulationProfitLossAvg,
          ),
          recent30RStats: normalizeRStats(data.recent30RStats),
          recent30SimulationRStats: normalizeRStats(data.recent30SimulationRStats),
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

    const buildValueMap = (series: WinRatePoint[]) =>
      new Map(
        series.map((point) => [
          point.date,
          chartMode === "winRate" ? point.winRate : point.total,
        ]),
      );
    const buildDetailMap = (series: WinRatePoint[]) =>
      new Map(series.map((point) => [point.date, point]));
    const simulationMap = buildValueMap(winRateData.simulation);
    const realMap = buildValueMap(winRateData.real);
    const simulationDetailMap = buildDetailMap(winRateData.simulation);
    const realDetailMap = buildDetailMap(winRateData.real);

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
            label: `真实交易${chartMode === "winRate" ? "" : "数量"}`,
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
            label: `模拟交易${chartMode === "winRate" ? "" : "数量"}`,
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
            mode: "nearest",
            intersect: false,
            enabled: false,
            external: (context) => {
              const { chart, tooltip } = context;
              if (!tooltip || tooltip.opacity === 0) {
                setWinRateTooltip(null);
                return;
              }

              const dataPoint = tooltip.dataPoints?.[0];
              if (!dataPoint) {
                setWinRateTooltip(null);
                return;
              }

              const dataIndex = dataPoint.dataIndex ?? 0;
              const date = labels[dataIndex];
              const title = date ?? tooltip.title?.[0] ?? "";

              const canvasRect = chart.canvas.getBoundingClientRect();
              const containerRect =
                winRateContainerRef.current?.getBoundingClientRect();
              if (!containerRect) return;

              const x = canvasRect.left - containerRect.left + tooltip.caretX;
              const y = canvasRect.top - containerRect.top + tooltip.caretY;

              setWinRateTooltip({
                x,
                y,
                title,
                real: realDetailMap.get(date),
                simulation: simulationDetailMap.get(date),
              });
            },
          },
        },
        interaction: {
          mode: "nearest",
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
            suggestedMax:
              chartMode === "winRate"
                ? 100
                : Math.max(5, ...realRates, ...simulationRates) + 1,
            ticks: {
              color: "#9ca3af",
              callback: (value) =>
                chartMode === "winRate" ? `${value}%` : String(value),
              stepSize: chartMode === "winRate" ? 25 : undefined,
              precision: chartMode === "winRate" ? 0 : 0,
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
      setWinRateTooltip(null);
    };
  }, [winRateData, winRateLoading, winRateError, chartMode]);

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

  const formatR = (value: number) => value.toFixed(2);

  const getRPromptLevel = (kind: "good" | "warn" | "bad") => {
    if (kind === "good") return "text-emerald-300";
    if (kind === "warn") return "text-yellow-300";
    return "text-red-300";
  };

  const buildRPrompts = (rStats: {
    expectancyR: number;
    avgPlannedRR: number;
    avgRealizedR: number;
    avgREfficiency: number;
    emotionalLeakageR: number;
    qualityDistribution: {
      TECHNICAL: number;
      EMOTIONAL: number;
      SYSTEM: number;
      UNKNOWN: number;
    };
  }) => {
    const prompts: Array<{ kind: "good" | "warn" | "bad"; text: string }> = [];

    if (rStats.expectancyR >= 0.5) {
      prompts.push({ kind: "good", text: `Expectancy ${formatR(rStats.expectancyR)}R，系统当前有正期望。` });
    } else if (rStats.expectancyR >= 0) {
      prompts.push({ kind: "warn", text: `Expectancy ${formatR(rStats.expectancyR)}R，边际偏弱，优先优化低质量离场。` });
    } else {
      prompts.push({ kind: "bad", text: `Expectancy ${formatR(rStats.expectancyR)}R，当前是负期望，建议先降频并复盘样本。` });
    }

    if (rStats.avgREfficiency >= 0.7) {
      prompts.push({ kind: "good", text: `R效率 ${formatR(rStats.avgREfficiency)}，计划兑现较好。` });
    } else if (rStats.avgREfficiency >= 0.5) {
      prompts.push({ kind: "warn", text: `R效率 ${formatR(rStats.avgREfficiency)}，仍有提前离场/拿不住利润问题。` });
    } else {
      prompts.push({ kind: "bad", text: `R效率 ${formatR(rStats.avgREfficiency)}，计划兑现不足，优先修正出场纪律。` });
    }

    if (rStats.emotionalLeakageR > 0.5) {
      prompts.push({ kind: "bad", text: `情绪泄露 ${formatR(rStats.emotionalLeakageR)}R，情绪离场影响显著。` });
    } else if (rStats.emotionalLeakageR > 0) {
      prompts.push({ kind: "warn", text: `情绪泄露 ${formatR(rStats.emotionalLeakageR)}R，建议继续压缩情绪干预。` });
    } else {
      prompts.push({ kind: "good", text: "情绪泄露接近 0，离场执行较稳定。" });
    }

    const unknown = rStats.qualityDistribution.UNKNOWN;
    if (unknown >= 10) {
      prompts.push({ kind: "warn", text: `有 ${unknown} 笔未标注离场标签，行为归因可信度不足。` });
    }

    return prompts;
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
          <div className="bg-[#121212] p-5 rounded-xl border border-[#27272a] shadow-sm hover:border-emerald-400/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
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
          <div className="bg-[#121212] p-5 rounded-xl border border-[#27272a] shadow-sm hover:border-emerald-400/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
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
          <div className="bg-[#121212] p-5 rounded-xl border border-[#27272a] shadow-sm hover:border-emerald-400/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
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
          <div className="bg-[#121212] p-5 rounded-xl border border-[#27272a] shadow-sm hover:border-emerald-400/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-[#9ca3af]">模拟胜率</h3>
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

        <section className="overflow-hidden rounded-xl border border-[#27272a] bg-[#121212] shadow-sm">
          <div className="flex items-center justify-between border-b border-[#27272a] bg-white/[0.02] px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded border border-[#27272a] bg-[#1e1e1e]">
                <Sigma className="h-4 w-4 text-emerald-400" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                R 指标看板
                <span className="ml-2 text-xs font-normal text-[#9ca3af]">
                  (Last 30 Trades)
                </span>
              </h2>
            </div>
            <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#9ca3af]">
              Expectancy / RR / Efficiency / Emotional Leakage
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="space-y-6 border-b border-[#27272a] p-6 lg:border-b-0 lg:border-r">
              <div className="flex items-center justify-between">
                <h3 className="border-l-2 border-emerald-400 pl-2 text-xs font-bold uppercase tracking-[0.16em] text-white">
                  Real Trades（真实）
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="mb-1 text-[10px] uppercase text-[#9ca3af]">Expectancy (R)</p>
                  <p className="text-xl font-bold text-emerald-400">{loading ? "..." : formatR(stats.recent30RStats.expectancyR)}</p>
                </div>
                <div>
                  <p className="mb-1 text-[10px] uppercase text-[#9ca3af]">Avg Planned RR</p>
                  <p className="text-xl font-bold text-white">{loading ? "..." : formatR(stats.recent30RStats.avgPlannedRR)}</p>
                </div>
                <div>
                  <p className="mb-1 text-[10px] uppercase text-[#9ca3af]">Avg Realized R</p>
                  <p className="text-xl font-bold text-white">{loading ? "..." : formatR(stats.recent30RStats.avgRealizedR)}</p>
                </div>
                <div>
                  <p className="mb-1 text-[10px] uppercase text-[#9ca3af]">R-Efficiency</p>
                  <p className="text-xl font-bold text-white">
                    {loading ? "..." : `${(stats.recent30RStats.avgREfficiency * 100).toFixed(1)}%`}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="mb-1 text-[10px] uppercase text-[#9ca3af]">Emotional Leakage R</p>
                  <p className={`text-xl font-bold ${stats.recent30RStats.emotionalLeakageR > 0 ? "text-red-400" : "text-emerald-400"}`}>
                    {loading ? "..." : formatR(stats.recent30RStats.emotionalLeakageR)}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#9ca3af]">Tag Distribution</span>
                  <span className="text-[#9ca3af]">
                    Tech: {stats.recent30RStats.qualityDistribution.TECHNICAL} / Emot: {stats.recent30RStats.qualityDistribution.EMOTIONAL} / Strat: {stats.recent30RStats.qualityDistribution.SYSTEM} / Untagged: {stats.recent30RStats.qualityDistribution.UNKNOWN}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {buildRPrompts(stats.recent30RStats).map((item, idx) => (
                    <div key={`real-r-prompt-${idx}`} className="flex items-start gap-2">
                      <span
                        className={`mt-1.5 h-1.5 w-1.5 rounded-full ${
                          item.kind === "good"
                            ? "bg-emerald-400"
                            : item.kind === "warn"
                              ? "bg-yellow-300"
                              : "bg-red-400"
                        }`}
                      />
                      <p className={`text-xs ${getRPromptLevel(item.kind)}`}>{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6 p-6">
              <div className="flex items-center justify-between">
                <h3 className="border-l-2 border-[#9ca3af] pl-2 text-xs font-bold uppercase tracking-[0.16em] text-white">
                  Simulated（模拟）
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="mb-1 text-[10px] uppercase text-[#9ca3af]">Expectancy (R)</p>
                  <p className="text-xl font-bold text-emerald-400">{loading ? "..." : formatR(stats.recent30SimulationRStats.expectancyR)}</p>
                </div>
                <div>
                  <p className="mb-1 text-[10px] uppercase text-[#9ca3af]">Avg Planned RR</p>
                  <p className="text-xl font-bold text-white">{loading ? "..." : formatR(stats.recent30SimulationRStats.avgPlannedRR)}</p>
                </div>
                <div>
                  <p className="mb-1 text-[10px] uppercase text-[#9ca3af]">Avg Realized R</p>
                  <p className="text-xl font-bold text-white">{loading ? "..." : formatR(stats.recent30SimulationRStats.avgRealizedR)}</p>
                </div>
                <div>
                  <p className="mb-1 text-[10px] uppercase text-[#9ca3af]">R-Efficiency</p>
                  <p className="text-xl font-bold text-white">
                    {loading ? "..." : `${(stats.recent30SimulationRStats.avgREfficiency * 100).toFixed(1)}%`}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="mb-1 text-[10px] uppercase text-[#9ca3af]">Emotional Leakage R</p>
                  <p className={`text-xl font-bold ${stats.recent30SimulationRStats.emotionalLeakageR > 0 ? "text-red-400" : "text-emerald-400"}`}>
                    {loading ? "..." : formatR(stats.recent30SimulationRStats.emotionalLeakageR)}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#9ca3af]">Tag Distribution</span>
                  <span className="text-[#9ca3af]">
                    Tech: {stats.recent30SimulationRStats.qualityDistribution.TECHNICAL} / Emot: {stats.recent30SimulationRStats.qualityDistribution.EMOTIONAL} / Strat: {stats.recent30SimulationRStats.qualityDistribution.SYSTEM} / Untagged: {stats.recent30SimulationRStats.qualityDistribution.UNKNOWN}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {buildRPrompts(stats.recent30SimulationRStats).map((item, idx) => (
                    <div key={`sim-r-prompt-${idx}`} className="flex items-start gap-2">
                      <span
                        className={`mt-1.5 h-1.5 w-1.5 rounded-full ${
                          item.kind === "good"
                            ? "bg-emerald-400"
                            : item.kind === "warn"
                              ? "bg-yellow-300"
                              : "bg-red-400"
                        }`}
                      />
                      <p className={`text-xs ${getRPromptLevel(item.kind)}`}>{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#121212] p-6 rounded-xl border border-[#27272a] shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {chartMode === "winRate" ? "胜率曲线" : "交易数量曲线"}
                </h3>
                <p className="text-xs text-[#9ca3af] mt-1">
                  点击切换查看胜率或交易数量
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-lg border border-[#27272a] bg-black/20 p-1">
                  <button
                    type="button"
                    onClick={() => setChartMode("winRate")}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                      chartMode === "winRate"
                        ? "bg-white/10 text-white"
                        : "text-[#9ca3af] hover:text-white"
                    }`}
                  >
                    胜率
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMode("count")}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                      chartMode === "count"
                        ? "bg-white/10 text-white"
                        : "text-[#9ca3af] hover:text-white"
                    }`}
                  >
                    数量
                  </button>
                </div>
              </div>
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
            <div
              ref={winRateContainerRef}
              className="relative h-72 w-full rounded-lg border border-[#27272a]"
            >
              {/* <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1e1e1e,transparent_70%)]" />
              <div className="absolute inset-0 border border-white/5" /> */}
              {winRateTooltip ? (
                <div
                  className="pointer-events-none absolute z-20 min-w-[200px] -translate-x-1/2 -translate-y-3 rounded-lg border border-emerald-400/30 bg-[#0b0b0d]/95 px-3 py-2 text-xs text-[#e5e7eb] shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur"
                  style={{ left: winRateTooltip.x, top: winRateTooltip.y }}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] uppercase tracking-[0.2em] text-emerald-400">
                      {winRateTooltip.title ||
                        (chartMode === "winRate" ? "胜率" : "交易数量")}
                    </span>
                  </div>
                  {(["real", "simulation"] as const).map((key) => {
                    const detail =
                      key === "real"
                        ? winRateTooltip.real
                        : winRateTooltip.simulation;
                    const labelText = key === "real" ? "真实交易" : "模拟交易";
                    const primaryValue =
                      chartMode === "winRate"
                        ? typeof detail?.winRate === "number"
                          ? `${detail.winRate}%`
                          : "-"
                        : String(detail?.total ?? 0);
                    return (
                      <div
                        key={key}
                        className="mt-2 space-y-1 border-t border-white/5 pt-2"
                      >
                        <div className="flex items-center justify-between text-[11px] text-[#9ca3af]">
                          <span>{labelText}</span>
                          <span className="text-emerald-400">{primaryValue}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-1 text-[#9ca3af]">
                            <Sigma className="h-3 w-3 text-emerald-400" />
                            总数
                          </span>
                          <span className="text-white">
                            {detail?.total ?? 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-1 text-[#9ca3af]">
                            <TrendingUp className="h-3 w-3 text-emerald-400" />
                            盈利
                          </span>
                          <span className="text-white">
                            {detail?.profit ?? 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-1 text-[#9ca3af]">
                            <TrendingDown className="h-3 w-3 text-emerald-400" />
                            亏损
                          </span>
                          <span className="text-white">
                            {detail?.loss ?? 0}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
              <div className="relative z-10 h-full w-full overflow-hidden rounded-lg">
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
                      className="block p-4 rounded-lg bg-[#1e1e1e] cursor-pointer hover:bg-white/5 transition-colors border border-transparent hover:border-[#27272a]"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded ${badgeClass}`}
                        >
                          {badgeLabel}
                        </span>
                        <span className="text-xs text-[#9ca3af]">5 星</span>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-sm text-[#e5e7eb] line-clamp-2">
                            {summary.summary}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          sideOffset={8}
                          className="max-w-[22rem] rounded-xl border border-[#27272a] bg-[#0b0b0b] px-3.5 py-3 text-sm leading-snug text-[#e5e7eb] shadow-[0_18px_40px_rgba(0,0,0,0.35)]"
                          arrowClassName="bg-[#0b0b0b] fill-[#0b0b0b] border-l border-b border-[#27272a]"
                        >
                          {summary.summary}
                        </TooltipContent>
                      </Tooltip>
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
                  <th className="px-6 py-3 whitespace-nowrap uppercase text-xs tracking-wider">
                    类型
                  </th>
                  <th className="px-6 py-3 whitespace-nowrap text-right uppercase text-xs tracking-wider">
                    收益率 %
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
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-[#9ca3af] border border-white/10`}
                          >
                            {trade.tradeType || "-"}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-right ${percentClass}`}>
                          {percent}
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
