'use client';

import * as React from 'react';
import { useEffect, useState, useMemo } from 'react';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type Trade = {
  transactionId: string;
  dateTimeRange: string;
  marketStructure: string;
  signalType: string;
  vah: string;
  val: string;
  poc: string;
  entry: string;
  stopLoss: string;
  target: string;
  volumeProfileImage: string;
  hypothesisPaths: string[];
  actualPath: string;
  profitLoss: string;
  rr: string;
  analysisError: string;
  executionMindsetScore: number;
  improvement: string;
  createdAt: string;
  updatedAt: string;
};


async function fetchTrades(): Promise<Trade[]> {
  // POST 方式传递分页参数
  const proxyParams = {
    targetPath: 'trade/list',
    actualMethod: 'POST',
  };
  const actualBody = {
    limit: 10,
  };
  const res = await fetchWithAuth('/api/proxy-post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    proxyParams: proxyParams,
    actualBody: actualBody,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => undefined);
    throw new Error((data && data.message) || '获取交易列表失败');
  }
  return res.json();
}

async function createTrade(data: Partial<Trade>) {
  const proxyParams = {
    targetPath: 'trade',
    actualMethod: 'POST',
  };
  const actualBody = {
    ...data,
  };
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

async function updateTrade(id: string, data: Partial<Trade>) {
  const proxyParams = {
    targetPath: `trade/${id}`,
    actualMethod: 'PATCH',
  };
  const actualBody = {
    ...data,
  };
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

  const fetchAll = async () => {
    setLoading(true);
    try {
      const data = await fetchTrades();
      setTrades(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // 简化编辑表单字段，生产版可自行丰富
  const tradeFields: { key: keyof Trade; label: string; required?: boolean }[] = [
    { key: 'dateTimeRange', label: '时间段', required: true },
    { key: 'marketStructure', label: '结构' },
    { key: 'signalType', label: '信号' },
    { key: 'vah', label: 'VAH' },
    { key: 'val', label: 'VAL' },
    { key: 'poc', label: 'POC' },
    { key: 'entry', label: '入场' },
    { key: 'stopLoss', label: '止损' },
    { key: 'target', label: '目标' },
    // 生产环境可以补充其余字段
    { key: 'profitLoss', label: '盈亏' },
    { key: 'rr', label: 'RR' },
    { key: 'executionMindsetScore', label: '评分' },
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
            <Button size="sm" variant="destructive" onClick={() => setDeleteId(row.transactionId)}>删除</Button>
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
      if (editTrade?.transactionId) {
        await updateTrade(editTrade.transactionId, form);
      } else {
        await createTrade(form);
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
                <Input
                  value={form[f.key] ?? ''}
                  onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                  required={f.required}
                  className="border p-2 rounded"
                />
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