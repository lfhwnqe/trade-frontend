export const FLASHCARD_DIRECTIONS = ["LONG", "SHORT", "NO_TRADE"] as const;
export type FlashcardDirection = (typeof FLASHCARD_DIRECTIONS)[number];
export type FlashcardAction = FlashcardDirection;

export const FLASHCARD_RECOMMENDED_BEHAVIOR_TYPES = [
  "ZONE_REJECTION",
  "ZONE_FAKE_BREAK",
  "STRONG_BREAKOUT_CLOSE",
  "BREAKOUT_RETEST_CONTINUATION",
  "HH_LL_RECLAIM_CONTINUATION",
  "SECOND_TEST_CONFIRMATION",
  "ZONE_CHOP_NO_EDGE",
] as const;

export const FLASHCARD_LEGACY_BEHAVIOR_TYPES = [
  "REJECTION",
  "FAKE_BREAK_RECLAIM",
  "BREAK_ACCEPTANCE",
  "BREAK_RETEST",
  "CHOP",
  "SECOND_CONFIRMATION",
] as const;
export const FLASHCARD_BEHAVIOR_TYPES = [
  ...FLASHCARD_RECOMMENDED_BEHAVIOR_TYPES,
  ...FLASHCARD_LEGACY_BEHAVIOR_TYPES,
] as const;
export type FlashcardBehaviorType =
  (typeof FLASHCARD_BEHAVIOR_TYPES)[number];

export const FLASHCARD_RECOMMENDED_INVALIDATION_TYPES = [
  "REJECTION_EXTREME_BROKEN",
  "FALSE_BREAK_SIDE_REACCEPTED",
  "BREAKOUT_BACK_IN_ZONE",
  "RETEST_FLIP_FAILED",
  "HH_LL_CONFIRMATION_FAILED",
  "MICRO_STRUCTURE_BROKEN",
  "NO_EXPANSION_AFTER_TRIGGER",
  "ZONE_DWELL_FAILURE",
  "NONE",
] as const;

export const FLASHCARD_LEGACY_INVALIDATION_TYPES = [
  "ZONE_OUTSIDE",
  "WICK_EXTREME",
  "MICRO_STRUCTURE",
  "REENTER_ZONE",
  "NONE",
] as const;
export const FLASHCARD_INVALIDATION_TYPES = [
  ...FLASHCARD_RECOMMENDED_INVALIDATION_TYPES,
  ...FLASHCARD_LEGACY_INVALIDATION_TYPES.filter((item) => item !== "NONE"),
] as const;
export type FlashcardInvalidationType =
  (typeof FLASHCARD_INVALIDATION_TYPES)[number];
export const FLASHCARD_SOURCES = ["ALL", "WRONG_BOOK", "FAVORITES"] as const;
export type FlashcardSource = (typeof FLASHCARD_SOURCES)[number];

export const FLASHCARD_BEHAVIOR_OPTION_GROUPS: ReadonlyArray<{
  label: string;
  items: readonly FlashcardBehaviorType[];
}> = [
  { label: "推荐分类（system v5）", items: FLASHCARD_RECOMMENDED_BEHAVIOR_TYPES },
  { label: "兼容旧题", items: FLASHCARD_LEGACY_BEHAVIOR_TYPES },
];

export const FLASHCARD_BEHAVIOR_SELECT_OPTION_GROUPS: ReadonlyArray<{
  label: string;
  items: readonly FlashcardBehaviorType[];
}> = [
  { label: "推荐分类（system v5）", items: FLASHCARD_RECOMMENDED_BEHAVIOR_TYPES },
];

export const FLASHCARD_INVALIDATION_OPTION_GROUPS: ReadonlyArray<{
  label: string;
  items: readonly FlashcardInvalidationType[];
}> = [
  { label: "推荐分类（system v5）", items: FLASHCARD_RECOMMENDED_INVALIDATION_TYPES },
  {
    label: "兼容旧题",
    items: FLASHCARD_LEGACY_INVALIDATION_TYPES.filter(
      (item) => item !== "NONE",
    ) as readonly FlashcardInvalidationType[],
  },
];

export const FLASHCARD_INVALIDATION_SELECT_OPTION_GROUPS: ReadonlyArray<{
  label: string;
  items: readonly FlashcardInvalidationType[];
}> = [
  { label: "推荐分类（system v5）", items: FLASHCARD_RECOMMENDED_INVALIDATION_TYPES },
];

