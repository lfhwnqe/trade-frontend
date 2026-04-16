import { fetchWithAuth } from "@/utils/fetchWithAuth";
import type {
  FlashcardAction,
  FlashcardCard,
  FlashcardBehaviorType,
  FlashcardCardSortBy,
  FlashcardCardSortOrder,
  FlashcardDrillStartResponse,
  FlashcardDrillStats,
  FlashcardDrillSessionDetail,
  FlashcardDrillSessionHistoryItem,
  FlashcardDrillAnalytics,
  FlashcardDirection,
  FlashcardFilters,
  FlashcardInvalidationType,
  FlashcardSimulationCardHistoryResponse,
  FlashcardSimulationCardMetrics,
  FlashcardSimulationRunningStats,
  FlashcardSimulationSessionHistoryItem,
  FlashcardSimulationSessionStartResponse,
  MistakeRecord,
  FlashcardSource,
  FlashcardSystemOutcomeType,
} from "./types";

export const FLASHCARD_ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

type Scope = "question" | "answer";

type CreateFlashcardPayload = {
  questionImageUrl: string;
  answerImageUrl: string;
  expectedAction: FlashcardAction;
  direction?: FlashcardDirection;
  behaviorType?: FlashcardBehaviorType;
  invalidationType?: FlashcardInvalidationType;
  systemOutcomeType?: FlashcardSystemOutcomeType;
  earlyExitTag?: boolean;
  earlyExitReason?: string;
  earlyExitImageUrls?: string[];
  marketTimeInfo?: string;
  symbolPairInfo?: string;
  playbookType?: string;
  notes?: string;
  tagCodes?: string[];
};

type UpdateFlashcardPayload = {
  questionImageUrl?: string;
  answerImageUrl?: string;
  expectedAction?: FlashcardAction;
  direction?: FlashcardDirection;
  behaviorType?: FlashcardBehaviorType;
  invalidationType?: FlashcardInvalidationType;
  systemOutcomeType?: FlashcardSystemOutcomeType;
  earlyExitTag?: boolean;
  earlyExitReason?: string;
  earlyExitImageUrls?: string[];
  marketTimeInfo?: string;
  symbolPairInfo?: string;
  playbookType?: string;
  notes?: string;
  tagCodes?: string[];
};

export async function getFlashcardUploadUrl(params: {
  fileName: string;
  contentType: string;
  scope: Scope;
}): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: "flashcard/image/upload-url",
      actualMethod: "POST",
    },
    actualBody: params,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "获取闪卡上传 URL 失败");
  }

  return {
    uploadUrl: data.data.uploadUrl,
    fileUrl: data.data.fileUrl,
    key: data.data.key,
  };
}

export async function uploadToS3(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!res.ok) {
    throw new Error("上传到 S3 失败");
  }
}

export async function createFlashcardCard(
  payload: CreateFlashcardPayload,
): Promise<FlashcardCard> {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: "flashcard/cards",
      actualMethod: "POST",
    },
    actualBody: payload,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "创建闪卡失败");
  }

  return data.data as FlashcardCard;
}

export async function randomFlashcardCards(params: {
  filters?: FlashcardFilters;
  count: number;
}): Promise<FlashcardCard[]> {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: "flashcard/cards/random",
      actualMethod: "POST",
    },
    actualBody: params,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "获取随机卡片失败");
  }

  return (data.data || []) as FlashcardCard[];
}

