import { fetchWithAuth } from '@/utils/fetchWithAuth';
import type {
  PracticalFlashcardAttempt,
  PracticalFlashcardCard,
  PracticalFlashcardDashboardAnalytics,
  PracticalFlashcardDirection,
  PracticalFlashcardExitReason,
  PracticalFlashcardRunningStats,
  PracticalFlashcardStatus,
  PracticalFlashcardTradeDirection,
  PracticalFlashcardVenue,
} from './types';

export type CreatePracticalFlashcardPayload = {
  venue: PracticalFlashcardVenue;
  symbolPairInfo: string;
  entryTimeInfo: string;
  exitTimeInfo: string;
  primaryInterval?: '15m';
  timeZone?: string;
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

export type UpdatePracticalFlashcardPayload = {
  status?: PracticalFlashcardStatus;
  entryTimeInfo?: string;
  exitTimeInfo?: string;
  timeZone?: string;
  expectedDirection?: PracticalFlashcardDirection | null;
  standardEntryPrice?: number | null;
  standardStopLossPrice?: number | null;
  standardTakeProfitPrice?: number | null;
  playbookType?: string;
  tagCodes?: string[];
  orderFlowImageUrls?: string[];
  orderFlowRemark?: string | null;
  notes?: string | null;
  summary?: string | null;
};

export type CreatePracticalFlashcardAttemptTradePayload = {
  direction: PracticalFlashcardTradeDirection;
  currentCandleIndex: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  drawingSnapshot?: Record<string, unknown>;
  preTradeMarketStructureAnalysis: string;
  preTradePriceActionAnalysis?: string;
  preTradeOrderFlowAnalysis?: string;
};

export type ResolvePracticalFlashcardAttemptPayload = {
  finalCandleIndex?: number;
  marketStructureAnalysisCorrect?: boolean;
  priceActionAnalysisCorrect?: boolean;
  orderFlowAnalysisUsed?: boolean;
  orderFlowAnalysisCorrect?: boolean;
  riskRewardSetupCorrect?: boolean;
  tradeClosedCandleIndex?: number;
  exitPrice?: number;
  exitReason?: PracticalFlashcardExitReason;
  drawingSnapshot?: Record<string, unknown>;
  mistakeReasons?: string[];
  notes?: string;
  summary?: string;
};

export type StartRandomPracticalFlashcardTrainingPayload = {
  symbolPairInfo?: string;
  playbookType?: string;
  tagCodes?: string[];
  excludeRecentlyResolved?: boolean;
};

export type PracticalFlashcardDashboardAnalyticsParams = {
  from?: string;
  to?: string;
  playbookType?: string;
  symbolPairInfo?: string;
};

export function getBrowserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai';
}

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

export async function getPracticalFlashcardCard(cardId: string): Promise<PracticalFlashcardCard> {
  const res = await fetchWithAuth('/api/proxy-post', {
    method: 'POST',
    credentials: 'include',
    proxyParams: {
      targetPath: `practical-flashcard/cards/${cardId}`,
      actualMethod: 'GET',
    },
    actualBody: {},
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '获取实操闪卡失败');
  return data.data as PracticalFlashcardCard;
}

export async function updatePracticalFlashcardCard(
  cardId: string,
  payload: UpdatePracticalFlashcardPayload,
): Promise<PracticalFlashcardCard> {
  const res = await fetchWithAuth('/api/proxy-post', {
    method: 'POST',
    credentials: 'include',
    proxyParams: {
      targetPath: `practical-flashcard/cards/${cardId}`,
      actualMethod: 'PATCH',
    },
    actualBody: Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined)),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '更新实操闪卡失败');
  return data.data as PracticalFlashcardCard;
}

export async function startPracticalFlashcardAttempt(
  cardId: string,
): Promise<{ attemptId: string; attempt: PracticalFlashcardAttempt; card: PracticalFlashcardCard }> {
  const res = await fetchWithAuth('/api/proxy-post', {
    method: 'POST',
    credentials: 'include',
    proxyParams: {
      targetPath: 'practical-flashcard/attempts/start',
      actualMethod: 'POST',
    },
    actualBody: { cardId },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '开始实操训练失败');
  return data.data as { attemptId: string; attempt: PracticalFlashcardAttempt; card: PracticalFlashcardCard };
}

export async function startRandomPracticalFlashcardTraining(
  payload: StartRandomPracticalFlashcardTrainingPayload = {},
): Promise<{ attemptId: string; attempt: PracticalFlashcardAttempt; card: PracticalFlashcardCard }> {
  const res = await fetchWithAuth('/api/proxy-post', {
    method: 'POST',
    credentials: 'include',
    proxyParams: {
      targetPath: 'practical-flashcard/training/random/start',
      actualMethod: 'POST',
    },
    actualBody: sanitizePayload(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '开始随机实操训练失败');
  return data.data as { attemptId: string; attempt: PracticalFlashcardAttempt; card: PracticalFlashcardCard };
}

export async function getPracticalFlashcardAttempt(attemptId: string): Promise<PracticalFlashcardAttempt> {
  const res = await fetchWithAuth('/api/proxy-post', {
    method: 'POST',
    credentials: 'include',
    proxyParams: {
      targetPath: `practical-flashcard/attempts/${attemptId}`,
      actualMethod: 'GET',
    },
    actualBody: {},
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '获取实操训练记录失败');
  return data.data as PracticalFlashcardAttempt;
}

export async function createPracticalFlashcardAttemptTrade(
  attemptId: string,
  payload: CreatePracticalFlashcardAttemptTradePayload,
): Promise<PracticalFlashcardAttempt> {
  const res = await fetchWithAuth('/api/proxy-post', {
    method: 'POST',
    credentials: 'include',
    proxyParams: {
      targetPath: `practical-flashcard/attempts/${attemptId}/trade`,
      actualMethod: 'POST',
    },
    actualBody: sanitizePayload(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '确认交易失败');
  return data.data as PracticalFlashcardAttempt;
}

export async function resolvePracticalFlashcardAttempt(
  attemptId: string,
  payload: ResolvePracticalFlashcardAttemptPayload,
): Promise<{ attempt: PracticalFlashcardAttempt; runningStats: PracticalFlashcardRunningStats }> {
  const res = await fetchWithAuth('/api/proxy-post', {
    method: 'POST',
    credentials: 'include',
    proxyParams: {
      targetPath: `practical-flashcard/attempts/${attemptId}/resolve`,
      actualMethod: 'POST',
    },
    actualBody: sanitizePayload(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '完成训练失败');
  return data.data as { attempt: PracticalFlashcardAttempt; runningStats: PracticalFlashcardRunningStats };
}

export async function getPracticalFlashcardDashboardAnalytics(
  params: PracticalFlashcardDashboardAnalyticsParams = {},
): Promise<PracticalFlashcardDashboardAnalytics> {
  const searchParams = new URLSearchParams();
  if (params.from) searchParams.set('from', params.from);
  if (params.to) searchParams.set('to', params.to);
  if (params.playbookType) searchParams.set('playbookType', params.playbookType);
  if (params.symbolPairInfo) searchParams.set('symbolPairInfo', params.symbolPairInfo);
  const targetPath = `practical-flashcard/analytics/dashboard${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const res = await fetchWithAuth('/api/proxy-post', {
    method: 'POST',
    credentials: 'include',
    proxyParams: { targetPath, actualMethod: 'GET' },
    actualBody: {},
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '获取实操闪卡训练统计失败');
  return data.data as PracticalFlashcardDashboardAnalytics;
}
