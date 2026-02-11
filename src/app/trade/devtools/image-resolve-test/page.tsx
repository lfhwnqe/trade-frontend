"use client";

import React from "react";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import TradePageShell from "@/app/trade/components/trade-page-shell";

export default function ImageResolveTestPage() {
  const [refsText, setRefsText] = React.useState(
    "https://legacy-public.example.com/a.jpg\nimages/your-user-id/2026-02-11/demo.jpg",
  );
  const [transactionId, setTransactionId] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<unknown>(null);
  const [error, setError] = React.useState<string | null>(null);

  const runResolve = async () => {
    const refs = refsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    if (refs.length === 0) {
      setError("请至少输入一个图片引用");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetchWithAuth("/api/proxy-post", {
        method: "POST",
        credentials: "include",
        proxyParams: {
          targetPath: "trade/image/resolve",
          actualMethod: "POST",
        },
        actualBody: {
          refs,
          ...(transactionId ? { transactionId } : {}),
        },
      });

      const text = await res.text();
      let json: unknown = null;
      try {
        json = JSON.parse(text);
      } catch {
        json = text;
      }

      if (!res.ok) {
        setError(typeof json === "string" ? json : JSON.stringify(json, null, 2));
        return;
      }

      setResult(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "请求失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TradePageShell title="图片解析接口测试" subtitle="M1 - /trade/image/resolve" showAddButton={false}>
      <div className="space-y-4">
        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4 space-y-3">
          <label className="block text-sm text-[#9ca3af]">图片引用（每行一个，支持 legacy URL + private key）</label>
          <textarea
            value={refsText}
            onChange={(e) => setRefsText(e.target.value)}
            className="h-40 w-full rounded-md border border-[#27272a] bg-black px-3 py-2 text-sm text-white outline-none focus:border-[#00c2b2]"
          />

          <label className="block text-sm text-[#9ca3af]">transactionId（可选）</label>
          <input
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            className="w-full rounded-md border border-[#27272a] bg-black px-3 py-2 text-sm text-white outline-none focus:border-[#00c2b2]"
            placeholder="可留空"
          />

          <button
            type="button"
            onClick={runResolve}
            disabled={loading}
            className="rounded-md bg-[#00c2b2] px-4 py-2 text-sm font-semibold text-black hover:bg-[#00a79a] disabled:opacity-60"
          >
            {loading ? "请求中..." : "调用 /trade/image/resolve"}
          </button>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200 whitespace-pre-wrap">{error}</div>
        ) : null}

        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4">
          <div className="mb-2 text-sm text-[#9ca3af]">响应结果</div>
          <pre className="max-h-[420px] overflow-auto rounded-md bg-black p-3 text-xs text-[#e5e7eb]">
            {result ? JSON.stringify(result, null, 2) : "(暂无)"}
          </pre>
        </div>
      </div>
    </TradePageShell>
  );
}
