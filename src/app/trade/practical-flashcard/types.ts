export const PRACTICAL_FLASHCARD_VENUES = ['BINANCE_UM_FUTURES'] as const;
export type PracticalFlashcardVenue = (typeof PRACTICAL_FLASHCARD_VENUES)[number];

export const PRACTICAL_FLASHCARD_BINANCE_UM_SYMBOLS = ['BTCUSDT', 'BTCUSDC', 'ETHUSDT', 'ETHUSDC'] as const;
export type PracticalFlashcardBinanceUmSymbol = (typeof PRACTICAL_FLASHCARD_BINANCE_UM_SYMBOLS)[number];

export const PRACTICAL_FLASHCARD_DIRECTIONS = ['LONG', 'SHORT', 'NO_ENTRY'] as const;
export type PracticalFlashcardDirection = (typeof PRACTICAL_FLASHCARD_DIRECTIONS)[number];
export type PracticalFlashcardTradeDirection = Exclude<PracticalFlashcardDirection, 'NO_ENTRY'>;

export type PracticalFlashcardStatus = 'ACTIVE' | 'DISABLED';
export type PracticalFlashcardInterval = '15m';
export type PracticalFlashcardAttemptStatus = 'IN_PROGRESS' | 'RESOLVED' | 'ABANDONED';
export type PracticalFlashcardTrainingMode = 'DIRECT_CARD' | 'RANDOM_TRAINING';
export type PracticalFlashcardExitReason = 'TAKE_PROFIT' | 'STOP_LOSS' | 'MANUAL_EXIT' | 'NO_EXIT_BY_FINAL_CANDLE';

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
  ownerRole?: string;
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

export type PracticalFlashcardAttempt = {
  id: string;
  userId: string;
  cardId: string;
  entityType: 'PRACTICAL_FLASHCARD_ATTEMPT';
  attemptId: string;
  targetCardId: string;
  targetCardOwnerUserId?: string;
  status: PracticalFlashcardAttemptStatus;
  trainingMode?: PracticalFlashcardTrainingMode;
  cardSnapshot?: {
    playbookType: string;
    tagCodes?: string[];
    symbolPairInfo: string;
    primaryInterval: PracticalFlashcardInterval;
    expectedDirection?: PracticalFlashcardDirection;
  };
  decision?: PracticalFlashcardDirection;
  tradeOpenedCandleIndex?: number;
  tradeDirection?: PracticalFlashcardTradeDirection;
  entryPrice?: number;
  stopLossPrice?: number;
  takeProfitPrice?: number;
  plannedRr?: number;
  tradeClosedCandleIndex?: number;
  exitPrice?: number;
  exitReason?: PracticalFlashcardExitReason;
  preTradeMarketStructureAnalysis?: string;
  preTradePriceActionAnalysis?: string;
  preTradeOrderFlowAnalysis?: string;
  realizedR?: number;
  isWin?: boolean;
  maxFavorableR?: number;
  maxAdverseR?: number;
  finalCandleIndex?: number;
  currentCandleIndex?: number;
  drawingSnapshot?: unknown;
  tradeExecutionSnapshot?: {
    entryCandleIndex: number;
    entryCandleOpenTime: number;
    entryPrice: number;
    exitCandleIndex?: number;
    exitCandleOpenTime?: number;
    exitPrice?: number;
    exitReason?: PracticalFlashcardExitReason;
    stopLossPrice: number;
    takeProfitPrice: number;
    tradeDirection: PracticalFlashcardTradeDirection;
  };
  usedOrderFlowReveal?: boolean;
  orderFlowRevealEvents?: Array<{ imageUrl: string; candleIndex: number; revealedAt: string }>;
  marketStructureAnalysisCorrect?: boolean;
  priceActionAnalysisCorrect?: boolean;
  orderFlowAnalysisCorrect?: boolean;
  orderFlowAnalysisUsed?: boolean;
  riskRewardSetupCorrect?: boolean;
  mistakeReasons?: string[];
  notes?: string;
  summary?: string;
  startedAt: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type PracticalFlashcardRunningStats = {
  attemptCount: number;
  resolvedCount: number;
  winRate: number | null;
  avgRealizedR: number | null;
  totalRealizedR: number;
  avgPlannedRr: number | null;
  orderFlowRevealRate: number | null;
};

export type PracticalFlashcardAnalyticsGroup = {
  key: string;
  label: string;
  attemptCount: number;
  resolvedCount: number;
  winCount: number;
  winRate: number | null;
  avgRealizedR: number | null;
  totalRealizedR: number;
  avgPlannedRr: number | null;
};

export type PracticalFlashcardAnalysisDimensionStats = {
  key: string;
  label: string;
  reviewedCount: number;
  correctCount: number;
  wrongCount: number;
  correctRate: number | null;
};

export type PracticalFlashcardAnalyticsAttemptSample = {
  attemptId: string;
  targetCardId: string;
  resolvedAt?: string;
  symbolPairInfo?: string;
  playbookType?: string;
  tradeDirection?: PracticalFlashcardTradeDirection;
  realizedR?: number;
  isWin?: boolean;
  mistakeReasons?: string[];
  summary?: string;
};

export type PracticalFlashcardDashboardAnalytics = PracticalFlashcardRunningStats & {
  filters: {
    from?: string;
    to?: string;
    playbookType?: string;
    symbolPairInfo?: string;
  };
  analysisDimensions: PracticalFlashcardAnalysisDimensionStats[];
  playbookStats: PracticalFlashcardAnalyticsGroup[];
  symbolStats: PracticalFlashcardAnalyticsGroup[];
  cardStats: PracticalFlashcardAnalyticsGroup[];
  recentAttempts: PracticalFlashcardAnalyticsAttemptSample[];
  recentWrongAttempts: PracticalFlashcardAnalyticsAttemptSample[];
};

export const PRACTICAL_FLASHCARD_LABELS: Record<string, string> = {
  BINANCE_UM_FUTURES: 'Binance U 本位合约',
  ACTIVE: '可训练',
  DISABLED: '已停用',
  LONG: '做多',
  SHORT: '做空',
  NO_ENTRY: '不入场',
};
