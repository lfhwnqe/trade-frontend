"use client";

import * as React from "react";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createTrade, updateTrade, deleteTrade, toDto } from "./request";
import { ColumnDef, SortingState, VisibilityState, RowSelectionState } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/common/DataTable";
import { isErrorWithMessage } from "@/utils";
import TradeQueryForm from "./components/TradeQueryForm";
import { TradeFormDialog } from "./components/TradeFormDialog";
import { Trade } from "../config";
import { useTradeList } from "./useTradeList";
import { format } from "date-fns";

export default function TradeListPage() {
  const router = useRouter();
  // 使用自定义 hook 管理状态和操作
  const {
    trades,
    loading,
    pagination,
    queryForm,
    sorting,
    columnVisibility,
    rowSelection,
    dialog,
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
  } = useTradeList();

  useEffect(() => {
    fetchAll(); // 页面加载时获取数据
  }, [fetchAll]);

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
        accessorKey: "profitLossPercentage",
        header: () => <div className="text-right">盈亏%</div>,
        cell: ({ row }) => {
          const value = row.original.profitLossPercentage;
          const formatted =
            value !== undefined && value !== null && value !== ""
              ? `${value}%`
              : "-";
          return <div className="text-right font-medium">{formatted}</div>;
        },
      },
      {
        id: "actions",
        header: () => <div className="text-center">操作</div>,
        cell: ({ row }) => {
          const trade = row.original;
          return (
            <div className="flex space-x-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  openDialog(trade);
                }}
              >
                编辑
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteId(trade.transactionId || null)}
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (dialog.editTrade?.transactionId) {
        await updateTrade(dialog.editTrade.transactionId, toDto(dialog.form));
        alert("交易更新成功");
      } else {
        await createTrade(toDto(dialog.form));
        alert("交易创建成功");
      }
      closeDialog();
      fetchAll(); // 刷新数据
    } catch (err) {
      if (isErrorWithMessage(err)) {
        alert("操作失败: " + err.message);
      } else {
        alert("操作失败: 未知错误");
      }
    }
  };

  const handleDelete = async () => {
    if (!dialog.deleteId) return;

    try {
      await deleteTrade(dialog.deleteId);
      alert("交易删除成功");
      setDeleteId(null);
      fetchAll(); // 刷新数据
    } catch (err) {
      if (isErrorWithMessage(err)) {
        alert("删除失败: " + err.message);
      } else {
        alert("删除失败: 未知错误");
      }
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">交易列表</h1>
        <Button
          onClick={() => {
            router.push("/trade/add");
          }}
        >
          新增交易
        </Button>
      </div>

      <TradeQueryForm
        queryForm={queryForm}
        onQueryFormChange={(newQueryForm) => {
          updateQueryForm(newQueryForm);
          updatePagination(1, pagination.pageSize);
          fetchAll(1, pagination.pageSize, newQueryForm, sorting);
        }}
        onSubmit={(e) => {
          e.preventDefault();
          fetchAll(1, pagination.pageSize, queryForm, sorting);
        }}
        onReset={() => {
          updateQueryForm({});
          updatePagination(1, pagination.pageSize);
          updateSorting([]);
          fetchAll(1, pagination.pageSize, {}, []);
        }}
      />

      <DataTable<Trade, unknown>
        columns={columns as ColumnDef<Trade, unknown>[]}
        data={trades}
        sorting={sorting}
        columnVisibility={columnVisibility}
        rowSelection={rowSelection}
        loading={loading}
        page={pagination.page}
        pageSize={pagination.pageSize}
        totalItems={pagination.total}
        totalPages={pagination.totalPages}
        onPageChange={updatePagination}
        onPageSizeChange={updatePagination}
        onSortingChange={(newSorting) => updateSorting(newSorting as SortingState)}
        onColumnVisibilityChange={(newVisibility) => updateColumnVisibility(newVisibility as VisibilityState)}
        onRowSelectionChange={(newSelection) => updateRowSelection(newSelection as RowSelectionState)}
      />

      {dialog.open && (
        <TradeFormDialog
          editTrade={dialog.editTrade}
          form={dialog.form}
          handleChange={(e) => {
            const name = e.target.name as keyof Trade;
            const value = e.target.value;
            updateForm({ [name]: value });
          }}
          handleSelectChange={(name, value) => {
            updateForm({ [name]: value });
          }}
          handleDateRangeChange={(dateRange) => {
            updateForm({
              dateTimeRange: dateRange?.from
                ? format(dateRange.from, "yyyy-MM-dd")
                : undefined,
            });
          }}
          // 图片和计划类型需特殊处理，底层子组件需通过 updateForm 合并嵌套对象
          handleImageChange={(key, v) => {
            updateForm({ [key]: v });
          }}
          handlePlanChange={(key, v) => {
            updateForm({ [key]: v });
          }}
          handleSubmit={handleSubmit}
          updateForm={updateForm}
        />
      )}

      {dialog.deleteId && (
        <Dialog
          open={!!dialog.deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>确认删除</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              确定要删除这条交易记录吗？此操作无法撤销。
            </div>
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
