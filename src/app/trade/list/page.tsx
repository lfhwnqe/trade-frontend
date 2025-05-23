"use client";

import * as React from "react";
import { useEffect, useState, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import {
  fetchTrades,
  createTrade,
  updateTrade,
  deleteTrade,
  toDto,
} from "./request";
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  RowSelectionState,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DataTable } from "@/components/common/DataTable";
import { isErrorWithMessage } from "@/utils";
import TradeQueryForm from "./components/TradeQueryForm";
import { TradeFormDialog } from "./components/TradeFormDialog";
import {
  Trade,
  TradeQuery,
  ApiQueryParameters,
  TradeFieldConfig,
  entryDirectionOptions,
  signalTypeOptions,
  marketStructureOptions,
} from "../config";

export default function TradeListPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editTrade, setEditTrade] = useState<Partial<Trade> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Trade>>({});

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [queryForm, setQueryForm] = useState<TradeQuery>({});
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const fetchAll = useCallback(
    async (
      _page = page,
      _pageSize = pageSize,
      _query = queryForm,
      _sorting = sorting
    ) => {
      setLoading(true);
      try {
        let apiDateTimeRange: string | undefined = undefined;
        if (_query?.dateTimeRange?.from) {
          apiDateTimeRange = format(_query.dateTimeRange.from, "yyyy-MM");
        }

        const processedQuery: ApiQueryParameters = {
          marketStructure:
            _query?.marketStructure === "all"
              ? undefined
              : _query?.marketStructure,
          signalType:
            _query?.signalType === "all" ? undefined : _query?.signalType,
          entryDirection:
            _query?.entryDirection === "all"
              ? undefined
              : _query?.entryDirection,
          dateTimeRange: apiDateTimeRange,
        };

        if (_sorting.length > 0) {
          processedQuery.sortBy = _sorting[0].id;
          processedQuery.sortOrder = _sorting[0].desc ? "DESC" : "ASC";
        }

        const res = await fetchTrades({
          page: _page,
          pageSize: _pageSize,
          query: processedQuery,
        });
        setTrades(res.items);
        setTotal(res.total);
        setPage(res.page); // API might return corrected page
        setPageSize(res.pageSize); // API might return corrected pageSize
        setTotalPages(res.totalPages);
      } catch (err) {
        if (isErrorWithMessage(err)) {
          alert("获取列表失败: " + err.message);
        } else {
          alert("获取列表失败: 未知错误");
        }
        // Reset to a safe state if fetch fails
        setTrades([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    },
    [
      page,
      pageSize,
      queryForm,
      sorting,
      setLoading,
      setTrades,
      setTotal,
      setPage,
      setPageSize,
      setTotalPages,
    ]
  );

  useEffect(() => {
    fetchAll(); // Called on mount and when fetchAll identity changes (due to its own deps changing)
  }, [fetchAll]);

  const tradeFields: TradeFieldConfig[] = [
    { key: "dateTimeRange", label: "时间段", required: true, type: "date" },
    {
      key: "marketStructure",
      label: "市场结构",
      options: marketStructureOptions,
      required: true,
    },
    {
      key: "signalType",
      label: "信号类型",
      options: signalTypeOptions,
      required: true,
    },
    {
      key: "entryDirection",
      label: "入场方向",
      options: entryDirectionOptions,
      required: true,
    },
    { key: "entry", label: "入场价格", required: true, type: "number" },
    { key: "stopLoss", label: "止损价格", required: true, type: "number" },
    { key: "takeProfit", label: "止盈价格", type: "number" },
    { key: "tradeDuration", label: "持仓时间" },
    { key: "riskRewardRatio", label: "风险回报比", type: "number" },
    { key: "profitLoss", label: "盈亏 (%)", type: "number" },
    {
      key: "executionMindsetScore",
      label: "执行心态评分 (1-10)",
      required: true,
      type: "number",
    },
    { key: "notes", label: "备注" },
  ];

  const columns = useMemo<ColumnDef<Trade>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="选择所有"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="选择行"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "dateTimeRange",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            时间段 <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => row.original.dateTimeRange ?? "-",
      },
      {
        accessorKey: "marketStructure",
        header: "结构",
        cell: ({ row }) => (
          <div className="capitalize">
            {row.original.marketStructure ?? "-"}
          </div>
        ),
      },
      {
        accessorKey: "signalType",
        header: "信号",
        cell: ({ row }) => (
          <div className="capitalize">{row.original.signalType ?? "-"}</div>
        ),
      },
      {
        accessorKey: "entryDirection",
        header: "方向",
        cell: ({ row }) => (
          <div className="capitalize">{row.original.entryDirection ?? "-"}</div>
        ),
      },
      {
        accessorKey: "entry",
        header: () => <div className="text-right">入场</div>,
        cell: ({ row }) => (
          <div className="text-right font-medium">
            {row.original.entry?.toString() ?? "-"}
          </div>
        ),
      },
      {
        accessorKey: "profitLoss",
        header: () => <div className="text-right">盈亏</div>,
        cell: ({ row }) => {
          const value = row.original.profitLoss;
          const formatted = typeof value === "number" ? `${value}%` : "-";
          return <div className="text-right font-medium">{formatted}</div>;
        },
      },
      {
        accessorKey: "executionMindsetScore",
        header: () => <div className="text-center">评分</div>,
        cell: ({ row }) => (
          <div className="text-center font-medium">
            {row.original.executionMindsetScore?.toString() ?? "-"}
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-center">操作</div>,
        cell: ({ row }) => {
          const trade = row.original;
          return (
            <div className="text-center font-medium">
              <Button
                variant="outline"
                onClick={() => {
                  setEditTrade(trade);
                  setForm(trade);
                  setOpenDialog(true);
                }}
              >
                编辑
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteId(trade.transactionId ?? null);
                }}
              >
                删除
              </Button>
            </div>
          );
        },
      },
    ],
    []
  );

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    // fetchAll will be called by useEffect due to fetchAll's dependency on 'page'
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when page size changes
    // fetchAll will be called by useEffect due to fetchAll's dependency on 'pageSize' and 'page'
  };

  const handleSortingChange = (newSorting: SortingState) => {
    setSorting(newSorting);
    // fetchAll will be called by useEffect due to fetchAll's dependency on 'sorting'
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const dtoData = toDto(form as Trade);
      if (editTrade?.transactionId) {
        await updateTrade(editTrade.transactionId, dtoData);
      } else {
        await createTrade(dtoData);
      }
      setOpenDialog(false);
      setEditTrade(null);
      setForm({});
      fetchAll();
    } catch (err: unknown) {
      if (isErrorWithMessage(err)) {
        alert(err.message);
      } else {
        alert("未知错误");
      }
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteTrade(deleteId);
        setDeleteId(null);
        fetchAll();
      } catch (err: unknown) {
        if (isErrorWithMessage(err)) {
          alert(err.message);
        } else {
          alert("未知错误");
        }
      }
    }
  };

  const handleChange = (
    event:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | {
          target: {
            name: string;
            value: string | number | readonly string[] | undefined;
          };
        }
  ) => {
    const name = event.target.name as keyof Trade;
    const value = event.target.value;

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof Trade, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateRangeChange = (dateRange: DateRange | undefined) => {
    setForm((prev) => ({
      ...prev,
      dateTimeRange: dateRange?.from
        ? format(dateRange.from, "yyyy-MM-dd")
        : undefined,
    }));
  };

  const handleQuerySubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1); // Reset to first page on new query
    fetchAll(1, pageSize, queryForm, sorting); // Pass current sorting
  };

  const handleQueryReset = () => {
    setQueryForm({});
    setPage(1);
    // setSorting([]); // Optionally reset sorting, if desired
    // fetchAll will be called by useEffect due to queryForm and page changes
    // If sorting is also reset, ensure fetchAll's dependencies include it or call fetchAll explicitly here.
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">交易列表</h1>
        <Button
          onClick={() => {
            setForm({});
            setEditTrade(null);
            setOpenDialog(true);
          }}
        >
          新增交易
        </Button>
      </div>

      <TradeQueryForm
        queryForm={queryForm}
        onQueryFormChange={setQueryForm}
        onSubmit={handleQuerySubmit}
        onReset={handleQueryReset}
      />

      <DataTable
        columns={columns}
        data={trades}
        loading={loading}
        page={page}
        pageSize={pageSize}
        totalItems={total}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        sorting={sorting}
        onSortingChange={handleSortingChange}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
      />

      <TradeFormDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        editTrade={editTrade}
        form={form}
        tradeFields={tradeFields}
        handleChange={handleChange}
        handleSelectChange={handleSelectChange}
        handleDateRangeChange={handleDateRangeChange}
        handleSubmit={handleSubmit}
      />

      {deleteId && (
        <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>确认删除</DialogTitle>
            </DialogHeader>
            <p>你确定要删除这条交易记录吗？此操作无法撤销。</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>
                取消
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                删除
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
