"use client";

import * as React from "react";
import { useEffect, useMemo } from "react";
import { createTrade, updateTrade, deleteTrade, toDto } from "./request";
import { ColumnDef } from "@tanstack/react-table";
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
import {
  Trade,
  TradeFieldConfig,
  entryDirectionOptions,
  marketStructureOptions,
} from "../config";
import { useTradeList } from "./useTradeList";
import { format } from "date-fns";

export default function TradeListPage() {
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

  // 扩展字段，和后端 DTO 保持一致，表单展示建议分组区域（基础/图片/分析/计划/复盘）
  const tradeFields: TradeFieldConfig[] = [
    // ===== 交易基础信息 =====
    {
      key: "status",
      label: "交易状态",
      required: true,
      options: [
        { label: "已分析", value: "ANALYZED" },
        { label: "已入场", value: "ENTERED" },
        { label: "已离场", value: "EXITED" },
      ],
    },
    {
      key: "marketStructure",
      label: "市场结构",
      required: true,
      options: marketStructureOptions,
    },
    { key: "marketStructureAnalysis", label: "结构分析", type: "text" },
    // 入场方向只在已入场/已离场时必填
    {
      key: "entryDirection",
      label: "入场方向",
      required: (status) => status === "ENTERED" || status === "EXITED",
      options: entryDirectionOptions,
    },

    // ===== 图片相关（分组内多选或上传） =====
    { key: "volumeProfileImages", label: "成交量分布图", type: "image-array" },
    { key: "expectedPathImages", label: "假设路径图", type: "image-array" },
    { key: "actualPathImages", label: "实际路径图", type: "image-array" },

    // ===== 价值区价位等 =====
    { key: "poc", label: "POC价格", type: "number" },
    { key: "val", label: "价值区下沿", type: "number" },
    { key: "vah", label: "价值区上沿", type: "number" },
    { key: "keyPriceLevels", label: "关键价位说明", type: "text" },

    // ===== 入场计划区域（嵌套对象） =====
    { key: "entryPlanA", label: "入场计划A", type: "plan" },
    { key: "entryPlanB", label: "入场计划B", type: "plan" },
    { key: "entryPlanC", label: "入场计划C", type: "plan" },

    // ===== 入场记录（根据状态显隐）======
    // ===== 入场记录（根据状态判定必填）======
    {
      key: "entry",
      label: "入场价格",
      type: "number",
      required: (status) => status === "ENTERED" || status === "EXITED",
    },
    {
      key: "entryTime",
      label: "入场时间",
      type: "date",
      required: (status) => status === "ENTERED" || status === "EXITED",
    },
    {
      key: "stopLoss",
      label: "止损点",
      type: "number",
      required: (status) => status === "ENTERED" || status === "EXITED",
    },
    {
      key: "takeProfit",
      label: "止盈点",
      type: "number",
      required: (status) => status === "ENTERED" || status === "EXITED",
    },
    {
      key: "entryReason",
      label: "入场理由",
      type: "text",
      required: (status) => status === "ENTERED" || status === "EXITED",
    },

    // ===== 离场及复盘 =====
    // ===== 离场及复盘（根据 status 判定必填）=====
    {
      key: "exitPrice",
      label: "离场价格",
      type: "number",
      required: (status) => status === "EXITED",
    },
    {
      key: "exitTime",
      label: "离场时间",
      type: "date",
      required: (status) => status === "EXITED",
    },
    {
      key: "exitReason",
      label: "离场理由",
      type: "text",
      required: (status) => status === "ENTERED" || status === "EXITED",
    },
    {
      key: "tradeResult",
      label: "交易结果",
      options: [
        { label: "盈利", value: "PROFIT" },
        { label: "亏损", value: "LOSS" },
        { label: "保本", value: "BREAKEVEN" },
      ],
      required: (status) => status === "EXITED",
    },
    {
      key: "followedPlan",
      label: "是否执行了计划",
      type: "checkbox",
      required: (status) => status === "EXITED",
    },
    {
      key: "followedPlanId",
      label: "计划ID",
      type: "text",
      required: (status, form) => status === "EXITED" && !!form?.followedPlan,
    },
    {
      key: "mentalityNotes",
      label: "心态记录",
      type: "text",
      required: (status) => status === "ENTERED" || status === "EXITED",
    },
    { key: "actualPathAnalysis", label: "实际路径复盘", type: "text" },
    { key: "remarks", label: "备注", type: "text" },
    { key: "lessonsLearned", label: "经验总结", type: "text" },
    { key: "profitLossPercentage", label: "盈亏%", type: "number" },
    { key: "riskRewardRatio", label: "风险回报比", type: "text" },
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
            updateForm({});
            openDialog(null);
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
        onSortingChange={updateSorting as any}
        onColumnVisibilityChange={updateColumnVisibility as any}
        onRowSelectionChange={updateRowSelection as any}
      />

      <Dialog
        open={dialog.open}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog.editTrade?.transactionId ? "编辑交易" : "添加交易"}
            </DialogTitle>
          </DialogHeader>

          <TradeFormDialog
            open={dialog.open}
            onOpenChange={(open) => !open && closeDialog()}
            editTrade={dialog.editTrade}
            form={dialog.form}
            tradeFields={tradeFields}
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
        </DialogContent>
      </Dialog>

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
