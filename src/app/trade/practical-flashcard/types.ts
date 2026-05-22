export const PRACTICAL_FLASHCARD_VENUES = ['BINANCE_UM_FUTURES'] as const;
export type PracticalFlashcardVenue = (typeof PRACTICAL_FLASHCARD_VENUES)[number];

export const PRACTICAL_FLASHCARD_BINANCE_UM_SYMBOLS = ['BTCUSDT', 'BTCUSDC', 'ETHUSDT', 'ETHUSDC'] as const;
export type PracticalFlashcardBinanceUmSymbol = (typeof PRACTICAL_FLASHCARD_BINANCE_UM_SYMBOLS)[number];

export const PRACTICAL_FLASHCARD_DIRECTIONS = ['LONG', 'SHORT', 'NO_ENTRY'] as const;
export type PracticalFlashcardDirection = (typeof PRACTICAL_FLASHCARD_DIRECTIONS)[number];

export type PracticalFlashcardStatus = 'ACTIVE' | 'DISABLED';
export type PracticalFlashcardInterval = '15m';

export type PracticalFlashcardCandle = {
  openTime: number;
  closeTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type PracticalFlashcardCard = {
  id: string;
  userId: string;
  cardId: string;
  entityType: 'PRACTICAL_FLASHCARD';
  status: PracticalFlashcardStatus;
  venue: PracticalFlashcardVenue;
  symbolPairInfo: string;
  primaryInterval: PracticalFlashcardInterval;
  timeZone?: string;
  entryTimeInfo: string;
  exitTimeInfo: string;
  snapshotStartTime: string;
  snapshotEndTime: string;
  candles: PracticalFlashcardCandle[];
  initialVisibleCandleIndex: number;
  resultCandleIndex?: number;
  expectedDirection?: PracticalFlashcardDirection;
  standardEntryPrice?: number;
  standardStopLossPrice?: number;
  standardTakeProfitPrice?: number;
  playbookType: string;
  tagCodes?: string[];
  tagItems?: Array<{ code: string; label: string; color?: string; status?: string }>;
  orderFlowImageUrls?: string[];
  orderFlowRemark?: string;
  notes?: string;
  summary?: string;
  sourceTradeFlashcardId?: string;
  createdAt: string;
  updatedAt: string;
};

export const PRACTICAL_FLASHCARD_LABELS: Record<string, string> = {
  BINANCE_UM_FUTURES: 'Binance U 本位合约',
  ACTIVE: '可训练',
  DISABLED: '已停用',
  LONG: '做多',
  SHORT: '做空',
  NO_ENTRY: '不入场',
};
