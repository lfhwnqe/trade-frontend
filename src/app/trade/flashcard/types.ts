export const FLASHCARD_DIRECTIONS = ["LONG", "SHORT", "NO_TRADE"] as const;
export type FlashcardDirection = (typeof FLASHCARD_DIRECTIONS)[number];

export const FLASHCARD_CONTEXTS = ["TREND", "RANGE", "REVERSAL"] as const;
export type FlashcardContext = (typeof FLASHCARD_CONTEXTS)[number];

export const FLASHCARD_ORDER_FLOW_FEATURES = [
  "CVD_ABSORPTION_DIVERGENCE",
  "FOOTPRINT_IMBALANCE_CLUSTER",
  "NO_CLEAR_ANOMALY",
  "SWEEP",
] as const;
export type FlashcardOrderFlowFeature =
  (typeof FLASHCARD_ORDER_FLOW_FEATURES)[number];

export const FLASHCARD_RESULTS = ["WIN", "LOSS", "BREAK_EVEN"] as const;
export type FlashcardResult = (typeof FLASHCARD_RESULTS)[number];

export type FlashcardCard = {
  id: string;
  userId: string;
  cardId: string;
  questionImageUrl: string;
  answerImageUrl: string;
  direction: FlashcardDirection;
  context: FlashcardContext;
  orderFlowFeature: FlashcardOrderFlowFeature;
  result: FlashcardResult;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type FlashcardFilters = {
  direction?: FlashcardDirection[];
  context?: FlashcardContext[];
  orderFlowFeature?: FlashcardOrderFlowFeature[];
  result?: FlashcardResult[];
};

export const FLASHCARD_LABELS: Record<string, string> = {
  LONG: "做多",
  SHORT: "做空",
  NO_TRADE: "不交易",
  TREND: "趋势",
  RANGE: "震荡",
  REVERSAL: "反转",
  CVD_ABSORPTION_DIVERGENCE: "CVD 吸收背离",
  FOOTPRINT_IMBALANCE_CLUSTER: "Footprint 失衡簇",
  NO_CLEAR_ANOMALY: "无明显异常",
  SWEEP: "流动性扫单",
  WIN: "盈利",
  LOSS: "亏损",
  BREAK_EVEN: "保本",
};
