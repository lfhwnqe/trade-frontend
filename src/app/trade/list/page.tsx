"use client";

import * as React from 'react';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  RowSelectionState
} from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { entryDirectionOptions, signalTypeOptions, marketStructureOptions, TradeQuery, TradeListResponse, Trade, ApiQueryParameters, TradeFieldConfig } from "../config";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DataTable } from '@/components/common/DataTable';

async function fetchTrades(params: {
  page: number;
  pageSize: number;
  query?: Omit<TradeQuery, "dateTimeRange"> & { dateTimeRange?: string };
}): Promise<TradeListResponse> {
  const { page, pageSize, query } = params;
  const proxyParams = {
    targetPath: "trade/list",
    actualMethod: "POST",
  };
  const actualBody = {
    page,
    limit: pageSize,
    ...query,
  };
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    proxyParams,
    actualBody,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => undefined);
    throw new Error((data && data.message) || "获取交易列表失败");
  }
  const data = await res.json();
  return {
    items: data.data?.items || [],
    total: data.data?.total || 0,
    page: data.data?.page || page,
    pageSize: data.data?.pageSize || pageSize,
    totalPages: data.data?.totalPages || 1,
  };
}

type CreateTradeDto = {
  dateTimeRange: string;
  marketStructure: string;
  signalType: string;
  vah?: number;
  val?: number;
  poc?: number;
  entryDirection: "Long" | "Short" | "";
  entry?: number;
  stopLoss?: number;
  target?: number;
  volumeProfileImage: string;
  hypothesisPaths: string[];
  actualPath: string;
  profitLoss?: number;
  rr: string;
  analysisError: string;
  executionMindsetScore?: number;
  improvement: string;
};

function toDto(form: Partial<Trade>): Partial<CreateTradeDto> {
  function parseNum(v: string | undefined) {
    return v === undefined || v === "" ? undefined : Number(v);
  }
  return {
    dateTimeRange: form.dateTimeRange ?? "",
    marketStructure: form.marketStructure ?? "",
    signalType: form.signalType ?? "",
    entryDirection: (form.entryDirection ?? "") as "Long" | "Short" | "",
    vah: parseNum(form.vah),
    val: parseNum(form.val),
    poc: parseNum(form.poc),
    entry: parseNum(form.entry),
    stopLoss: parseNum(form.stopLoss),
    target: parseNum(form.target),
    volumeProfileImage: form.volumeProfileImage ?? "",
    hypothesisPaths: Array.isArray(form.hypothesisPaths)
      ? form.hypothesisPaths
      : typeof form.hypothesisPaths === "string"
      ? (form.hypothesisPaths as string).split(",").map((s: string) => s.trim())
      : [],
    actualPath: form.actualPath ?? "",
    profitLoss: parseNum(form.profitLoss),
    rr: form.rr ?? "",
    analysisError: form.analysisError ?? "",
    executionMindsetScore: parseNum(form.executionMindsetScore),
    improvement: form.improvement ?? "",
  };
}

async function createTrade(data: Partial<CreateTradeDto>) {
  const proxyParams = {
    targetPath: "trade",
    actualMethod: "POST",
  };
  const actualBody = data;
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    proxyParams,
    actualBody,
  });
  const resData = await res.json();
  if (!res.ok) throw new Error(resData.message || "新建失败");
  return resData;
}

async function updateTrade(id: string, data: Partial<CreateTradeDto>) {
  const proxyParams = {
    targetPath: `trade/${id}`,
    actualMethod: "PATCH",
  };
  const actualBody = data;
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    proxyParams,
    actualBody,
  });
  const resData = await res.json();
  if (!res.ok) throw new Error(resData.message || "更新失败");
  return resData;
}

async function deleteTrade(id: string) {
  const proxyParams = {
    targetPath: `trade/${id}`,
    actualMethod: "DELETE",
  };
  const actualBody = {};
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    proxyParams,
    actualBody,
  });
  const resData = await res.json();
  if (!res.ok) throw new Error(resData.message || "删除失败");
  return resData;
}

