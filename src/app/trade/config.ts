import { DateRange } from 'react-day-picker';
/**
 * 交易表单枚举/选项配置（与后端 CreateTradeDto 保持同步）
 */

export type Option = { label: string; value: string }; // 新增 Option 类型

export const entryDirectionOptions: Option[] = [
  { label: "多单", value: "Long" },
  { label: "空单", value: "Short" },
];

export const signalTypeOptions: Option[] = [
  { label: "信号A", value: "A" },
  { label: "信号B", value: "B" },
  { label: "信号C", value: "C" },
  // 如有更多类型可补充
];

export const marketStructureOptions: Option[] = [
  { label: "结构1", value: "结构1" },
  { label: "结构2", value: "结构2" },
  // 如有更多类型可补充
];

/**
 * 用于跨页面/表单复用
 */
export const tradeFieldConfigs = {
  entryDirection: entryDirectionOptions,
  signalType: signalTypeOptions,
  marketStructure: marketStructureOptions,
};

export type Trade = {
  transactionId?: string;
  dateTimeRange?: string; // 注意：在表单和查询中可能是 DateRange 或 string，API 可能是 string
  marketStructure?: string;
  signalType?: string;
  vah?: string;
  val?: string;
  poc?: string;
  entryDirection?: string;
  entry?: string; // 通常是 number，但 DTO 中可能是 string
  stopLoss?: string; // 通常是 number
  target?: string; // 通常是 number
  takeProfit?: string; // 新增，通常是 number
  tradeDuration?: string; // 新增
  riskRewardRatio?: string; // 新增，通常是 number
  volumeProfileImage?: string;
  hypothesisPaths?: string | string[];
  actualPath?: string;
  profitLoss?: string; // 通常是 number
  rr?: string; // 这个可能与 riskRewardRatio 重复或相关
  analysisError?: string;
  executionMindsetScore?: string; // 通常是 number (1-10)
  improvement?: string;
  notes?: string; // 新增
  createdAt?: string;
  updatedAt?: string;
};

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
};

export interface ApiQueryParameters {
  marketStructure?: string;
  signalType?: string;
  entryDirection?: string;
  dateTimeRange?: string; // yyyy-MM format
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface TradeFieldConfig {
  key: keyof Omit<Trade, 'transactionId'>; // transactionId is not usually part of the form fields directly editable like this
  label: string;
  required?: boolean;
  options?: readonly Option[]; // 使用 Option 类型
  type?: 'text' | 'number' | 'date'; // Optional: for input types, though not strictly used by current Input component props
}