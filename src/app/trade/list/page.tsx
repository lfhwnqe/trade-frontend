"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createTrade,
  updateTrade,
  deleteTrade,
  copyTrade,
  toDto,
} from "./request";
import {
  ColumnDef,
  SortingState,
  RowSelectionState,
} from "@tanstack/react-table";
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
import { useAlert } from "@/components/common/alert";
import TradePageShell from "../components/trade-page-shell";

export default function TradeListPage() {
  const router = useRouter();
  const [success, errorAlert] = useAlert();

  // 使用自定义 hook 管理状态和操作
  const {
    trades,
    loading,
    pagination,
    queryForm,
    sorting,
    rowSelection,
    dialog,
    fetchAll,
    updateQueryForm,
    updateSorting,
    updateRowSelection,
    updatePagination,
    closeDialog,
    updateForm,
    setDeleteId,
  } = useTradeList();

  // 复制交易记录相关状态
  const [copyId, setCopyId] = useState<string | null>(null);
  const [copyLoading, setCopyLoading] = useState(false);

  // 处理复制交易记录
  const handleCopy = async () => {
    if (!copyId) return;

    try {
      setCopyLoading(true);
      await copyTrade(copyId);
      success("复制成功");
      // 关闭对话框
      setCopyId(null);
      // 刷新列表
      fetchAll();
    } catch (error) {
      console.error("复制交易记录失败:", error);
      errorAlert(
        isErrorWithMessage(error) ? error.message : "复制交易记录失败",
      );
    } finally {
      setCopyLoading(false);
    }
  };

  useEffect(() => {
    fetchAll(); // 页面加载时获取数据
  }, []);

  const formatDateTime = (value?: string) => {
    if (!value) return { date: "-", time: "-" };
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return {
        date: format(parsed, "yyyy-MM-dd"),
        time: format(parsed, "HH:mm"),
      };
    }
    const [date, time] = value.split(" ");
    return { date: date || "-", time: time ? time.slice(0, 5) : "-" };
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "已分析":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case "待入场":
        return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
      case "已入场":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "已离场":
        return "bg-white/10 text-[#9ca3af] border border-white/10";
      default:
        return "bg-white/5 text-[#9ca3af] border border-white/10";
    }
  };

  const getDirectionBadge = (direction?: string) => {
    if (direction === "多") {
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    }
    if (direction === "空") {
      return "bg-red-500/10 text-red-400 border border-red-500/20";
    }
    return "bg-white/5 text-[#9ca3af] border border-white/10";
  };

  const getGradeBadge = (grade?: string) => {
    switch (grade) {
      case "高":
        return "bg-red-500/10 text-red-400 border border-red-500/20";
      case "中":
        return "bg-yellow-500/10 text-yellow-300 border border-yellow-500/20";
      case "低":
        return "bg-white/10 text-[#9ca3af] border border-white/10";
      default:
        return "bg-white/5 text-[#9ca3af] border border-white/10";
    }
  };

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
      // 最高优先级：盈亏结果
      {
        accessorKey: "profitLossPercentage",
        header: "盈亏%",
        cell: ({ row }) => {
          const value = row.original.profitLossPercentage;
          const formatted =
            value !== undefined && value !== null && value !== ""
              ? `${value}%`
              : "-";
          const isProfit = value && parseFloat(value) > 0;
          const isLoss = value && parseFloat(value) < 0;
          return (
            <div
              className={`text-right font-semibold min-w-[80px] ${
                isProfit
                  ? "text-emerald-400"
                  : isLoss
                    ? "text-red-400"
                    : "text-[#9ca3af]"
              }`}
            >
              {formatted}
            </div>
          );
        },
        enableHiding: true,
      },
      // 高优先级：交易状态
      {
        accessorKey: "status",
        header: "交易状态",
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <div className="min-w-[80px]">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                  status,
                )}`}
              >
                {status ?? "-"}
              </span>
            </div>
          );
        },
        enableHiding: true,
      },
      // 高优先级：交易分级
      {
        accessorKey: "grade",
        header: "分级",
        cell: ({ row }) => {
          const grade = row.original.grade;
          return (
            <div className="min-w-[60px]">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeBadge(
                  grade,
                )}`}
              >
                {grade ?? "-"}
              </span>
            </div>
          );
        },
        enableHiding: true,
      },
      // 高优先级：入场方向
      {
        accessorKey: "entryDirection",
        header: "方向",
        cell: ({ row }) => {
          const direction = row.original.entryDirection;
          return (
            <div className="min-w-[60px]">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDirectionBadge(
                  direction,
                )}`}
              >
                {direction ?? "-"}
              </span>
            </div>
          );
        },
        enableHiding: true,
      },
      // 中优先级：交易主题
      {
        accessorKey: "tradeSubject",
        header: "交易主题",
        cell: ({ row }) => (
          <div
            className="min-w-[120px] max-w-[200px] truncate text-white font-medium"
            title={row.original.tradeSubject}
          >
            {row.original.tradeSubject ?? "-"}
          </div>
        ),
        enableHiding: true,
      },
      // 中优先级：分析时间
      {
        accessorKey: "analysisTime",
        header: "分析时间",
        cell: ({ row }) => {
          const time = formatDateTime(row.original.analysisTime);
          return (
            <div className="min-w-[120px] text-white">
              {time.date}
              <span className="text-[#9ca3af] text-xs ml-1">{time.time}</span>
            </div>
          );
        },
        enableHiding: true,
      },
      // 中优先级：入场时间
      {
        accessorKey: "entryTime",
        header: "入场时间",
        cell: ({ row }) => {
          const time = formatDateTime(row.original.entryTime);
          return (
            <div className="min-w-[120px] text-white">
              {time.date}
              <span className="text-[#9ca3af] text-xs ml-1">{time.time}</span>
            </div>
          );
        },
        enableHiding: true,
      },
      // 中优先级：离场时间
      {
        accessorKey: "exitTime",
        header: "离场时间",
        cell: ({ row }) => {
          const time = formatDateTime(row.original.exitTime);
          return (
            <div className="min-w-[120px] text-white">
              {time.date}
              <span className="text-[#9ca3af] text-xs ml-1">{time.time}</span>
            </div>
          );
        },
        enableHiding: true,
      },
      {
        accessorKey: "createdAt",
        header: "创建时间",
        cell: ({ row }) => {
          const time = formatDateTime(row.original.createdAt);
          return (
            <div className="min-w-[120px] text-white">
              {time.date}
              <span className="text-[#9ca3af] text-xs ml-1">{time.time}</span>
            </div>
          );
        },
        enableHiding: true,
      },
      // 中优先级：市场结构
      {
        accessorKey: "marketStructure",
        header: "市场结构",
        cell: ({ row }) => (
          <div className="min-w-[80px] text-[#e5e7eb]">
            {row.original.marketStructure ?? "-"}
          </div>
        ),
        enableHiding: true,
      },
      // 低优先级：交易类型
      {
        accessorKey: "tradeType",
        header: "类型",
        cell: ({ row }) => (
          <div className="min-w-[80px]">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 text-[#e5e7eb] border border-white/10">
              {row.original.tradeType ?? "-"}
            </span>
          </div>
        ),
        enableHiding: true,
      },
      // 低优先级：风险收益比
      {
        accessorKey: "riskRewardRatio",
        header: "风险收益比",
        cell: ({ row }) => (
          <div className="min-w-[100px] text-right text-[#e5e7eb]">
            {row.original.riskRewardRatio ?? "-"}
          </div>
        ),
        enableHiding: true,
      },
      {
        id: "actions",
        header: () => <div className="text-center">操作</div>,
        cell: ({ row }) => {
          const trade = row.original;
          const transactionId = trade.transactionId;
          return (
            <div className="flex space-x-2 justify-center min-w-[200px]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (transactionId) {
                    router.push(`/trade/detail?id=${transactionId}`);
                  }
                }}
                disabled={!transactionId}
              >
                详情
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  router.push(`/trade/add?id=${trade.transactionId}`);
                }}
              >
                编辑
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCopyId(trade.transactionId || null)}
              >
                复制
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
        enableSorting: false,
        enableHiding: false,
        size: 200, // 固定操作列宽度
        enablePinning: true, // 启用列固定
        meta: {
          pinned: "right", // 固定在右侧
        },
      },
    ],
    [],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (dialog.editTrade?.transactionId) {
        await updateTrade(dialog.editTrade.transactionId, toDto(dialog.form));
        success("交易更新成功");
      } else {
        await createTrade(toDto(dialog.form));
        success("交易创建成功");
      }
      closeDialog();
      fetchAll(); // 刷新数据
    } catch (err) {
      if (isErrorWithMessage(err)) {
        errorAlert("操作失败: " + err.message);
      } else {
        errorAlert("操作失败: 未知错误");
      }
    }
  };

  const handleDelete = async () => {
    if (!dialog.deleteId) return;

    try {
      await deleteTrade(dialog.deleteId);
      success("交易删除成功");
      setDeleteId(null);
      fetchAll(); // 刷新数据
    } catch (err) {
      if (isErrorWithMessage(err)) {
        errorAlert("删除失败: " + err.message);
      } else {
        errorAlert("删除失败: 未知错误");
      }
    }
  };

  return (
    <TradePageShell title="交易记录">
      <div className="flex flex-col h-full space-y-6">
        {/* 查询表单 */}
        <div className="flex-shrink-0">
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
        </div>

        {/* 表格容器 - 可滚动区域 */}
        <div className="flex-1 min-h-0">
          <DataTable<Trade, unknown>
            columns={columns as ColumnDef<Trade, unknown>[]}
            data={trades}
            sorting={sorting}
            rowSelection={rowSelection}
            loading={loading}
            page={pagination.page}
            pageSize={pagination.pageSize}
            totalItems={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={(page, pageSize) => updatePagination(page, pageSize)}
            onPageSizeChange={(page, pageSize) =>
              updatePagination(page, pageSize)
            }
            onSortingChange={(newSorting) =>
              updateSorting(newSorting as SortingState)
            }
            onRowSelectionChange={(newSelection) =>
              updateRowSelection(newSelection as RowSelectionState)
            }
            initialColumnPinning={{
              right: ["actions"], // 将操作列固定在右侧
            }}
          />
        </div>

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

        {copyId && (
          <Dialog
            open={!!copyId}
            onOpenChange={(open) => !open && setCopyId(null)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>确认复制</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                确定要复制这条交易记录吗？将创建一个新的交易记录，并将分析已过期字段设置为未过期。
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCopyId(null)}
                  disabled={copyLoading}
                >
                  取消
                </Button>
                <Button onClick={handleCopy} disabled={copyLoading}>
                  {copyLoading ? "复制中..." : "确认复制"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </TradePageShell>
  );
}