export async function listFlashcardCards(params?: {
  pageSize?: number;
  cursor?: string;
  cardId?: string;
  behaviorType?: FlashcardBehaviorType;
  invalidationType?: FlashcardInvalidationType;
  symbolPairInfo?: string;
  playbookType?: string;
  marketTimeInfo?: string;
  sortBy?: FlashcardCardSortBy;
  sortOrder?: FlashcardCardSortOrder;
}): Promise<{ items: FlashcardCard[]; totalCount: number; nextCursor: string | null }> {
  const searchParams = new URLSearchParams();
  if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
  if (params?.cursor) searchParams.set("cursor", params.cursor);
  if (params?.cardId) searchParams.set("cardId", params.cardId);
  if (params?.behaviorType) searchParams.set("behaviorType", params.behaviorType);
  if (params?.invalidationType) {
    searchParams.set("invalidationType", params.invalidationType);
  }
  if (params?.symbolPairInfo) searchParams.set("symbolPairInfo", params.symbolPairInfo);
  if (params?.playbookType) searchParams.set("playbookType", params.playbookType);
  if (params?.marketTimeInfo) searchParams.set("marketTimeInfo", params.marketTimeInfo);
  if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);

  const targetPath = `flashcard/cards${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath,
      actualMethod: "GET",
    },
    actualBody: {},
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "查询闪卡失败");
  }

  return {
    items: (data.data?.items || []) as FlashcardCard[],
    totalCount:
      typeof data.data?.totalCount === "number" && Number.isFinite(data.data.totalCount)
        ? data.data.totalCount
        : Array.isArray(data.data?.items)
          ? data.data.items.length
          : 0,
    nextCursor:
      typeof data.data?.nextCursor === "string" ? data.data.nextCursor : null,
  };
}

export async function rateFlashcardCard(cardId: string, score: number): Promise<FlashcardCard> {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: `flashcard/cards/${cardId}/rate`,
      actualMethod: "POST",
    },
    actualBody: { score },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "闪卡评分失败");
  }

  return data.data as FlashcardCard;
}

export async function getFlashcardCard(cardId: string): Promise<FlashcardCard> {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: `flashcard/cards/${cardId}`,
      actualMethod: "GET",
    },
    actualBody: {},
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "获取闪卡详情失败");
  }

  return data.data as FlashcardCard;
}

export async function deleteFlashcardCard(cardId: string): Promise<void> {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: `flashcard/cards/${cardId}`,
      actualMethod: "DELETE",
    },
    actualBody: {},
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "删除闪卡失败");
  }
}

export async function startFlashcardDrillSession(params: {
  source: FlashcardSource;
  count: number;
}): Promise<FlashcardDrillStartResponse> {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: "flashcard/drill/session/start",
      actualMethod: "POST",
    },
    actualBody: params,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "开始练习失败");
  }

  return data.data as FlashcardDrillStartResponse;
}

export async function submitFlashcardDrillAttempt(params: {
  sessionId: string;
  cardId: string;
  userAction: FlashcardAction;
  isFavorite?: boolean;
  note?: string;
}): Promise<{
  isCorrect: boolean;
  expectedAction: FlashcardAction;
  runningStats: FlashcardDrillStats;
}> {
  const { sessionId, ...body } = params;
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: `flashcard/drill/session/${sessionId}/attempt`,
      actualMethod: "POST",
    },
    actualBody: body,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "提交作答失败");
  }

  return data.data as {
    isCorrect: boolean;
    expectedAction: FlashcardAction;
    runningStats: FlashcardDrillStats;
  };
}

export async function finishFlashcardDrillSession(
  sessionId: string,
): Promise<{ sessionId: string; score: number; stats: FlashcardDrillStats }> {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: `flashcard/drill/session/${sessionId}/finish`,
      actualMethod: "POST",
    },
    actualBody: {},
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "结束练习失败");
  }

  return data.data as { sessionId: string; score: number; stats: FlashcardDrillStats };
}

export async function abandonFlashcardDrillSession(
  sessionId: string,
): Promise<{ sessionId: string; score: number; stats: FlashcardDrillStats }> {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    keepalive: true,
    proxyParams: {
      targetPath: `flashcard/drill/session/${sessionId}/abandon`,
      actualMethod: "POST",
    },
    actualBody: {},
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "中断练习失败");
  }

  return data.data as { sessionId: string; score: number; stats: FlashcardDrillStats };
}

export async function listFlashcardDrillSessions(params?: {
  pageSize?: number;
  cursor?: string;
  status?: "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
}): Promise<{ items: FlashcardDrillSessionHistoryItem[]; nextCursor: string | null }> {
  const searchParams = new URLSearchParams();
  if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
  if (params?.cursor) searchParams.set("cursor", params.cursor);
  if (params?.status) searchParams.set("status", params.status);

  const targetPath = `flashcard/drill/sessions${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath,
      actualMethod: "GET",
    },
    actualBody: {},
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "获取训练成绩历史失败");
  }

  return {
    items: (data.data?.items || []) as FlashcardDrillSessionHistoryItem[],
    nextCursor:
      typeof data.data?.nextCursor === "string" ? data.data.nextCursor : null,
  };
}

export async function getFlashcardDrillSessionDetail(
  sessionId: string,
): Promise<FlashcardDrillSessionDetail> {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: `flashcard/drill/session/${sessionId}`,
      actualMethod: "GET",
    },
    actualBody: {},
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "获取练习会话详情失败");
  }

  return data.data as FlashcardDrillSessionDetail;
}

