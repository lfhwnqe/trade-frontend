import { fetchWithAuth } from "@/utils/fetchWithAuth";
import type {
  FlashcardAction,
  FlashcardCard,
  FlashcardContext,
  FlashcardDrillStartResponse,
  FlashcardDrillStats,
  FlashcardDirection,
  FlashcardFilters,
  FlashcardOrderFlowFeature,
  FlashcardResult,
  FlashcardSource,
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
  context?: FlashcardContext;
  orderFlowFeature?: FlashcardOrderFlowFeature;
  result?: FlashcardResult;
  notes?: string;
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
  direction?: FlashcardDirection;
  context?: FlashcardContext;
  orderFlowFeature?: FlashcardOrderFlowFeature;
  result?: FlashcardResult;
}): Promise<{ items: FlashcardCard[]; nextCursor: string | null }> {
  const searchParams = new URLSearchParams();
  if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
  if (params?.cursor) searchParams.set("cursor", params.cursor);
  if (params?.direction) searchParams.set("direction", params.direction);
  if (params?.context) searchParams.set("context", params.context);
  if (params?.orderFlowFeature) {
    searchParams.set("orderFlowFeature", params.orderFlowFeature);
  }
  if (params?.result) searchParams.set("result", params.result);

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
    nextCursor:
      typeof data.data?.nextCursor === "string" ? data.data.nextCursor : null,
  };
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
