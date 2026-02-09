"use client";

import React from "react";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import TradePageShell from "../components/trade-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAlert } from "@/components/common/alert";

type KeyStatus = {
  configured: boolean;
  apiKeyTail: string | null;
  defaultLeverage?: number | null;
  updatedAt: string | null;
};

type FillItem = {
  tradeKey: string;
  tradeId: string;
  symbol: string;
  time: number;
  side?: string;
  positionSide?: string;
  price?: string;
  qty?: string;
  realizedPnl?: string;
  commission?: string;
  commissionAsset?: string;
};

type FillListResponse = {
  items: FillItem[];
  nextToken: string | null;
};

async function getKeyStatus() {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: "trade/integrations/binance-futures/key",
      actualMethod: "GET",
    },
    actualBody: {},
  });
  if (!res.ok) throw new Error(await res.text());
  const json = await res.json();
  return (json.data || {}) as KeyStatus;
}

async function setKey(
  apiKey: string,
  apiSecret: string,
  defaultLeverage?: number | null,
) {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: "trade/integrations/binance-futures/key",
      actualMethod: "POST",
    },
    actualBody: {
      apiKey,
      apiSecret,
      ...(typeof defaultLeverage === "number" && Number.isFinite(defaultLeverage)
        ? { defaultLeverage }
        : {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function updateSettings(defaultLeverage?: number | null) {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: "trade/integrations/binance-futures/settings",
      actualMethod: "POST",
    },
    actualBody: {
      ...(typeof defaultLeverage === "number" && Number.isFinite(defaultLeverage)
        ? { defaultLeverage }
        : {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function deleteKey() {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: "trade/integrations/binance-futures/key",
      actualMethod: "DELETE",
    },
    actualBody: {},
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function cleanupSyncedData() {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: "trade/integrations/binance-futures/cleanup",
      actualMethod: "POST",
    },
    actualBody: { includeKeys: false },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function importFills(
  range: "7d" | "30d" | "1y",
  market: "usdtm" | "coinm",
  symbols?: string[],
) {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: "trade/integrations/binance-futures/import",
      actualMethod: "POST",
    },
    actualBody:
      symbols && symbols.length > 0
        ? { range, market, symbols }
        : { range, market },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function listFills(pageSize: number, nextToken?: string | null) {
  const query = new URLSearchParams();
  query.set("pageSize", String(pageSize));
  if (nextToken) query.set("nextToken", nextToken);

  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: `trade/integrations/binance-futures/fills?${query.toString()}`,
      actualMethod: "GET",
    },
    actualBody: {},
  });
  if (!res.ok) throw new Error(await res.text());
  const json = await res.json();
  return (json.data || {}) as FillListResponse;
}

async function aggregatePreview(tradeKeys: string[]) {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: "trade/integrations/binance-futures/fills/aggregate-preview",
      actualMethod: "POST",
    },
    actualBody: { tradeKeys },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function aggregateConvert(tradeKeys: string[]) {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: "trade/integrations/binance-futures/fills/aggregate-convert",
      actualMethod: "POST",
    },
    actualBody: { tradeKeys },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function convertFills(tradeKeys: string[]) {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: "trade/integrations/binance-futures/convert",
      actualMethod: "POST",
    },
    actualBody: { tradeKeys },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function BinanceFuturesIntegrationPage() {
  const [errorAlert, successAlert] = useAlert();

  const [loading, setLoading] = React.useState(true);
  const [status, setStatus] = React.useState<KeyStatus | null>(null);

  const [apiKey, setApiKeyValue] = React.useState("");
  const [apiSecret, setApiSecretValue] = React.useState("");
  const [defaultLeverage, setDefaultLeverage] = React.useState<number | null>(30);
  const [symbolsText, setSymbolsText] = React.useState("");
  const [range, setRange] = React.useState<"7d" | "30d" | "1y">("7d");
  const [market, setMarket] = React.useState<"usdtm" | "coinm">("usdtm");

  const [saving, setSaving] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const [fills, setFills] = React.useState<FillItem[]>([]);
  const [fillsLoading, setFillsLoading] = React.useState(false);
  const [fillsNextToken, setFillsNextToken] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [converting, setConverting] = React.useState(false);
  const [aggregating, setAggregating] = React.useState(false);
  const [aggregateResult, setAggregateResult] = React.useState<unknown>(null);
  const [aggregateOpen, setAggregateOpen] = React.useState(false);
  const [cleaning, setCleaning] = React.useState(false);

  const refresh = React.useCallback(async () => {
    try {
      setLoading(true);
      const s = await getKeyStatus();
      setStatus(s);
      if (typeof s.defaultLeverage === "number") {
        setDefaultLeverage(s.defaultLeverage);
      }
    } catch (e) {
      console.error(e);
      errorAlert("加载配置状态失败");
    } finally {
      setLoading(false);
    }
  }, [errorAlert]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const parsedSymbols = React.useMemo(() => {
    const parts = symbolsText
      .split(/[,\n\s]+/)
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    return Array.from(new Set(parts));
  }, [symbolsText]);

  const selectedKeys = React.useMemo(
    () => Object.keys(selected).filter((k) => selected[k]),
    [selected],
  );

  const loadFills = React.useCallback(
    async (mode: "reset" | "more") => {
      try {
        setFillsLoading(true);
        const pageSize = 50;
        const token = mode === "more" ? fillsNextToken : null;
        const data = await listFills(pageSize, token);

        setFills((prev) =>
          mode === "more" ? [...prev, ...(data.items || [])] : data.items || [],
        );
        setFillsNextToken(data.nextToken || null);
      } catch (e) {
        console.error(e);
        errorAlert("加载同步记录失败");
      } finally {
        setFillsLoading(false);
      }
    },
    [errorAlert, fillsNextToken],
  );

  return (
    <TradePageShell title="币安合约同步" subtitle="只读 API Key（查看权限）→ 手动导入最近 1 年成交记录（fills）">
      <div className="mb-4 text-sm text-[#9ca3af]">
        不知道 API Key/Secret 从哪里获取？看
        <a className="ml-1 text-[#00c2b2] hover:underline" href="/docs/binance-futures">
          币安合约同步文档
        </a>
        。
      </div>
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => loadFills("reset")}
            disabled={fillsLoading || !status?.configured}
          >
            {fillsLoading ? "加载中..." : "查看已同步记录"}
          </Button>
          {fills.length > 0 && fillsNextToken ? (
            <Button
              variant="secondary"
              onClick={() => loadFills("more")}
              disabled={fillsLoading}
            >
              {fillsLoading ? "加载中..." : "加载更多"}
            </Button>
          ) : null}

          <Button
            variant="secondary"
            onClick={async () => {
              const ok = window.confirm(
                "确认清空‘币安合约同步’的数据吗？\n\n将删除：已同步的成交记录/仓位聚合数据。\n不会删除系统里的真实交易记录。",
              );
              if (!ok) return;

              try {
                setCleaning(true);
                const res = await cleanupSyncedData();
                successAlert(
                  `已清空：fills ${res?.data?.fillsDeleted ?? 0} 条，positions ${res?.data?.positionsDeleted ?? 0} 条`,
                );
                setFills([]);
                setFillsNextToken(null);
                setSelected({});
              } catch (e) {
                console.error(e);
                errorAlert("清空失败");
              } finally {
                setCleaning(false);
              }
            }}
            disabled={cleaning || !status?.configured}
          >
            {cleaning ? "清空中..." : "清空同步数据"}
          </Button>

          {selectedKeys.length > 0 ? (
            <>
              <Button
                variant="secondary"
                onClick={async () => {
                  try {
                    setAggregating(true);
                    const res = await aggregatePreview(selectedKeys);
                    setAggregateResult(res);
                    setAggregateOpen(true);
                    successAlert(
                      `预览完成：netQty=${res?.data?.totals?.netQty ?? 0}`,
                    );
                  } catch (e) {
                    console.error(e);
                    errorAlert("聚合预览失败");
                  } finally {
                    setAggregating(false);
                  }
                }}
                disabled={aggregating}
              >
                {aggregating ? "处理中..." : `合并成交预览（${selectedKeys.length}）`}
              </Button>

              <Button
                onClick={async () => {
                  try {
                    setConverting(true);
                    const res = await aggregateConvert(selectedKeys);
                    successAlert("已生成 1 笔交易记录（可编辑）");
                    setSelected({});
                    const tid = res?.data?.transactionId;
                    if (tid) {
                      window.location.href = `/trade/detail?id=${encodeURIComponent(tid)}`;
                    }
                  } catch (e) {
                    console.error(e);
                    errorAlert("生成交易失败");
                  } finally {
                    setConverting(false);
                  }
                }}
                disabled={converting}
                className="bg-[#00c2b2] text-black hover:bg-[#00a79a]"
              >
                {converting ? "生成中..." : `生成交易（${selectedKeys.length}）`}
              </Button>

              <Button
                variant="secondary"
                onClick={async () => {
                  try {
                    setConverting(true);
                    const res = await convertFills(selectedKeys);
                    successAlert(
                      `（旧）已导入为系统交易记录：${res?.data?.createdCount ?? 0} 条`,
                    );
                    setSelected({});
                  } catch (e) {
                    console.error(e);
                    errorAlert("导入为交易记录失败");
                  } finally {
                    setConverting(false);
                  }
                }}
                disabled={converting}
              >
                {converting ? "导入中..." : `（旧）逐条导入（${selectedKeys.length}）`}
              </Button>
            </>
          ) : null}
        </div>

        {aggregateOpen && aggregateResult ? (() => {
          const r = aggregateResult as unknown as {
            data?: {
              totals?: { buyQty?: number; sellQty?: number; netQty?: number };
              closedPositions?: unknown[];
              openPositions?: unknown[];
            };
          };
          const totals = r?.data?.totals;
          const netQty = typeof totals?.netQty === "number" ? totals.netQty : null;
          const buyQty = typeof totals?.buyQty === "number" ? totals.buyQty : null;
          const sellQty = typeof totals?.sellQty === "number" ? totals.sellQty : null;

          const closed = Array.isArray(r?.data?.closedPositions)
            ? r.data.closedPositions
            : [];
          const open = Array.isArray(r?.data?.openPositions) ? r.data.openPositions : [];

          const p = ((closed[0] || open[0] || null) as unknown) as {
            symbol?: string;
            positionSide?: string;
            openTime?: number;
            closeTime?: number;
            lastTime?: number;
            openPrice?: number;
            closePrice?: number;
            realizedPnl?: number;
            fees?: number;
            closedQty?: number;
            currentQty?: number;
            maxOpenQty?: number;
          } | null;

          const symbol = p?.symbol || "-";
          const side = p?.positionSide || "-";
          const openTime = p?.openTime ? new Date(p.openTime).toLocaleString() : "-";
          const closeTime = p?.closeTime
            ? new Date(p.closeTime).toLocaleString()
            : p?.lastTime
              ? new Date(p.lastTime).toLocaleString()
              : "-";

          const openPrice = typeof p?.openPrice === "number" ? p.openPrice : null;
          const closePrice = typeof p?.closePrice === "number" ? p.closePrice : null;
          const realizedPnl = typeof p?.realizedPnl === "number" ? p.realizedPnl : null;
          const fees = typeof p?.fees === "number" ? p.fees : null;
          const qty = typeof p?.closedQty === "number" && p.closedQty > 0
            ? p.closedQty
            : typeof p?.currentQty === "number"
              ? p.currentQty
              : typeof p?.maxOpenQty === "number"
                ? p.maxOpenQty
                : null;

          const isClosed = closed.length > 0 && (netQty === null || Math.abs(netQty) < 1e-9);

          return (
            <div className="rounded-xl border border-[#27272a] bg-[#121212] p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-white">合并成交预览</div>
                  <div className="mt-2 text-xs text-[#6b7280]">
                    说明：把你勾选的成交合并为“一笔仓位”。
                    <span className="ml-1">netQty≈0 表示已闭合；不为 0 说明漏选或仍有未平仓。</span>
                  </div>
                </div>
                <Button variant="secondary" onClick={() => setAggregateOpen(false)}>
                  关闭
                </Button>
              </div>

              <div className="mt-4 rounded-xl border border-[#27272a] bg-[#0b0b0b] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-[#9ca3af]">{symbol} · {side} · {isClosed ? "已平仓" : "未平仓/未闭合"}</div>
                  <div className={realizedPnl != null && realizedPnl >= 0 ? "text-[#00c2b2] font-mono" : "text-red-400 font-mono"}>
                    {realizedPnl == null ? "-" : `${realizedPnl.toFixed(8)} USDC`}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3 text-xs text-[#9ca3af]">
                  <div>开仓：<span className="text-[#e5e7eb]">{openTime}</span></div>
                  <div>平仓/最后：<span className="text-[#e5e7eb]">{closeTime}</span></div>
                  <div>数量：<span className="text-[#e5e7eb] font-mono">{qty == null ? "-" : qty}</span></div>
                  <div>开仓均价：<span className="text-[#e5e7eb] font-mono">{openPrice == null ? "-" : openPrice.toFixed(2)}</span></div>
                  <div>平仓均价：<span className="text-[#e5e7eb] font-mono">{closePrice == null ? "-" : closePrice.toFixed(2)}</span></div>
                  <div>手续费：<span className="text-[#e5e7eb] font-mono">{fees == null ? "-" : fees.toFixed(8)}</span></div>
                </div>

                <div className="mt-3 text-xs text-[#6b7280] font-mono">
                  buyQty={buyQty == null ? "-" : buyQty} · sellQty={sellQty == null ? "-" : sellQty} · netQty={netQty == null ? "-" : netQty}
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    className="bg-[#00c2b2] text-black hover:bg-[#00a79a]"
                    onClick={async () => {
                      try {
                        setConverting(true);
                        const res = await aggregateConvert(selectedKeys);
                        successAlert("已生成 1 笔交易记录（可编辑）");
                        setSelected({});
                        const tid = res?.data?.transactionId;
                        if (tid) {
                          window.location.href = `/trade/detail?id=${encodeURIComponent(tid)}`;
                        }
                      } catch (e) {
                        console.error(e);
                        errorAlert("生成交易失败");
                      } finally {
                        setConverting(false);
                      }
                    }}
                    disabled={converting || selectedKeys.length === 0}
                  >
                    {converting ? "生成中..." : `转为复盘交易（${selectedKeys.length}）`}
                  </Button>

                  <Button variant="secondary" onClick={() => setAggregateOpen(false)} disabled={converting}>
                    关闭
                  </Button>
                </div>
              </div>
            </div>
          );
        })() : null}

        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-6">
          <div className="text-lg font-semibold text-white">配置状态</div>
          <div className="mt-2 text-sm text-[#9ca3af]">
            {loading ? (
              "加载中..."
            ) : status?.configured ? (
              <div>
                已配置（尾号：
                <span className="font-mono text-white">{status.apiKeyTail}</span>
                ）
                {status.updatedAt ? (
                  <span className="ml-2 text-xs text-[#6b7280]">
                    更新于 {new Date(status.updatedAt).toLocaleString()}
                  </span>
                ) : null}
              </div>
            ) : (
              "未配置"
            )}
          </div>
        </div>

        {fills.length > 0 ? (
          <div className="rounded-xl border border-[#27272a] bg-[#121212] p-6 overflow-x-auto">
            <div className="text-lg font-semibold text-white">已同步成交记录</div>
            <table className="mt-4 w-full text-sm">
              <thead className="text-[#9ca3af]">
                <tr className="border-b border-[#27272a]">
                  <th className="py-2 pr-3 text-left">选择</th>
                  <th className="py-2 pr-3 text-left">时间</th>
                  <th className="py-2 pr-3 text-left">Symbol</th>
                  <th className="py-2 pr-3 text-left">方向</th>
                  <th className="py-2 pr-3 text-right">价格</th>
                  <th className="py-2 pr-3 text-right">数量</th>
                  <th className="py-2 pr-3 text-right">已实现盈亏</th>
                </tr>
              </thead>
              <tbody>
                {fills.map((f) => (
                  <tr
                    key={f.tradeKey}
                    className="border-b border-[#27272a] hover:bg-white/5 cursor-pointer"
                    onClick={() =>
                      setSelected((prev) => ({
                        ...prev,
                        [f.tradeKey]: !Boolean(prev[f.tradeKey]),
                      }))
                    }
                  >
                    <td className="py-2 pr-3">
                      <input
                        type="checkbox"
                        checked={Boolean(selected[f.tradeKey])}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          setSelected((prev) => ({
                            ...prev,
                            [f.tradeKey]: e.target.checked,
                          }))
                        }
                      />
                    </td>
                    <td className="py-2 pr-3 text-[#e5e7eb] whitespace-nowrap">
                      {f.time ? new Date(f.time).toLocaleString() : "-"}
                    </td>
                    <td className="py-2 pr-3 text-white font-mono">
                      {f.symbol}
                    </td>
                    <td className="py-2 pr-3 text-[#e5e7eb]">
                      {f.positionSide || f.side || "-"}
                    </td>
                    <td className="py-2 pr-3 text-right text-[#e5e7eb] font-mono">
                      {f.price ?? "-"}
                    </td>
                    <td className="py-2 pr-3 text-right text-[#e5e7eb] font-mono">
                      {f.qty ?? "-"}
                    </td>
                    <td className="py-2 pr-3 text-right font-mono">
                      <span
                        className={
                          Number(f.realizedPnl ?? 0) >= 0
                            ? "text-[#00c2b2]"
                            : "text-red-400"
                        }
                      >
                        {f.realizedPnl ?? "-"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-6">
          <div className="text-lg font-semibold text-white">API Key 配置</div>
          <div className="mt-2 text-sm text-[#9ca3af]">
            {status?.configured ? (
              <span>
                已配置（尾号：
                <span className="font-mono text-white">{status.apiKeyTail}</span>
                ）
              </span>
            ) : (
              "未配置"
            )}
          </div>

          {!status?.configured ? (
            <>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <div className="mb-2 text-sm text-[#9ca3af]">API Key</div>
                  <Input
                    value={apiKey}
                    onChange={(e) => setApiKeyValue(e.target.value)}
                    placeholder="Binance API 密钥"
                    className="bg-[#1e1e1e] border border-[#27272a] text-[#e5e7eb]"
                  />
                </div>
                <div>
                  <div className="mb-2 text-sm text-[#9ca3af]">API Secret</div>
                  <Input
                    value={apiSecret}
                    onChange={(e) => setApiSecretValue(e.target.value)}
                    placeholder="Binance 密钥"
                    type="password"
                    className="bg-[#1e1e1e] border border-[#27272a] text-[#e5e7eb]"
                  />
                </div>
                <div>
                  <div className="mb-2 text-sm text-[#9ca3af]">默认杠杆（用于 ROI 估算）</div>
                  <Input
                    value={defaultLeverage ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      const n = Number(v);
                      setDefaultLeverage(
                        v.trim().length === 0 || !Number.isFinite(n)
                          ? null
                          : Math.max(1, Math.min(125, Math.trunc(n))),
                      );
                    }}
                    placeholder="例如 30"
                    inputMode="numeric"
                    className="bg-[#1e1e1e] border border-[#27272a] text-[#e5e7eb]"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  onClick={async () => {
                    try {
                      setSaving(true);
                      await setKey(apiKey.trim(), apiSecret.trim(), defaultLeverage);
                      successAlert("保存成功");
                      setApiKeyValue("");
                      setApiSecretValue("");
                      await refresh();
                    } catch (e) {
                      console.error(e);
                      errorAlert("保存失败");
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={
                    saving || apiKey.trim().length < 8 || apiSecret.trim().length < 8
                  }
                  className="bg-[#00c2b2] text-black hover:bg-[#00a79a]"
                >
                  {saving ? "保存中..." : "保存"}
                </Button>
              </div>

              <div className="mt-4 text-xs text-[#6b7280]">
                安全说明：服务端会加密保存 Secret（不返回明文），仅用于读取你的合约成交记录。
              </div>
            </>
          ) : null}

          {status?.configured ? (
            <>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                  <div className="text-xs text-[#6b7280]">
                    已配置 Key/Secret（不显示明文）。如需修改请删除后重新配置。
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-sm text-[#9ca3af]">默认杠杆（用于 ROI 估算）</div>
                  <Input
                    value={defaultLeverage ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      const n = Number(v);
                      setDefaultLeverage(
                        v.trim().length === 0 || !Number.isFinite(n)
                          ? null
                          : Math.max(1, Math.min(125, Math.trunc(n))),
                      );
                    }}
                    placeholder="例如 30"
                    inputMode="numeric"
                    className="bg-[#1e1e1e] border border-[#27272a] text-[#e5e7eb]"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  onClick={async () => {
                    try {
                      setSaving(true);
                      await updateSettings(defaultLeverage);
                      successAlert("保存成功");
                      await refresh();
                    } catch (e) {
                      console.error(e);
                      errorAlert("保存失败");
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                  className="bg-[#00c2b2] text-black hover:bg-[#00a79a]"
                >
                  {saving ? "保存中..." : "保存杠杆"}
                </Button>

                <Button
                  variant="secondary"
                  onClick={async () => {
                    try {
                      setDeleting(true);
                      await deleteKey();
                      successAlert("已删除");
                      await refresh();
                    } catch (e) {
                      console.error(e);
                      errorAlert("删除失败");
                    } finally {
                      setDeleting(false);
                    }
                  }}
                  disabled={deleting}
                >
                  {deleting ? "删除中..." : "删除配置"}
                </Button>
              </div>
            </>
          ) : null}
        </div>

        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-6">
          <div className="text-lg font-semibold text-white">手动导入（最近成交）</div>
          <div className="mt-2 text-sm text-[#9ca3af]">
            默认导入范围为 <span className="font-mono text-white">7 天</span>。你可以选择导入 1 个月或 1 年。
            Binance 单次查询最大 7 天，系统会自动分段。
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <div className="mb-2 text-sm text-[#9ca3af]">合约市场</div>
              <select
                value={market}
                onChange={(e) => setMarket(e.target.value as "usdtm" | "coinm")}
                className="w-full rounded-md bg-[#1e1e1e] border border-[#27272a] px-3 py-2 text-sm text-[#e5e7eb]"
              >
                <option value="usdtm">USDⓈ-M（USDT/USDC 永续）</option>
                <option value="coinm">COIN-M（币本位）</option>
              </select>
            </div>

            <div>
              <div className="mb-2 text-sm text-[#9ca3af]">导入范围</div>
              <select
                value={range}
                onChange={(e) => setRange(e.target.value as "7d" | "30d" | "1y")}
                className="w-full rounded-md bg-[#1e1e1e] border border-[#27272a] px-3 py-2 text-sm text-[#e5e7eb]"
              >
                <option value="7d">最近 7 天（默认）</option>
                <option value="30d">最近 1 个月</option>
                <option value="1y">最近 1 年</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 text-sm text-[#9ca3af]">symbols（可选）</div>
            <Textarea
              value={symbolsText}
              onChange={(e) => setSymbolsText(e.target.value)}
              placeholder="BTCUSDT\nETHUSDT"
              className="min-h-[100px] bg-[#1e1e1e] border border-[#27272a] text-[#e5e7eb]"
            />
            <div className="mt-2 text-xs text-[#6b7280]">
              当前解析到：{parsedSymbols.length} 个 symbols
            </div>
          </div>

          <div className="mt-4">
            <Button
              onClick={async () => {
                try {
                  setImporting(true);
                  const res = await importFills(range, market, parsedSymbols);
                  successAlert(
                    `导入完成：新增 ${res?.data?.importedCount ?? 0}，跳过 ${res?.data?.skippedCount ?? 0}`,
                  );
                } catch (e) {
                  console.error(e);
                  errorAlert("导入失败：请检查 API Key 权限，或填写 symbols 重试");
                } finally {
                  setImporting(false);
                }
              }}
              disabled={importing || !status?.configured}
              className="bg-[#00c2b2] text-black hover:bg-[#00a79a]"
            >
              {importing ? "导入中..." : "开始导入"}
            </Button>
          </div>
        </div>
      </div>
    </TradePageShell>
  );
}
