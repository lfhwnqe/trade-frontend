"use client";

import React from "react";
import TradePageShell from "../components/trade-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAlert } from "@/components/common/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { Copy, Info, Link as LinkIcon, RefreshCcw, Webhook } from "lucide-react";

function envApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "";
}

function normalizeApiBaseUrl(url: string) {
  if (!url) return "";
  return url.endsWith("/") ? url : url + "/";
}

type HookItem = {
  hookId: string;
  userId: string;
  name?: string;
  createdAt: string;
  revokedAt?: string;
  url: string; // legacy
  triggerUrl?: string; // TradingView-friendly
  chatId?: number;
  chatTitle?: string;
  boundAt?: string;
};

type CreateHookResponse = {
  hook: {
    hookId: string;
    userId: string;
    name?: string;
    createdAt: string;
    revokedAt?: string;
    chatId?: number;
    chatTitle?: string;
    boundAt?: string;
    triggerToken?: string;
  };
  secret: string;
  url: string; // legacy
  bindCode: string;
  triggerUrl: string;
};

type ListHooksResponse = {
  items: HookItem[];
  nextCursor?: string;
};

async function createHook(name?: string) {
  const resp = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: "user/webhooks",
      actualMethod: "POST",
    },
    actualBody: {
      ...(name ? { name } : {}),
    },
  });
  if (!resp.ok) throw new Error(await resp.text());
  const json = (await resp.json()) as { success: boolean; data: CreateHookResponse };
  return json.data;
}

async function listHooks(limit = 20, cursor?: string) {
  const query = new URLSearchParams();
  query.set("limit", String(limit));
  if (cursor) query.set("cursor", cursor);

  const resp = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: `user/webhooks?${query.toString()}`,
      actualMethod: "GET",
    },
    actualBody: {},
  });
  if (!resp.ok) throw new Error(await resp.text());
  const json = (await resp.json()) as { success: boolean; data: ListHooksResponse };
  return json.data;
}

async function revokeHook(hookId: string) {
  const resp = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: `user/webhooks/${hookId}`,
      actualMethod: "DELETE",
    },
    actualBody: {},
  });
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json();
}

function formatTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

