'use client';

import * as React from 'react';
import { useEffect, useState, useMemo } from 'react';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
    { accessorKey: 'dateTimeRange', header: '时间段' },
    { accessorKey: 'marketStructure', header: '结构' },
    { accessorKey: 'signalType', header: '信号' },
    { accessorKey: 'entry', header: '入场' },
    { accessorKey: 'profitLoss', header: '盈亏' },
    { accessorKey: 'executionMindsetScore', header: '评分' },
    {
      id: 'actions',
      header: '操作',
      cell: info => {
        const row = info.row.original;
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { setEditTrade(row); setForm(row); setOpenDialog(true); }}>编辑</Button>
            <Button size="sm" variant="destructive" onClick={() => setDeleteId(row.transactionId ?? null)}>删除</Button>
          </div>
        );
      },
    },
  ], []);

  const table = useReactTable({
    data: trades,
    columns,
    getCoreRowModel: getCoreRowModel(),
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

      {/* 表格主体 */}
      <div className="border rounded-md overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="p-2 border-b">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="even:bg-gray-50">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="p-2 border-b">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="p-4 text-center">加载中...</div>}
        {!loading && trades.length === 0 && <div className="p-4 text-center">暂无数据</div>}
      </div>

      {/* 分页组件 */}
      <div className="flex flex-wrap items-center gap-2 justify-end mt-3">
        <span className="text-sm">共{total}条</span>
        <Button
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => {
            if (page > 1) {
              fetchAll(page - 1, pageSize);
            }
          }}
        >
          上一页
        </Button>
        <span className="mx-2 text-sm">第 {page} / {totalPages} 页</span>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => {
            if (page < totalPages) {
              fetchAll(page + 1, pageSize);
            }
          }}
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
          }}
        >
          {[10, 20, 50].map(sz => (
            <option key={sz} value={sz}>{sz}条/页</option>
          ))}
        </select>
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