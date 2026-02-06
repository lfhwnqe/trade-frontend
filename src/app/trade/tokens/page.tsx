"use client";

import React from "react";
import TradePageShell from "../components/trade-page-shell";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, KeyRound, Copy } from "lucide-react";
import { useAlert } from "@/components/common/alert";

type TokenItem = {
  tokenId: string;
  userId: string;
  name?: string;
  scopes: string[];
  createdAt: string;
  revokedAt?: string;
  lastUsedAt?: string;
};

type ListResponse = {
  items: TokenItem[];
  nextCursor?: string;
};

async function createToken(name?: string) {
  const resp = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: "user/tokens",
      actualMethod: "POST",
    },
    actualBody: {
      ...(name ? { name } : {}),
    },
  });
  if (!resp.ok) throw new Error(await resp.text());
  return (await resp.json()) as {
    success: boolean;
    data: { token: string; tokenInfo: TokenItem };
  };
}

async function listTokens(limit = 20, cursor?: string) {
  const query = new URLSearchParams();
  query.set("limit", String(limit));
  if (cursor) query.set("cursor", cursor);

  const resp = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: `user/tokens?${query.toString()}`,
      actualMethod: "GET",
    },
    actualBody: {},
  });
  if (!resp.ok) throw new Error(await resp.text());
  const json = (await resp.json()) as { success: boolean; data: ListResponse };
  return json.data;
}

async function revokeToken(tokenId: string) {
  const resp = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: `user/tokens/${tokenId}`,
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

export default function TradeTokensPage() {
  const [errorAlert, successAlert] = useAlert();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [items, setItems] = React.useState<TokenItem[]>([]);
  const [nextCursor, setNextCursor] = React.useState<string | undefined>();

  const [creating, setCreating] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [revealedToken, setRevealedToken] = React.useState<string | null>(null);

  const loadFirstPage = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listTokens(20);
      setItems(Array.isArray(data.items) ? data.items : []);
      setNextCursor(data.nextCursor);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "获取 token 列表失败";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  const handleLoadMore = async () => {
    if (!nextCursor) return;
    try {
      const data = await listTokens(20, nextCursor);
      setItems((prev) => [...prev, ...(data.items || [])]);
      setNextCursor(data.nextCursor);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "加载更多失败";
      errorAlert(message);
    }
  };

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    setRevealedToken(null);
    try {
      const res = await createToken(newName.trim() || undefined);
      setRevealedToken(res.data.token);
      successAlert("创建成功：token 仅展示一次，请立即复制保存");
      setNewName("");
      await loadFirstPage();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "创建失败";
      errorAlert(message);
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!revealedToken) return;
    try {
      await navigator.clipboard.writeText(revealedToken);
      successAlert("已复制到剪贴板");
    } catch {
      errorAlert("复制失败，请手动复制");
    }
  };

  const handleRevoke = async (tokenId: string) => {
    const ok = confirm("确认撤销该 token？撤销后 claw/脚本将无法继续使用。 ");
    if (!ok) return;
    try {
      await revokeToken(tokenId);
      successAlert("撤销成功");
      await loadFirstPage();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "撤销失败";
      errorAlert(message);
    }
  };

  return (
    <TradePageShell title="API Token">
      <div className="space-y-6">
        {error ? (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="bg-[#121212] rounded-xl border border-[#27272a] shadow-sm p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-[#00c2b2]" />
                创建 Token
              </h3>
              <p className="text-sm text-[#9ca3af] mt-1">
                用于 claw/脚本访问你的交易数据（可读写，不可删除）。
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="名称（可选，例如 claw / laptop）"
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

          {revealedToken ? (
            <div className="mt-4 rounded-lg border border-[#27272a] bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-[#9ca3af]">
                  Token（仅展示一次）
                </div>
                <Button variant="secondary" onClick={handleCopy}>
                  <Copy className="h-4 w-4 mr-2" />
                  复制
                </Button>
              </div>
              <div className="mt-2 font-mono text-sm break-all text-white">
                {revealedToken}
              </div>
            </div>
          ) : null}
        </div>

        <div className="bg-[#121212] rounded-xl border border-[#27272a] shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-[#27272a] flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">我的 Tokens</h3>
            <Button variant="secondary" onClick={loadFirstPage}>
              刷新
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-black/20 text-[#9ca3af] font-medium border-b border-[#27272a]">
                <tr>
                  <th className="px-6 py-3 whitespace-nowrap uppercase text-xs tracking-wider">
                    名称
                  </th>
                  <th className="px-6 py-3 whitespace-nowrap uppercase text-xs tracking-wider">
                    Scopes
                  </th>
                  <th className="px-6 py-3 whitespace-nowrap uppercase text-xs tracking-wider">
                    创建时间
                  </th>
                  <th className="px-6 py-3 whitespace-nowrap uppercase text-xs tracking-wider">
                    最近使用
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
                    <tr key={`token-skel-${idx}`}>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-24 bg-white/10" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-40 bg-white/10" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-32 bg-white/10" />
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
                      colSpan={6}
                      className="px-6 py-6 text-center text-[#9ca3af]"
                    >
                      暂无 token
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const revoked = Boolean(item.revokedAt);
                    return (
                      <tr key={item.tokenId} className="hover:bg-[#1e1e1e]">
                        <td className="px-6 py-4 text-white font-medium">
                          {item.name || "-"}
                        </td>
                        <td className="px-6 py-4 text-[#9ca3af]">
                          {(item.scopes || []).join(", ")}
                        </td>
                        <td className="px-6 py-4 text-[#9ca3af]">
                          {formatTime(item.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-[#9ca3af]">
                          {formatTime(item.lastUsedAt)}
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
                            onClick={() => handleRevoke(item.tokenId)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
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
      </div>
    </TradePageShell>
  );
}