function isErrorWithMessage(e: unknown): e is { message: string } {
  return !!(
    e &&
    typeof e === "object" &&
    "message" in e &&
    typeof (e as Record<string, unknown>).message === "string"
  );
}

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
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const fetchAll = useCallback(async (
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
          _query?.marketStructure === "all" ? undefined : _query?.marketStructure,
        signalType: _query?.signalType === "all" ? undefined : _query?.signalType,
        entryDirection:
          _query?.entryDirection === "all" ? undefined : _query?.entryDirection,
        dateTimeRange: apiDateTimeRange,
      };
      
      if (_sorting.length > 0) {
        processedQuery.sortBy = _sorting[0].id;
        processedQuery.sortOrder = _sorting[0].desc ? 'DESC' : 'ASC';
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
    } catch(err) {
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
  }, [page, pageSize, queryForm, sorting, setLoading, setTrades, setTotal, setPage, setPageSize, setTotalPages]);

  useEffect(() => {
    fetchAll(); // Called on mount and when fetchAll identity changes (due to its own deps changing)
  }, [fetchAll]);

  const tradeFields: TradeFieldConfig[] = [
    { key: "dateTimeRange", label: "时间段", required: true, type: 'date' },
    { key: "marketStructure", label: "市场结构", options: marketStructureOptions, required: true },
    { key: "signalType", label: "信号类型", options: signalTypeOptions, required: true },
    { key: "entryDirection", label: "入场方向", options: entryDirectionOptions, required: true },
    { key: "entry", label: "入场价格", required: true, type: 'number' },
    { key: "stopLoss", label: "止损价格", required: true, type: 'number' },
    { key: "takeProfit", label: "止盈价格", type: 'number' },
    { key: "tradeDuration", label: "持仓时间" },
    { key: "riskRewardRatio", label: "风险回报比", type: 'number' },
    { key: "profitLoss", label: "盈亏 (%)", type: 'number' },
    { key: "executionMindsetScore", label: "执行心态评分 (1-10)", required: true, type: 'number' },
    { key: "notes", label: "备注" },
  ];

  const columns = useMemo<ColumnDef<Trade>[]>(() => [
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
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          时间段 <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => row.original.dateTimeRange ?? "-",
    },
    {
      accessorKey: "marketStructure",
      header: "结构",
      cell: ({ row }) => <div className="capitalize">{row.original.marketStructure ?? "-"}</div>,
    },
    {
      accessorKey: "signalType",
      header: "信号",
      cell: ({ row }) => <div className="capitalize">{row.original.signalType ?? "-"}</div>,
    },
    {
      accessorKey: "entryDirection",
      header: "方向",
      cell: ({ row }) => <div className="capitalize">{row.original.entryDirection ?? "-"}</div>,
    },
    {
      accessorKey: "entry",
      header: () => <div className="text-right">入场</div>,
      cell: ({ row }) => <div className="text-right font-medium">{row.original.entry?.toString() ?? "-"}</div>,
    },
    {
      accessorKey: "profitLoss",
      header: () => <div className="text-right">盈亏</div>,
      cell: ({ row }) => { 
        const value = row.original.profitLoss;
        const formatted = typeof value === 'number' ? `${value}%` : "-";
        return <div className="text-right font-medium">{formatted}</div>;
      },
    },
    {
      accessorKey: "executionMindsetScore",
      header: () => <div className="text-center">评分</div>,
      cell: ({ row }) => <div className="text-center font-medium">{row.original.executionMindsetScore?.toString() ?? "-"}</div>,
    },
    {
      id: "actions",
      header: "操作",
      cell: ({ row }) => {
        const trade = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                id="actions"
                variant="ghost"
                className="h-8 w-8 p-0"
              >
                <span className="sr-only">打开菜单</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>操作</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => { setEditTrade(trade); setForm(trade); setOpenDialog(true); }}>编辑</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setDeleteId(trade.transactionId ?? null)}>删除</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], []);

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
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> |
           { target: { name: string; value: string | number | readonly string[] | undefined } }
  ) => {
    const name = event.target.name as keyof Trade;
    const value = event.target.value;

    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof Trade, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleDateRangeChange = (dateRange: DateRange | undefined) => {
    setForm(prev => ({ ...prev, dateTimeRange: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined }));
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

      <form
        className="flex flex-wrap gap-2 mb-4 items-end"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          fetchAll(1, pageSize, queryForm);
        }}
      >
        <div>
          <label className="block text-xs mb-1">时间段</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !queryForm.dateTimeRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {queryForm.dateTimeRange?.from ? (
                  queryForm.dateTimeRange.to ? (
                    <>
                      {format(queryForm.dateTimeRange.from, "yyyy-MM-dd")} -{" "}
                      {format(queryForm.dateTimeRange.to, "yyyy-MM-dd")}
                    </>
                  ) : (
                    format(queryForm.dateTimeRange.from, "yyyy-MM-dd")
                  )
                ) : (
                  <span>选择日期范围</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={queryForm.dateTimeRange?.from}
                selected={queryForm.dateTimeRange}
                onSelect={(range) =>
                  setQueryForm((v) => ({ ...v, dateTimeRange: range }))
                }
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <label className="block text-xs mb-1">结构</label>
          <Select
            value={queryForm.marketStructure ?? ""}
            onValueChange={(value: string) =>
              setQueryForm((v) => ({ ...v, marketStructure: value }))
            }
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="全部" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              {marketStructureOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-xs mb-1">信号类型</label>
          <Select
            value={queryForm.signalType ?? ""}
            onValueChange={(value: string) =>
              setQueryForm((v) => ({ ...v, signalType: value }))
            }
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="全部" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              {signalTypeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-xs mb-1">方向</label>
          <Select
            value={queryForm.entryDirection ?? ""}
            onValueChange={(value: string) =>
              setQueryForm((v) => ({ ...v, entryDirection: value }))
            }
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="全部" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              {entryDirectionOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" className="ml-2" variant="secondary">
          查询
        </Button>
        <Button
          type="button"
          variant="outline"
          className="ml-1"
          onClick={() => {
            setQueryForm({});
            setPage(1);
            // setSorting([]); // Optionally reset sorting
            // fetchAll will be called by useEffect due to queryForm, page (and sorting if reset) changing in fetchAll's deps
          }}
        >
          重置
        </Button>
      </form>

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

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[825px]">
          <DialogHeader>
            <DialogTitle>{editTrade?.transactionId ? '编辑交易记录' : '新增交易记录'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {tradeFields.map((field) => (
                <div key={field.key} className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor={field.key} className="text-right">{field.label}{field.required && '*'}:</label>
                  {field.key === 'dateTimeRange' ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "col-span-3 justify-start text-left font-normal",
                            !form.dateTimeRange && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.dateTimeRange ? format(new Date(form.dateTimeRange), "PPP") : <span>选择日期</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={form.dateTimeRange ? new Date(form.dateTimeRange) : undefined}
                          onSelect={(date) => handleDateRangeChange(date ? { from: date, to: date } : undefined)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  ) : field.options ? (
                    <Select
                      value={(form[field.key as keyof Trade] as string | undefined) ?? ''}
                      onValueChange={(val) => handleSelectChange(field.key, val)}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder={`选择${field.label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map(option => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={field.key}
                      name={field.key}
                      type={field.type === 'number' ? 'number' : 'text'}
                      value={form[field.key as keyof Trade] ?? ''}
                      onChange={handleChange}
                      className="col-span-3"
                      required={field.required}
                    />
                  )}
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setOpenDialog(false)}
              >
                取消
              </Button>
              <Button type="submit" className="ml-2">
                提交
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteId}
        onOpenChange={(v) => {
          if (!v) setDeleteId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除此交易？</DialogTitle>
          </DialogHeader>
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
    </div>
  );
}
