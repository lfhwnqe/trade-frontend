import { useAtomImmer } from "@/hooks/useAtomImmer";
import { tradeListAtom, processQueryParams } from "./atom";
import { useCallback } from "react";
import { fetchTrades } from "./request";
import { isErrorWithMessage } from "@/utils";
import { Trade, TradeQuery } from "../config";
import {
  SortingState,
  VisibilityState,
  RowSelectionState,
} from "@tanstack/react-table";
import { useAlert } from "@/components/common/alert";

/**
 * 交易列表 hook
 * 使用 jotai 和 jotai-immer 组装状态管理
 */
export function useTradeList() {
  const [state, setState, resetState] = useAtomImmer(tradeListAtom);
  const [errorAlert] = useAlert();

  // 获取所有交易数据
  const fetchAll = useCallback(
    async (
      _page = state.pagination.page,
      _pageSize = state.pagination.pageSize,
      _query = state.queryForm,
      _sorting = state.sorting
    ) => {
      setState((draft) => {
        draft.loading = true;
      });

      try {
        const processedQuery = processQueryParams(_query, _sorting);

        const res = await fetchTrades({
          page: _page,
          pageSize: _pageSize,
          query: processedQuery,
        });

        setState((draft) => {
          draft.trades = res.items;
          draft.pagination.total = res.total;
          draft.pagination.page = res.page; // API 可以返回当前页
          draft.pagination.pageSize = res.pageSize; // API 可以返回当前页大小
          draft.pagination.totalPages = res.totalPages;
          draft.loading = false;
        });
      } catch (err) {
        if (isErrorWithMessage(err)) {
          errorAlert("获取列表失败: " + err.message);
        } else {
          errorAlert("获取列表失败: 系统错误");
        }

        // 重置到空状态
        setState((draft) => {
          draft.trades = [];
          draft.pagination.total = 0;
          draft.pagination.totalPages = 1;
          draft.loading = false;
        });
      }
    },
    [
      setState,
      state.pagination.page,
      state.pagination.pageSize,
      state.queryForm,
      state.sorting,
    ]
  );

  // 更新查询表单
  const updateQueryForm = useCallback(
    (newQueryForm: TradeQuery) => {
      setState((draft) => {
        draft.queryForm = newQueryForm;
      });
    },
    [setState]
  );

  // 更新排序
  const updateSorting = useCallback(
    (newSorting: SortingState) => {
      setState((draft) => {
        draft.sorting = newSorting;
      });
    },
    [setState]
  );

  // 更新列可见性
  const updateColumnVisibility = useCallback(
    (newVisibility: VisibilityState) => {
      setState((draft) => {
        draft.columnVisibility = newVisibility;
      });
    },
    [setState]
  );

  // 更新行选择
  const updateRowSelection = useCallback(
    (newSelection: RowSelectionState) => {
      setState((draft) => {
        draft.rowSelection = newSelection;
      });
    },
    [setState]
  );

  // 更新分页
  const updatePagination = useCallback(
    (page?: number, pageSize?: number) => {
      setState((draft) => {
        if (page !== undefined) draft.pagination.page = page;
        if (pageSize !== undefined) draft.pagination.pageSize = pageSize;
      });
    },
    [setState]
  );

  // 打开编辑对话框
  const openDialog = useCallback(
    (editTrade: Partial<Trade> | null = null) => {
      setState((draft) => {
        draft.dialog.open = true;
        draft.dialog.editTrade = editTrade;
        draft.dialog.form = editTrade || {};
      });
    },
    [setState]
  );

  //  关闭编辑对话框
  const closeDialog = useCallback(() => {
    setState((draft) => {
      draft.dialog.open = false;
      draft.dialog.editTrade = null;
      draft.dialog.form = {};
    });
  }, [setState]);

  // 更新表单
  const updateForm = useCallback(
    (newForm: Partial<Trade>) => {
      setState((draft) => {
        draft.dialog.form = { ...draft.dialog.form, ...newForm };
      });
    },
    [setState]
  );

  // 设置要删除的 ID
  const setDeleteId = useCallback(
    (id: string | null) => {
      setState((draft) => {
        draft.dialog.deleteId = id;
      });
    },
    [setState]
  );

  return {
    // 状态
    trades: state.trades,
    loading: state.loading,
    pagination: state.pagination,
    queryForm: state.queryForm,
    sorting: state.sorting,
    columnVisibility: state.columnVisibility,
    rowSelection: state.rowSelection,
    dialog: state.dialog,

    // 方法
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
    resetState,
  };
}
