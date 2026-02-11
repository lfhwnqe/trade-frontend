"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import TradePageShell from "@/app/trade/components/trade-page-shell";

export default function ImageResolveTestPage() {
  const router = useRouter();
  const isDevEnv = React.useMemo(() => {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
    return base.includes("/dev/") || base.includes("localhost") || base.includes("127.0.0.1");
  }, []);

  React.useEffect(() => {
    if (!isDevEnv) {
      router.replace("/trade/devtools/tokens");
    }
  }, [isDevEnv, router]);

  const [refsText, setRefsText] = React.useState(
    "https://legacy-public.example.com/a.jpg\nimages/your-user-id/2026-02-11/demo.jpg",
  );
  const [transactionId, setTransactionId] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<unknown>(null);
  const [error, setError] = React.useState<string | null>(null);

  // M2 upload-url test
  const [apiToken, setApiToken] = React.useState("");
  const [uploadTxId, setUploadTxId] = React.useState("");
  const [withTxId, setWithTxId] = React.useState(true);
  const [uploadLoading, setUploadLoading] = React.useState(false);
  const [uploadResult, setUploadResult] = React.useState<unknown>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  // M3 migrate legacy refs test
  const [migrateLimit, setMigrateLimit] = React.useState("200");
  const [migrateDryRun, setMigrateDryRun] = React.useState(true);
  const [migrateLoading, setMigrateLoading] = React.useState(false);
  const [migrateResult, setMigrateResult] = React.useState<unknown>(null);
  const [migrateError, setMigrateError] = React.useState<string | null>(null);

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

  const runUploadUrlTest = async () => {
    if (!apiToken.trim()) {
      setUploadError("请先输入 API Token（tc_...）");
      return;
    }

    setUploadLoading(true);
    setUploadError(null);
    setUploadResult(null);

    try {
      const payload: Record<string, unknown> = {
        fileName: "test.png",
        fileType: "image/png",
        date: new Date().toISOString().slice(0, 10),
        contentLength: 1024,
        source: "trade",
      };
      if (withTxId && uploadTxId.trim()) {
        payload.transactionId = uploadTxId.trim();
      }

      const res = await fetch("/api/proxy-post", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiToken.trim()}`,
        },
        body: JSON.stringify({
          request: {
            targetPath: "trade/image/upload-url",
            actualMethod: "POST",
          },
          body: payload,
        }),
      });

      const text = await res.text();
      let json: unknown = null;
      try {
        json = JSON.parse(text);
      } catch {
        json = text;
      }

      if (!res.ok) {
        setUploadError(
          typeof json === "string" ? json : JSON.stringify(json, null, 2),
        );
        return;
      }

      setUploadResult(json);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "请求失败");
    } finally {
      setUploadLoading(false);
    }
  };


  const runMigrateLegacyTest = async () => {
    setMigrateLoading(true);
    setMigrateError(null);
    setMigrateResult(null);

    try {
      const qp = new URLSearchParams();
      qp.set("limit", migrateLimit || "200");
      qp.set("dryRun", migrateDryRun ? "true" : "false");

      const res = await fetchWithAuth("/api/proxy-post", {
        method: "POST",
        credentials: "include",
        proxyParams: {
          targetPath: `trade/image/migrate-legacy?${qp.toString()}`,
          actualMethod: "POST",
        },
        actualBody: {},
      });

      const text = await res.text();
      let json: unknown = null;
      try {
        json = JSON.parse(text);
      } catch {
        json = text;
      }

      if (!res.ok) {
        setMigrateError(
          typeof json === "string" ? json : JSON.stringify(json, null, 2),
        );
        return;
      }

      setMigrateResult(json);
    } catch (e) {
      setMigrateError(e instanceof Error ? e.message : "请求失败");
    } finally {
      setMigrateLoading(false);
    }
  };
  if (!isDevEnv) {
    return null;
  }

  return (
    <TradePageShell
      title="图片接口测试"
      subtitle="M1 resolve + M2 upload-url"
      showAddButton={false}
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4 space-y-3">
          <div className="text-sm font-semibold text-white">M1：/trade/image/resolve</div>
          <label className="block text-sm text-[#9ca3af]">
            图片引用（每行一个，支持 legacy URL + private key）
          </label>
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

          {error ? (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200 whitespace-pre-wrap">
              {error}
            </div>
          ) : null}

          <pre className="max-h-[280px] overflow-auto rounded-md bg-black p-3 text-xs text-[#e5e7eb]">
            {result ? JSON.stringify(result, null, 2) : "(暂无)"}
          </pre>
        </div>

        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4 space-y-3">
          <div className="text-sm font-semibold text-white">M2：/trade/image/upload-url（API Token）</div>
          <p className="text-xs text-[#9ca3af]">
            最简单验证：输入 API Token，切换“传/不传 transactionId”，可测试必填与越权。
          </p>

          <label className="block text-sm text-[#9ca3af]">API Token（tc_...）</label>
          <input
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            className="w-full rounded-md border border-[#27272a] bg-black px-3 py-2 text-sm text-white outline-none focus:border-[#00c2b2]"
            placeholder="tc_xxx"
          />

          <div className="flex items-center gap-2 text-sm">
            <input
              id="withTxId"
              type="checkbox"
              checked={withTxId}
              onChange={(e) => setWithTxId(e.target.checked)}
            />
            <label htmlFor="withTxId" className="text-[#9ca3af]">
              请求中携带 transactionId
            </label>
          </div>

          <input
            value={uploadTxId}
            onChange={(e) => setUploadTxId(e.target.value)}
            disabled={!withTxId}
            className="w-full rounded-md border border-[#27272a] bg-black px-3 py-2 text-sm text-white outline-none focus:border-[#00c2b2] disabled:opacity-50"
            placeholder="可输入自己的 transactionId 或别人 transactionId 测试越权"
          />

          <button
            type="button"
            onClick={runUploadUrlTest}
            disabled={uploadLoading}
            className="rounded-md bg-[#00c2b2] px-4 py-2 text-sm font-semibold text-black hover:bg-[#00a79a] disabled:opacity-60"
          >
            {uploadLoading ? "请求中..." : "调用 /trade/image/upload-url"}
          </button>

          {uploadError ? (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200 whitespace-pre-wrap">
              {uploadError}
            </div>
          ) : null}

          <pre className="max-h-[280px] overflow-auto rounded-md bg-black p-3 text-xs text-[#e5e7eb]">
            {uploadResult ? JSON.stringify(uploadResult, null, 2) : "(暂无)"}
          </pre>
        </div>

        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4 space-y-3">
          <div className="text-sm font-semibold text-white">M3：历史图片引用迁移（当前用户）</div>
          <p className="text-xs text-[#9ca3af]">
            先 dryRun 预览变更量；确认后再把 dryRun 取消执行真实回写。
          </p>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              value={migrateLimit}
              onChange={(e) => setMigrateLimit(e.target.value)}
              className="w-full rounded-md border border-[#27272a] bg-black px-3 py-2 text-sm text-white outline-none focus:border-[#00c2b2]"
              placeholder="limit，默认 200"
            />
            <label className="flex items-center gap-2 text-sm text-[#9ca3af]">
              <input
                type="checkbox"
                checked={migrateDryRun}
                onChange={(e) => setMigrateDryRun(e.target.checked)}
              />
              dryRun（仅预览）
            </label>
          </div>

          <button
            type="button"
            onClick={runMigrateLegacyTest}
            disabled={migrateLoading}
            className="rounded-md bg-[#00c2b2] px-4 py-2 text-sm font-semibold text-black hover:bg-[#00a79a] disabled:opacity-60"
          >
            {migrateLoading ? "请求中..." : "调用 /trade/image/migrate-legacy"}
          </button>

          {migrateError ? (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200 whitespace-pre-wrap">
              {migrateError}
            </div>
          ) : null}

          <pre className="max-h-[280px] overflow-auto rounded-md bg-black p-3 text-xs text-[#e5e7eb]">
            {migrateResult ? JSON.stringify(migrateResult, null, 2) : "(暂无)"}
          </pre>
        </div>
      </div>
    </TradePageShell>
  );
}
