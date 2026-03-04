import { fetchWithAuth } from "@/utils/fetchWithAuth";
import type {
  FlashcardCard,
  FlashcardContext,
  FlashcardDirection,
  FlashcardFilters,
  FlashcardOrderFlowFeature,
  FlashcardResult,
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
  direction: FlashcardDirection;
  context: FlashcardContext;
  orderFlowFeature: FlashcardOrderFlowFeature;
  result: FlashcardResult;
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
