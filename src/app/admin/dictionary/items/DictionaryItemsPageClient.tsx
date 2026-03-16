"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
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

type DictionaryStatus = "ACTIVE" | "DISABLED";

type DictionaryItem = {
  itemId: string;
  categoryCode: string;
  code: string;
  label: string;
  alias?: string[];
  description?: string;
  color?: string;
  status: DictionaryStatus;
  sortOrder: number;
  isSystem?: boolean;
  usageCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

type ItemFormState = {
  categoryCode: string;
  code: string;
  label: string;
  aliasText: string;
  description: string;
  color: string;
  status: DictionaryStatus;
  sortOrder: string;
};

const defaultForm: ItemFormState = {
  categoryCode: "",
  code: "",
  label: "",
  aliasText: "",
  description: "",
  color: "#00c2b2",
  status: "ACTIVE",
  sortOrder: "100",
};

const STATUS_OPTIONS: { label: string; value: DictionaryStatus }[] = [
  { label: "启用", value: "ACTIVE" },
  { label: "停用", value: "DISABLED" },
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

const normalizeItem = (raw: Record<string, unknown>): DictionaryItem => ({
  itemId: String(raw.itemId ?? ""),
  categoryCode: String(raw.categoryCode ?? ""),
  code: String(raw.code ?? ""),
  label: String(raw.label ?? ""),
  alias: Array.isArray(raw.alias) ? raw.alias.map((item) => String(item)) : undefined,
  description: typeof raw.description === "string" ? raw.description : undefined,
  color: typeof raw.color === "string" ? raw.color : undefined,
  status: String(raw.status ?? "ACTIVE") as DictionaryStatus,
  sortOrder:
    typeof raw.sortOrder === "number"
      ? raw.sortOrder
      : Number(raw.sortOrder ?? 0) || 0,
  isSystem: raw.isSystem === true,
  usageCount:
    typeof raw.usageCount === "number"
      ? raw.usageCount
      : Number(raw.usageCount ?? 0) || 0,
  createdAt: typeof raw.createdAt === "string" ? raw.createdAt : undefined,
  updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
});

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const getArrayValue = (record: Record<string, unknown>, key: string) => {
  const value = record[key];
  return Array.isArray(value) ? value : [];
};

export default function AdminDictionaryItemsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [success, errorAlert] = useAlert();

  const [items, setItems] = useState<DictionaryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const categoryCode = searchParams.get("categoryCode") || "";
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [keyword, setKeyword] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingItem, setEditingItem] = useState<DictionaryItem | null>(null);
  const [form, setForm] = useState<ItemFormState>({ ...defaultForm, categoryCode });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm((prev) => ({ ...prev, categoryCode }));
  }, [categoryCode]);

  const fetchItems = React.useCallback(async () => {
    if (!categoryCode) {
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const query = new URLSearchParams();
      query.set("categoryCode", categoryCode);
      if (statusFilter !== "ALL") query.set("status", statusFilter);
      if (keyword.trim()) query.set("keyword", keyword.trim());

      const targetPath = `dictionary/items?${query.toString()}`;
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
        throw new Error(getErrorMessage(data, "获取字典项失败"));
      }

      const payload =
        data && typeof data === "object" && "data" in data
          ? (data as Record<string, unknown>).data
          : data;
      const payloadRecord = toRecord(payload);
      const list = getArrayValue(payloadRecord, "items").map((item) =>
        normalizeItem(toRecord(item)),
      );
      setItems(list);
    } catch (error) {
      if (isErrorWithMessage(error)) {
        errorAlert(error.message);
      } else {
        errorAlert("获取字典项失败");
      }
    } finally {
      setLoading(false);
    }
  }, [categoryCode, errorAlert, keyword, router, statusFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

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
    setEditingItem(null);
    setForm({ ...defaultForm, categoryCode, color: "#00c2b2" });
    setDialogOpen(true);
  };

  const openEditDialog = (item: DictionaryItem) => {
    setDialogMode("edit");
    setEditingItem(item);
    setForm({
      categoryCode: item.categoryCode,
      code: item.code,
      label: item.label,
      aliasText: (item.alias || []).join("\n"),
      description: item.description || "",
      color: item.color || "#00c2b2",
      status: item.status,
      sortOrder: String(item.sortOrder ?? 100),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.categoryCode.trim()) {
      errorAlert("请先从分类页进入，或补充 categoryCode");
      return;
    }
    if (!form.code.trim() && dialogMode === "create") {
      errorAlert("字典项 code 不能为空");
      return;
    }
    if (!form.label.trim()) {
      errorAlert("字典项名称不能为空");
      return;
    }

    setSubmitting(true);
    try {
      const alias = form.aliasText
        .split(/\n|,/)
        .map((item) => item.trim())
        .filter(Boolean);

      const body =
        dialogMode === "create"
          ? {
              categoryCode: form.categoryCode.trim(),
              code: form.code.trim(),
              label: form.label.trim(),
              alias: alias.length ? alias : undefined,
              description: form.description.trim() || undefined,
              color: form.color || undefined,
              sortOrder: Number(form.sortOrder || 100),
            }
          : {
              label: form.label.trim(),
              alias: alias.length ? alias : undefined,
              description: form.description.trim() || undefined,
              color: form.color || undefined,
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
                ? "dictionary/items"
                : `dictionary/items/${editingItem?.itemId}`,
            actualMethod: dialogMode === "create" ? "POST" : "PATCH",
          },
          actualBody: body,
        },
        router,
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          getErrorMessage(data, dialogMode === "create" ? "创建字典项失败" : "更新字典项失败"),
        );
      }

      success(dialogMode === "create" ? "字典项创建成功" : "字典项更新成功");
      setDialogOpen(false);
      await fetchItems();
    } catch (error) {
      if (isErrorWithMessage(error)) {
        errorAlert(error.message);
      } else {
        errorAlert(dialogMode === "create" ? "创建字典项失败" : "更新字典项失败");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: DictionaryItem) => {
    try {
      const nextStatus: DictionaryStatus = item.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
      const res = await fetchWithAuth(
        "/api/proxy-post",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          proxyParams: {
            targetPath: `dictionary/items/${item.itemId}`,
            actualMethod: "PATCH",
          },
          actualBody: { status: nextStatus },
        },
        router,
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(getErrorMessage(data, "更新字典项状态失败"));
      success(nextStatus === "ACTIVE" ? "字典项已启用" : "字典项已停用");
      await fetchItems();
    } catch (error) {
      if (isErrorWithMessage(error)) {
        errorAlert(error.message);
      } else {
        errorAlert("更新字典项状态失败");
      }
    }
  };

  const handleDelete = async (item: DictionaryItem) => {
    if (!window.confirm(`确认删除字典项「${item.label}」吗？`)) return;
    try {
      const res = await fetchWithAuth(
        "/api/proxy-post",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          proxyParams: {
            targetPath: `dictionary/items/${item.itemId}`,
            actualMethod: "DELETE",
          },
          actualBody: {},
        },
        router,
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(getErrorMessage(data, "删除字典项失败"));
      success("字典项删除成功");
      await fetchItems();
    } catch (error) {
      if (isErrorWithMessage(error)) {
        errorAlert(error.message);
      } else {
        errorAlert("删除字典项失败");
      }
    }
  };

  const columns = useMemo<ColumnDef<DictionaryItem>[]>(
    () => [
      {
        accessorKey: "label",
        header: "字典项",
        cell: ({ row }) => (
          <div className="min-w-[180px]">
            <div className="flex items-center gap-2">
              {row.original.color ? (
                <span
                  className="inline-block h-3 w-3 rounded-full border border-white/20"
                  style={{ backgroundColor: row.original.color }}
                />
              ) : null}
              <span className="text-sm font-semibold text-white">{row.original.label}</span>
            </div>
            <div className="mt-1 text-xs text-[#9ca3af]">{row.original.code}</div>
          </div>
        ),
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
        accessorKey: "description",
        header: "描述",
        cell: ({ row }) => (
          <div className="max-w-[280px] whitespace-normal text-sm text-[#9ca3af]">
            {row.original.description || "-"}
          </div>
        ),
      },
      {
        accessorKey: "usageCount",
        header: "使用次数",
        cell: ({ row }) => <span className="text-sm text-[#e5e7eb]">{row.original.usageCount ?? 0}</span>,
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
            <Button
              variant="outline"
              size="sm"
              className="border-red-500/40 bg-[#121212] text-red-300 hover:bg-red-500/10"
              onClick={() => handleDelete(row.original)}
              disabled={row.original.isSystem}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              删除
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const toolbarSlot = (
    <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
        <Input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="搜索 label / code"
          className="max-w-sm border-[#27272a] bg-[#121212] text-white"
        />
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
          onClick={fetchItems}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          刷新
        </Button>
      </div>
      <Button className="bg-[#00c2b2] text-black hover:bg-[#00a99c]" onClick={openCreateDialog} disabled={!categoryCode}>
        <Plus className="mr-2 h-4 w-4" />
        新增字典项
      </Button>
    </div>
  );

  return (
    <TradePageShell
      title="字典项"
      subtitle={categoryCode ? `当前分类：${categoryCode}` : "请从分类页进入或带上 categoryCode"}
      showAddButton={false}
    >
      <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4 text-sm text-[#9ca3af]">
        {categoryCode
          ? `当前正在维护分类「${categoryCode}」下的字典项。停用项不会出现在业务 options 中，但历史数据仍可正常展示。`
          : "当前未选择分类，请先从“字典分类”页面点击进入对应分类。"}
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
            <DialogTitle>{dialogMode === "create" ? "新增字典项" : "编辑字典项"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="item-category-code">分类 Code</Label>
              <Input
                id="item-category-code"
                value={form.categoryCode}
                onChange={(event) => setForm((prev) => ({ ...prev, categoryCode: event.target.value }))}
                disabled={dialogMode === "edit"}
                className="border-[#27272a] bg-[#090909]"
              />
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="item-code">字典项 Code</Label>
                <Input
                  id="item-code"
                  value={form.code}
                  onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
                  disabled={dialogMode === "edit"}
                  placeholder="false_breakout"
                  className="border-[#27272a] bg-[#090909]"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="item-label">字典项名称</Label>
                <Input
                  id="item-label"
                  value={form.label}
                  onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))}
                  placeholder="假突破"
                  className="border-[#27272a] bg-[#090909]"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="item-alias">别名（每行一个）</Label>
              <Textarea
                id="item-alias"
                value={form.aliasText}
                onChange={(event) => setForm((prev) => ({ ...prev, aliasText: event.target.value }))}
                placeholder={`扫流动性失败\n假上破`}
                className="min-h-[100px] border-[#27272a] bg-[#090909]"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="item-description">描述</Label>
              <Textarea
                id="item-description"
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="价格短暂突破后重新回到关键区域"
                className="min-h-[100px] border-[#27272a] bg-[#090909]"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="item-color">颜色</Label>
                <Input
                  id="item-color"
                  type="color"
                  value={form.color}
                  onChange={(event) => setForm((prev) => ({ ...prev, color: event.target.value }))}
                  className="h-11 border-[#27272a] bg-[#090909] p-1"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="item-sort-order">排序</Label>
                <Input
                  id="item-sort-order"
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(event) => setForm((prev) => ({ ...prev, sortOrder: event.target.value }))}
                  className="border-[#27272a] bg-[#090909]"
                />
              </div>
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
              {submitting ? "提交中..." : dialogMode === "create" ? "创建字典项" : "保存修改"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TradePageShell>
  );
}