export async function getFlashcardDrillAnalytics(params?: {
  recentWindow?: number;
}): Promise<FlashcardDrillAnalytics> {
  const searchParams = new URLSearchParams();
  if (params?.recentWindow) {
    searchParams.set("recentWindow", String(params.recentWindow));
  }

  const targetPath = `flashcard/drill/analytics${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath,
      actualMethod: "GET",
    },
    actualBody: {},
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "获取训练成绩分析失败");
  }

  return data.data as FlashcardDrillAnalytics;
}

export async function listFlashcardWrongBook(): Promise<FlashcardCard[]> {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: "flashcard/review/wrong-book",
      actualMethod: "GET",
    },
    actualBody: {},
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "获取错题集失败");
  }

  return (data.data || []) as FlashcardCard[];
}

export async function listFlashcardFavorites(): Promise<FlashcardCard[]> {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: "flashcard/review/favorites",
      actualMethod: "GET",
    },
    actualBody: {},
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "获取收藏库失败");
  }

  return (data.data || []) as FlashcardCard[];
}

export async function updateFlashcardNote(
  cardId: string,
  note: string,
): Promise<FlashcardCard> {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: `flashcard/cards/${cardId}/note`,
      actualMethod: "PATCH",
    },
    actualBody: {
      note,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "更新备注失败");
  }

  return data.data as FlashcardCard;
}

export async function updateFlashcardCard(
  cardId: string,
  payload: UpdateFlashcardPayload,
): Promise<FlashcardCard> {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: `flashcard/cards/${cardId}`,
      actualMethod: "PATCH",
    },
    actualBody: payload,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "更新闪卡失败");
  }

  return data.data as FlashcardCard;
}

export async function startFlashcardSimulationSession(params: {
  count: number;
  mode?: "STANDARD" | "ATTEMPT_REPLAY";
  filters?: FlashcardFilters & {
    result?: Array<"SUCCESS" | "FAILURE">;
  };
}): Promise<FlashcardSimulationSessionStartResponse> {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: "flashcard/simulation/session/start",
      actualMethod: "POST",
    },
    actualBody: params,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "开始模拟盘训练失败");
  }

  return data.data as FlashcardSimulationSessionStartResponse;
}

export async function createFlashcardSimulationAttempt(params: {
  sessionId: string;
  cardId: string;
  revealProgress: number;
  entryLineYPercent: number;
  stopLossLineYPercent: number;
  takeProfitLineYPercent: number;
  rrValue: number;
  entryDirection: "LONG" | "SHORT";
  entryReason: string;
  replaySourceAttemptId?: string;
}): Promise<{
  attemptId: string;
  status: "ENTRY_SAVED" | "RESOLVED";
  attempt: import("./types").FlashcardSimulationAttemptDetail;
  cardMetrics: FlashcardSimulationCardMetrics;
}> {
  const { sessionId, ...body } = params;
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: `flashcard/simulation/session/${sessionId}/attempts`,
      actualMethod: "POST",
    },
    actualBody: body,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "保存模拟盘入场失败");
  }

  return data.data;
}

export async function resolveFlashcardSimulationAttempt(params: {
  attemptId: string;
  result: "SUCCESS" | "FAILURE";
  failureReason?: string;
  primaryMistakeCode?: string;
  mistakeCodes?: string[];
  correctionNote?: string;
  cardQualityScore?: 1 | 2 | 3 | 4 | 5;
}): Promise<{
  attemptId: string;
  status: "RESOLVED" | "ENTRY_SAVED";
  result?: "SUCCESS" | "FAILURE";
  runningStats: FlashcardSimulationRunningStats;
  cardMetrics: FlashcardSimulationCardMetrics;
}> {
  const { attemptId, ...body } = params;
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: `flashcard/simulation/attempts/${attemptId}/resolve`,
      actualMethod: "POST",
    },
    actualBody: body,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "保存模拟盘结果失败");
  }

  return data.data;
}

export async function listMistakeRecords(params?: {
  pageSize?: number;
  cursor?: string;
  sourceType?: "FLASHCARD_SIMULATION" | "TRADE_FLASHCARD";
  primaryMistakeCode?: string;
  mistakeDomain?: "RECOGNITION" | "TRIGGER_TIMING" | "RISK_FRAMEWORK" | "CONTEXT_FILTER" | "EXECUTION";
  playbookType?: string;
  reviewStatus?: "NEW" | "CLASSIFIED" | "IN_TRAINING" | "IMPROVED" | "ARCHIVED";
}): Promise<{ items: MistakeRecord[]; totalCount: number; nextCursor: string | null }> {
  const searchParams = new URLSearchParams();
  if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
  if (params?.cursor) searchParams.set("cursor", params.cursor);
  if (params?.sourceType) searchParams.set("sourceType", params.sourceType);
  if (params?.primaryMistakeCode) searchParams.set("primaryMistakeCode", params.primaryMistakeCode);
  if (params?.mistakeDomain) searchParams.set("mistakeDomain", params.mistakeDomain);
  if (params?.playbookType) searchParams.set("playbookType", params.playbookType);
  if (params?.reviewStatus) searchParams.set("reviewStatus", params.reviewStatus);

  const targetPath = `mistakes/records${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath,
      actualMethod: "GET",
    },
    actualBody: {},
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "获取误判记录失败");
  }

  return {
    items: (data.data?.items || []) as MistakeRecord[],
    totalCount: typeof data.data?.totalCount === "number" ? data.data.totalCount : 0,
    nextCursor: typeof data.data?.nextCursor === "string" ? data.data.nextCursor : null,
  };
}

