'use client';

import * as React from 'react';
import { useEffect, useState, useMemo } from 'react';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronDown, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { entryDirectionOptions, signalTypeOptions, marketStructureOptions } from '../config';

type Trade = {
  transactionId?: string;
  dateTimeRange?: string;
  marketStructure?: string;
  signalType?: string;
  vah?: string;
  val?: string;
  poc?: string;
  entryDirection?: string; // 前端表单扩展，适配DTO
  entry?: string;
  stopLoss?: string;
  target?: string;
  volumeProfileImage?: string;
  hypothesisPaths?: string | string[]; // 允许逗号分隔/数组
  actualPath?: string;
  profitLoss?: string;
  rr?: string;
  analysisError?: string;
  executionMindsetScore?: string;
  improvement?: string;
  createdAt?: string;
  updatedAt?: string;
};


type TradeListResponse = {
  items: Trade[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type TradeQuery = {
  dateTimeRange?: string;
  marketStructure?: string;
  signalType?: string;
  entryDirection?: string;
};

async function fetchTrades(params: { page: number; pageSize: number; query?: TradeQuery }): Promise<TradeListResponse> {
  const { page, pageSize, query } = params;
  const proxyParams = {
    targetPath: 'trade/list',
    actualMethod: 'POST',
  };
  const actualBody = {
    page,
    limit: pageSize,
    ...query,
  };
  const res = await fetchWithAuth('/api/proxy-post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    proxyParams,
    actualBody,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => undefined);
    throw new Error((data && data.message) || '获取交易列表失败');
  }
  const data = await res.json();
  // 保证格式一定一致
  return {
    items: data.data?.items || [],
    total: data.data?.total || 0,
    page: data.data?.page || page,
    pageSize: data.data?.pageSize || pageSize,
    totalPages: data.data?.totalPages || 1,
  };
}

/**
 * 与后端 CreateTradeDto 对齐的类型
 */
type CreateTradeDto = {
  dateTimeRange: string;
  marketStructure: string;
  signalType: string;
  vah?: number;
  val?: number;
  poc?: number;
  entryDirection: 'Long' | 'Short' | '';
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

/**
 * 表单转后端 DTO 字段映射+类型校正
 */
function toDto(form: Partial<Trade>): Partial<CreateTradeDto> {
  // 解决 number 字段 "" 转 NaN 问题
  function parseNum(v: string | undefined) {
    return v === undefined || v === "" ? undefined : Number(v);
  }
  return {
    dateTimeRange: form.dateTimeRange ?? "",
    marketStructure: form.marketStructure ?? "",
    signalType: form.signalType ?? "",
    entryDirection: (form.entryDirection ?? "") as 'Long' | 'Short' | '',
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
    targetPath: 'trade',
    actualMethod: 'POST',
  };
  const actualBody = data;
  const res = await fetchWithAuth('/api/proxy-post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    proxyParams: proxyParams,
    actualBody: actualBody,
  });
  const resData = await res.json();
  if (!res.ok) throw new Error(resData.message || '新建失败');
  return resData;
}

async function updateTrade(id: string, data: Partial<CreateTradeDto>) {
  const proxyParams = {
    targetPath: `trade/${id}`,
    actualMethod: 'PATCH',
  };
  const actualBody = data;
  const res = await fetchWithAuth('/api/proxy-post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    proxyParams: proxyParams,
    actualBody: actualBody,
  });
  const resData = await res.json();
  if (!res.ok) throw new Error(resData.message || '更新失败');
  return resData;
}

async function deleteTrade(id: string) {
  const proxyParams = {
    targetPath: `trade/${id}`,
    actualMethod: 'DELETE',
  };
  const actualBody = {};
  const res = await fetchWithAuth('/api/proxy-post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    proxyParams: proxyParams,
    actualBody: actualBody,
  });
  const resData = await res.json();
  if (!res.ok) throw new Error(resData.message || '删除失败');
  return resData;
}

function isErrorWithMessage(e: unknown): e is { message: string } {
  return !!(e && typeof e === 'object' && 'message' in e && typeof (e as Record<string, unknown>).message === 'string');
}

