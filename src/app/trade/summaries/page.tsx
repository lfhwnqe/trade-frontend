"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardCopy, RotateCcw, Search } from "lucide-react";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/components/common/alert";
import Link from "next/link";

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
      entity.trade && typeof entity.trade === "object"
        ? entity.trade
        : undefined;

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
  summaryType: "pre" | "post",
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

  const handleCopyAll = useCallback(
    async (summaryType: "pre" | "post") => {
      const source = summaryType === "pre" ? preSummaries : postSummaries;
      if (!source.length) {
        errorAlert("暂无数据可复制");
        return;
      }
      const contentBody = source
        .map(
          (summary, index) =>
            `【第${index + 1}条】\n${summary.text || "暂无总结"}`,
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
    },
    [preSummaries, postSummaries, success, errorAlert],
  );

  const filteredPreSummaries = useMemo(() => {
    const trimmed = keyword.trim().toLowerCase();
    if (!trimmed) return preSummaries;
    return preSummaries.filter((summary) =>
      (summary.text || "").toLowerCase().includes(trimmed),
    );
  }, [keyword, preSummaries]);

  const filteredPostSummaries = useMemo(() => {
    const trimmed = keyword.trim().toLowerCase();
    if (!trimmed) return postSummaries;
    return postSummaries.filter((summary) =>
      (summary.text || "").toLowerCase().includes(trimmed),
    );
  }, [keyword, postSummaries]);

  return (
    <div className="dark min-h-screen bg-[#000] text-[#e5e7eb] antialiased flex">
      <main className="flex-1 min-h-screen flex flex-col bg-[#000]">
        <header className="h-24 border-b border-[#27272a] flex items-center justify-between px-8 sticky top-0 z-30 bg-black/90 backdrop-blur">
          <div>
            <h1 className="text-3xl italic text-white tracking-wide">交易反思墙</h1>
            <p className="text-xs text-[#9ca3af] mt-1 tracking-wide">沉淀交易洞察，识别模式，持续进化。</p>
          </div>
          <Button variant="outline" className="border-[#27272a] bg-[#121212] text-[#e5e7eb] hover:bg-[#1A1A1A]" onClick={loadData} disabled={loading}>
            <RotateCcw className="size-4 mr-2" />{loading ? '刷新中...' : '刷新'}
          </Button>
        </header>

        <div className="p-8 bg-black max-w-6xl mx-auto w-full flex-1 min-h-0 flex flex-col gap-6">
          <div className="w-full max-w-2xl">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#666]" />
              <Input
                className="pl-11 bg-[#0f0f0f] border-[#222] text-gray-200 placeholder:text-gray-600"
                placeholder="搜索交易总结..."
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </div>
          </div>

          {preError && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{preError}</div>
          )}
          {postError && postError !== preError && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{postError}</div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
            <section className="min-h-0 flex flex-col bg-[#0a0a0a] border border-[#222] rounded-xl p-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                <h2 className="text-lg italic text-white tracking-wide">交易前总结</h2>
                <div className="h-px bg-[#27272a] flex-1 ml-4 opacity-50" />
                <Button variant="secondary" size="sm" onClick={() => handleCopyAll('pre')} disabled={copying === 'pre' || !preSummaries.length}>
                  <ClipboardCopy className="size-4 mr-2" />{copying === 'pre' ? '复制中...' : '复制全部'}
                </Button>
              </div>
              <div className="space-y-4 flex-1 min-h-0 overflow-y-auto pr-1">
                {loading ? (
                  Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="rounded-lg border border-[#222] bg-[#0f0f0f] p-5"><Skeleton className="h-4 w-24" /><Skeleton className="mt-3 h-4 w-full" /></div>
                  ))
                ) : filteredPreSummaries.length > 0 ? (
                  filteredPreSummaries.map((summary) => (
                    <Link href={`/trade/detail?id=${summary.transactionId}`} key={summary.transactionId}>
                      <article className="bg-[#0f0f0f] border border-[#222] rounded-lg p-5 mb-4 hover:border-gray-700 transition-colors duration-200 relative">
                        <div className="absolute left-0 top-4 bottom-4 w-[2px] bg-[#D4AF37]/40 rounded-r-sm" />
                        <div className="pl-4">
                          <div className="flex justify-between items-baseline mb-2">
                            <span className="text-xs font-mono text-[#D4AF37] uppercase tracking-wider opacity-80">交易前</span>
                            <span className="text-[10px] text-gray-600 font-mono">{summary.transactionId.slice(0, 8)}...</span>
                          </div>
                          <p className="text-sm text-gray-300 leading-relaxed font-light whitespace-pre-line">{summary.text || '暂无总结'}</p>
                        </div>
                      </article>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-[#333] bg-[#0f0f0f] p-6 text-center text-sm text-gray-500">{keyword ? '没有找到匹配的交易前总结。' : '暂无交易前总结。'}</div>
                )}
              </div>
            </section>

            <section className="min-h-0 flex flex-col bg-[#0a0a0a] border border-[#222] rounded-xl p-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-2 h-2 rounded-full bg-[#06b6d4]" />
                <h2 className="text-lg italic text-white tracking-wide">交易后总结</h2>
                <div className="h-px bg-[#27272a] flex-1 ml-4 opacity-50" />
                <Button variant="secondary" size="sm" onClick={() => handleCopyAll('post')} disabled={copying === 'post' || !postSummaries.length}>
                  <ClipboardCopy className="size-4 mr-2" />{copying === 'post' ? '复制中...' : '复制全部'}
                </Button>
              </div>
              <div className="space-y-4 flex-1 min-h-0 overflow-y-auto pr-1">
                {loading ? (
                  Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="rounded-lg border border-[#222] bg-[#0f0f0f] p-5"><Skeleton className="h-4 w-24" /><Skeleton className="mt-3 h-4 w-full" /></div>
                  ))
                ) : filteredPostSummaries.length > 0 ? (
                  filteredPostSummaries.map((summary) => (
                    <Link href={`/trade/detail?id=${summary.transactionId}`} key={`post_${summary.transactionId}`}>
                      <article className="bg-[#0f0f0f] border border-[#222] rounded-lg p-5 mb-4 hover:border-gray-700 transition-colors duration-200 relative">
                        <div className="absolute left-0 top-4 bottom-4 w-[2px] bg-[#06b6d4]/40 rounded-r-sm" />
                        <div className="pl-4">
                          <div className="flex justify-between items-baseline mb-2">
                            <span className="text-xs font-mono text-[#06b6d4] uppercase tracking-wider opacity-80">交易后</span>
                            <span className="text-[10px] text-gray-600 font-mono">{summary.transactionId.slice(0, 8)}...</span>
                          </div>
                          <p className="text-sm text-gray-300 leading-relaxed font-light whitespace-pre-line">{summary.text || '暂无总结'}</p>
                        </div>
                      </article>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-[#333] bg-[#0f0f0f] p-6 text-center text-sm text-gray-500">{keyword ? '没有找到匹配的交易后总结。' : '暂无交易后总结。'}</div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}