"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Pencil, Plus, RefreshCw } from "lucide-react";
import { ColumnDef, RowSelectionState, SortingState } from "@tanstack/react-table";
import TradePageShell from "@/app/trade/components/trade-page-shell";
import { DataTable } from "@/components/common/DataTable";
import { useAlert } from "@/components/common/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { isErrorWithMessage } from "@/utils";
import { format } from "date-fns";

type DictionaryBizType = "TRADE" | "FLASHCARD" | "SIMULATION" | "COMMON";
type DictionarySelectionMode = "SINGLE" | "MULTIPLE";
type DictionaryStatus = "ACTIVE" | "DISABLED";

type DictionaryCategory = {
  categoryId: string;
  code: string;
  name: string;
  description?: string;
  bizType: DictionaryBizType;
  selectionMode: DictionarySelectionMode;
  status: DictionaryStatus;
  sortOrder: number;
  itemCount: number;
  createdAt?: string;
  updatedAt?: string;
};

type CategoryFormState = {
  code: string;
  name: string;
  description: string;
  bizType: DictionaryBizType;
  selectionMode: DictionarySelectionMode;
  status: DictionaryStatus;
  sortOrder: string;
};

const defaultForm: CategoryFormState = {
  code: "",
  name: "",
  description: "",
  bizType: "TRADE",
  selectionMode: "MULTIPLE",
  status: "ACTIVE",
  sortOrder: "100",
};

const BIZ_TYPE_OPTIONS: { label: string; value: DictionaryBizType }[] = [
  { label: "Trade", value: "TRADE" },
  { label: "Flashcard", value: "FLASHCARD" },
  { label: "Simulation", value: "SIMULATION" },
  { label: "Common", value: "COMMON" },
];

const STATUS_OPTIONS: { label: string; value: DictionaryStatus }[] = [
  { label: "启用", value: "ACTIVE" },
  { label: "停用", value: "DISABLED" },
];

const SELECTION_MODE_OPTIONS: { label: string; value: DictionarySelectionMode }[] = [
  { label: "单选", value: "SINGLE" },
  { label: "多选", value: "MULTIPLE" },
];

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "yyyy-MM-dd HH:mm");
};

const getErrorMessage = (data: unknown, fallback: string) => {
  if (!data || typeof data !== "object") return fallback;
  const record = data as Record<string, unknown>;
  if (typeof record.userMessage === "string") return record.userMessage;
  if (typeof record.message === "string") return record.message;
  if (typeof record.error === "string") return record.error;
  return fallback;
};

const normalizeCategory = (raw: Record<string, unknown>): DictionaryCategory => ({
  categoryId: String(raw.categoryId ?? ""),
  code: String(raw.code ?? ""),
  name: String(raw.name ?? ""),
  description: typeof raw.description === "string" ? raw.description : undefined,
  bizType: String(raw.bizType ?? "TRADE") as DictionaryBizType,
  selectionMode: String(raw.selectionMode ?? "MULTIPLE") as DictionarySelectionMode,
  status: String(raw.status ?? "ACTIVE") as DictionaryStatus,
  sortOrder:
    typeof raw.sortOrder === "number"
      ? raw.sortOrder
      : Number(raw.sortOrder ?? 0) || 0,
  itemCount:
    typeof raw.itemCount === "number"
      ? raw.itemCount
      : Number(raw.itemCount ?? 0) || 0,
  createdAt: typeof raw.createdAt === "string" ? raw.createdAt : undefined,
  updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
});

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const getArrayValue = (record: Record<string, unknown>, key: string) => {
  const value = record[key];
  return Array.isArray(value) ? value : [];
};

