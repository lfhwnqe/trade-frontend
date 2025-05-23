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
  let apiDateTimeRange: string | undefined = undefined;
  if (query?.dateTimeRange?.from) {
    apiDateTimeRange = format(query.dateTimeRange.from, "yyyy-MM");
  }

  const processedQuery: ApiQueryParameters = {
    marketStructure:
      query?.marketStructure === "all"
        ? undefined
        : query?.marketStructure,
    signalType:
      query?.signalType === "all" ? undefined : query?.signalType,
    entryDirection:
      query?.entryDirection === "all"
        ? undefined
        : query?.entryDirection,
    dateTimeRange: apiDateTimeRange,
  };

  if (sorting.length > 0) {
    processedQuery.sortBy = sorting[0].id;
    processedQuery.sortOrder = sorting[0].desc ? "DESC" : "ASC";
  }

  return processedQuery;
}
