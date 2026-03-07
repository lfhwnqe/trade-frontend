export const FLASHCARD_DIRECTIONS = ["LONG", "SHORT", "NO_TRADE"] as const;
export type FlashcardDirection = (typeof FLASHCARD_DIRECTIONS)[number];
export type FlashcardAction = FlashcardDirection;

export const FLASHCARD_BEHAVIOR_TYPES = [
  "REJECTION",
  "FAKE_BREAK_RECLAIM",
  "BREAK_ACCEPTANCE",
  "BREAK_RETEST",
  "CHOP",
  "SECOND_CONFIRMATION",
] as const;
export type FlashcardBehaviorType =
  (typeof FLASHCARD_BEHAVIOR_TYPES)[number];

export const FLASHCARD_INVALIDATION_TYPES = [
  "ZONE_OUTSIDE",
  "WICK_EXTREME",
  "MICRO_STRUCTURE",
  "REENTER_ZONE",
  "NONE",
] as const;
export type FlashcardInvalidationType =
  (typeof FLASHCARD_INVALIDATION_TYPES)[number];
export const FLASHCARD_SOURCES = ["ALL", "WRONG_BOOK", "FAVORITES"] as const;
export type FlashcardSource = (typeof FLASHCARD_SOURCES)[number];

export type FlashcardCard = {
  id: string;
  userId: string;
  cardId: string;
  questionImageUrl: string;
  answerImageUrl: string;
  expectedAction?: FlashcardAction;
  behaviorType?: FlashcardBehaviorType;
  invalidationType?: FlashcardInvalidationType;
  direction?: FlashcardDirection;
  marketTimeInfo?: string;
  symbolPairInfo?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type FlashcardFilters = {
  behaviorType?: FlashcardBehaviorType[];
  invalidationType?: FlashcardInvalidationType[];
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

export type FlashcardDrillSessionHistoryItem = {
  sessionId: string;
  source: FlashcardSource;
  total: number;
  answered: number;
  correct: number;
  wrong: number;
  accuracy: number;
  score: number;
  status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
  startedAt: string;
  endedAt?: string;
  updatedAt: string;
};

export const FLASHCARD_BEHAVIOR_EXPLANATIONS: Record<
  FlashcardBehaviorType,
  { summary: string; whenToUse: string }
> = {
  REJECTION: {
    summary: "价格触区后明显被拒绝，迅速离开关键区域。",
    whenToUse: "适合区域边缘一碰就走，方向依据来自拒绝本身。",
  },
  FAKE_BREAK_RECLAIM: {
    summary: "先刺穿关键位，再快速收回区域内。",
    whenToUse: "适合你判断这是诱骗突破，真正机会在收回后出现。",
  },
  BREAK_ACCEPTANCE: {
    summary: "突破后在区域外持续成交/收线，说明旧区域失效。",
    whenToUse: "适合你认为突破被市场接受，不是单根插针。",
  },
  BREAK_RETEST: {
    summary: "突破成立后回踩确认，再沿突破方向延续。",
    whenToUse: "适合机会来自回踩确认，不是第一次突破当下。",
  },
  CHOP: {
    summary: "区域内来回扫动，结构混乱，没有清晰优势。",
    whenToUse: "适合题目的重点是识别不该做，而不是猜方向。",
  },
  SECOND_CONFIRMATION: {
    summary: "第一次触区不够清晰，需要二次测试或小结构确认。",
    whenToUse: "适合需要等二次确认才有把握出手的题。",
  },
};

export const FLASHCARD_INVALIDATION_EXPLANATIONS: Record<
  FlashcardInvalidationType,
  { summary: string; whenToUse: string }
> = {
  ZONE_OUTSIDE: {
    summary: "价格有效突破区域外侧，原有逻辑失效。",
    whenToUse: "适合止损核心在区域边界是否被真正打穿。",
  },
  WICK_EXTREME: {
    summary: "关键插针高/低点再次被打穿，拒绝/假破逻辑失效。",
    whenToUse: "适合你的认错点是极值不能再被破坏。",
  },
  MICRO_STRUCTURE: {
    summary: "小级别结构、CHoCH/BOS 或二次确认被破坏。",
    whenToUse: "适合入场依赖微结构成立，一旦结构坏掉就要认错。",
  },
  REENTER_ZONE: {
    summary: "价格本应离开区域，后来又吞回并重新接受在区域内。",
    whenToUse: "适合突破/离区逻辑失效，重点在是否重新回到区域内部。",
  },
  NONE: {
    summary: "这题只训练方向识别，不强调具体止损框架。",
    whenToUse: "适合你只想练看法，不想把题做成完整执行模型。",
  },
};

export const FLASHCARD_LABELS: Record<string, string> = {
  LONG: "做多",
  SHORT: "做空",
  NO_TRADE: "不交易",
  ALL: "全部题库",
  WRONG_BOOK: "错题集",
  FAVORITES: "收藏库",
  REJECTION: "拒绝",
  FAKE_BREAK_RECLAIM: "假突破收回",
  BREAK_ACCEPTANCE: "突破接受",
  BREAK_RETEST: "突破回踩",
  CHOP: "震荡混乱",
  SECOND_CONFIRMATION: "二次确认",
  ZONE_OUTSIDE: "区域外失效",
  WICK_EXTREME: "插针极值失效",
  MICRO_STRUCTURE: "微结构失效",
  REENTER_ZONE: "重回区域失效",
  NONE: "仅方向识别",
};