export default function AdminDictionaryCategoriesPage() {
  const router = useRouter();
  const [success, errorAlert] = useAlert();

  const [items, setItems] = useState<DictionaryCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const [keyword, setKeyword] = useState("");
  const [bizTypeFilter, setBizTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingCategory, setEditingCategory] = useState<DictionaryCategory | null>(null);
  const [form, setForm] = useState<CategoryFormState>(defaultForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = React.useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (bizTypeFilter !== "ALL") query.set("bizType", bizTypeFilter);
      if (statusFilter !== "ALL") query.set("status", statusFilter);
      if (keyword.trim()) query.set("keyword", keyword.trim());

      const targetPath = `dictionary/categories${query.toString() ? `?${query.toString()}` : ""}`;
      const res = await fetchWithAuth(
        "/api/proxy-post",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          proxyParams: {
            targetPath,
            actualMethod: "GET",
          },
          actualBody: {},
        },
        router,
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(getErrorMessage(data, "获取字典分类失败"));
      }

      const payload =
        data && typeof data === "object" && "data" in data
          ? (data as Record<string, unknown>).data
          : data;
      const payloadRecord = toRecord(payload);
      const list = getArrayValue(payloadRecord, "items").map((item) =>
        normalizeCategory(toRecord(item)),
      );
      setItems(list);
    } catch (error) {
      if (isErrorWithMessage(error)) {
        errorAlert(error.message);
      } else {
        errorAlert("获取字典分类失败");
      }
    } finally {
      setLoading(false);
    }
  }, [bizTypeFilter, errorAlert, keyword, router, statusFilter]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const sortedItems = useMemo(() => {
    if (!sorting.length) return items;
    const [{ id, desc }] = sorting;
    const sorted = [...items].sort((a, b) => {
      const left = (a as Record<string, unknown>)[id];
      const right = (b as Record<string, unknown>)[id];
      if (typeof left === "number" && typeof right === "number") return left - right;
      return String(left ?? "").localeCompare(String(right ?? ""));
    });
    return desc ? sorted.reverse() : sorted;
  }, [items, sorting]);

  const openCreateDialog = () => {
    setDialogMode("create");
    setEditingCategory(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEditDialog = (item: DictionaryCategory) => {
    setDialogMode("edit");
    setEditingCategory(item);
    setForm({
      code: item.code,
      name: item.name,
      description: item.description || "",
      bizType: item.bizType,
      selectionMode: item.selectionMode,
      status: item.status,
      sortOrder: String(item.sortOrder ?? 100),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.code.trim() && dialogMode === "create") {
      errorAlert("分类 code 不能为空");
      return;
    }
    if (!form.name.trim()) {
      errorAlert("分类名称不能为空");
      return;
    }

    setSubmitting(true);
    try {
      const body =
        dialogMode === "create"
          ? {
              code: form.code.trim(),
              name: form.name.trim(),
              description: form.description.trim() || undefined,
              bizType: form.bizType,
              selectionMode: form.selectionMode,
              sortOrder: Number(form.sortOrder || 100),
            }
          : {
              name: form.name.trim(),
              description: form.description.trim() || undefined,
              bizType: form.bizType,
              selectionMode: form.selectionMode,
              status: form.status,
              sortOrder: Number(form.sortOrder || 100),
            };

      const res = await fetchWithAuth(
        "/api/proxy-post",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          proxyParams: {
            targetPath:
              dialogMode === "create"
                ? "dictionary/categories"
                : `dictionary/categories/${editingCategory?.categoryId}`,
            actualMethod: dialogMode === "create" ? "POST" : "PATCH",
          },
          actualBody: body,
        },
        router,
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          getErrorMessage(data, dialogMode === "create" ? "创建分类失败" : "更新分类失败"),
        );
      }

      success(dialogMode === "create" ? "分类创建成功" : "分类更新成功");
      setDialogOpen(false);
      await fetchCategories();
    } catch (error) {
      if (isErrorWithMessage(error)) {
        errorAlert(error.message);
      } else {
        errorAlert(dialogMode === "create" ? "创建分类失败" : "更新分类失败");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: DictionaryCategory) => {
    try {
      const nextStatus: DictionaryStatus = item.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
      const res = await fetchWithAuth(
        "/api/proxy-post",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          proxyParams: {
            targetPath: `dictionary/categories/${item.categoryId}`,
            actualMethod: "PATCH",
          },
          actualBody: { status: nextStatus },
        },
        router,
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(getErrorMessage(data, "更新分类状态失败"));
      }
      success(nextStatus === "ACTIVE" ? "分类已启用" : "分类已停用");
      await fetchCategories();
    } catch (error) {
      if (isErrorWithMessage(error)) {
        errorAlert(error.message);
      } else {
        errorAlert("更新分类状态失败");
      }
    }
  };

  const columns = useMemo<ColumnDef<DictionaryCategory>[]>(
    () => [
      {
        accessorKey: "name",
        header: "分类名称",
        cell: ({ row }) => (
          <div className="min-w-[160px]">
            <div className="text-sm font-semibold text-white">{row.original.name}</div>
            <div className="text-xs text-[#9ca3af]">{row.original.code}</div>
          </div>
        ),
      },
      {
        accessorKey: "bizType",
        header: "业务域",
        cell: ({ row }) => <span className="text-sm text-[#e5e7eb]">{row.original.bizType}</span>,
      },
      {
        accessorKey: "selectionMode",
        header: "选择模式",
        cell: ({ row }) => <span className="text-sm text-[#e5e7eb]">{row.original.selectionMode === "SINGLE" ? "单选" : "多选"}</span>,
      },
      {
        accessorKey: "status",
        header: "状态",
        cell: ({ row }) => (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
              row.original.status === "ACTIVE"
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-zinc-700/40 text-zinc-300"
            }`}
          >
            {row.original.status === "ACTIVE" ? "启用" : "停用"}
          </span>
        ),
      },
      {
        accessorKey: "sortOrder",
        header: "排序",
        cell: ({ row }) => <span className="text-sm text-[#e5e7eb]">{row.original.sortOrder}</span>,
      },
      {
        accessorKey: "itemCount",
        header: "字典项数",
        cell: ({ row }) => <span className="text-sm text-[#e5e7eb]">{row.original.itemCount}</span>,
      },
      {
        accessorKey: "updatedAt",
        header: "更新时间",
        cell: ({ row }) => <span className="text-sm text-[#9ca3af]">{formatDateTime(row.original.updatedAt)}</span>,
      },
      {
        id: "actions",
        header: "操作",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-[#27272a] bg-[#121212] text-white hover:bg-[#1e1e1e]"
              onClick={() =>
                router.push(`/admin/dictionary/items?categoryCode=${encodeURIComponent(row.original.code)}`)
              }
            >
              <ArrowRight className="mr-1 h-4 w-4" />
              字典项
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-[#27272a] bg-[#121212] text-white hover:bg-[#1e1e1e]"
              onClick={() => openEditDialog(row.original)}
            >
              <Pencil className="mr-1 h-4 w-4" />
              编辑
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-[#27272a] bg-[#121212] text-white hover:bg-[#1e1e1e]"
              onClick={() => handleToggleStatus(row.original)}
            >
              {row.original.status === "ACTIVE" ? "停用" : "启用"}
            </Button>
          </div>
        ),
      },
    ],
    [router],
  );

  const toolbarSlot = (
    <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
        <Input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="搜索分类名称 / code"
          className="max-w-sm border-[#27272a] bg-[#121212] text-white"
        />
        <Select value={bizTypeFilter} onValueChange={setBizTypeFilter}>
          <SelectTrigger className="w-[180px] border-[#27272a] bg-[#121212] text-white">
            <SelectValue placeholder="业务域" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">全部业务域</SelectItem>
            {BIZ_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] border-[#27272a] bg-[#121212] text-white">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">全部状态</SelectItem>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          className="border-[#27272a] bg-[#121212] text-white hover:bg-[#1e1e1e]"
          onClick={fetchCategories}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          刷新
        </Button>
      </div>
      <Button className="bg-[#00c2b2] text-black hover:bg-[#00a99c]" onClick={openCreateDialog}>
        <Plus className="mr-2 h-4 w-4" />
        新增分类
      </Button>
    </div>
  );

  return (
    <TradePageShell
      title="字典分类"
      subtitle="管理 Trade / Flashcard / Simulation 可复用的字典分类"
      showAddButton={false}
    >
      <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4 text-sm text-[#9ca3af]">
        先维护分类，再进入字典项页面维护具体标签。当前分类停用后，不影响历史数据展示，但默认不会继续出现在业务 options 中。
      </div>

      <div className="h-[calc(100vh-220px)] min-h-[520px]">
        <DataTable
          columns={columns}
          data={sortedItems}
          loading={loading}
          page={1}
          pageSize={Math.max(sortedItems.length, 1)}
          totalItems={sortedItems.length}
          totalPages={1}
          onPageChange={() => {}}
          onPageSizeChange={() => {}}
          sorting={sorting}
          onSortingChange={setSorting}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          toolbarSlot={toolbarSlot}
          showPagination={false}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl border-[#27272a] bg-[#121212] text-white">
          <DialogHeader>
            <DialogTitle>{dialogMode === "create" ? "新增字典分类" : "编辑字典分类"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="category-code">分类 Code</Label>
              <Input
                id="category-code"
                value={form.code}
                onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
                disabled={dialogMode === "edit"}
                placeholder="trade_tag"
                className="border-[#27272a] bg-[#090909]"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category-name">分类名称</Label>
              <Input
                id="category-name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="交易标签"
                className="border-[#27272a] bg-[#090909]"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category-description">描述</Label>
              <Textarea
                id="category-description"
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="用于交易记录打标签"
                className="min-h-[96px] border-[#27272a] bg-[#090909]"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>业务域</Label>
                <Select
                  value={form.bizType}
                  onValueChange={(value: DictionaryBizType) =>
                    setForm((prev) => ({ ...prev, bizType: value }))
                  }
                >
                  <SelectTrigger className="border-[#27272a] bg-[#090909] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BIZ_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>选择模式</Label>
                <Select
                  value={form.selectionMode}
                  onValueChange={(value: DictionarySelectionMode) =>
                    setForm((prev) => ({ ...prev, selectionMode: value }))
                  }
                >
                  <SelectTrigger className="border-[#27272a] bg-[#090909] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SELECTION_MODE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>状态</Label>
                <Select
                  value={form.status}
                  onValueChange={(value: DictionaryStatus) =>
                    setForm((prev) => ({ ...prev, status: value }))
                  }
                  disabled={dialogMode === "create"}
                >
                  <SelectTrigger className="border-[#27272a] bg-[#090909] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category-sort-order">排序</Label>
                <Input
                  id="category-sort-order"
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(event) => setForm((prev) => ({ ...prev, sortOrder: event.target.value }))}
                  className="border-[#27272a] bg-[#090909]"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="border-[#27272a] bg-[#121212] text-white hover:bg-[#1e1e1e]"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              取消
            </Button>
            <Button className="bg-[#00c2b2] text-black hover:bg-[#00a99c]" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "提交中..." : dialogMode === "create" ? "创建分类" : "保存修改"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TradePageShell>
  );
}