export default function TradeWebhookPage() {
  const [errorAlert, successAlert] = useAlert();

  const [apiBaseUrl] = React.useState(() => normalizeApiBaseUrl(envApiBaseUrl()));

  // Telegram setWebhook part (admin/dev ops)
  const [telegramSecret, setTelegramSecret] = React.useState("");

  // hook management
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<HookItem[]>([]);
  const [nextCursor, setNextCursor] = React.useState<string | undefined>();

  const [creating, setCreating] = React.useState(false);
  const [newName, setNewName] = React.useState("");

  const [revealedHook, setRevealedHook] = React.useState<CreateHookResponse | null>(null);

  const loadFirstPage = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await listHooks(20);
      setItems(Array.isArray(data.items) ? data.items : []);
      setNextCursor(data.nextCursor);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "获取 webhook 列表失败";
      errorAlert(msg);
    } finally {
      setLoading(false);
    }
  }, [errorAlert]);

  React.useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    setRevealedHook(null);
    try {
      const res = await createHook(newName.trim() || undefined);
      setRevealedHook(res);
      successAlert("创建成功：secret 仅展示一次，请立即复制保存");
      setNewName("");
      await loadFirstPage();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "创建失败";
      errorAlert(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleLoadMore = async () => {
    if (!nextCursor) return;
    try {
      const data = await listHooks(20, nextCursor);
      setItems((prev) => [...prev, ...(data.items || [])]);
      setNextCursor(data.nextCursor);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "加载更多失败";
      errorAlert(msg);
    }
  };

  const handleCopy = async (text: string, okMsg = "已复制到剪贴板") => {
    try {
      await navigator.clipboard.writeText(text);
      successAlert(okMsg);
    } catch {
      errorAlert("复制失败，请手动复制");
    }
  };

  const handleRevoke = async (hookId: string) => {
    const ok = confirm("确认撤销该 webhook？撤销后外部触发将失效。");
    if (!ok) return;
    try {
      await revokeHook(hookId);
      successAlert("撤销成功");
      await loadFirstPage();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "撤销失败";
      errorAlert(msg);
    }
  };

  const telegramWebhookUrl = apiBaseUrl ? `${apiBaseUrl}webhook/telegram` : "";
  const setWebhookCurl = telegramWebhookUrl
    ? `curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "url": "${telegramWebhookUrl}",\n    "secret_token": "${telegramSecret || "<TELEGRAM_WEBHOOK_SECRET>"}"\n  }'`
    : "";

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const sampleCurl = revealedHook
    ? `curl -X POST "${revealedHook.triggerUrl}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"message":"hello from webhook"}'`
    : "";

  const token = revealedHook ? revealedHook.triggerUrl.split("/").pop() || "" : "";

  const buildProxyUrl = (t: string) => `${origin}/api/webhook?token=${encodeURIComponent(t)}`;

  const sampleProxyCurl = revealedHook
    ? `curl -X POST "${buildProxyUrl(token)}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"message":"hello from webhook"}'`
    : "";

  const bindCommand = revealedHook ? `/bind ${revealedHook.bindCode}` : "";

  return (
    <TradePageShell title="Webhook">
      <div className="space-y-6">
        <div className="bg-[#121212] rounded-xl border border-[#27272a] shadow-sm p-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Info className="h-5 w-5 text-[#00c2b2]" />
            闭环说明（Webhook → Telegram 群）
          </h3>
          <ol className="mt-3 space-y-2 text-sm text-[#9ca3af] list-decimal pl-5">
            <li>
              在本页创建一个 Hook（得到 URL + secret + /bind 命令，secret 仅展示一次）。
            </li>
            <li>
              把系统通知机器人（clawbot）拉进目标 Telegram 群（需要管理员把 bot 加进群）。
            </li>
            <li>
              在群里发送上面生成的：<span className="text-white font-mono">/bind &lt;bindCode&gt;</span>
              ，即可把“这个 hook”绑定到“这个群”。
            </li>
            <li>
              外部系统触发 webhook：对 Hook URL 发 POST（无需 header），body 里带 message。
            </li>
            <li>
              群里会收到消息；你放在群里的 clawbot 看到消息后就可以执行后续自动任务。
            </li>
          </ol>

          <div className="mt-4 text-xs text-[#9ca3af]">
            说明：Telegram 的 <span className="text-white font-mono">/start</span> 深链只能在私聊里用，
            所以群绑定必须通过 <span className="text-white font-mono">/bind</span> 命令完成。
          </div>

          <div className="mt-4 text-xs text-[#9ca3af]">
            本页面不会让终端用户配置 API Base URL；服务端会按部署环境自动路由。
          </div>
        </div>

        <div className="bg-[#121212] rounded-xl border border-[#27272a] shadow-sm p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Webhook className="h-5 w-5 text-[#00c2b2]" />
                创建 Hook
              </h3>
              <p className="text-sm text-[#9ca3af] mt-1">
                创建后会返回一次触发 URL（TradingView 可直接用，触发时无需 header）。
              </p>
            </div>
            <Button variant="secondary" onClick={loadFirstPage} disabled={loading}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              刷新
            </Button>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="名称（可选，例如 group-A / claw / server）"
              className="bg-[#1e1e1e] border border-[#27272a] text-[#e5e7eb]"
            />
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="bg-[#00c2b2] text-black hover:bg-[#00c2b2]/90"
            >
              {creating ? "创建中..." : "创建"}
            </Button>
          </div>

          {revealedHook ? (
            <div className="mt-4 rounded-lg border border-[#27272a] bg-black/20 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-[#9ca3af]">触发 URL（TradingView 用，无需 header）</div>
                <Button
                  variant="secondary"
                  onClick={() => handleCopy(revealedHook.triggerUrl, "已复制 URL")}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  复制 URL
                </Button>
              </div>
              <div className="font-mono text-sm break-all text-white">
                {revealedHook.triggerUrl}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-[#9ca3af]">当前域名代理 URL（可选，不暴露 API Base URL）</div>
                <Button
                  variant="secondary"
                  onClick={() => handleCopy(buildProxyUrl(token), "已复制 URL")}
                  disabled={!origin || !token}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  复制 URL
                </Button>
              </div>
              <div className="font-mono text-sm break-all text-white">
                {origin && token ? buildProxyUrl(token) : ""}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-[#9ca3af]">群绑定命令（在目标群里发送）</div>
                <Button
                  variant="secondary"
                  onClick={() => handleCopy(bindCommand, "已复制 /bind 命令")}
                  disabled={!bindCommand}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  复制命令
                </Button>
              </div>
              <pre className="overflow-x-auto rounded-lg border border-[#27272a] bg-black/30 p-4 text-xs text-white whitespace-pre">
                {bindCommand}
              </pre>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-[#9ca3af]">curl 示例（直接打后端 triggerUrl）</div>
                <Button
                  variant="secondary"
                  onClick={() => handleCopy(sampleCurl, "已复制 curl")}
                  disabled={!sampleCurl}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  复制命令
                </Button>
              </div>
              <pre className="overflow-x-auto rounded-lg border border-[#27272a] bg-black/30 p-4 text-xs text-white whitespace-pre">
                {sampleCurl}
              </pre>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-[#9ca3af]">curl 示例（走当前域名代理 /api/webhook）</div>
                <Button
                  variant="secondary"
                  onClick={() => handleCopy(sampleProxyCurl, "已复制 curl")}
                  disabled={!sampleProxyCurl}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  复制命令
                </Button>
              </div>
              <pre className="overflow-x-auto rounded-lg border border-[#27272a] bg-black/30 p-4 text-xs text-white whitespace-pre">
                {sampleProxyCurl}
              </pre>
            </div>
          ) : null}
        </div>

        <div className="bg-[#121212] rounded-xl border border-[#27272a] shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-[#27272a] flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">我的 Hooks</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-black/20 text-[#9ca3af] font-medium border-b border-[#27272a]">
                <tr>
                  <th className="px-6 py-3 whitespace-nowrap uppercase text-xs tracking-wider">
                    名称
                  </th>
                  <th className="px-6 py-3 whitespace-nowrap uppercase text-xs tracking-wider">
                    URL
                  </th>
                  <th className="px-6 py-3 whitespace-nowrap uppercase text-xs tracking-wider">
                    创建时间
                  </th>
                  <th className="px-6 py-3 whitespace-nowrap uppercase text-xs tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 whitespace-nowrap text-right uppercase text-xs tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {loading ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <tr key={`hook-skel-${idx}`}>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-24 bg-white/10" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-64 bg-white/10" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-32 bg-white/10" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-14 bg-white/10" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Skeleton className="ml-auto h-4 w-16 bg-white/10" />
                      </td>
                    </tr>
                  ))
                ) : items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-6 text-center text-[#9ca3af]"
                    >
                      暂无 hook
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const revoked = Boolean(item.revokedAt);
                    return (
                      <tr key={item.hookId} className="hover:bg-[#1e1e1e]">
                        <td className="px-6 py-4 text-white font-medium">
                          {item.name || "-"}
                        </td>
                        <td className="px-6 py-4 text-[#9ca3af]">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs break-all">
                              {origin && item.triggerUrl
                                ? buildProxyUrl(item.triggerUrl.split("/").pop() || "")
                                : item.url}
                            </span>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                handleCopy(
                                  origin && item.triggerUrl
                                    ? buildProxyUrl(
                                        item.triggerUrl.split("/").pop() || "",
                                      )
                                    : item.url,
                                  "已复制 URL",
                                )
                              }
                            >
                              <LinkIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[#9ca3af]">
                          {formatTime(item.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              revoked
                                ? "bg-red-500/10 text-red-300 border-red-500/20"
                                : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                            }`}
                          >
                            {revoked ? "已撤销" : "有效"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant="destructive"
                            disabled={revoked}
                            onClick={() => handleRevoke(item.hookId)}
                          >
                            撤销
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-[#27272a] flex items-center justify-between">
            <div className="text-xs text-[#9ca3af]">
              {nextCursor ? "还有更多" : "已到底"}
            </div>
            <Button
              variant="secondary"
              onClick={handleLoadMore}
              disabled={!nextCursor || loading}
            >
              加载更多
            </Button>
          </div>
        </div>

        <div className="bg-[#121212] rounded-xl border border-[#27272a] shadow-sm p-6">
          <h3 className="text-lg font-semibold text-white">Telegram setWebhook（管理员/开发）</h3>
          <p className="mt-2 text-sm text-[#9ca3af]">
            用于绑定 bot webhook。对最终用户一般不暴露 token。
          </p>

          <div className="mt-4">
            <div className="text-sm text-[#9ca3af] mb-2">TELEGRAM_WEBHOOK_SECRET</div>
            <Input
              value={telegramSecret}
              onChange={(e) => setTelegramSecret(e.target.value)}
              placeholder="用于 Telegram setWebhook secret_token"
              className="bg-[#1e1e1e] border border-[#27272a] text-[#e5e7eb]"
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="text-sm text-[#9ca3af]">setWebhook 命令</div>
            <Button
              variant="secondary"
              onClick={() => handleCopy(setWebhookCurl, "已复制命令")}
              disabled={!setWebhookCurl}
            >
              <Copy className="h-4 w-4 mr-2" />
              复制命令
            </Button>
          </div>

          <pre className="mt-3 overflow-x-auto rounded-lg border border-[#27272a] bg-black/30 p-4 text-xs text-white whitespace-pre">
            {setWebhookCurl || "请先填写 API Base URL"}
          </pre>
        </div>
      </div>
    </TradePageShell>
  );
}
