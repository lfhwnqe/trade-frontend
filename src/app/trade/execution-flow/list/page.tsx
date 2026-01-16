"use client";

import * as React from "react";
import { useCallback, useMemo, useState } from "react";
import { format } from "date-fns";
import type { ColumnDef, RowSelectionState, SortingState } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/common/DataTable";
import { useAlert } from "@/components/common/alert";
import { isErrorWithMessage } from "@/utils";
import {
  CreateExecutionFlowRunDto,
  ExecutionFlowListItem,
  ExecutionFlowQuery,
  ExecutionFlowStatus,
} from "../config";
import {
  createExecutionFlowRun,
  fetchExecutionFlowList,
  updateExecutionFlowRun,
} from "../request";

const statusOptions: { value: ExecutionFlowStatus; label: string }[] = [
  { value: "ANALYSIS", label: "分析" },
  { value: "PLAN", label: "计划" },
  { value: "CHECKLIST", label: "入场清单" },
  { value: "REVIEW", label: "复盘" },
];

const statusLabelMap = statusOptions.reduce<Record<string, string>>(
  (acc, item) => {
    acc[item.value] = item.label;
    return acc;
  },
  {},
);

type PaginationState = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export default function ExecutionFlowListPage() {
  const [successAlert, errorAlert] = useAlert();
  const [loading, setLoading] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [items, setItems] = useState<ExecutionFlowListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
  });

  const [query, setQuery] = useState<ExecutionFlowQuery>({
    tradeSubject: "",
    status: undefined,
    dateFrom: "",
    dateTo: "",
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateExecutionFlowRunDto>({
    title: "",
    tradeSubject: "",
  });

  const [updateOpen, setUpdateOpen] = useState(false);
  const [updateRunId, setUpdateRunId] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState<ExecutionFlowStatus>("ANALYSIS");

  const fetchList = useCallback(
    async (page = pagination.page, pageSize = pagination.pageSize) => {
      setLoading(true);
      try {
        const data = await fetchExecutionFlowList({
          page,
          pageSize,
          query: {
            ...query,
            tradeSubject: query.tradeSubject || undefined,
            status: query.status || undefined,
            dateFrom: query.dateFrom || undefined,
            dateTo: query.dateTo || undefined,
          },
        });
        setItems(data.items);
        setPagination({
          page: data.page,
          pageSize: data.pageSize,
          total: data.total,
          totalPages: data.totalPages,
        });
      } catch (error) {
        errorAlert(isErrorWithMessage(error) ? error.message : "获取列表失败");
      } finally {
        setLoading(false);
      }
    },
    [errorAlert, pagination.page, pagination.pageSize, query],
  );

  React.useEffect(() => {
    fetchList(1, pagination.pageSize);
  }, []);

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await fetchList(1, pagination.pageSize);
  };

  const handleReset = async () => {
    setQuery({
      tradeSubject: "",
      status: undefined,
      dateFrom: "",
      dateTo: "",
    });
    await fetchList(1, pagination.pageSize);
  };

  const handleCreate = async () => {
    if (!createForm.title || !createForm.tradeSubject) {
      errorAlert("请填写标题和交易对");
      return;
    }
    try {
      await createExecutionFlowRun(createForm);
      successAlert("创建成功");
      setCreateOpen(false);
      setCreateForm({ title: "", tradeSubject: "" });
      fetchList(1, pagination.pageSize);
    } catch (error) {
      errorAlert(isErrorWithMessage(error) ? error.message : "创建失败");
    }
  };

  const openUpdateDialog = (item: ExecutionFlowListItem) => {
    setUpdateRunId(item.runId);
    setUpdateStatus(item.status);
    setUpdateOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!updateRunId) return;
    try {
      await updateExecutionFlowRun(updateRunId, { status: updateStatus });
      successAlert("更新成功");
      setUpdateOpen(false);
      setUpdateRunId(null);
      fetchList(pagination.page, pagination.pageSize);
    } catch (error) {
      errorAlert(isErrorWithMessage(error) ? error.message : "更新失败");
    }
  };

  const columns = useMemo<ColumnDef<ExecutionFlowListItem>[]>(
    () => [
      {
        accessorKey: "title",
        header: "标题",
        cell: ({ row }) => (
          <div className="min-w-[160px] font-medium">{row.original.title}</div>
        ),
      },
      {
        accessorKey: "tradeSubject",
        header: "交易对",
        cell: ({ row }) => (
          <div className="min-w-[120px]">{row.original.tradeSubject}</div>
        ),
      },
      {
        accessorKey: "currentStep",
        header: "当前步骤",
        cell: ({ row }) => (
          <span className="text-sm">
            {statusLabelMap[row.original.currentStep] || row.original.currentStep}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "状态",
        cell: ({ row }) => (
          <span className="text-sm">
            {statusLabelMap[row.original.status] || row.original.status}
          </span>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: "更新时间",
        cell: ({ row }) => {
          const value = row.original.updatedAt;
          return (
            <span className="text-sm text-muted-foreground">
              {value ? format(new Date(value), "yyyy-MM-dd HH:mm") : "-"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "操作",
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => openUpdateDialog(row.original)}
          >
            更新状态
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-lg font-semibold">执行流程列表（调试）</h1>
        <p className="text-sm text-muted-foreground">
          用于调试 execution-flow 服务端接口：分页查询、创建、更新状态。
        </p>
      </div>

      <div className="bg-card border rounded-lg p-3 shadow-sm">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              交易对
            </label>
            <Input
              value={query.tradeSubject || ""}
              onChange={(event) =>
                setQuery((prev) => ({ ...prev, tradeSubject: event.target.value }))
              }
              placeholder="BTC/USDT"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              状态
            </label>
            <Select
              value={query.status ?? "all"}
              onValueChange={(value) =>
                setQuery((prev) => ({
                  ...prev,
                  status: value === "all" ? undefined : (value as ExecutionFlowStatus),
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="全部" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                {statusOptions.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              开始日期
            </label>
            <Input
              type="date"
              value={query.dateFrom || ""}
              onChange={(event) =>
                setQuery((prev) => ({ ...prev, dateFrom: event.target.value }))
              }
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              结束日期
            </label>
            <Input
              type="date"
              value={query.dateTo || ""}
              onChange={(event) =>
                setQuery((prev) => ({ ...prev, dateTo: event.target.value }))
              }
            />
          </div>
          <div className="flex gap-2 md:col-span-4">
            <Button type="submit" size="sm">
              查询
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleReset}>
              重置
            </Button>
            <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
              新建工作
            </Button>
          </div>
        </form>
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        page={pagination.page}
        pageSize={pagination.pageSize}
        totalItems={pagination.total}
        totalPages={pagination.totalPages}
        onPageChange={(page, pageSize) => fetchList(page, pageSize)}
        onPageSizeChange={(page, pageSize) => fetchList(page, pageSize)}
        sorting={sorting}
        onSortingChange={setSorting}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建执行流程</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                标题
              </label>
              <Input
                value={createForm.title}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, title: event.target.value }))
                }
                placeholder="例如：BTC 突破计划"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                交易对
              </label>
              <Input
                value={createForm.tradeSubject}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    tradeSubject: event.target.value,
                  }))
                }
                placeholder="例如：BTC/USDT"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreate}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>更新状态</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block text-xs font-medium text-foreground mb-1">
              状态
            </label>
            <Select
              value={updateStatus}
              onValueChange={(value) => setUpdateStatus(value as ExecutionFlowStatus)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUpdateStatus}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
