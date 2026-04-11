import { fetchWithAuth } from '@/utils/fetchWithAuth';
import type { FlashcardCard } from '../flashcard/types';
import type {
  TradeFlashcardCard,
  TradeFlashcardCardSortBy,
  TradeFlashcardCardSortOrder,
  TradeFlashcardLifecycleStatus,
  TradeFlashcardProcessResult,
  TradeFlashcardType,
} from './types';

export const TRADE_FLASHCARD_ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

type Scope = 'pre-entry' | 'post-entry' | 'progress';

type CreateTradeFlashcardPayload = {
  tradeFlashcardType: TradeFlashcardType;
  processResult?: TradeFlashcardProcessResult;
  isSystemAligned?: boolean;
  preEntryImageUrl: string;
  postEntryImageUrl?: string;
  progressImageUrls?: string[];
  marketTimeInfo?: string;
  symbolPairInfo?: string;
  playbookType?: string;
  notes?: string;
  summary?: string;
  tagCodes?: string[];
};

type UpdateTradeFlashcardPayload = Partial<CreateTradeFlashcardPayload>;

export async function getTradeFlashcardUploadUrl(params: {
  fileName: string;
  contentType: string;
  scope: Scope;
}): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
  const res = await fetchWithAuth('/api/proxy-post', {
    method: 'POST',
    credentials: 'include',
    proxyParams: {
      targetPath: 'trade-flashcard/image/upload-url',
      actualMethod: 'POST',
    },
    actualBody: params,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '获取交易闪卡上传 URL 失败');
  return {
    uploadUrl: data.data.uploadUrl,
    fileUrl: data.data.fileUrl,
    key: data.data.key,
  };
}

export async function createTradeFlashcardCard(payload: CreateTradeFlashcardPayload): Promise<TradeFlashcardCard> {
  const res = await fetchWithAuth('/api/proxy-post', {
    method: 'POST',
    credentials: 'include',
    proxyParams: {
      targetPath: 'trade-flashcard/cards',
      actualMethod: 'POST',
    },
    actualBody: payload,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '创建交易闪卡失败');
  return data.data as TradeFlashcardCard;
}

export async function listTradeFlashcardCards(params?: {
  pageSize?: number;
  cursor?: string;
  tradeFlashcardType?: TradeFlashcardType;
  lifecycleStatus?: TradeFlashcardLifecycleStatus;
  symbolPairInfo?: string;
  playbookType?: string;
  marketTimeInfo?: string;
  sortBy?: TradeFlashcardCardSortBy;
  sortOrder?: TradeFlashcardCardSortOrder;
}): Promise<{ items: TradeFlashcardCard[]; totalCount: number; nextCursor: string | null }> {
  const searchParams = new URLSearchParams();
  if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
  if (params?.cursor) searchParams.set('cursor', params.cursor);
  if (params?.tradeFlashcardType) searchParams.set('tradeFlashcardType', params.tradeFlashcardType);
  if (params?.lifecycleStatus) searchParams.set('lifecycleStatus', params.lifecycleStatus);
  if (params?.symbolPairInfo) searchParams.set('symbolPairInfo', params.symbolPairInfo);
  if (params?.playbookType) searchParams.set('playbookType', params.playbookType);
  if (params?.marketTimeInfo) searchParams.set('marketTimeInfo', params.marketTimeInfo);
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

  const targetPath = `trade-flashcard/cards${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const res = await fetchWithAuth('/api/proxy-post', {
    method: 'POST',
    credentials: 'include',
    proxyParams: { targetPath, actualMethod: 'GET' },
    actualBody: {},
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '查询交易闪卡失败');
  return {
    items: (data.data?.items || []) as TradeFlashcardCard[],
    totalCount: typeof data.data?.totalCount === 'number' ? data.data.totalCount : 0,
    nextCursor: typeof data.data?.nextCursor === 'string' ? data.data.nextCursor : null,
  };
}

export async function updateTradeFlashcardCard(cardId: string, payload: UpdateTradeFlashcardPayload): Promise<TradeFlashcardCard> {
  const res = await fetchWithAuth('/api/proxy-post', {
    method: 'POST',
    credentials: 'include',
    proxyParams: {
      targetPath: `trade-flashcard/cards/${cardId}`,
      actualMethod: 'PATCH',
    },
    actualBody: payload,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '更新交易闪卡失败');
  return data.data as TradeFlashcardCard;
}

export async function convertTradeFlashcardToFlashcard(
  cardId: string,
  payload: {
    expectedAction: 'LONG' | 'SHORT' | 'NO_TRADE';
    systemOutcomeType: 'SYSTEM_WIN' | 'SYSTEM_LOSS_NORMAL';
    behaviorType?: string;
    invalidationType?: string;
    notes?: string;
  },
): Promise<FlashcardCard> {
  const res = await fetchWithAuth('/api/proxy-post', {
    method: 'POST',
    credentials: 'include',
    proxyParams: {
      targetPath: `trade-flashcard/cards/${cardId}/convert-to-flashcard`,
      actualMethod: 'POST',
    },
    actualBody: payload,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '转换为常规训练闪卡失败');
  return data.data;
}

export async function deleteTradeFlashcardCard(cardId: string): Promise<void> {
  const res = await fetchWithAuth('/api/proxy-post', {
    method: 'POST',
    credentials: 'include',
    proxyParams: {
      targetPath: `trade-flashcard/cards/${cardId}`,
      actualMethod: 'DELETE',
    },
    actualBody: {},
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || '删除交易闪卡失败');
}
