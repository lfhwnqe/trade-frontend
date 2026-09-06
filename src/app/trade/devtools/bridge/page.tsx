"use client";

import React from "react";
import Link from "next/link";
import TradePageShell from "../../components/trade-page-shell";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Hook = {
  hookId: string;
  name: string;
  createdAt: string;
  revokedAt?: string;
  webhookPath?: string;
};
type RevealedHook = Hook & { webhookPath: string };
const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");

async function request<T>(
  targetPath: string,
  method = "GET",
  body: Record<string, unknown> = {},
): Promise<T> {
  const response = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: { targetPath, actualMethod: method },
    actualBody: body,
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error || result.message || "请求失败，请稍后重试");
  return result as T;
}

export default function BridgePage() {
  const [items, setItems] = React.useState<Hook[]>([]);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [restoreUrls, setRestoreUrls] = React.useState<Record<string, string>>(
    {},
  );
  const [name, setName] = React.useState("");
  const [revealed, setRevealed] = React.useState<RevealedHook | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

  const load = React.useCallback(async (next?: string) => {
    setLoading(true);
    setError("");
    try {
      const result = await request<{
        items: Hook[];
        nextCursor: string | null;
      }>("bridge/hooks" + (next ? "?cursor=" + encodeURIComponent(next) : ""));
      setItems((old) =>
        next
          ? [
              ...new Map(
                [...old, ...result.items].map((item) => [item.hookId, item]),
              ).values(),
            ]
          : result.items,
      );
      setCursor(result.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);
  React.useEffect(() => {
    void load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !name.trim() || !base) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await request<RevealedHook>("bridge/hooks", "POST", {
        name: name.trim(),
      });
      setRevealed(result);
      setItems((old) => [result, ...old]);
      setName("");
      setMessage("已创建，请复制下方 URL 并保存到 TradingView。");
    } catch (e) {
      setError(e instanceof Error ? e.message : "创建失败");
    } finally {
      setBusy(false);
    }
  }
  async function change(hook: Hook, rotate: boolean) {
    if (
      busy ||
      !window.confirm(
        rotate
          ? "重新生成后，原 URL 会立即失效，需要更新 TradingView 告警。继续吗？"
          : "停用后将不再接收此 hook 的通知，已有任务仍保留。继续吗？",
      )
    )
      return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await request<RevealedHook>(
        `bridge/hooks/${hook.hookId}${rotate ? "/rotate" : ""}`,
        rotate ? "POST" : "DELETE",
      );
      setItems((old) =>
        old.map((item) => (item.hookId === hook.hookId ? result : item)),
      );
      if (rotate) setRevealed(result);
      else setRevealed((old) => (old?.hookId === hook.hookId ? null : old));
      setMessage(
        rotate
          ? "新 URL 已生成，请更新 TradingView。"
          : "已停用，历史任务保留。",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败");
    } finally {
      setBusy(false);
    }
  }
  async function restore(hook: Hook) {
    setBusy(true);
    setError("");
    try {
      const result = await request<Hook>(
        `bridge/hooks/${hook.hookId}/restore-url`,
        "POST",
        { url: restoreUrls[hook.hookId] || "" },
      );
      setItems((old) =>
        old.map((item) => (item.hookId === hook.hookId ? result : item)),
      );
      setRestoreUrls((old) => ({ ...old, [hook.hookId]: "" }));
      setMessage("已有 URL 已保存，地址保持不变。");
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }
  const url = revealed ? base + revealed.webhookPath : "";
  async function copy(value: string = url) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage("Hook URL 已复制。");
    } catch {
      setError("复制失败，请手动选择下方 URL 复制。");
    }
  }

  return (
    <TradePageShell title="Webhook Bridge" showAddButton={false}>
      <div className="space-y-6">
        <section className="rounded-xl border border-[#27272a] bg-[#121212] p-6 space-y-3">
          <h2 className="text-lg font-semibold text-white">通知收件箱入口</h2>
          <p className="text-sm text-[#9ca3af]">
            创建独立 webhook，将 URL 填入 TradingView
            告警。通知入库后，外部程序通过 API Token 查询未读任务并标记已读。
          </p>
          <p className="text-sm text-[#9ca3af]">
            仅 Admin / SuperAdmin 可用。无需选择交易记录或绑定 Telegram。
          </p>
          <Link
            className="text-[#00c2b2] text-sm underline"
            href="/trade/devtools/tokens"
          >
            管理 API Token
          </Link>
          {!base && (
            <p role="alert" className="text-red-300">
              未配置 API 地址，暂时无法生成完整 Hook URL。
            </p>
          )}
          <Link
            className="inline-block ml-4 text-[#00c2b2] text-sm underline"
            href="/trade/devtools/bridge/notifications"
          >
            查询近期通知
          </Link>
          <form onSubmit={create} className="flex flex-wrap gap-3 pt-2">
            <Input
              aria-label="Webhook 名称"
              placeholder="名称，例如 BTC 15分钟告警"
              maxLength={64}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="max-w-md"
            />
            <Button disabled={busy || !name.trim() || !base} type="submit">
              创建 Webhook
            </Button>
          </form>
          {error && (
            <p role="alert" className="text-sm text-red-300">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="text-sm text-[#00c2b2]">
              {message}
            </p>
          )}
        </section>
        {revealed && (
          <section className="rounded-xl border border-[#00c2b2]/40 bg-[#121212] p-6 space-y-3">
            <h3 className="font-semibold text-white">
              {revealed.name} · Hook URL
            </h3>
            <p className="text-sm text-[#9ca3af]">
              URL 已保存，之后可以在下方列表中查看和复制。重新生成将使原 URL
              失效。TradingView 只需要此 URL，不需要 API Token。
            </p>
            <textarea
              aria-label="Hook URL"
              className="w-full rounded bg-black p-3 text-sm text-white break-all"
              rows={3}
              readOnly
              value={url}
            />
            <div className="flex gap-3">
              <Button onClick={() => copy()}>复制 URL</Button>
              <Button variant="secondary" onClick={() => setRevealed(null)}>
                已保存，隐藏
              </Button>
            </div>
          </section>
        )}
        <section className="rounded-xl border border-[#27272a] bg-[#121212] p-6 space-y-4">
          <div className="flex justify-between">
            <h3 className="font-semibold text-white">我的 Webhooks</h3>
            <Button
              variant="secondary"
              disabled={loading || busy}
              onClick={() => load()}
            >
              刷新
            </Button>
          </div>
          {loading && <p className="text-sm text-[#9ca3af]">加载中…</p>}
          {!loading && !items.length && (
            <p className="text-sm text-[#9ca3af]">尚未创建 Bridge webhook。</p>
          )}
          {items.map((hook) => (
            <article
              key={hook.hookId}
              className="rounded border border-[#27272a] p-4 flex flex-wrap justify-between gap-4"
            >
              <div>
                <p className="text-white">
                  {hook.name}{" "}
                  <span className="text-sm text-[#9ca3af]">
                    · {hook.revokedAt ? "已停用" : "启用中"}
                  </span>
                </p>
                <p className="text-xs text-[#9ca3af] mt-1">
                  创建于 {new Date(hook.createdAt).toLocaleString()}
                  <span className="block break-all mt-1">
                    Hook ID：{hook.hookId}
                  </span>
                </p>
              </div>
              {hook.webhookPath ? (
                <div className="w-full space-y-2 order-last">
                  <input
                    aria-label={`${hook.name} Hook URL`}
                    readOnly
                    value={base + hook.webhookPath}
                    className="w-full rounded bg-black p-3 text-xs text-white"
                  />
                  <Button
                    variant="secondary"
                    disabled={!base}
                    onClick={() => copy(base + hook.webhookPath!)}
                  >
                    复制 URL
                  </Button>
                </div>
              ) : !hook.revokedAt ? (
                <div className="w-full space-y-2 order-last">
                  <p className="text-sm text-[#9ca3af]">
                    此旧 hook 尚未保存 URL。粘贴原 URL
                    即可补存，不改变地址；下一次有效通知也会自动补存。
                  </p>
                  <Input
                    aria-label={`${hook.name} 原 URL`}
                    value={restoreUrls[hook.hookId] || ""}
                    onChange={(e) =>
                      setRestoreUrls((old) => ({
                        ...old,
                        [hook.hookId]: e.target.value,
                      }))
                    }
                    placeholder="粘贴原有 Hook URL"
                  />
                  <Button
                    variant="secondary"
                    disabled={busy || !restoreUrls[hook.hookId]?.trim()}
                    onClick={() => restore(hook)}
                  >
                    保存已有 URL
                  </Button>
                </div>
              ) : null}
              {!hook.revokedAt && (
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    disabled={busy || !base}
                    onClick={() => change(hook, true)}
                  >
                    重新生成 URL
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => change(hook, false)}
                  >
                    停用
                  </Button>
                </div>
              )}
            </article>
          ))}
          {cursor && (
            <Button
              disabled={loading || busy}
              variant="secondary"
              onClick={() => load(cursor)}
            >
              加载更多
            </Button>
          )}
        </section>
        <section className="rounded-xl border border-[#27272a] bg-[#121212] p-6 text-sm text-[#9ca3af] space-y-3">
          <h3 className="text-white font-semibold">接入方法</h3>
          <p>
            1. 在 TradingView 告警中填入 Hook URL；消息可以是纯文本，也可以是
            JSON。
          </p>
          <p>
            2. 将 Hook URL 与同一账户的 API Token
            提供给消费程序，即可验证投递、未读查询和已读确认。
          </p>
          <p>
            3. 消费程序调用 GET /bridge/tasks 查询未读，处理后调用 POST
            /bridge/tasks/:taskId/read 标记已读。
          </p>
          <p>
            如需去重，JSON 中传入每次告警唯一、重试时不变的
            event_id；不传则每次请求创建新任务。
          </p>
        </section>
      </div>
    </TradePageShell>
  );
}
