import { fetchWithAuth } from "@/utils/fetchWithAuth";
import type {
  TradingViewTrainingRecord,
  TradingViewTrainingRecordPlaybookAnalytics,
  TradingViewTrainingRecordResult,
  TradingViewTrainingRecordSortBy,
  TradingViewTrainingRecordSortOrder,
  TradingViewTrainingRecordSummary,
} from "./types";

export const TRADINGVIEW_TRAINING_RECORD_ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

type CreateTradingViewTrainingRecordPayload = {
  symbolPair?: string;
  imageUrl: string;
  imageKey?: string;
  tradeResult: TradingViewTrainingRecordResult;
  playbookType: string;
  entryConfidenceRating: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  reviewCandleTime?: string | null;
};

type UpdateTradingViewTrainingRecordPayload = Partial<CreateTradingViewTrainingRecordPayload>;

function sanitizePayload<T extends Record<string, unknown>>(payload: T) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  ) as T;
}

export async function getTradingViewTrainingRecordUploadUrl(params: {
  fileName: string;
  contentType: string;
  scope?: "training-image";
}): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: "tradingview-training-record/image/upload-url",
      actualMethod: "POST",
    },
    actualBody: {
      fileName: params.fileName,
      contentType: params.contentType,
      scope: params.scope || "training-image",
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "获取 TradingView 训练图片上传 URL 失败");
  return { uploadUrl: data.data.uploadUrl, fileUrl: data.data.fileUrl, key: data.data.key };
}

export async function createTradingViewTrainingRecord(
  payload: CreateTradingViewTrainingRecordPayload,
): Promise<TradingViewTrainingRecord> {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: "tradingview-training-record/records",
      actualMethod: "POST",
    },
    actualBody: sanitizePayload(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "创建 TradingView 训练记录失败");
  return data.data as TradingViewTrainingRecord;
}

export async function listTradingViewTrainingRecords(params?: {
  pageSize?: number;
  cursor?: string;
  playbookType?: string;
  symbolPair?: string;
  tradeResult?: TradingViewTrainingRecordResult;
  entryConfidenceRating?: 1 | 2 | 3 | 4 | 5;
  from?: string;
  to?: string;
  keyword?: string;
  sortBy?: TradingViewTrainingRecordSortBy;
  sortOrder?: TradingViewTrainingRecordSortOrder;
}): Promise<{ items: TradingViewTrainingRecord[]; totalCount: number; nextCursor: string | null }> {
  const searchParams = new URLSearchParams();
  if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
  if (params?.cursor) searchParams.set("cursor", params.cursor);
  if (params?.playbookType) searchParams.set("playbookType", params.playbookType);
  if (params?.symbolPair) searchParams.set("symbolPair", params.symbolPair);
  if (params?.tradeResult) searchParams.set("tradeResult", params.tradeResult);
  if (params?.entryConfidenceRating) searchParams.set("entryConfidenceRating", String(params.entryConfidenceRating));
  if (params?.from) searchParams.set("from", params.from);
  if (params?.to) searchParams.set("to", params.to);
  if (params?.keyword) searchParams.set("keyword", params.keyword);
  if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  const targetPath = `tradingview-training-record/records${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: { targetPath, actualMethod: "GET" },
    actualBody: {},
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "查询 TradingView 训练记录失败");
  return {
    items: (data.data?.items || []) as TradingViewTrainingRecord[],
    totalCount: typeof data.data?.totalCount === "number" ? data.data.totalCount : 0,
    nextCursor: typeof data.data?.nextCursor === "string" ? data.data.nextCursor : null,
  };
}

export async function updateTradingViewTrainingRecord(
  recordId: string,
  payload: UpdateTradingViewTrainingRecordPayload,
): Promise<TradingViewTrainingRecord> {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: `tradingview-training-record/records/${recordId}`,
      actualMethod: "PATCH",
    },
    actualBody: sanitizePayload(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "更新 TradingView 训练记录失败");
  return data.data as TradingViewTrainingRecord;
}

export async function deleteTradingViewTrainingRecord(recordId: string): Promise<void> {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: `tradingview-training-record/records/${recordId}`,
      actualMethod: "DELETE",
    },
    actualBody: {},
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "删除 TradingView 训练记录失败");
}

export async function getTradingViewTrainingRecordAnalytics(params?: {
  from?: string;
  to?: string;
  playbookType?: string;
  symbolPair?: string;
}): Promise<{
  summary: TradingViewTrainingRecordSummary;
  playbookItems: TradingViewTrainingRecordPlaybookAnalytics[];
}> {
  const searchParams = new URLSearchParams();
  if (params?.from) searchParams.set("from", params.from);
  if (params?.to) searchParams.set("to", params.to);
  if (params?.playbookType) searchParams.set("playbookType", params.playbookType);
  if (params?.symbolPair) searchParams.set("symbolPair", params.symbolPair);
  const targetPath = `tradingview-training-record/analytics${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: { targetPath, actualMethod: "GET" },
    actualBody: {},
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "查询 TradingView 训练统计失败");
  return {
    summary: data.data.summary as TradingViewTrainingRecordSummary,
    playbookItems: (data.data.playbookItems || []) as TradingViewTrainingRecordPlaybookAnalytics[],
  };
}
