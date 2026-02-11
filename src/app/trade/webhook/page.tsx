"use client";

import React from "react";
import Link from "next/link";
import TradePageShell from "../components/trade-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAlert } from "@/components/common/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { useAtomImmer } from "@/hooks/useAtomImmer";
import { userAtom } from "@/store/user";
import { Copy, Info, RefreshCcw, Webhook } from "lucide-react";

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

  // trade-scoped
  tradeTransactionId?: string;
  tradeShortId?: string;
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

type TradeSummary = {
  transactionId: string;
  tradeShortId?: string;
  tradeSubject?: string;
  status?: string;
  createdAt?: string;
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
  const json = (await resp.json()) as {
    success: boolean;
    data: CreateHookResponse;
  };
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
  const json = (await resp.json()) as {
    success: boolean;
    data: ListHooksResponse;
  };
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
  const [user] = useAtomImmer(userAtom);
  const userRole = user.role || "FreePlan";
  const isAdmin = userRole === "Admins" || userRole === "SuperAdmins";
  const isPro = userRole === "ProPlan";
  const quotaLimit = isAdmin ? 5 : isPro ? 1 : 0;

  const [apiBaseUrl] = React.useState(() =>
    normalizeApiBaseUrl(envApiBaseUrl()),
  );

  // Telegram setWebhook part (admin/dev ops)
  const [telegramSecret, setTelegramSecret] = React.useState("");

  // hook management
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<HookItem[]>([]);
  const [nextCursor, setNextCursor] = React.useState<string | undefined>();

  const [bindCodeMap, setBindCodeMap] = React.useState<Record<string, string>>(
    {},
  );

  const chatStats = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const it of items) {
      const key = it.chatTitle
        ? String(it.chatTitle)
        : it.chatId
          ? `chat:${it.chatId}`
          : "未绑定";
      map[key] = (map[key] || 0) + 1;
    }
    const entries = Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    return entries;
  }, [items]);

  // trade cache for list rendering
  const [tradeMap, setTradeMap] = React.useState<Record<string, TradeSummary>>(
    {},
  );

  // legacy creation (dev/admin only)
  const [creating, setCreating] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [revealedHook, setRevealedHook] =
    React.useState<CreateHookResponse | null>(null);

  // (removed) legacy test trigger UI

  const fetchTradeSummary = React.useCallback(
    async (transactionId: string): Promise<TradeSummary | null> => {
      try {
        const resp = await fetchWithAuth("/api/proxy-post", {
          method: "POST",
          credentials: "include",
          proxyParams: {
            targetPath: `trade/${encodeURIComponent(transactionId)}`,
            actualMethod: "GET",
          },
          actualBody: {},
        });
        const json = (await resp.json()) as {
          success?: boolean;
          data?: unknown;
        };
        if (!resp.ok || !json?.success) return null;

        const t = (json?.data ?? null) as Record<string, unknown> | null;
        if (!t) return null;

        return {
          transactionId: String((t.transactionId as string) || transactionId),
          tradeShortId:
            typeof t.tradeShortId === "string" ? t.tradeShortId : undefined,
          tradeSubject:
            typeof t.tradeSubject === "string" ? t.tradeSubject : undefined,
          status: typeof t.status === "string" ? t.status : undefined,
          createdAt: typeof t.createdAt === "string" ? t.createdAt : undefined,
        };
      } catch {
        return null;
      }
    },
    [],
  );

  const loadFirstPage = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await listHooks(20);
      const newItems = Array.isArray(data.items) ? data.items : [];
      setItems(newItems);
      setNextCursor(data.nextCursor);

      // hydrate trade summaries for trade-scoped hooks
      const tradeIds = Array.from(
        new Set(
          newItems
            .map((it) => it.tradeTransactionId)
            .filter((v): v is string => typeof v === "string" && v.length > 0),
        ),
      ).filter((id) => !tradeMap[id]);

      if (tradeIds.length > 0) {
        const results = await Promise.all(tradeIds.map(fetchTradeSummary));
        setTradeMap((prev) => {
          const next = { ...prev };
          for (const r of results) {
            if (r?.transactionId) next[r.transactionId] = r;
          }
          return next;
        });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "获取 webhook 列表失败";
      errorAlert(msg);
    } finally {
      setLoading(false);
    }
  }, [errorAlert, fetchTradeSummary, tradeMap]);

  React.useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  // Legacy create: keep behind admin/dev only (trade-scoped webhook should be created from Trade detail)
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

  // (removed) legacy sample curl / proxy / test trigger UI

  return (
    <TradePageShell title="Webhook">
      <div className="space-y-6">
        <div className="bg-[#121212] rounded-xl border border-[#27272a] shadow-sm p-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Info className="h-5 w-5 text-[#00c2b2]" />
            <span>使用说明（TradingView → Telegram，按交易绑定）</span>
          </h3>
          <ol className="mt-3 space-y-2 text-sm text-[#9ca3af] list-decimal pl-5">
            <li>
              在「交易详情页」为某一条 Trade 创建 webhook（1 笔交易 = 1 个 webhook）。
            </li>
            <li>
              把官方 bot 拉进目标 Telegram 群。
            </li>
            <li>
              在群里发送：
              <span className="text-white font-mono">/bind &lt;bindCode&gt;</span>
              ，把该交易的 webhook 绑定到这个群。
            </li>
            <li>
              在 TradingView alert 的 webhook URL 填入系统生成的 URL（URL path 里会携带 tradeShortId）。
            </li>
            <li>
              TradingView 触发后，消息会推送到该交易绑定的 Telegram 群。
            </li>
          </ol>

          <div className="mt-4 text-xs text-[#9ca3af]">
            说明：Telegram 的{" "}
            <span className="text-white font-mono">/start</span>{" "}
            深链只能在私聊里用， 所以群绑定必须通过{" "}
            <span className="text-white font-mono">/bind</span> 命令完成。
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
                已创建的交易 Webhook
              </h3>
              <p className="text-sm text-[#9ca3af] mt-1">
                为了让你知道哪些交易已经开启了 webhook（用于配额限制）。创建/删除在「交易详情页」完成。
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                  <span className="text-white/50">配额</span>
                  <span className="font-mono text-white">
                    {quotaLimit === 0
                      ? "Free 用户需升级"
                      : `${items.length}/${quotaLimit}`}
                  </span>
                  <span className="ml-2 text-white/30">（推荐全部绑定同一个交易群）</span>
                </div>

                {chatStats.length > 0 ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                    <span className="text-white/50">群分布</span>
                    <span className="text-white/80">
                      {chatStats
                        .map(([name, count]) => `${name}(${count})`)
                        .join(" · ")}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
            <Button variant="secondary" onClick={loadFirstPage} disabled={loading}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              刷新
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full bg-white/5" />
                <Skeleton className="h-10 w-full bg-white/5" />
                <Skeleton className="h-10 w-full bg-white/5" />
              </div>
            ) : null}

            {!loading && items.length === 0 ? (
              <div className="text-sm text-[#9ca3af]">暂无 webhook。去某条交易详情页创建。</div>
            ) : null}

            {!loading && items.length > 0 ? (
              <div className="space-y-3">
                {items.map((it) => {
                  const tradeId = it.tradeTransactionId;
                  const trade = tradeId ? tradeMap[tradeId] : undefined;
                  const title = trade?.tradeSubject
                    ? `${trade.tradeSubject}${trade.status ? ` · ${trade.status}` : ""}`
                    : tradeId
                      ? `Trade ${tradeId.slice(0, 8)}...`
                      : it.name || it.hookId;

                  return (
                    <div
                      key={it.hookId}
                      className="rounded-lg border border-[#27272a] bg-black/20 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="text-white font-semibold truncate">
                            {title}
                          </div>
                          <div className="mt-1 text-xs text-[#9ca3af]">
                            绑定群：{it.chatTitle ? `「${it.chatTitle}」` : "未绑定"}
                            {it.boundAt ? ` · 绑定时间：${formatTime(it.boundAt)}` : ""}
                          </div>
                          <div className="mt-2 text-xs text-[#9ca3af]">
                            webhook URL：
                            <span className="ml-2 font-mono text-white break-all">
                              {it.triggerUrl || "-"}
                            </span>
                          </div>

                          {bindCodeMap[it.hookId] ? (
                            <div className="mt-2 text-xs text-[#9ca3af]">
                              bindCode：
                              <span className="ml-2 font-mono text-[#00c2b2] break-all">
                                {bindCodeMap[it.hookId]}
                              </span>
                              <span className="ml-2 text-white/60 font-mono">/bind {bindCodeMap[it.hookId]}</span>
                            </div>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => it.triggerUrl && handleCopy(it.triggerUrl, "已复制 webhook URL")}
                            disabled={!it.triggerUrl}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            复制 URL
                          </Button>

                          {tradeId ? (
                            <Link
                              href={`/trade/detail?id=${encodeURIComponent(tradeId)}`}
                              className="inline-flex h-10 items-center justify-center rounded-md bg-white/5 px-4 text-sm text-white hover:bg-white/10 border border-white/10"
                            >
                              打开交易
                            </Link>
                          ) : null}

                          <Button
                            variant="secondary"
                            onClick={async () => {
                              try {
                                const resp = await fetchWithAuth("/api/proxy-post", {
                                  method: "POST",
                                  credentials: "include",
                                  proxyParams: {
                                    targetPath: `user/webhooks/${encodeURIComponent(it.hookId)}/bind-code`,
                                    actualMethod: "POST",
                                  },
                                  actualBody: {},
                                });
                                const json = (await resp.json()) as {
                                  success?: boolean;
                                  message?: string;
                                  data?: { bindCode?: string };
                                };
                                if (!resp.ok || !json?.success) {
                                  throw new Error(json?.message || "生成 bindCode 失败");
                                }
                                const bindCode = String(json?.data?.bindCode || "");
                                setBindCodeMap((prev) => ({ ...prev, [it.hookId]: bindCode }));
                                successAlert("已生成 bindCode");
                              } catch (e) {
                                const msg = e instanceof Error ? e.message : "生成 bindCode 失败";
                                errorAlert(msg);
                              }
                            }}
                          >
                            生成 bindCode
                          </Button>

                          <Button
                            variant="destructive"
                            onClick={() => handleRevoke(it.hookId)}
                          >
                            删除
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {nextCursor ? (
                  <div className="pt-2">
                    <Button variant="secondary" onClick={handleLoadMore}>
                      加载更多
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {isAdmin ? (
            <details className="mt-6">
              <summary className="cursor-pointer text-sm text-[#9ca3af] hover:text-white">
                管理员 / 开发者工具（Legacy 用户级 hooks）
              </summary>
              <div className="mt-3 rounded-lg border border-[#27272a] bg-black/20 p-4">
                <div className="text-sm text-[#9ca3af] mb-3">
                  历史遗留接口：直接创建用户级 hook（不推荐）。新的 trade-scoped webhook 请在交易详情页创建。
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
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
                    <div className="font-mono text-sm break-all text-white">
                      {revealedHook.triggerUrl}
                    </div>
                  </div>
                ) : null}
              </div>
            </details>
          ) : null}
        </div>

        {isAdmin ? (
          <div className="bg-[#121212] rounded-xl border border-[#27272a] shadow-sm p-6">
            <h3 className="text-lg font-semibold text-white">
              Telegram setWebhook（管理员/开发）
            </h3>
            <p className="mt-2 text-sm text-[#9ca3af]">
              用于绑定 bot webhook（系统级一次性配置）。
            </p>

            <div className="mt-4">
              <div className="text-sm text-[#9ca3af] mb-2">
                TELEGRAM_WEBHOOK_SECRET
              </div>
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
        ) : null}
      </div>
    </TradePageShell>
  );
}
