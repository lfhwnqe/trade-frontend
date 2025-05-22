import { DateRange } from 'react-day-picker';
/**
 * 交易表单枚举/选项配置（与后端 CreateTradeDto 保持同步）
 */

export const entryDirectionOptions = [
  { label: "多单", value: "Long" },
  { label: "空单", value: "Short" },
];

export const signalTypeOptions = [
  { label: "信号A", value: "A" },
  { label: "信号B", value: "B" },
  { label: "信号C", value: "C" },
  // 如有更多类型可补充
];

export const marketStructureOptions = [
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
  dateTimeRange?: string;
  marketStructure?: string;
  signalType?: string;
  vah?: string;
  val?: string;
  poc?: string;
  entryDirection?: string;
  entry?: string;
  stopLoss?: string;
  target?: string;
  volumeProfileImage?: string;
  hypothesisPaths?: string | string[];
  actualPath?: string;
  profitLoss?: string;
  rr?: string;
  analysisError?: string;
  executionMindsetScore?: string;
  improvement?: string;
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
  options?: readonly { value: string; label: string }[];
  type?: 'text' | 'number' | 'date'; // Optional: for input types, though not strictly used by current Input component props
}