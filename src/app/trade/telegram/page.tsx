"use client";

import React from "react";
import TradePageShell from "../components/trade-page-shell";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/components/common/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, RefreshCcw, Send } from "lucide-react";

type TelegramBinding = {
  userId: string;
  chatId: number;
  telegramUserId?: number;
  telegramUsername?: string;
  createdAt: string;
  updatedAt: string;
};

async function getTelegramBinding() {
  const resp = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: "user/telegram",
      actualMethod: "GET",
    },
    actualBody: {},
  });
  if (!resp.ok) throw new Error(await resp.text());
  const json = (await resp.json()) as {
    success: boolean;
    data: TelegramBinding | null;
  };
  return json.data;
}

async function createBindLink() {
  const resp = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: "user/telegram/bind",
      actualMethod: "POST",
    },
    actualBody: {},
  });
  if (!resp.ok) throw new Error(await resp.text());
  const json = (await resp.json()) as {
    success: boolean;
    data: {
      url: string;
      startParam?: string;
    };
  };
  return json.data;
}

function formatTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

export default function TradeTelegramPage() {
  const [errorAlert, successAlert] = useAlert();

  const [loading, setLoading] = React.useState(true);
  const [binding, setBinding] = React.useState<TelegramBinding | null>(null);
  const [bindUrl, setBindUrl] = React.useState<string | null>(null);
  const [startParam, setStartParam] = React.useState<string | undefined>();

  const load = React.useCallback(async () => {
    setLoading(true);
    setBindUrl(null);
    try {
      const data = await getTelegramBinding();
      setBinding(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "获取绑定状态失败";
      errorAlert(msg);
    } finally {
      setLoading(false);
    }
  }, [errorAlert]);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleCreateLink = async () => {
    try {
      const res = await createBindLink();
      setBindUrl(res.url);
      setStartParam(res.startParam);
      successAlert("已生成绑定链接：请在 Telegram 打开完成绑定");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "生成绑定链接失败";
      errorAlert(msg);
    }
  };

  const handleOpenTelegram = () => {
    if (!bindUrl) return;
    window.open(bindUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <TradePageShell title="Telegram 绑定">
      <div className="space-y-6">
        <div className="bg-[#121212] rounded-xl border border-[#27272a] shadow-sm p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Send className="h-5 w-5 text-[#00c2b2]" />
                绑定状态
              </h3>
              <p className="text-sm text-[#9ca3af] mt-1">
                绑定后，外部 webhook 可向你的 Telegram 推送交易提醒。
              </p>
            </div>
            <Button variant="secondary" onClick={load} disabled={loading}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              刷新
            </Button>
          </div>

          <div className="mt-4 rounded-lg border border-[#27272a] bg-black/20 p-4">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-56 bg-white/10" />
                <Skeleton className="h-4 w-80 bg-white/10" />
              </div>
            ) : binding ? (
              <div className="space-y-2 text-sm">
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <div>
                    <span className="text-[#9ca3af]">ChatId：</span>
                    <span className="text-white font-mono">{binding.chatId}</span>
                  </div>
                  <div>
                    <span className="text-[#9ca3af]">绑定时间：</span>
                    <span className="text-white">{formatTime(binding.createdAt)}</span>
                  </div>
                </div>
                {binding.telegramUsername ? (
                  <div>
                    <span className="text-[#9ca3af]">Telegram 用户名：</span>
                    <span className="text-white">{binding.telegramUsername}</span>
                  </div>
                ) : null}
                <div className="pt-2 text-[#9ca3af]">
                  已绑定。如果你要换绑，直接重新生成链接并在 Telegram 点开即可覆盖。
                </div>
              </div>
            ) : (
              <div className="text-sm text-[#9ca3af]">
                当前未绑定 Telegram。
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleCreateLink}
              className="bg-[#00c2b2] text-black hover:bg-[#00c2b2]/90"
              disabled={loading}
            >
              生成绑定链接
            </Button>

            <Button
              variant="secondary"
              onClick={handleOpenTelegram}
              disabled={!bindUrl}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              打开 Telegram
            </Button>
          </div>

          {bindUrl ? (
            <div className="mt-4 rounded-lg border border-[#27272a] bg-black/20 p-4">
              <div className="text-sm text-[#9ca3af]">绑定链接</div>
              <div className="mt-2 font-mono text-sm break-all text-white">
                {bindUrl}
              </div>
              <div className="mt-2 text-xs text-[#9ca3af]">
                {startParam ? `start 参数：${startParam}` : ""}
              </div>
            </div>
          ) : null}
        </div>

        <div className="bg-[#121212] rounded-xl border border-[#27272a] shadow-sm p-6">
          <h3 className="text-lg font-semibold text-white">使用说明（快速）</h3>
          <ol className="mt-3 space-y-2 text-sm text-[#9ca3af] list-decimal pl-5">
            <li>点击“生成绑定链接”。</li>
            <li>在 Telegram 打开链接（会给 bot 发送 /start）。</li>
            <li>回到此页点“刷新”，看到 ChatId 即绑定成功。</li>
          </ol>
        </div>
      </div>
    </TradePageShell>
  );
}