export default function TradeListPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editTrade, setEditTrade] = useState<Partial<Trade> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Trade>>({});

  // 分页和查询相关状态
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // 查询表单，只包含常用查询项，也可自行扩展
  const [queryForm, setQueryForm] = useState<TradeQuery>({});

  const fetchAll = async (_page = page, _pageSize = pageSize, _query = queryForm) => {
    setLoading(true);
    try {
      const res = await fetchTrades({ page: _page, pageSize: _pageSize, query: _query });
      setTrades(res.items);
      setTotal(res.total);
      setPage(res.page);
      setPageSize(res.pageSize);
      setTotalPages(res.totalPages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 简化编辑表单字段，生产版可自行丰富
  const tradeFields: { key: keyof Trade; label: string; required?: boolean; type?: string; options?: {label:string,value:string;}[]; min?: number; max?: number; step?: number }[] = [
    { key: 'dateTimeRange', label: '时间段', required: true },
    { key: 'marketStructure', label: '结构', options: marketStructureOptions },
    { key: 'signalType', label: '信号', options: signalTypeOptions, required: true },
    { key: 'entryDirection', label: '方向', options: entryDirectionOptions, required: true },
    { key: 'vah', label: 'VAH', required: true, type: 'number', step:0.01 },
    { key: 'val', label: 'VAL', required: true, type: 'number', step:0.01 },
    { key: 'poc', label: 'POC', required: true, type: 'number', step:0.01 },
    { key: 'entry', label: '入场', required: true, type: 'number', step:0.01 },
    { key: 'stopLoss', label: '止损', required: true, type: 'number', step:0.01 },
    { key: 'target', label: '目标', required: true, type: 'number', step:0.01 },
    { key: 'profitLoss', label: '盈亏%', required: true, type: 'number', step:0.01 },
    { key: 'executionMindsetScore', label: '评分(1-5)', required: true, type: 'number', min:1, max:5 },
    // 生产环境可以补充其余字段
    { key: 'rr', label: 'RR' },
  ];

  const columns = useMemo<ColumnDef<Trade>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
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
      accessorKey: 'dateTimeRange', 
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            时间段
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      }
    },
    { 
      accessorKey: 'marketStructure', 
      header: '结构',
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("marketStructure")}</div>
      ),
    },
    { 
      accessorKey: 'signalType', 
      header: '信号',
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("signalType")}</div>
      ),
    },
    { 
      accessorKey: 'entryDirection', 
      header: '方向',
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("entryDirection")}</div>
      ),
    },
    { 
      accessorKey: 'entry', 
      header: () => <div className="text-right">入场</div>,
      cell: ({ row }) => {
        const value = row.getValue("entry");
        return <div className="text-right font-medium">{value}</div>
      },
    },
    { 
      accessorKey: 'profitLoss', 
      header: () => <div className="text-right">盈亏</div>,
      cell: ({ row }) => {
        const value = parseFloat(row.getValue("profitLoss") as string);
        const formatted = !isNaN(value) ? `${value}%` : '-';
        return <div className="text-right font-medium">{formatted}</div>
      },
    },
    { 
      accessorKey: 'executionMindsetScore', 
      header: () => <div className="text-center">评分</div>,
      cell: ({ row }) => {
        const value = row.getValue("executionMindsetScore");
        return <div className="text-center font-medium">{value}</div>
      },
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => {
        const trade = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
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
        )
      },
    },
  ], []);

  // 表格状态
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data: trades,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      // 统一转 DTO 字段（编辑/新增都走一遍，后端字段冗余不会报错）
      const dtoData = toDto(form);
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
        alert('未知错误');
      }
    }
  }

  async function handleDelete() {
    if (deleteId) {
      try {
        await deleteTrade(deleteId);
        setDeleteId(null);
        fetchAll();
      } catch (err: unknown) {
        if (isErrorWithMessage(err)) {
          alert(err.message);
        } else {
          alert('未知错误');
        }
      }
    }
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">交易列表</h1>
        <Button onClick={() => { setForm({}); setEditTrade(null); setOpenDialog(true); }}>新增交易</Button>
      </div>

      {/* 查询表单 */}
      <form
        className="flex flex-wrap gap-2 mb-4 items-end"
        onSubmit={e => {
          e.preventDefault();
          setPage(1);
          fetchAll(1, pageSize, queryForm);
        }}
      >
        <div>
          <label className="block text-xs">时间段</label>
          <Input
            value={queryForm.dateTimeRange ?? ''}
            onChange={e => setQueryForm(v => ({ ...v, dateTimeRange: e.target.value }))}
            placeholder="例如2025-05"
            className="w-32"
          />
        </div>
        <div>
          <label className="block text-xs">结构</label>
          <select
            className="border p-2 rounded w-24"
            value={queryForm.marketStructure ?? ''}
            onChange={e => setQueryForm(v => ({ ...v, marketStructure: e.target.value }))}
          >
            <option value="">全部</option>
            {marketStructureOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs">信号类型</label>
          <select
            className="border p-2 rounded w-24"
            value={queryForm.signalType ?? ''}
            onChange={e => setQueryForm(v => ({ ...v, signalType: e.target.value }))}
          >
            <option value="">全部</option>
            {signalTypeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs">方向</label>
          <select
            className="border p-2 rounded w-24"
            value={queryForm.entryDirection ?? ''}
            onChange={e => setQueryForm(v => ({ ...v, entryDirection: e.target.value }))}
          >
            <option value="">全部</option>
            {entryDirectionOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <Button type="submit" className="ml-2" variant="secondary">查询</Button>
        <Button
          type="button"
          variant="outline"
          className="ml-1"
          onClick={() => {
            setQueryForm({});
            setPage(1);
            fetchAll(1, pageSize, {});
          }}
        >
          重置
        </Button>
      </form>

      {/* 表格过滤和列显示控制 */}
      <div className="flex items-center py-4">
        <Input
          placeholder="搜索时间段..."
          value={(table.getColumn('dateTimeRange')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('dateTimeRange')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              显示列 <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id === 'dateTimeRange' ? '时间段' :
                     column.id === 'marketStructure' ? '结构' :
                     column.id === 'signalType' ? '信号' :
                     column.id === 'entryDirection' ? '方向' :
                     column.id === 'entry' ? '入场' :
                     column.id === 'profitLoss' ? '盈亏' :
                     column.id === 'executionMindsetScore' ? '评分' :
                     column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 表格主体 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {loading ? "加载中..." : "暂无数据"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页和选择信息 */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          已选择 {table.getFilteredSelectedRowModel().rows.length} 条，共
          {table.getFilteredRowModel().rows.length} 条
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage() || page <= 1}
          >
            上一页
          </Button>
          <span className="mx-2 text-sm">第 {page} / {totalPages} 页</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              table.nextPage();
              if (page < totalPages) {
                fetchAll(page + 1, pageSize);
              }
            }}
            disabled={!table.getCanNextPage() || page >= totalPages}
          >
            下一页
          </Button>
          <select
            className="border p-1 rounded ml-2 text-sm"
            value={pageSize}
            onChange={e => {
              const size = Number(e.target.value);
              setPageSize(size);
              setPage(1);
              fetchAll(1, size);
              table.setPageSize(size);
            }}
          >
            {[10, 20, 50].map(sz => (
              <option key={sz} value={sz}>{sz}条/页</option>
            ))}
          </select>
        </div>
      </div>

      {/* 新增/编辑弹窗 */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTrade ? '编辑交易' : '新增交易'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            {tradeFields.map(f => (
              <div key={f.key as string} className="flex flex-col gap-1">
                <label className="text-sm">
                  {f.label}
                  {f.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {f.options ? (
                  <select
                    value={form[f.key] ?? ''}
                    onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                    required={f.required}
                    className="border p-2 rounded"
                  >
                    <option value="">请选择</option>
                    {f.options.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <Input
                    type={f.type || 'text'}
                    value={form[f.key] ?? ''}
                    onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                    required={f.required}
                    className="border p-2 rounded"
                    min={f.min}
                    max={f.max}
                    step={f.step}
                  />
                )}
              </div>
            ))}
            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setOpenDialog(false)}>取消</Button>
              <Button type="submit">提交</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <Dialog open={!!deleteId} onOpenChange={v => { if (!v) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>确认删除此交易？</DialogTitle></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete}>删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}