import { fetchWithAuth } from "@/utils/fetchWithAuth";
import type {
  ImageRecognitionFlashcardCard,
  ImageRecognitionFlashcardCardSortBy,
  ImageRecognitionFlashcardCardSortOrder,
  ImageRecognitionFlashcardPlaybookStat,
  ImageRecognitionFlashcardSampleResult,
  ImageRecognitionFlashcardStatus,
  ImageRecognitionFlashcardStatusFilter,
} from "./types";

export const IMAGE_RECOGNITION_FLASHCARD_ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

type CreateImageRecognitionFlashcardPayload = {
  imageUrl: string;
  imageKey?: string;
  playbookType: string;
  sampleResult: ImageRecognitionFlashcardSampleResult;
  notes?: string;
  status?: ImageRecognitionFlashcardStatus;
};

type UpdateImageRecognitionFlashcardPayload = Partial<CreateImageRecognitionFlashcardPayload>;

function sanitizeCreatePayload(payload: CreateImageRecognitionFlashcardPayload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => {
      if (value === undefined) return false;
      if (typeof value === "string") return value.trim() !== "";
      return true;
    }),
  ) as CreateImageRecognitionFlashcardPayload;
}

function sanitizeUpdatePayload(payload: UpdateImageRecognitionFlashcardPayload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  ) as UpdateImageRecognitionFlashcardPayload;
}

export async function getImageRecognitionFlashcardUploadUrl(params: {
  fileName: string;
  contentType: string;
  scope?: "card-image";
}): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: "image-recognition-flashcard/image/upload-url",
      actualMethod: "POST",
    },
    actualBody: {
      fileName: params.fileName,
      contentType: params.contentType,
      scope: params.scope || "card-image",
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "获取图片识别闪卡上传 URL 失败");
  return {
    uploadUrl: data.data.uploadUrl,
    fileUrl: data.data.fileUrl,
    key: data.data.key,
  };
}

export async function createImageRecognitionFlashcardCard(
  payload: CreateImageRecognitionFlashcardPayload,
): Promise<ImageRecognitionFlashcardCard> {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: "image-recognition-flashcard/cards",
      actualMethod: "POST",
    },
    actualBody: sanitizeCreatePayload(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "创建图片识别闪卡失败");
  return data.data as ImageRecognitionFlashcardCard;
}

export async function listImageRecognitionFlashcardCards(params?: {
  pageSize?: number;
  cursor?: string;
  playbookType?: string;
  sampleResult?: ImageRecognitionFlashcardSampleResult;
  status?: ImageRecognitionFlashcardStatusFilter;
  keyword?: string;
  sortBy?: ImageRecognitionFlashcardCardSortBy;
  sortOrder?: ImageRecognitionFlashcardCardSortOrder;
}): Promise<{
  items: ImageRecognitionFlashcardCard[];
  totalCount: number;
  nextCursor: string | null;
  playbookStats: ImageRecognitionFlashcardPlaybookStat[];
}> {
  const searchParams = new URLSearchParams();
  if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
  if (params?.cursor) searchParams.set("cursor", params.cursor);
  if (params?.playbookType) searchParams.set("playbookType", params.playbookType);
  if (params?.sampleResult) searchParams.set("sampleResult", params.sampleResult);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.keyword) searchParams.set("keyword", params.keyword);
  if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);

  const targetPath = `image-recognition-flashcard/cards${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
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
  if (!res.ok) throw new Error(data.message || "查询图片识别闪卡失败");
  return {
    items: (data.data?.items || []) as ImageRecognitionFlashcardCard[],
    totalCount: typeof data.data?.totalCount === "number" ? data.data.totalCount : 0,
    nextCursor: typeof data.data?.nextCursor === "string" ? data.data.nextCursor : null,
    playbookStats: Array.isArray(data.data?.playbookStats)
      ? (data.data.playbookStats as ImageRecognitionFlashcardPlaybookStat[])
      : [],
  };
}

export async function updateImageRecognitionFlashcardCard(
  cardId: string,
  payload: UpdateImageRecognitionFlashcardPayload,
): Promise<ImageRecognitionFlashcardCard> {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: `image-recognition-flashcard/cards/${cardId}`,
      actualMethod: "PATCH",
    },
    actualBody: sanitizeUpdatePayload(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "更新图片识别闪卡失败");
  return data.data as ImageRecognitionFlashcardCard;
}

export async function deleteImageRecognitionFlashcardCard(cardId: string): Promise<void> {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: `image-recognition-flashcard/cards/${cardId}`,
      actualMethod: "DELETE",
    },
    actualBody: {},
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "删除图片识别闪卡失败");
}

export async function randomImageRecognitionFlashcardTraining(params: {
  count?: number;
  playbookType?: string;
}): Promise<{ cards: ImageRecognitionFlashcardCard[]; count: number }> {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: "image-recognition-flashcard/training/random",
      actualMethod: "POST",
    },
    actualBody: params,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "获取图片识别训练卡失败");
  return {
    cards: (data.data?.cards || []) as ImageRecognitionFlashcardCard[],
    count: typeof data.data?.count === "number" ? data.data.count : 0,
  };
}
