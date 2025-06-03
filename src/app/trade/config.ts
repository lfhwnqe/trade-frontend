import { DateRange } from "react-day-picker";
/**
 * 交易表单枚举/选项配置（与后端 CreateTradeDto 保持同步）
 */

export type Option = { label: string; value: string }; // 新增 Option 类型

export enum EntryDirection {
  多 = "多",
  空 = "空",
}

export const entryDirectionOptions: Option[] = [
  { label: "多单", value: EntryDirection.多 },
  { label: "空单", value: EntryDirection.空 },
];

// 市场结构枚举
export enum MarketStructure {
  BALANCED = "震荡",
  IMBALANCED = "趋势",
  UNSEEN = "暂无法判断",
}

// 交易类型枚举
export enum TradeType {
  模拟交易 = "模拟交易",
  真实交易 = "真实交易",
}

// 交易类型选项
export const tradeTypeOptions = [
  { label: TradeType.模拟交易, value: TradeType.模拟交易 },
  { label: TradeType.真实交易, value: TradeType.真实交易 },
];
// 交易结果选项
export const tradeResultOptions = [
  { label: "盈利", value: "PROFIT" },
  { label: "亏损", value: "LOSS" },
  { label: "保本", value: "BREAKEVEN" },
];

// 计划选项
export const planOptions = [
  { label: "A计划", value: "A" },
  { label: "B计划", value: "B" },
  { label: "C计划", value: "C" },
];

export const marketStructureOptions = [
  { label: "震荡", value: MarketStructure.BALANCED },
  { label: "趋势", value: MarketStructure.IMBALANCED },
  { label: "暂无法判断", value: MarketStructure.UNSEEN },
];

/**
 * 用于跨页面/表单复用
 */
export const tradeFieldConfigs = {
  entryDirection: entryDirectionOptions,
  marketStructure: marketStructureOptions,
  tradeType: tradeTypeOptions,
};

export interface ImageResource {
  key: string;
  url: string;
}

export interface EntryPlan {
  entryReason?: string;
  entrySignal?: string;
  exitSignal?: string;
}

// 交易记录状态枚举
export enum TradeStatus {
  ANALYZED = "已分析",
  ENTERED = "已入场",
  EXITED = "已离场",
}
// 交易状态选项
export const tradeStatusOptions = [
  { label: "已分析", value: TradeStatus.ANALYZED },
  { label: "已入场", value: TradeStatus.ENTERED },
  { label: "已离场", value: TradeStatus.EXITED },
];
/**
 * Trade 前端完整类型定义，对齐后端 CreateTradeDto
 */
export type Trade = {
  analysisTime?: string;
  transactionId?: string;
  // 状态与基础分析
  tradeType?: TradeType; // 新增字段：交易类型
  status?: TradeStatus;
  dateTimeRange?: string;
  marketStructure?: MarketStructure;
  marketStructureAnalysis?: string;
  signalType?: string;

  // 图片相关（用数组类型）
  volumeProfileImages?: ImageResource[];
  expectedPathImages?: ImageResource[];
  expectedPathAnalysis?: string;
  actualPathImages?: ImageResource[];
  analysisImages?: ImageResource[];

  // 价格/价值区等
  vah?: string;
  val?: string;
  poc?: string;
  keyPriceLevels?: string;

  // 入场计划
  entryPlanA?: EntryPlan;
  entryPlanB?: EntryPlan;
  entryPlanC?: EntryPlan;

  // 入场记录
  entry?: string;
  entryTime?: string;
  entryDirection?: EntryDirection;
  stopLoss?: string;
  takeProfit?: string;
  entryReason?: string;

  // 离场分析及复盘
  exitPrice?: string;
  exitTime?: string;
  exitReason?: string;
  tradeResult?: string;
  followedPlan?: boolean;
  followedPlanId?: string;
  mentalityNotes?: string;
  actualPathAnalysis?: string;
  remarks?: string;
  lessonsLearned?: string;
  profitLossPercentage?: string;
  riskRewardRatio?: string;

  // 旧遗留/兼容字段
  tradeDuration?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  // 新增扩展字段
  grade?: string;
  analysisExpired?: boolean;
};

// 交易重要性分级枚举
export enum TradeGrade {
  高 = "高",
  中 = "中",
  低 = "低",
}
// 交易重要性分级选项
export const tradeGradeOptions = [
  { label: "高", value: TradeGrade.高 },
  { label: "中", value: TradeGrade.中 },
  { label: "低", value: TradeGrade.低 },
];

export type TradeListResponse = {
  items: Trade[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type TradeQuery = {
  dateTimeRange?: DateRange;
  marketStructure?: string;
  signalType?: string;
  entryDirection?: string;
  tradeStatus?: string;
  tradeResult?: string;
  // 新增筛选字段
  type?: string;
  grade?: string;
};

export interface ApiQueryParameters {
  marketStructure?: string;
  signalType?: string;
  entryDirection?: string;
  tradeStatus?: string;
  tradeResult?: string;
  dateFrom?: string; // yyyy-MM-dd format
  dateTo?: string; // yyyy-MM-dd format
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  tradeType?: string;
  grade?: string;
}

export interface TradeFieldConfig {
  key: keyof Omit<Trade, "transactionId">;
  label: string;
  /**
   * 可以为 boolean 或函数: (status, form) => boolean
   * 用于支持根据 status 动态判定某字段是否 required
   */
  required?: boolean | ((status: string | undefined, form?: Trade) => boolean);
  options?: readonly Option[];
  type?: "text" | "number" | "date" | "image-array" | "plan" | "checkbox";
}
