import { createImmerAtom } from '@/hooks/useAtomImmer';
import { SortingState, VisibilityState, RowSelectionState } from '@tanstack/react-table';
import { Trade, TradeQuery, ApiQueryParameters } from '../config';
import { format } from 'date-fns';

// 分页相关状态
interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// 列表数据状态
interface TradeListState {
  trades: Trade[];
  loading: boolean;
  pagination: PaginationState;
  queryForm: TradeQuery;
  sorting: SortingState;
  columnVisibility: VisibilityState;
  rowSelection: RowSelectionState;
  dialog: {
    open: boolean;
    editTrade: Partial<Trade> | null;
    deleteId: string | null;
    form: Partial<Trade>;
  };
}

// 初始状态
const initialState: TradeListState = {
  trades: [],
  loading: false,
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1
  },
  queryForm: {},
  sorting: [],
  columnVisibility: {},
  rowSelection: {},
  dialog: {
    open: false,
    editTrade: null,
    deleteId: null,
    form: {}
  }
};

// 创建 atom
export const tradeListAtom = createImmerAtom<TradeListState>(initialState);

// 辅助函数：处理查询参数
export function processQueryParams(query: TradeQuery, sorting: SortingState): ApiQueryParameters {
  // 处理日期范围
  let dateFrom: string | undefined = undefined;
  let dateTo: string | undefined = undefined;
  
  if (query?.dateTimeRange?.from) {
    dateFrom = format(query.dateTimeRange.from, "yyyy-MM-dd");
    
    if (query.dateTimeRange.to) {
      dateTo = format(query.dateTimeRange.to, "yyyy-MM-dd");
    }
  }

  const processedQuery: ApiQueryParameters = {
    // 市场结构
    marketStructure:
      query?.marketStructure === "all"
        ? undefined
        : query?.marketStructure,
    // 信号类型
    signalType:
      query?.signalType === "all" ? undefined : query?.signalType,
    // 入场方向
    entryDirection:
      query?.entryDirection === "all"
        ? undefined
        : query?.entryDirection,
    // 交易状态
    tradeStatus:
      query?.tradeStatus === "all"
        ? undefined
        : query?.tradeStatus,
    // 交易结果
    tradeResult:
      query?.tradeResult === "all"
        ? undefined
        : query?.tradeResult,
    // 日期范围
    dateFrom,
    dateTo,
  };

  if (sorting.length > 0) {
    processedQuery.sortBy = sorting[0].id;
    processedQuery.sortOrder = sorting[0].desc ? "DESC" : "ASC";
  }

  return processedQuery;
}
