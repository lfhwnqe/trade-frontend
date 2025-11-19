"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RotateCcw, Search } from "lucide-react";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type TradeSummary = {
  transactionId: string;
  lessonsLearned: string;
};

type SummaryApiEntity = {
  transactionId?: string | number | null;
  lessonsLearned?: string | null;
  trade?: {
    transactionId?: string | number | null;
    lessonsLearned?: string | null;
  } | null;
};

function toText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function extractList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    const obj = payload as { data?: unknown; items?: unknown };
    if (Array.isArray(obj.data)) return obj.data;
    if (obj.data && typeof obj.data === "object") {
      const nested = obj.data as { items?: unknown; data?: unknown };
      if (Array.isArray(nested.items)) return nested.items;
      if (Array.isArray(nested.data)) return nested.data;
    }
    if (Array.isArray(obj.items)) return obj.items;
  }
  return [];
}

function parseSummaries(payload: unknown): TradeSummary[] {
  return extractList(payload)
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const entity = item as SummaryApiEntity;
      const trade =
        entity.trade && typeof entity.trade === "object"
          ? entity.trade
          : undefined;

      const transactionId =
        toText(entity.transactionId)?.trim() ||
        toText(trade?.transactionId)?.trim();
      if (!transactionId) return null;

      const lessons = toText(entity.lessonsLearned) || toText(trade?.lessonsLearned);

      return {
        transactionId,
        lessonsLearned: lessons || "暂无总结",
      };
    })
    .filter((item): item is TradeSummary => Boolean(item));
}

async function fetchSummaries(): Promise<TradeSummary[]> {
  const response = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    proxyParams: {
      targetPath: "trade/summaries",
      actualMethod: "POST",
    },
    actualBody: {},
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "message" in payload &&
      typeof (payload as { message?: string }).message === "string"
        ? (payload as { message?: string }).message
        : "获取交易总结失败";
    throw new Error(message);
  }

  return parseSummaries(payload);
}

export default function TradeSummariesPage() {
  const [summaries, setSummaries] = useState<TradeSummary[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchSummaries();
      setSummaries(result);
    } catch (err) {
      setSummaries([]);
      setError(err instanceof Error ? err.message : "获取交易总结失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredSummaries = useMemo(() => {
    const trimmed = keyword.trim().toLowerCase();
    if (!trimmed) return summaries;
    return summaries.filter((summary) => {
      const lessons = summary.lessonsLearned || "";
      return (
        summary.transactionId.toLowerCase().includes(trimmed) ||
        lessons.toLowerCase().includes(trimmed)
      );
    });
  }, [keyword, summaries]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">交易总结</h1>
          <p className="text-sm text-muted-foreground">
            汇总每笔交易的反思，快速定位容易犯错的环节。
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
          >
            <RotateCcw className="size-4" />
            {loading ? "刷新中..." : "刷新"}
          </Button>
        </div>
      </div>

      <div className="w-full sm:max-w-md">
        <label className="text-sm font-medium text-muted-foreground">
          快速筛选
        </label>
        <div className="relative mt-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="根据交易编号或总结关键词过滤"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`summary-skeleton-${index}`}
                className="rounded-xl border bg-background p-4 shadow-sm"
              >
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-3 h-6 w-3/4" />
                <Skeleton className="mt-4 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-5/6" />
              </div>
            ))
          : filteredSummaries.length > 0
          ? filteredSummaries.map((summary) => (
              <article
                key={summary.transactionId}
                className="group flex flex-col rounded-xl border bg-background p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      交易编号
                    </p>
                    <p className="text-lg font-semibold leading-tight">
                      {summary.transactionId}
                    </p>
                  </div>
                  <Button variant="link" size="sm" asChild className="px-0">
                    <Link
                      href={`/trade/detail?id=${encodeURIComponent(
                        summary.transactionId
                      )}`}
                    >
                      查看详情
                    </Link>
                  </Button>
                </div>
                <p className="mt-4 text-xs font-medium text-muted-foreground">
                  总结
                </p>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground">
                  {summary.lessonsLearned || "暂无总结"}
                </p>
              </article>
            ))
          : (
              <div className="col-span-full rounded-xl border border-dashed bg-muted/10 p-8 text-center text-sm text-muted-foreground">
                {keyword
                  ? "没有找到匹配的总结，请调整筛选条件试试。"
                  : "暂无总结数据，稍后再试或点击上方刷新按钮。"}
              </div>
            )}
      </div>
    </div>
  );
}
