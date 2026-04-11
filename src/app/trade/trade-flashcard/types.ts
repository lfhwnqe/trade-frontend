export const TRADE_FLASHCARD_TYPES = ['REAL_TRADE', 'SIM_TRADE'] as const;
export type TradeFlashcardType = (typeof TRADE_FLASHCARD_TYPES)[number];

export const TRADE_FLASHCARD_LIFECYCLE_STATUSES = ['IN_PROGRESS', 'COMPLETED'] as const;
export type TradeFlashcardLifecycleStatus = (typeof TRADE_FLASHCARD_LIFECYCLE_STATUSES)[number];

export const TRADE_FLASHCARD_PROCESS_RESULTS = ['SUCCESS', 'FAIL'] as const;
export type TradeFlashcardProcessResult = (typeof TRADE_FLASHCARD_PROCESS_RESULTS)[number];

export const TRADE_FLASHCARD_CARD_SORT_BYS = ['CREATED_AT', 'UPDATED_AT'] as const;
export type TradeFlashcardCardSortBy = (typeof TRADE_FLASHCARD_CARD_SORT_BYS)[number];

export const TRADE_FLASHCARD_CARD_SORT_ORDERS = ['asc', 'desc'] as const;
export type TradeFlashcardCardSortOrder = (typeof TRADE_FLASHCARD_CARD_SORT_ORDERS)[number];

export type TradeFlashcardDictionaryTagItem = {
  code: string;
  label: string;
  color?: string;
  status?: string;
};

export type TradeFlashcardCard = {
  id: string;
  userId: string;
  cardId: string;
  entityType: 'TRADE_FLASHCARD';
  tradeFlashcardType: TradeFlashcardType;
  lifecycleStatus: TradeFlashcardLifecycleStatus;
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
  convertedToFlashcardAt?: string;
  convertedFlashcardId?: string;
  tagCodes?: string[];
  tagItems?: TradeFlashcardDictionaryTagItem[];
  createdAt: string;
  updatedAt: string;
};

export const TRADE_FLASHCARD_LABELS: Record<string, string> = {
  REAL_TRADE: '交易闪卡',
  SIM_TRADE: '模拟交易闪卡',
  IN_PROGRESS: '进行中',
  COMPLETED: '已完成',
  SUCCESS: '成功',
  FAIL: '失败',
  CONVERTED_TO_FLASHCARD: '已转训练闪卡',
  CREATED_AT: '创建时间',
  UPDATED_AT: '最后编辑时间',
};
