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
  updatedAt: string | null;
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

async function setKey(apiKey: string, apiSecret: string) {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: "trade/integrations/binance-futures/key",
      actualMethod: "POST",
    },
    actualBody: { apiKey, apiSecret },
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

async function importFills(range: "7d" | "30d" | "1y", symbols?: string[]) {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: "trade/integrations/binance-futures/import",
      actualMethod: "POST",
    },
    actualBody:
      symbols && symbols.length > 0
        ? { range, symbols }
        : { range },
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
  const [symbolsText, setSymbolsText] = React.useState("");
  const [range, setRange] = React.useState<"7d" | "30d" | "1y">("7d");

  const [saving, setSaving] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const refresh = React.useCallback(async () => {
    try {
      setLoading(true);
      const s = await getKeyStatus();
      setStatus(s);
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
        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-6">
          <div className="text-lg font-semibold text-white">配置状态</div>
          <div className="mt-2 text-sm text-[#9ca3af]">
            {loading ? (
              "加载中..."
            ) : status?.configured ? (
              <div>
                已配置（API Key 尾号：
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

        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-6">
          <div className="text-lg font-semibold text-white">设置 API Key（只读权限即可）</div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="mb-2 text-sm text-[#9ca3af]">API Key</div>
              <Input
                value={apiKey}
                onChange={(e) => setApiKeyValue(e.target.value)}
                placeholder="Binance API Key"
                className="bg-[#1e1e1e] border border-[#27272a] text-[#e5e7eb]"
              />
            </div>
            <div>
              <div className="mb-2 text-sm text-[#9ca3af]">API Secret</div>
              <Input
                value={apiSecret}
                onChange={(e) => setApiSecretValue(e.target.value)}
                placeholder="Binance API Secret"
                type="password"
                className="bg-[#1e1e1e] border border-[#27272a] text-[#e5e7eb]"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              onClick={async () => {
                try {
                  setSaving(true);
                  await setKey(apiKey.trim(), apiSecret.trim());
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
              disabled={saving || apiKey.trim().length < 8 || apiSecret.trim().length < 8}
              className="bg-[#00c2b2] text-black hover:bg-[#00a79a]"
            >
              {saving ? "保存中..." : "保存"}
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

          <div className="mt-4 text-xs text-[#6b7280]">
            安全说明：服务端会加密保存 Secret（不返回明文），仅用于读取你的合约成交记录。
          </div>
        </div>

        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-6">
          <div className="text-lg font-semibold text-white">手动导入（最近 1 年）</div>
          <div className="mt-2 text-sm text-[#9ca3af]">
            默认导入范围为 <span className="font-mono text-white">7 天</span>。你可以选择导入 1 个月或 1 年。
            Binance 单次查询最大 7 天，系统会自动分段。
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
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
                  const res = await importFills(range, parsedSymbols);
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