export function isLegacyFlashcardBehaviorType(
  value?: FlashcardBehaviorType | "",
): value is FlashcardBehaviorType {
  return Boolean(value && FLASHCARD_LEGACY_BEHAVIOR_TYPES.includes(value as never));
}

export function isLegacyFlashcardInvalidationType(
  value?: FlashcardInvalidationType | "",
): value is FlashcardInvalidationType {
  return Boolean(
    value &&
      FLASHCARD_LEGACY_INVALIDATION_TYPES.includes(value as never) &&
      value !== "NONE",
  );
}

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
  ZONE_REJECTION: {
    summary: "价格触及支撑/阻力区域后被明显拒绝，常见于锤子线、长影线、吞没或强收盘。",
    whenToUse: "适合你的优势来自区域本身的反应，而不是先突破再回踩。",
  },
  ZONE_FAKE_BREAK: {
    summary: "价格先刺穿支撑/阻力区域，再快速收回区域内，属于典型假突破/扫流动性。",
    whenToUse: "适合亚盘、欧盘或你明确在训练区域假突破反转的题。",
  },
  STRONG_BREAKOUT_CLOSE: {
    summary: "突破区域的 K 线实体足够大、方向明确，并且收盘坚决站到区域外。",
    whenToUse: "适合你训练第一段突破是否真的有方向性，而不是把弱突破当真突破。",
  },
  BREAKOUT_RETEST_CONTINUATION: {
    summary: "有效突破后回踩原区域边缘，确认支撑阻力互换成功，再沿突破方向延续。",
    whenToUse: "适合你的交易机会来自 Break & Retest，而不是第一次突破当下。",
  },
  HH_LL_RECLAIM_CONTINUATION: {
    summary: "突破后先形成 higher high / lower low，回到旧区域附近后重新站回 HH/LL 并收在其外侧。",
    whenToUse: "适合你训练“回踩后重新夺回趋势延续位”的方向确认。",
  },
  SECOND_TEST_CONFIRMATION: {
    summary: "第一次触区不够清晰，需要二次测试、二次反应或小结构确认后才有把握。",
    whenToUse: "适合你明确要求等第二次确认，而不是第一次触区就做。",
  },
  ZONE_CHOP_NO_EDGE: {
    summary: "价格在区域附近来回徘徊、反复扫动，没有形成清晰方向性或扩张。",
    whenToUse: "适合题目的核心是识别“不该做”，尤其是区域久盘后优势消失。",
  },
  REJECTION: {
    summary: "价格触区后明显被拒绝，迅速离开关键区域。",
    whenToUse: "旧题兼容项，建议新题优先改用“支撑阻力区拒绝”。",
  },
  FAKE_BREAK_RECLAIM: {
    summary: "先刺穿关键位，再快速收回区域内。",
    whenToUse: "旧题兼容项，建议新题优先改用“区域假突破收回”。",
  },
  BREAK_ACCEPTANCE: {
    summary: "突破后在区域外持续成交/收线，说明旧区域失效。",
    whenToUse: "旧题兼容项，建议新题优先改用“强势突破收盘”。",
  },
  BREAK_RETEST: {
    summary: "突破成立后回踩确认，再沿突破方向延续。",
    whenToUse: "旧题兼容项，建议新题优先改用“突破回踩延续”。",
  },
  CHOP: {
    summary: "区域内来回扫动，结构混乱，没有清晰优势。",
    whenToUse: "旧题兼容项，建议新题优先改用“区域混乱观望”。",
  },
  SECOND_CONFIRMATION: {
    summary: "第一次触区不够清晰，需要二次测试或小结构确认。",
    whenToUse: "旧题兼容项，建议新题优先改用“二次测试确认”。",
  },
};

export const FLASHCARD_INVALIDATION_EXPLANATIONS: Record<
  FlashcardInvalidationType,
  { summary: string; whenToUse: string }
