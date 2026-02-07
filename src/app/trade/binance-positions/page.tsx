"use client";

import React from "react";
import TradePageShell from "../components/trade-page-shell";
import { Button } from "@/components/ui/button";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { useAlert } from "@/components/common/alert";

type PositionItem = {
  positionKey: string;
  symbol: string;
  positionSide: "LONG" | "SHORT";
  openTime: number;
  closeTime: number;
  openPrice: number;
  closePrice: number;
  maxOpenQty: number;
  closedQty: number;
  realizedPnl: number;
  pnlPercent?: number;
  fillCount: number;
};

type ListResp = {
  items: PositionItem[];
  nextToken: string | null;
};

async function listPositions(
  range: "7d" | "30d" | "1y",
  nextToken?: string | null,
) {
  const query = new URLSearchParams();
  query.set("pageSize", "20");
  query.set("range", range);
  if (nextToken) query.set("nextToken", nextToken);

  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: `trade/integrations/binance-futures/positions?${query.toString()}`,
      actualMethod: "GET",
    },
    actualBody: {},
  });
  if (!res.ok) throw new Error(await res.text());
  const json = await res.json();
  return (json.data || {}) as ListResp;
}

async function rebuildPositions(range: "7d" | "30d" | "1y") {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: "trade/integrations/binance-futures/positions/rebuild",
      actualMethod: "POST",
    },
    actualBody: { range },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function convertPositions(positionKeys: string[]) {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: "trade/integrations/binance-futures/positions/convert",
      actualMethod: "POST",
    },
    actualBody: { positionKeys },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function BinancePositionsPage() {
  const [errorAlert, successAlert] = useAlert();

  const [range, setRange] = React.useState<"7d" | "30d" | "1y">("7d");
  const [items, setItems] = React.useState<PositionItem[]>([]);
  const [nextToken, setNextToken] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const selectedKeys = React.useMemo(
    () => Object.keys(selected).filter((k) => selected[k]),
    [selected],
  );

  const load = React.useCallback(
    async (mode: "reset" | "more") => {
      try {
        setLoading(true);
        const token = mode === "more" ? nextToken : null;
        const data = await listPositions(range, token);
        setItems((prev) =>
          mode === "more" ? [...prev, ...(data.items || [])] : data.items || [],
        );
        setNextToken(data.nextToken || null);
      } catch (e) {
        console.error(e);
        errorAlert("加载仓位历史失败：你可以先点“重建仓位历史”");
      } finally {
        setLoading(false);
      }
    },
    [errorAlert, nextToken, range],
  );

  return (
    <TradePageShell title="币安已平仓仓位" subtitle="由成交记录聚合而来（更接近真实操作）">
      <div className="space-y-6">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <div className="mb-2 text-sm text-[#9ca3af]">范围</div>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as "7d" | "30d" | "1y")}
              className="rounded-md bg-[#1e1e1e] border border-[#27272a] px-3 py-2 text-sm text-[#e5e7eb]"
            >
              <option value="7d">最近 7 天</option>
              <option value="30d">最近 1 个月</option>
              <option value="1y">最近 1 年</option>
            </select>
          </div>

          <Button
            variant="secondary"
            onClick={async () => {
              try {
                setLoading(true);
                const res = await rebuildPositions(range);
                successAlert(
                  `已重建仓位历史：${res?.data?.rebuiltCount ?? 0} 条`,
                );
                await load("reset");
              } catch (e) {
                console.error(e);
                errorAlert("重建失败：请先同步成交记录");
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            {loading ? "处理中..." : "重建仓位历史"}
          </Button>

          <Button variant="secondary" onClick={() => load("reset")} disabled={loading}>
            {loading ? "加载中..." : "刷新/加载"}
          </Button>

          {nextToken ? (
            <Button variant="secondary" onClick={() => load("more")} disabled={loading}>
              {loading ? "加载中..." : "加载更多"}
            </Button>
          ) : null}

          {selectedKeys.length > 0 ? (
            <Button
              className="bg-[#00c2b2] text-black hover:bg-[#00a79a]"
              onClick={async () => {
                try {
                  const res = await convertPositions(selectedKeys);
                  successAlert(
                    `已导入为系统交易记录：${res?.data?.createdCount ?? 0} 条`,
                  );
                  setSelected({});
                } catch (e) {
                  console.error(e);
                  errorAlert("导入失败");
                }
              }}
            >
              导入选中（{selectedKeys.length}）为交易
            </Button>
          ) : null}
        </div>

        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-6 overflow-x-auto">
          <div className="text-lg font-semibold text-white">仓位历史列表</div>
          <div className="mt-2 text-xs text-[#6b7280]">
            说明：杠杆/全仓逐仓等字段 Binance 不一定通过成交接口提供，我们后续再补齐。
          </div>

          <table className="mt-4 w-full text-sm">
            <thead className="text-[#9ca3af]">
              <tr className="border-b border-[#27272a]">
                <th className="py-2 pr-3 text-left">选择</th>
                <th className="py-2 pr-3 text-left">标的</th>
                <th className="py-2 pr-3 text-left">方向</th>
                <th className="py-2 pr-3 text-left">开仓时间</th>
                <th className="py-2 pr-3 text-left">平仓时间</th>
                <th className="py-2 pr-3 text-right">开仓价</th>
                <th className="py-2 pr-3 text-right">平仓均价</th>
                <th className="py-2 pr-3 text-right">最大持仓</th>
                <th className="py-2 pr-3 text-right">已实现盈亏</th>
                <th className="py-2 pr-3 text-right">收益率(估算)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.positionKey} className="border-b border-[#27272a] hover:bg-white/5">
                  <td className="py-2 pr-3">
                    <input
                      type="checkbox"
                      checked={Boolean(selected[p.positionKey])}
                      onChange={(e) =>
                        setSelected((prev) => ({
                          ...prev,
                          [p.positionKey]: e.target.checked,
                        }))
                      }
                    />
                  </td>
                  <td className="py-2 pr-3 text-white font-mono">{p.symbol}</td>
                  <td className="py-2 pr-3 text-[#e5e7eb]">{p.positionSide}</td>
                  <td className="py-2 pr-3 text-[#e5e7eb] whitespace-nowrap">
                    {new Date(p.openTime).toLocaleString()}
                  </td>
                  <td className="py-2 pr-3 text-[#e5e7eb] whitespace-nowrap">
                    {new Date(p.closeTime).toLocaleString()}
                  </td>
                  <td className="py-2 pr-3 text-right text-[#e5e7eb] font-mono">
                    {p.openPrice?.toFixed ? p.openPrice.toFixed(2) : p.openPrice}
                  </td>
                  <td className="py-2 pr-3 text-right text-[#e5e7eb] font-mono">
                    {p.closePrice?.toFixed ? p.closePrice.toFixed(2) : p.closePrice}
                  </td>
                  <td className="py-2 pr-3 text-right text-[#e5e7eb] font-mono">
                    {p.maxOpenQty}
                  </td>
                  <td className="py-2 pr-3 text-right font-mono">
                    <span
                      className={p.realizedPnl >= 0 ? "text-[#00c2b2]" : "text-red-400"}
                    >
                      {p.realizedPnl}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-right text-[#e5e7eb] font-mono">
                    {typeof p.pnlPercent === "number"
                      ? `${(p.pnlPercent * 100).toFixed(2)}%`
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {items.length === 0 ? (
            <div className="mt-4 text-sm text-[#9ca3af]">
              暂无数据：请先在“币安合约同步”页导入一次成交记录。
            </div>
          ) : null}
        </div>
      </div>
    </TradePageShell>
  );
}