export async function finishFlashcardSimulationSession(sessionId: string): Promise<{
  simulationSessionId: string;
  totalCards: number;
  completedAttemptCount?: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  status: "COMPLETED" | "IN_PROGRESS" | "ABANDONED";
}> {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: `flashcard/simulation/session/${sessionId}/finish`,
      actualMethod: "POST",
    },
    actualBody: {},
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "结束模拟盘训练失败");
  }

  return data.data;
}

export async function listFlashcardSimulationSessions(params?: {
  pageSize?: number;
  cursor?: string;
  status?: "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
}): Promise<{ items: FlashcardSimulationSessionHistoryItem[]; nextCursor: string | null }> {
  const searchParams = new URLSearchParams();
  if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
  if (params?.cursor) searchParams.set("cursor", params.cursor);
  if (params?.status) searchParams.set("status", params.status);

  const targetPath = `flashcard/simulation/sessions${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath,
      actualMethod: "GET",
    },
    actualBody: {},
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "获取模拟盘训练历史失败");
  }

  return {
    items: (data.data?.items || []) as FlashcardSimulationSessionHistoryItem[],
    nextCursor: typeof data.data?.nextCursor === "string" ? data.data.nextCursor : null,
  };
}

export async function listFlashcardSimulationAttempts(params?: {
  pageSize?: number;
  cursor?: string;
  result?: "ALL" | "SUCCESS" | "FAILURE";
}): Promise<{ items: import("./types").FlashcardSimulationAttemptDetail[]; totalCount: number; nextCursor: string | null }> {
  const searchParams = new URLSearchParams();
  if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
  if (params?.cursor) searchParams.set("cursor", params.cursor);
  if (params?.result) searchParams.set("result", params.result);

  const targetPath = `flashcard/simulation/attempts${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath,
      actualMethod: "GET",
    },
    actualBody: {},
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "获取模拟盘训练记录失败");
  }

  return {
    items: (data.data?.items || []) as import("./types").FlashcardSimulationAttemptDetail[],
    totalCount: typeof data.data?.totalCount === "number" ? data.data.totalCount : 0,
    nextCursor: typeof data.data?.nextCursor === "string" ? data.data.nextCursor : null,
  };
}

export async function getFlashcardSimulationAttempt(
  attemptId: string,
): Promise<import("./types").FlashcardSimulationAttemptDetail> {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: `flashcard/simulation/attempts/${attemptId}`,
      actualMethod: "GET",
    },
    actualBody: {},
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "获取 attempt 详情失败");
  }

  return data.data as import("./types").FlashcardSimulationAttemptDetail;
}

export async function updateFlashcardSimulationAttempt(params: {
  attemptId: string;
  result: "SUCCESS" | "FAILURE";
  failureReason?: string;
  primaryMistakeCode?: string;
  mistakeCodes?: string[];
  correctionNote?: string;
  cardQualityScore?: 1 | 2 | 3 | 4 | 5;
}): Promise<import("./types").FlashcardSimulationAttemptDetail> {
  const { attemptId, ...body } = params;
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: `flashcard/simulation/attempts/${attemptId}`,
      actualMethod: "PATCH",
    },
    actualBody: body,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "更新 attempt 失败");
  }

  return data.data as import("./types").FlashcardSimulationAttemptDetail;
}

export async function deleteFlashcardSimulationAttempt(attemptId: string): Promise<void> {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: `flashcard/simulation/attempts/${attemptId}`,
      actualMethod: "DELETE",
    },
    actualBody: {},
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "删除 attempt 失败");
  }
}

export async function getFlashcardSimulationPlaybookAnalytics(params?: {
  recentWindow?: number;
  minResolved?: number;
}): Promise<import("./types").FlashcardSimulationPlaybookAnalyticsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.recentWindow) searchParams.set("recentWindow", String(params.recentWindow));
  if (params?.minResolved) searchParams.set("minResolved", String(params.minResolved));

  const targetPath = `flashcard/simulation/analytics/playbooks${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath,
      actualMethod: "GET",
    },
    actualBody: {},
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "获取薄弱剧本统计失败");
  }

  return data.data as import("./types").FlashcardSimulationPlaybookAnalyticsResponse;
}

export async function getFlashcardSimulationCardHistory(params: {
  cardId: string;
  pageSize?: number;
  cursor?: string;
}): Promise<FlashcardSimulationCardHistoryResponse> {
  const searchParams = new URLSearchParams();
  if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));
  if (params.cursor) searchParams.set("cursor", params.cursor);
  const targetPath = `flashcard/simulation/cards/${params.cardId}/history${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath,
      actualMethod: "GET",
    },
    actualBody: {},
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "获取闪卡模拟盘历史失败");
  }

  return data.data as FlashcardSimulationCardHistoryResponse;
}
