import { useAtomImmer } from '@/hooks/useAtomImmer';
import { tradeListAtom, processQueryParams } from './atom';
import { useCallback } from 'react';
import { fetchTrades } from './request';
import { isErrorWithMessage } from '@/utils';
import { Trade, TradeQuery } from '../config';
import { SortingState, VisibilityState, RowSelectionState } from '@tanstack/react-table';

/**
 * u4ea4u6613u5217u8868u9875u9762u7684u81eau5b9au4e49 hook
 * u4f7fu7528 jotai u548c jotai-immer u5c01u88c5u72b6u6001u7ba1u7406u903bu8f91
 */
export function useTradeList() {
  const [state, setState, resetState] = useAtomImmer(tradeListAtom);
  
  // u83b7u53d6u6240u6709u4ea4u6613u6570u636e
  const fetchAll = useCallback(
    async (
      _page = state.pagination.page,
      _pageSize = state.pagination.pageSize,
      _query = state.queryForm,
      _sorting = state.sorting
    ) => {
      setState(draft => { draft.loading = true; });
      
      try {
        const processedQuery = processQueryParams(_query, _sorting);
        
        const res = await fetchTrades({
          page: _page,
          pageSize: _pageSize,
          query: processedQuery,
        });
        
        setState(draft => {
          draft.trades = res.items;
          draft.pagination.total = res.total;
          draft.pagination.page = res.page; // API u53efu80fdu8fd4u56deu7ecfu8fc7u4feeu6b63u7684u9875u7801
          draft.pagination.pageSize = res.pageSize; // API u53efu80fdu8fd4u56deu7ecfu8fc7u4feeu6b63u7684u9875u9762u5927u5c0f
          draft.pagination.totalPages = res.totalPages;
          draft.loading = false;
        });
      } catch (err) {
        if (isErrorWithMessage(err)) {
          alert("u83b7u53d6u5217u8868u5931u8d25: " + err.message);
        } else {
          alert("u83b7u53d6u5217u8868u5931u8d25: u672au77e5u9519u8bef");
        }
        
        // u91cdu7f6eu5230u5b89u5168u72b6u6001
        setState(draft => {
          draft.trades = [];
          draft.pagination.total = 0;
          draft.pagination.totalPages = 1;
          draft.loading = false;
        });
      }
    },
    [setState, state.pagination.page, state.pagination.pageSize, state.queryForm, state.sorting]
  );
  
  // u66f4u65b0u67e5u8be2u8868u5355  // 更新查询表单
  const updateQueryForm = useCallback((newQueryForm: TradeQuery) => {
    setState(draft => {
      draft.queryForm = newQueryForm;
    });
  }, [setState]);
  
  // u66f4u65b0u6392u5e8f  // 更新排序
  const updateSorting = useCallback((newSorting: SortingState) => {
    setState(draft => {
      draft.sorting = newSorting;
    });
  }, [setState]);
  
  // u66f4u65b0u5217u53efu89c1u6027  // 更新列可见性
  const updateColumnVisibility = useCallback((newVisibility: VisibilityState) => {
    setState(draft => {
      draft.columnVisibility = newVisibility;
    });
  }, [setState]);
  
  // u66f4u65b0u884cu9009u62e9  // 更新行选择
  const updateRowSelection = useCallback((newSelection: RowSelectionState) => {
    setState(draft => {
      draft.rowSelection = newSelection;
    });
  }, [setState]);
  
  // u66f4u65b0u5206u9875  // 更新分页
  const updatePagination = useCallback((page?: number, pageSize?: number) => {
    setState(draft => {
      if (page !== undefined) draft.pagination.page = page;
      if (pageSize !== undefined) draft.pagination.pageSize = pageSize;
    });
  }, [setState]);
  
  // u6253u5f00u5bf9u8bddu6846
  const openDialog = useCallback((editTrade: Partial<Trade> | null = null) => {
    setState(draft => {
      draft.dialog.open = true;
      draft.dialog.editTrade = editTrade;
      draft.dialog.form = editTrade || {};
    });
  }, [setState]);
  
  // u5173u95edu5bf9u8bddu6846
  const closeDialog = useCallback(() => {
    setState(draft => {
      draft.dialog.open = false;
      draft.dialog.editTrade = null;
      draft.dialog.form = {};
    });
  }, [setState]);
  
  // u66f4u65b0u8868u5355  // 更新表单
  const updateForm = useCallback((newForm: Partial<Trade>) => {
    setState(draft => {
      draft.dialog.form = { ...draft.dialog.form, ...newForm };
    });
  }, [setState]);
  
  // u8bbeu7f6eu8981u5220u9664u7684 ID
  const setDeleteId = useCallback((id: string | null) => {
    setState(draft => {
      draft.dialog.deleteId = id;
    });
  }, [setState]);
  
  return {
    // u72b6u6001
    trades: state.trades,
    loading: state.loading,
    pagination: state.pagination,
    queryForm: state.queryForm,
    sorting: state.sorting,
    columnVisibility: state.columnVisibility,
    rowSelection: state.rowSelection,
    dialog: state.dialog,
    
    // u65b9u6cd5
    fetchAll,
    updateQueryForm,
    updateSorting,
    updateColumnVisibility,
    updateRowSelection,
    updatePagination,
    openDialog,
    closeDialog,
    updateForm,
    setDeleteId,
    resetState
  };
}
