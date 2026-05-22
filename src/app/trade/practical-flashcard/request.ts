import { fetchWithAuth } from '@/utils/fetchWithAuth';
import type {
  PracticalFlashcardCard,
  PracticalFlashcardDirection,
  PracticalFlashcardVenue,
} from './types';

export type CreatePracticalFlashcardPayload = {
  venue: PracticalFlashcardVenue;
  symbolPairInfo: string;
  entryTimeInfo: string;
  exitTimeInfo: string;
  primaryInterval?: '15m';
  snapshotStartTime?: string;
  snapshotEndTime?: string;
  expectedDirection?: PracticalFlashcardDirection;
  standardEntryPrice?: number;
  standardStopLossPrice?: number;
  standardTakeProfitPrice?: number;
  playbookType: string;
  tagCodes?: string[];
  orderFlowImageUrls?: string[];
  orderFlowRemark?: string;
  notes?: string;
  summary?: string;
};

function sanitizePayload<T extends object>(payload: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => {
      if (value === undefined) return false;
      if (typeof value === 'string') return value.trim() !== '';
      if (Array.isArray(value)) return value.length > 0;
      return true;
    }),
  );
}

export async function createPracticalFlashcardCard(
  payload: CreatePracticalFlashcardPayload,
): Promise<PracticalFlashcardCard> {
  const res = await fetchWithAuth('/api/proxy-post', {
    method: 'POST',
    credentials: 'include',
    proxyParams: {
      targetPath: 'practical-flashcard/cards',
      actualMethod: 'POST',
    },
    actualBody: sanitizePayload(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '创建实操闪卡失败');
  return data.data as PracticalFlashcardCard;
}

export async function listPracticalFlashcardCards(params?: {
  pageSize?: number;
  cursor?: string;
  status?: string;
  symbolPairInfo?: string;
  playbookType?: string;
}): Promise<{ items: PracticalFlashcardCard[]; totalCount: number; nextCursor: string | null }> {
  const searchParams = new URLSearchParams();
  if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
  if (params?.cursor) searchParams.set('cursor', params.cursor);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.symbolPairInfo) searchParams.set('symbolPairInfo', params.symbolPairInfo);
  if (params?.playbookType) searchParams.set('playbookType', params.playbookType);

  const targetPath = `practical-flashcard/cards${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const res = await fetchWithAuth('/api/proxy-post', {
    method: 'POST',
    credentials: 'include',
    proxyParams: { targetPath, actualMethod: 'GET' },
    actualBody: {},
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '查询实操闪卡失败');
  return {
    items: (data.data?.items || []) as PracticalFlashcardCard[],
    totalCount: typeof data.data?.totalCount === 'number' ? data.data.totalCount : 0,
    nextCursor: typeof data.data?.nextCursor === 'string' ? data.data.nextCursor : null,
  };
}
