export const FLASHCARD_DIRECTIONS = ["LONG", "SHORT", "NO_TRADE"] as const;
export type FlashcardDirection = (typeof FLASHCARD_DIRECTIONS)[number];
export type FlashcardAction = FlashcardDirection;

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
export const FLASHCARD_SOURCES = ["ALL", "WRONG_BOOK", "FAVORITES"] as const;
export type FlashcardSource = (typeof FLASHCARD_SOURCES)[number];

export type FlashcardCard = {
  id: string;
  userId: string;
  cardId: string;
  questionImageUrl: string;
  answerImageUrl: string;
  expectedAction?: FlashcardAction;
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

export type FlashcardDrillStartResponse = {
  sessionId: string;
  source: FlashcardSource;
  count: number;
  cards: FlashcardCard[];
};

export type FlashcardDrillStats = {
  total: number;
  answered: number;
  correct: number;
  wrong: number;
  accuracy: number;
  score: number;
  status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
};

export const FLASHCARD_LABELS: Record<string, string> = {
  LONG: "做多",
  SHORT: "做空",
  NO_TRADE: "不交易",
  ALL: "全部题库",
  WRONG_BOOK: "错题集",
  FAVORITES: "收藏库",
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
