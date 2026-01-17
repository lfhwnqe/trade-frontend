"use client";

import React from "react";
import { format } from "date-fns";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import TradePageShell from "../components/trade-page-shell";
import {
  Eye,
  PiggyBank,
  PieChart,
  Sigma,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { fetchTrades } from "../list/request";
import { Trade } from "../config";

function fetchStats() {
  return fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: "trade/stats",
      actualMethod: "GET",
    },
    actualBody: {},
  }).then(async (res) => {
    if (!res.ok) throw new Error(await res.text());
    const result = await res.json();
    return result.data || {};
  });
}

export default function TradeHomePage() {
  const [stats, setStats] = React.useState<{
    thisMonthClosedTradeCount: number;
    thisMonthWinRate: number;
  }>({ thisMonthClosedTradeCount: 0, thisMonthWinRate: 0 });
  const [recentTrades, setRecentTrades] = React.useState<Trade[]>([]);
  const [tradesLoading, setTradesLoading] = React.useState(true);
  const [tradesError, setTradesError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLoading(true);
    fetchStats()
      .then((data) => {
        setStats({
          thisMonthClosedTradeCount: data.thisMonthClosedTradeCount ?? 0,
          thisMonthWinRate: data.thisMonthWinRate ?? 0,
        });
        setLoading(false);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || "获取统计数据失败");
        setLoading(false);
      });
  }, []);

  React.useEffect(() => {
    setTradesLoading(true);
    fetchTrades({ page: 1, pageSize: 5 })
      .then((data) => {
        setRecentTrades(data.items || []);
        setTradesError(null);
      })
      .catch((err) => {
        setTradesError(err.message || "获取最近交易失败");
      })
      .finally(() => {
        setTradesLoading(false);
      });
  }, []);

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
              <h3 className="text-sm font-medium text-[#9ca3af]">
                本月交易数
              </h3>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Wallet className="h-4 w-4 text-blue-400" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">
                {loading ? "..." : stats.thisMonthClosedTradeCount}
              </span>
              <span className="text-sm font-medium text-emerald-400 flex items-center">
                +2.4% <TrendingUp className="ml-1 h-4 w-4" />
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
                {loading ? "..." : `${stats.thisMonthWinRate}%`}
              </span>
              <span className="text-sm font-medium text-emerald-400 flex items-center">
                +1.2%
              </span>
            </div>
            <p className="text-xs text-[#9ca3af] mt-1">最近 30 笔交易</p>
          </div>
          <div className="bg-[#121212] p-6 rounded-xl border border-[#27272a] shadow-sm hover:border-emerald-400/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[#9ca3af]">
                盈利因子
              </h3>
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Sigma className="h-4 w-4 text-purple-400" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">2.45</span>
              <span className="text-sm font-medium text-[#9ca3af]">优秀</span>
            </div>
            <p className="text-xs text-[#9ca3af] mt-1">
              总盈利 / 总亏损
            </p>
          </div>
          <div className="bg-[#121212] p-6 rounded-xl border border-[#27272a] shadow-sm hover:border-emerald-400/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[#9ca3af]">
                净盈亏（30天）
              </h3>
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <PiggyBank className="h-4 w-4 text-yellow-400" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">+$8,450.25</span>
            </div>
            <p className="text-xs text-[#9ca3af] mt-1">
              基于已平仓头寸
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#121212] p-6 rounded-xl border border-[#27272a] shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                净值增长
              </h3>
              <select className="bg-[#1e1e1e] border border-[#27272a] text-sm text-[#e5e7eb] rounded-md py-1 px-3 focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400 cursor-pointer outline-none">
                <option>最近 30 天</option>
                <option>最近 3 个月</option>
                <option>年初至今</option>
                <option>全部时间</option>
              </select>
            </div>
            <div className="relative h-72 w-full overflow-hidden rounded-lg border border-[#27272a]">
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/20 via-transparent to-transparent" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1e1e1e,transparent_70%)]" />
              <div className="absolute inset-0 border border-white/5" />
            </div>
          </div>
          <div className="bg-[#121212] p-6 rounded-xl border border-[#27272a] shadow-sm flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-6">
              日志精选
            </h3>
            <div className="space-y-4 flex-1 overflow-y-auto pr-2">
              <div className="group p-4 rounded-lg bg-[#1e1e1e] hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-[#27272a]">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/20">
                    复盘
                  </span>
                  <span className="text-xs text-[#9ca3af]">今天</span>
                </div>
                <p className="text-sm text-[#e5e7eb] line-clamp-2">
                  BTC 多头严格按计划执行，等待 VWAP 回测并在 15 分钟K线确认后进场。
                </p>
              </div>
              <div className="group p-4 rounded-lg bg-[#1e1e1e] hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-[#27272a]">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/20">
                    失误
                  </span>
                  <span className="text-xs text-[#9ca3af]">昨天</span>
                </div>
                <p className="text-sm text-[#e5e7eb] line-clamp-2">
                  因恐惧过早退出 ETH 仓位，需要信任止损设置，让交易有发挥空间。
                </p>
              </div>
              <div className="group p-4 rounded-lg bg-[#1e1e1e] hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-[#27272a]">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/20">
                    形态
                  </span>
                  <span className="text-xs text-[#9ca3af]">2 天前</span>
                </div>
                <p className="text-sm text-[#e5e7eb] line-clamp-2">
                  在 SOL 的 4H 图上识别到潜在头肩形态，关注 102 位置的跌破。
                </p>
              </div>
            </div>
            <button className="mt-4 w-full py-2 text-sm text-center text-[#9ca3af] font-medium hover:text-white transition-colors border border-dashed border-[#27272a] rounded-lg hover:bg-[#1e1e1e] hover:border-[#9ca3af]">
              + 添加日志
            </button>
          </div>
        </div>
        <div className="bg-[#121212] rounded-xl border border-[#27272a] shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-[#27272a] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-white">
              最近交易
            </h3>
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
                  <th className="px-6 py-3 whitespace-nowrap text-center uppercase text-xs tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {tradesLoading ? (
                  <tr>
                    <td className="px-6 py-6 text-center text-[#9ca3af]" colSpan={7}>
                      加载中...
                    </td>
                  </tr>
                ) : recentTrades.length === 0 ? (
                  <tr>
                    <td className="px-6 py-6 text-center text-[#9ca3af]" colSpan={7}>
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
                        trade.updatedAt
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
                      amount !== "-" ? Number(amount.replace(/[^0-9.-]/g, "")) : 0;
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
                        key={trade.transactionId ?? `${trade.tradeSubject}-${dateTime.date}-${dateTime.time}`}
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
                              trade.entryDirection
                            )}`}
                          >
                            {trade.entryDirection || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                              trade.status
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
                        <td className="px-6 py-4 text-center">
                          <button className="text-[#9ca3af] hover:text-white transition-colors">
                            <Eye className="h-4 w-4" />
                          </button>
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