> = {
  REJECTION_EXTREME_BROKEN: {
    summary: "支撑/阻力区的拒绝高点或低点被再次打穿，原本的拒绝逻辑失效。",
    whenToUse: "适合锤子线、长影线、吞没等区域拒绝题的认错位置。",
  },
  FALSE_BREAK_SIDE_REACCEPTED: {
    summary: "假突破收回后，价格又重新接受在被假破的一侧，说明假突破判断失败。",
    whenToUse: "适合你把机会定义为“刺破后收回”，一旦重新接受在外侧就该认错。",
  },
  BREAKOUT_BACK_IN_ZONE: {
    summary: "原本已经有效突破区域，但后续重新跌回/涨回区域内部，突破宣告失败。",
    whenToUse: "适合突破单，尤其是你明确以“不能重新回区”为核心条件时。",
  },
  RETEST_FLIP_FAILED: {
    summary: "突破回踩时，原阻力变支撑或原支撑变阻力没有守住，S/R Flip 失败。",
    whenToUse: "适合 Break & Retest 结构，一旦回踩翻转失败就不该继续持有。",
  },
  HH_LL_CONFIRMATION_FAILED: {
    summary: "回踩后没能重新站回 HH/LL，或刚站回就被再次跌破/涨破，延续确认失败。",
    whenToUse: "适合你训练 higher high / lower low 重夺确认的题。",
  },
  MICRO_STRUCTURE_BROKEN: {
    summary: "小级别 CHOCH/BOS、二次确认结构或局部节奏被破坏，入场依据消失。",
    whenToUse: "适合依赖 15min 微结构、二次确认、局部拐点的题。",
  },
  NO_EXPANSION_AFTER_TRIGGER: {
    summary: "触发后迟迟没有走出预期方向扩张，反而进入犹豫或横住，说明方向性不足。",
    whenToUse: "适合你强调“入场后应该很快走出来”，否则就离场的执行模型。",
  },
  ZONE_DWELL_FAILURE: {
    summary: "价格在阻力/支撑区域附近反复徘徊，既不拒绝也不延续，区域优势被消耗。",
    whenToUse: "适合 system v5 里“区域久盘后转混乱市场”的场景。",
  },
  ZONE_OUTSIDE: {
    summary: "价格有效突破区域外侧，原有逻辑失效。",
    whenToUse: "旧题兼容项，建议新题优先改用更具体的突破失败/翻转失败类型。",
  },
  WICK_EXTREME: {
    summary: "关键插针高/低点再次被打穿，拒绝/假破逻辑失效。",
    whenToUse: "旧题兼容项，建议新题优先改用“拒绝极值被破坏”。",
  },
  MICRO_STRUCTURE: {
    summary: "小级别结构、CHoCH/BOS 或二次确认被破坏。",
    whenToUse: "旧题兼容项，建议新题优先改用“微结构确认失效”。",
  },
  REENTER_ZONE: {
    summary: "价格本应离开区域，后来又吞回并重新接受在区域内。",
    whenToUse: "旧题兼容项，建议新题优先改用“突破后重回区域内”。",
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
  ZONE_REJECTION: "支撑阻力区拒绝",
  ZONE_FAKE_BREAK: "区域假突破收回",
  STRONG_BREAKOUT_CLOSE: "强势突破收盘",
  BREAKOUT_RETEST_CONTINUATION: "突破回踩延续",
  HH_LL_RECLAIM_CONTINUATION: "重回 HH/LL 延续",
  SECOND_TEST_CONFIRMATION: "二次测试确认",
  ZONE_CHOP_NO_EDGE: "区域混乱观望",
  REJECTION: "拒绝（旧）",
  FAKE_BREAK_RECLAIM: "假突破收回（旧）",
  BREAK_ACCEPTANCE: "突破接受（旧）",
  BREAK_RETEST: "突破回踩（旧）",
  CHOP: "震荡混乱（旧）",
  SECOND_CONFIRMATION: "二次确认（旧）",
  REJECTION_EXTREME_BROKEN: "拒绝极值被破坏",
  FALSE_BREAK_SIDE_REACCEPTED: "假突破一侧重新被接受",
  BREAKOUT_BACK_IN_ZONE: "突破后重回区域内",
  RETEST_FLIP_FAILED: "回踩翻转失败",
  HH_LL_CONFIRMATION_FAILED: "HH/LL 确认失败",
  MICRO_STRUCTURE_BROKEN: "微结构确认失效",
  NO_EXPANSION_AFTER_TRIGGER: "触发后无方向扩张",
  ZONE_DWELL_FAILURE: "区域久盘失效",
  ZONE_OUTSIDE: "区域外失效（旧）",
  WICK_EXTREME: "插针极值失效（旧）",
  MICRO_STRUCTURE: "微结构失效（旧）",
  REENTER_ZONE: "重回区域失效（旧）",
  NONE: "仅方向识别",
};
