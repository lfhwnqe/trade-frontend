"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardCopy, RotateCcw, Search } from "lucide-react";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/components/common/alert";
import TradePageShell from "../components/trade-page-shell";

const COPY_PROMPT_HEADER = [
  "这是我最近的交易复盘总结，请帮我：",
  "1. 按照出现频率从高到低梳理所有犯过的错误，并明确哪类错误最常出现；",
  "2. 针对每一类错误给出可执行的改进或规避方案；",
  "3. 输出时请先列出排序后的错误，再给出对应建议。",
  "",
  "以下是原始复盘总结：",
  "",
].join("\n");

type TradeSummary = {
  transactionId: string;
  text: string;
  importance?: number;
};

type SummaryApiEntity = {
  transactionId?: string | number | null;
  text?: string | null;
  importance?: number | null;
  trade?: {
    transactionId?: string | number | null;
    text?: string | null;
    importance?: number | null;
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
  return extractList(payload).reduce<TradeSummary[]>((acc, item) => {
    if (!item || typeof item !== "object") return acc;

    const entity = item as SummaryApiEntity;
    const trade =
      entity.trade && typeof entity.trade === "object" ? entity.trade : undefined;

    const transactionId =
      toText(entity.transactionId)?.trim() ||
      toText(trade?.transactionId)?.trim();
    if (!transactionId) return acc;

    const text = toText(entity.text) || toText(trade?.text);

    acc.push({
      transactionId,
      text: text || "暂无总结",
      importance:
        typeof entity.importance === "number"
          ? entity.importance
          : typeof trade?.importance === "number"
          ? trade.importance
          : undefined,
    });

    return acc;
  }, []);
}

async function fetchSummaries(
  summaryType: "pre" | "post"
): Promise<TradeSummary[]> {
  const response = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    proxyParams: {
      targetPath: `trade/summaries/${summaryType}`,
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
  const [preSummaries, setPreSummaries] = useState<TradeSummary[]>([]);
  const [postSummaries, setPostSummaries] = useState<TradeSummary[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [preError, setPreError] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);
  const [copying, setCopying] = useState<"pre" | "post" | null>(null);
  const [success, errorAlert] = useAlert();

  const loadData = useCallback(async () => {
    setLoading(true);
    setPreError(null);
    setPostError(null);
    try {
      const [pre, post] = await Promise.all([
        fetchSummaries("pre"),
        fetchSummaries("post"),
      ]);
      setPreSummaries(pre);
      setPostSummaries(post);
    } catch (err) {
      setPreSummaries([]);
      setPostSummaries([]);
      const message = err instanceof Error ? err.message : "获取交易总结失败";
      setPreError(message);
      setPostError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCopyAll = useCallback(async (summaryType: "pre" | "post") => {
    const source = summaryType === "pre" ? preSummaries : postSummaries;
    if (!source.length) {
      errorAlert("暂无数据可复制");
      return;
    }
    const contentBody = source
      .map(
        (summary, index) => `【第${index + 1}条】\n${summary.text || "暂无总结"}`
      )
      .join("\n\n----------------------------------------\n\n");
    const content = `${COPY_PROMPT_HEADER}${contentBody}`;

    try {
      setCopying(summaryType);
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        navigator.clipboard.writeText
      ) {
        await navigator.clipboard.writeText(content);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = content;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      success("已复制全部总结");
    } catch (err) {
      console.error(err);
      errorAlert("复制失败，请重试");
    } finally {
      setCopying(null);
    }
  }, [preSummaries, postSummaries, success, errorAlert]);

  const filteredPreSummaries = useMemo(() => {
    const trimmed = keyword.trim().toLowerCase();
    if (!trimmed) return preSummaries;
    return preSummaries.filter((summary) =>
      (summary.text || "").toLowerCase().includes(trimmed)
    );
  }, [keyword, preSummaries]);

  const filteredPostSummaries = useMemo(() => {
    const trimmed = keyword.trim().toLowerCase();
    if (!trimmed) return postSummaries;
    return postSummaries.filter((summary) =>
      (summary.text || "").toLowerCase().includes(trimmed)
    );
  }, [keyword, postSummaries]);

  return (
    <TradePageShell title="交易总结" showAddButton={false}>
      <div className="flex h-full flex-1 flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              汇总交易前后总结，快速定位容易犯错的环节。
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
              placeholder="输入关键词快速查找反思"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>
        </div>

        {preError && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {preError}
          </div>
        )}
        {postError && postError !== preError && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {postError}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="flex flex-col gap-4 rounded-2xl border bg-background/40 p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">交易前总结</h2>
                <p className="text-xs text-muted-foreground">
                  重点关注入场前的判断与逻辑。
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleCopyAll("pre")}
                disabled={copying === "pre" || !preSummaries.length}
              >
                <ClipboardCopy className="size-4" />
                {copying === "pre" ? "复制中..." : "复制全部"}
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {loading
                ? Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={`pre-summary-skeleton-${index}`}
                      className="rounded-xl border bg-background p-4 shadow-sm"
                    >
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="mt-3 h-6 w-3/4" />
                      <Skeleton className="mt-4 h-4 w-full" />
                    </div>
                  ))
                : filteredPreSummaries.length > 0
                ? filteredPreSummaries.map((summary) => (
                    <article
                      key={summary.transactionId}
                      className="group flex flex-col rounded-xl border bg-background p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50"
                    >
                      <p className="text-xs font-medium text-muted-foreground">
                        交易前总结
                      </p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground">
                        {summary.text || "暂无总结"}
                      </p>
                    </article>
                  ))
                : (
                    <div className="col-span-full rounded-xl border border-dashed bg-muted/10 p-6 text-center text-sm text-muted-foreground">
                      {keyword
                        ? "没有找到匹配的交易前总结，请调整筛选条件试试。"
                        : "暂无交易前总结，稍后再试或点击上方刷新按钮。"}
                    </div>
                  )}
            </div>
          </section>
          <section className="flex flex-col gap-4 rounded-2xl border bg-background/40 p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">交易后总结</h2>
                <p className="text-xs text-muted-foreground">
                  聚焦交易执行与复盘复利。
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleCopyAll("post")}
                disabled={copying === "post" || !postSummaries.length}
              >
                <ClipboardCopy className="size-4" />
                {copying === "post" ? "复制中..." : "复制全部"}
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {loading
                ? Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={`post-summary-skeleton-${index}`}
                      className="rounded-xl border bg-background p-4 shadow-sm"
                    >
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="mt-3 h-6 w-3/4" />
                      <Skeleton className="mt-4 h-4 w-full" />
                    </div>
                  ))
                : filteredPostSummaries.length > 0
                ? filteredPostSummaries.map((summary) => (
                    <article
                      key={summary.transactionId}
                      className="group flex flex-col rounded-xl border bg-background p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50"
                    >
                      <p className="text-xs font-medium text-muted-foreground">
                        交易后总结
                      </p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground">
                        {summary.text || "暂无总结"}
                      </p>
                    </article>
                  ))
                : (
                    <div className="col-span-full rounded-xl border border-dashed bg-muted/10 p-6 text-center text-sm text-muted-foreground">
                      {keyword
                        ? "没有找到匹配的交易后总结，请调整筛选条件试试。"
                        : "暂无交易后总结，稍后再试或点击上方刷新按钮。"}
                    </div>
                  )}
            </div>
          </section>
        </div>
      </div>
    </TradePageShell>
  );
}
