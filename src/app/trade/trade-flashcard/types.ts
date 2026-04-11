export const TRADE_FLASHCARD_TYPES = ['REAL_TRADE', 'SIM_TRADE'] as const;
export type TradeFlashcardType = (typeof TRADE_FLASHCARD_TYPES)[number];

export const TRADE_FLASHCARD_STATUSES = ['PRE_ENTRY', 'IN_PROGRESS', 'POST_ENTRY', 'COMPLETED'] as const;
export type TradeFlashcardStatus = (typeof TRADE_FLASHCARD_STATUSES)[number];

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
  status: TradeFlashcardStatus;
  preEntryImageUrl: string;
  postEntryImageUrl?: string;
  progressImageUrls?: string[];
  marketTimeInfo?: string;
  symbolPairInfo?: string;
  playbookType?: string;
  notes?: string;
  tagCodes?: string[];
  tagItems?: TradeFlashcardDictionaryTagItem[];
  createdAt: string;
  updatedAt: string;
};

export const TRADE_FLASHCARD_LABELS: Record<string, string> = {
  REAL_TRADE: '交易闪卡',
  SIM_TRADE: '模拟交易闪卡',
  PRE_ENTRY: '入场前',
  IN_PROGRESS: '入场中',
  POST_ENTRY: '入场后',
  COMPLETED: '全生命周期',
  CREATED_AT: '创建时间',
  UPDATED_AT: '最后编辑时间',
};
