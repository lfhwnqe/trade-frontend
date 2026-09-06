"use client";

import React from "react";
import Link from "next/link";
import TradePageShell from "../../../components/trade-page-shell";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Notification = {
  taskId: string;
  hookId: string;
  receivedAt: string;
  readAt?: string;
  status: "read" | "unread";
  payload: Record<string, unknown>;
};
type Filters = { days: string; status: string; hookId: string };
const initialFilters: Filters = { days: "7", status: "all", hookId: "" };

export default function NotificationsPage() {
  const [draft, setDraft] = React.useState(initialFilters);
  const [filters, setFilters] = React.useState(initialFilters);
  const [items, setItems] = React.useState<Notification[]>([]);
  const [cursors, setCursors] = React.useState<(string | null)[]>([null]);
  const [page, setPage] = React.useState(0);
  const [next, setNext] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [selected, setSelected] = React.useState<Notification | null>(null);
  const sequence = React.useRef(0);
  const load = React.useCallback(
    async (active: Filters, cursor: string | null, pageIndex: number) => {
      const current = ++sequence.current;
      setBusy(true);
      setError("");
      setSelected(null);
      try {
        const query = new URLSearchParams({ ...active, limit: "20" });
        if (cursor) query.set("cursor", cursor);
        const response = await fetchWithAuth("/api/proxy-post", {
          method: "POST",
          credentials: "include",
          proxyParams: {
            targetPath: "bridge/notifications?" + query,
            actualMethod: "GET",
          },
          actualBody: {},
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || data.message || "查询失败");
        if (current !== sequence.current) return;
        setItems(data.items);
        setNext(data.nextCursor);
        setPage(pageIndex);
      } catch (e) {
        if (current === sequence.current)
          setError(e instanceof Error ? e.message : "查询失败");
      } finally {
        if (current === sequence.current) setBusy(false);
      }
    },
    [],
  );
  React.useEffect(() => {
    void load(initialFilters, null, 0);
    return () => {
      ++sequence.current;
    };
  }, [load]);
  function search(e: React.FormEvent) {
    e.preventDefault();
    const active = { ...draft, hookId: draft.hookId.trim() };
    setFilters(active);
    setCursors([null]);
    setPage(0);
    setNext(null);
    setItems([]);
    void load(active, null, 0);
  }
  function nextPage() {
    if (!next) return;
    setCursors((old) => [...old.slice(0, page + 1), next]);
    void load(filters, next, page + 1);
  }
  const time = (value?: string) =>
    value ? new Date(value).toLocaleString() : "—";
  const summary = (item: Notification) =>
    typeof item.payload.message === "string"
      ? item.payload.message
      : JSON.stringify(item.payload);
  return (
    <TradePageShell title="Bridge 通知记录" showAddButton={false}>
      <div className="space-y-5">
        <div className="flex flex-wrap justify-between gap-3">
          <p className="text-sm text-[#9ca3af]">
            按接收时间倒序展示。查看记录不会将通知标记为已读。
          </p>
          <Link
            className="text-sm text-[#00c2b2] underline"
            href="/trade/devtools/bridge"
          >
            管理 Webhook
          </Link>
        </div>
        <form
          onSubmit={search}
          className="flex flex-wrap gap-3 rounded-xl border border-[#27272a] bg-[#121212] p-4"
        >
          <label className="text-sm text-white">
            时间范围
            <select
              className="ml-2 rounded bg-black p-2"
              value={draft.days}
              onChange={(e) =>
                setDraft((old) => ({ ...old, days: e.target.value }))
              }
            >
              <option value="7">近 7 天</option>
              <option value="30">近 30 天</option>
              <option value="90">近 90 天</option>
              <option value="all">全部时间</option>
            </select>
          </label>
          <label className="text-sm text-white">
            状态
            <select
              className="ml-2 rounded bg-black p-2"
              value={draft.status}
              onChange={(e) =>
                setDraft((old) => ({ ...old, status: e.target.value }))
              }
            >
              <option value="all">全部</option>
              <option value="unread">未读</option>
              <option value="read">已读</option>
            </select>
          </label>
          <Input
            aria-label="来源 Hook ID"
            placeholder="来源 Hook ID（可选）"
            value={draft.hookId}
            onChange={(e) =>
              setDraft((old) => ({ ...old, hookId: e.target.value }))
            }
            className="max-w-sm"
          />
          <Button disabled={busy}>查询 / 刷新</Button>
        </form>
        {error && (
          <p role="alert" className="text-red-300">
            {error}
          </p>
        )}
        <section className="rounded-xl border border-[#27272a] bg-[#121212] overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[#9ca3af]">
              <tr>
                <th className="p-4">接收时间</th>
                <th className="p-4">通知内容</th>
                <th className="p-4">状态</th>
                <th className="p-4">已读时间</th>
                <th className="p-4">详情</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.taskId}
                  className="border-t border-[#27272a] text-white"
                >
                  <td className="p-4 whitespace-nowrap">
                    {time(item.receivedAt)}
                  </td>
                  <td className="p-4 max-w-md break-words">
                    {summary(item).slice(0, 180)}
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    {item.status === "read" ? "已读" : "未读"}
                  </td>
                  <td className="p-4 whitespace-nowrap">{time(item.readAt)}</td>
                  <td className="p-4">
                    <Button
                      variant="secondary"
                      onClick={() => setSelected(item)}
                    >
                      查看
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!busy && !items.length && (
            <p className="p-6 text-[#9ca3af]">
              {next ? "本页没有匹配通知，可继续下一页。" : "暂无匹配通知。"}
            </p>
          )}
          {busy && <p className="p-4 text-[#9ca3af]">查询中…</p>}
        </section>
        <div className="flex items-center gap-4 text-sm text-[#9ca3af]">
          <Button
            variant="secondary"
            disabled={busy || page === 0}
            onClick={() => load(filters, cursors[page - 1], page - 1)}
          >
            上一页
          </Button>
          <span>第 {page + 1} 页 · 每页最多 20 条</span>
          <Button
            variant="secondary"
            disabled={busy || !next}
            onClick={nextPage}
          >
            下一页
          </Button>
        </div>
        {selected && (
          <section className="rounded-xl border border-[#27272a] bg-[#121212] p-5 space-y-3 text-sm text-white">
            <div className="flex justify-between">
              <h2>通知详情</h2>
              <Button variant="secondary" onClick={() => setSelected(null)}>
                关闭
              </Button>
            </div>
            <p className="break-all">任务 ID：{selected.taskId}</p>
            <p className="break-all">来源 Hook ID：{selected.hookId}</p>
            <p>
              接收：{time(selected.receivedAt)} · 已读：{time(selected.readAt)}
            </p>
            <pre className="whitespace-pre-wrap break-all rounded bg-black p-4">
              {JSON.stringify(selected.payload, null, 2)}
            </pre>
          </section>
        )}
      </div>
    </TradePageShell>
  );
}
