export const TRADINGVIEW_TRAINING_RECORD_RESULTS = ["WIN", "LOSS", "BREAKEVEN"] as const;
export type TradingViewTrainingRecordResult = (typeof TRADINGVIEW_TRAINING_RECORD_RESULTS)[number];

export const TRADINGVIEW_TRAINING_RECORD_SORT_BYS = ["CREATED_AT", "UPDATED_AT"] as const;
export type TradingViewTrainingRecordSortBy = (typeof TRADINGVIEW_TRAINING_RECORD_SORT_BYS)[number];

export const TRADINGVIEW_TRAINING_RECORD_SORT_ORDERS = ["asc", "desc"] as const;
export type TradingViewTrainingRecordSortOrder = (typeof TRADINGVIEW_TRAINING_RECORD_SORT_ORDERS)[number];

export type TradingViewTrainingRecordPlaybookItem = {
  code: string;
  label: string;
  color?: string;
  status?: string;
};

export type TradingViewTrainingRecord = {
  id: string;
  userId: string;
  cardId?: string;
  recordId: string;
  entityType: "TRADINGVIEW_TRAINING_RECORD";
  symbolPair?: string;
  imageUrl: string;
  imageKey?: string;
  tradeResult: TradingViewTrainingRecordResult;
  playbookType: string;
  playbookItem?: TradingViewTrainingRecordPlaybookItem;
  entryConfidenceRating: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  reviewCandleTime?: string;
  trainingTime?: string;
  status: "ACTIVE" | "DELETED";
  createdAt: string;
  updatedAt: string;
};

export type TradingViewTrainingRecordSummary = {
  totalCount: number;
  winCount: number;
  lossCount: number;
  breakevenCount: number;
  decisiveCount: number;
  winRate: number | null;
  avgEntryConfidenceRating: number | null;
};

export type TradingViewTrainingRecordPlaybookAnalytics = TradingViewTrainingRecordSummary & {
  playbookType: string;
  playbookItem?: TradingViewTrainingRecordPlaybookItem;
};

export const TRADINGVIEW_TRAINING_RECORD_LABELS: Record<string, string> = {
  WIN: "盈利",
  LOSS: "亏损",
  BREAKEVEN: "保本",
  CREATED_AT: "创建时间",
  UPDATED_AT: "最后编辑时间",
};
