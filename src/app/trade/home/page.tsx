"use client";

import React from "react";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import TradePageShell from "../components/trade-page-shell";
import {
  Eye,
  PiggyBank,
  PieChart,
  Search,
  Sigma,
  TrendingUp,
  Wallet,
} from "lucide-react";

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
                Trades This Month
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
            <p className="text-xs text-[#9ca3af] mt-1">vs. last month</p>
          </div>
          <div className="bg-[#121212] p-6 rounded-xl border border-[#27272a] shadow-sm hover:border-emerald-400/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[#9ca3af]">Win Rate</h3>
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
            <p className="text-xs text-[#9ca3af] mt-1">Last 30 trades</p>
          </div>
          <div className="bg-[#121212] p-6 rounded-xl border border-[#27272a] shadow-sm hover:border-emerald-400/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[#9ca3af]">
                Profit Factor
              </h3>
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Sigma className="h-4 w-4 text-purple-400" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">2.45</span>
              <span className="text-sm font-medium text-[#9ca3af]">
                Excellent
              </span>
            </div>
            <p className="text-xs text-[#9ca3af] mt-1">
              Gross Profit / Gross Loss
            </p>
          </div>
          <div className="bg-[#121212] p-6 rounded-xl border border-[#27272a] shadow-sm hover:border-emerald-400/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[#9ca3af]">
                Net P&amp;L (30d)
              </h3>
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <PiggyBank className="h-4 w-4 text-yellow-400" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">+$8,450.25</span>
            </div>
            <p className="text-xs text-[#9ca3af] mt-1">
              Based on closed positions
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#121212] p-6 rounded-xl border border-[#27272a] shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                Equity Growth
              </h3>
              <select className="bg-[#1e1e1e] border border-[#27272a] text-sm text-[#e5e7eb] rounded-md py-1 px-3 focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400 cursor-pointer outline-none">
                <option>Last 30 Days</option>
                <option>Last 3 Months</option>
                <option>YTD</option>
                <option>All Time</option>
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
              Journal Highlights
            </h3>
            <div className="space-y-4 flex-1 overflow-y-auto pr-2">
              <div className="group p-4 rounded-lg bg-[#1e1e1e] hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-[#27272a]">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/20">
                    Reflection
                  </span>
                  <span className="text-xs text-[#9ca3af]">Today</span>
                </div>
                <p className="text-sm text-[#e5e7eb] line-clamp-2">
                  Followed the plan perfectly on BTC long. Waited for the retest
                  of the VWAP and confirmation on the 15m candle.
                </p>
              </div>
              <div className="group p-4 rounded-lg bg-[#1e1e1e] hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-[#27272a]">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/20">
                    Mistake
                  </span>
                  <span className="text-xs text-[#9ca3af]">Yesterday</span>
                </div>
                <p className="text-sm text-[#e5e7eb] line-clamp-2">
                  Exited ETH position too early due to fear. Need to trust the
                  stop loss placement and let the trade breathe.
                </p>
              </div>
              <div className="group p-4 rounded-lg bg-[#1e1e1e] hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-[#27272a]">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/20">
                    Setup
                  </span>
                  <span className="text-xs text-[#9ca3af]">2 days ago</span>
                </div>
                <p className="text-sm text-[#e5e7eb] line-clamp-2">
                  Identifying a potential head and shoulders pattern on the 4H
                  chart for SOL. Watching 102 level for breakdown.
                </p>
              </div>
            </div>
            <button className="mt-4 w-full py-2 text-sm text-center text-[#9ca3af] font-medium hover:text-white transition-colors border border-dashed border-[#27272a] rounded-lg hover:bg-[#1e1e1e] hover:border-[#9ca3af]">
              + Add Journal Entry
            </button>
          </div>
        </div>
        <div className="bg-[#121212] rounded-xl border border-[#27272a] shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-[#27272a] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-white">
              Recent Transactions
            </h3>
            <div className="flex gap-2">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-[#9ca3af]" />
                </span>
                <input
                  className="pl-9 pr-4 py-1.5 text-sm border border-[#27272a] bg-[#1e1e1e] text-white rounded-md focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400 w-full sm:w-48 placeholder:text-[#9ca3af] outline-none"
                  placeholder="Search symbol..."
                  type="text"
                />
              </div>
              <button className="px-3 py-1.5 text-sm font-medium text-[#e5e7eb] bg-[#1e1e1e] border border-[#27272a] rounded-md hover:bg-white/5 transition-colors">
                Filter
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-black/20 text-[#9ca3af] font-medium border-b border-[#27272a]">
                <tr>
                  <th className="px-6 py-3 whitespace-nowrap uppercase text-xs tracking-wider">
                    Date Time
                  </th>
                  <th className="px-6 py-3 whitespace-nowrap uppercase text-xs tracking-wider">
                    Symbol
                  </th>
                  <th className="px-6 py-3 whitespace-nowrap uppercase text-xs tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 whitespace-nowrap uppercase text-xs tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 whitespace-nowrap text-right uppercase text-xs tracking-wider">
                    Return %
                  </th>
                  <th className="px-6 py-3 whitespace-nowrap text-right uppercase text-xs tracking-wider">
                    P&amp;L ($)
                  </th>
                  <th className="px-6 py-3 whitespace-nowrap text-center uppercase text-xs tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                <tr className="hover:bg-[#1e1e1e] transition-colors">
                  <td className="px-6 py-4 text-white whitespace-nowrap">
                    2026-01-16{" "}
                    <span className="text-[#9ca3af] text-xs ml-1">16:23</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-white">BTC/USDC</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Long
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Analysis
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-[#9ca3af]">-</td>
                  <td className="px-6 py-4 text-right text-[#9ca3af]">-</td>
                  <td className="px-6 py-4 text-center">
                    <button className="text-[#9ca3af] hover:text-white transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-[#1e1e1e] transition-colors">
                  <td className="px-6 py-4 text-white whitespace-nowrap">
                    2026-01-16{" "}
                    <span className="text-[#9ca3af] text-xs ml-1">14:05</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-white">ETH/USDC</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                      Short
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-[#9ca3af] border border-white/10">
                      Closed
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-red-400">
                    -8.9%
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-red-400">
                    -$420.50
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="text-[#9ca3af] hover:text-white transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-[#1e1e1e] transition-colors">
                  <td className="px-6 py-4 text-white whitespace-nowrap">
                    2026-01-15{" "}
                    <span className="text-[#9ca3af] text-xs ml-1">09:30</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-white">SOL/USDC</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Long
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-[#9ca3af] border border-white/10">
                      Closed
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-emerald-400">
                    +12.4%
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-emerald-400">
                    +$1,240.00
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="text-[#9ca3af] hover:text-white transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-[#1e1e1e] transition-colors">
                  <td className="px-6 py-4 text-white whitespace-nowrap">
                    2025-11-21{" "}
                    <span className="text-[#9ca3af] text-xs ml-1">01:38</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-white">ETH</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 text-[#9ca3af] border border-white/10">
                      -
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                      Pending
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-[#9ca3af]">-</td>
                  <td className="px-6 py-4 text-right text-[#9ca3af]">-</td>
                  <td className="px-6 py-4 text-center">
                    <button className="text-[#9ca3af] hover:text-white transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-[#1e1e1e] transition-colors">
                  <td className="px-6 py-4 text-white whitespace-nowrap">
                    2025-11-19{" "}
                    <span className="text-[#9ca3af] text-xs ml-1">00:26</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-white">ETH</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                      Short
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-[#9ca3af] border border-white/10">
                      Closed
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-red-400">
                    -13.54%
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-red-400">
                    -$850.20
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="text-[#9ca3af] hover:text-white transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="bg-[#121212] px-6 py-4 border-t border-[#27272a] flex items-center justify-between">
            <span className="text-sm text-[#9ca3af]">
              Showing <span className="font-medium text-white">1</span> to{" "}
              <span className="font-medium text-white">5</span> of{" "}
              <span className="font-medium text-white">27</span> results
            </span>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-sm border border-[#27272a] rounded bg-[#1e1e1e] text-[#e5e7eb] hover:bg-white/5 disabled:opacity-50 transition-colors">
                Previous
              </button>
              <button className="px-3 py-1 text-sm border border-[#27272a] rounded bg-[#1e1e1e] text-[#e5e7eb] hover:bg-white/5 transition-colors">
                Next
              </button>
            </div>
          </div>
        </div>
        <footer className="text-center text-xs text-[#9ca3af] mt-8 mb-4 opacity-50">
          © 2026 MMC Trading System. All rights reserved.
        </footer>
      </div>
    </TradePageShell>
  );
}
