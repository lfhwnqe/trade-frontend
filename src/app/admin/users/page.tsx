"use client";

import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, RefreshCw, Pencil, Trash2 } from "lucide-react";
import {
  ColumnDef,
  RowSelectionState,
  SortingState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/common/DataTable";
import { useAlert } from "@/components/common/alert";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { isErrorWithMessage } from "@/utils";
import TradePageShell from "@/app/trade/components/trade-page-shell";
import { format } from "date-fns";

type RoleGroup = {
  groupName: string;
  description?: string;
  precedence?: number;
  roleArn?: string;
  creationDate?: string;
  lastModifiedDate?: string;
};

type RoleFormState = {
  groupName: string;
  description: string;
  precedence: string;
  roleArn: string;
};

const emptyForm: RoleFormState = {
  groupName: "",
  description: "",
  precedence: "",
  roleArn: "",
};

const normalizeRole = (raw: Record<string, unknown>): RoleGroup => ({
  groupName: String(raw.GroupName ?? raw.groupName ?? ""),
  description:
    typeof raw.Description === "string"
      ? raw.Description
      : typeof raw.description === "string"
        ? raw.description
        : undefined,
  precedence:
    typeof raw.Precedence === "number"
      ? raw.Precedence
      : typeof raw.precedence === "number"
        ? raw.precedence
        : typeof raw.Precedence === "string"
          ? Number(raw.Precedence)
          : typeof raw.precedence === "string"
            ? Number(raw.precedence)
            : undefined,
  roleArn:
    typeof raw.RoleArn === "string"
      ? raw.RoleArn
      : typeof raw.roleArn === "string"
        ? raw.roleArn
        : undefined,
  creationDate:
    raw.CreationDate instanceof Date
      ? raw.CreationDate.toISOString()
      : raw.creationDate instanceof Date
        ? raw.creationDate.toISOString()
        : typeof raw.CreationDate === "string"
          ? raw.CreationDate
          : typeof raw.creationDate === "string"
            ? raw.creationDate
            : undefined,
  lastModifiedDate:
    raw.LastModifiedDate instanceof Date
      ? raw.LastModifiedDate.toISOString()
      : raw.lastModifiedDate instanceof Date
        ? raw.lastModifiedDate.toISOString()
        : typeof raw.LastModifiedDate === "string"
          ? raw.LastModifiedDate
          : typeof raw.lastModifiedDate === "string"
            ? raw.lastModifiedDate
            : undefined,
});

const getErrorMessage = (data: unknown, fallback: string) => {
  if (!data || typeof data !== "object") return fallback;
  const record = data as Record<string, unknown>;
  if (typeof record.message === "string") return record.message;
  if (typeof record.error === "string") return record.error;
  if (record.error && typeof record.error === "object") {
    const err = record.error as Record<string, unknown>;
    if (typeof err.message === "string") return err.message;
  }
  return fallback;
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return format(parsed, "yyyy-MM-dd HH:mm");
  }
  return value;
};

export default function AdminRoleManagementPage() {
  const router = useRouter();
  const [success, errorAlert] = useAlert();

  const [roles, setRoles] = useState<RoleGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const pageCacheRef = useRef<Record<number, RoleGroup[]>>({});
  const nextTokenRef = useRef<Record<number, string | undefined>>({});
  const initialPageSizeRef = useRef(pageSize);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState<RoleFormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RoleGroup | null>(null);

  const fetchRoles = React.useCallback(
    async (targetPage: number, targetPageSize: number, force = false) => {
      if (!force && pageCacheRef.current[targetPage]) {
        setRoles(pageCacheRef.current[targetPage]);
        setPage(targetPage);
        setPageSize(targetPageSize);
        return;
      }

      setLoading(true);
      try {
        const token =
          targetPage === 1 ? undefined : nextTokenRef.current[targetPage - 1];
        const res = await fetchWithAuth(
          "/api/proxy-post",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            proxyParams: {
              targetPath: "role/list",
              actualMethod: "GET",
            },
            actualBody: {
              limit: targetPageSize,
              paginationToken: token,
            },
          },
          router,
        );

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(getErrorMessage(data, "获取角色列表失败"));
        }

        const payload =
          (data && typeof data === "object" && "data" in data
            ? (data as Record<string, unknown>).data
            : data) ?? {};
        const groups = Array.isArray((payload as any).groups)
          ? (payload as any).groups
          : [];
        const normalized = groups.map((group: Record<string, unknown>) =>
          normalizeRole(group),
        );
        const nextToken =
          (payload as any).paginationToken ?? (payload as any).nextToken;

        pageCacheRef.current[targetPage] = normalized;
        nextTokenRef.current[targetPage] = nextToken;

        setRoles(normalized);
        setPage(targetPage);
        setPageSize(targetPageSize);
        if (nextToken) {
          setTotalPages((prev) => Math.max(prev, targetPage + 1));
        } else {
          setTotalPages(targetPage);
        }
      } catch (err) {
        if (isErrorWithMessage(err)) {
          errorAlert(err.message);
        } else {
          errorAlert("获取角色列表失败");
        }
      } finally {
        setLoading(false);
      }
    },
    [router, errorAlert],
  );

  useEffect(() => {
    fetchRoles(1, initialPageSizeRef.current, true);
  }, [fetchRoles]);

  const totalItems = Math.max((totalPages - 1) * pageSize + roles.length, 0);

  const sortedRoles = useMemo(() => {
    if (!sorting.length) return roles;
    const [{ id, desc }] = sorting;
    const compare = (a: RoleGroup, b: RoleGroup) => {
      const getValue = (role: RoleGroup) => {
        switch (id) {
          case "groupName":
            return role.groupName || "";
          case "description":
            return role.description || "";
          case "precedence":
            return role.precedence ?? -1;
          case "roleArn":
            return role.roleArn || "";
          case "creationDate":
            return role.creationDate
              ? new Date(role.creationDate).getTime()
              : 0;
          case "lastModifiedDate":
            return role.lastModifiedDate
              ? new Date(role.lastModifiedDate).getTime()
              : 0;
          default:
            return "";
        }
      };

      const left = getValue(a);
      const right = getValue(b);

      if (typeof left === "number" && typeof right === "number") {
        return left - right;
      }
      return String(left).localeCompare(String(right));
    };

    const sorted = [...roles].sort(compare);
    return desc ? sorted.reverse() : sorted;
  }, [roles, sorting]);

  const columns = useMemo<ColumnDef<RoleGroup>[]>(
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
        accessorKey: "groupName",
        header: "角色名称",
        cell: ({ row }) => (
          <div className="text-sm font-semibold text-white min-w-[140px]">
            {row.original.groupName || "-"}
          </div>
        ),
      },
      {
        accessorKey: "description",
        header: "描述",
        cell: ({ row }) => (
          <div className="text-sm text-[#9ca3af] min-w-[220px]">
            {row.original.description || "-"}
          </div>
        ),
      },
      {
        accessorKey: "precedence",
        header: "优先级",
        cell: ({ row }) => {
          const value = row.original.precedence;
          return (
            <div className="text-sm text-[#e5e7eb] min-w-[80px]">
              {value ?? "-"}
            </div>
          );
        },
      },
      {
        accessorKey: "roleArn",
        header: "关联 ARN",
        cell: ({ row }) => (
          <div className="text-sm text-[#9ca3af] min-w-[200px] max-w-[320px] truncate">
            {row.original.roleArn || "-"}
          </div>
        ),
      },
      {
        accessorKey: "creationDate",
        header: "创建时间",
        cell: ({ row }) => (
          <div className="text-sm text-[#9ca3af] min-w-[140px]">
            {formatDateTime(row.original.creationDate)}
          </div>
        ),
      },
      {
        accessorKey: "lastModifiedDate",
        header: "更新时间",
        cell: ({ row }) => (
          <div className="text-sm text-[#9ca3af] min-w-[140px]">
            {formatDateTime(row.original.lastModifiedDate)}
          </div>
        ),
      },
      {
        id: "actions",
        header: "操作",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1e1e1e]"
              onClick={() => {
                setDialogMode("edit");
                setForm({
                  groupName: row.original.groupName,
                  description: row.original.description || "",
                  precedence:
                    row.original.precedence !== undefined
                      ? String(row.original.precedence)
                      : "",
                  roleArn: row.original.roleArn || "",
                });
                setFormErrors({});
                setDialogOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" />
              编辑
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-[#27272a] bg-transparent text-red-400 hover:bg-red-500/10 hover:text-red-300"
              onClick={() => setDeleteTarget(row.original)}
            >
              <Trash2 className="h-4 w-4" />
              删除
            </Button>
          </div>
        ),
        enableSorting: false,
      },
    ],
    [
      setDialogMode,
      setForm,
      setFormErrors,
      setDialogOpen,
      setDeleteTarget,
    ],
  );

  const handlePageChange = (nextPage: number, nextPageSize?: number) => {
    fetchRoles(nextPage, nextPageSize ?? pageSize, true);
  };

  const handlePageSizeChange = (nextPage: number, nextPageSize: number) => {
    pageCacheRef.current = {};
    nextTokenRef.current = {};
    setTotalPages(1);
    fetchRoles(nextPage, nextPageSize, true);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (dialogMode === "create" && !form.groupName.trim()) {
      errors.groupName = "角色名称不能为空";
    }
    if (form.precedence) {
      const precedence = Number(form.precedence);
      if (!Number.isInteger(precedence) || precedence < 0) {
        errors.precedence = "优先级必须为非负整数";
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;
    setFormSubmitting(true);
    try {
      const precedence = form.precedence ? Number(form.precedence) : undefined;
      const body = {
        groupName: form.groupName.trim(),
        description: form.description.trim() || undefined,
        precedence,
        roleArn: form.roleArn.trim() || undefined,
      };

      const targetPath =
        dialogMode === "create"
          ? "role"
          : `role/${encodeURIComponent(form.groupName.trim())}`;
      const actualMethod = dialogMode === "create" ? "POST" : "PUT";
      const actualBody =
        dialogMode === "create"
          ? body
          : {
              description: body.description,
              precedence: body.precedence,
              roleArn: body.roleArn,
            };

      const res = await fetchWithAuth(
        "/api/proxy-post",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          proxyParams: {
            targetPath,
            actualMethod,
          },
          actualBody,
        },
        router,
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          getErrorMessage(
            data,
            dialogMode === "create" ? "创建角色失败" : "更新角色失败",
          ),
        );
      }

      success(dialogMode === "create" ? "角色创建成功" : "角色更新成功");
      setDialogOpen(false);
      resetForm();
      if (dialogMode === "create") {
        fetchRoles(1, pageSize, true);
      } else {
        fetchRoles(page, pageSize, true);
      }
    } catch (err) {
      if (isErrorWithMessage(err)) {
        errorAlert(err.message);
      } else {
        errorAlert(
          dialogMode === "create" ? "创建角色失败" : "更新角色失败",
        );
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.groupName) return;
    setFormSubmitting(true);
    try {
      const res = await fetchWithAuth(
        "/api/proxy-post",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          proxyParams: {
            targetPath: `role/${encodeURIComponent(deleteTarget.groupName)}`,
            actualMethod: "DELETE",
          },
          actualBody: {},
        },
        router,
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(getErrorMessage(data, "删除角色失败"));
      }
      success("角色删除成功");
      setDeleteTarget(null);
      fetchRoles(page, pageSize, true);
    } catch (err) {
      if (isErrorWithMessage(err)) {
        errorAlert(err.message);
      } else {
        errorAlert("删除角色失败");
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <TradePageShell title="角色管理" showAddButton={false}>
      <div className="flex flex-col h-full space-y-6">
        <div className="flex-1 min-h-0">
          <DataTable<RoleGroup, unknown>
            columns={columns as ColumnDef<RoleGroup, unknown>[]}
            data={sortedRoles}
            sorting={sorting}
            rowSelection={rowSelection}
            loading={loading}
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onSortingChange={(newSorting) =>
              setSorting(newSorting as SortingState)
            }
            onRowSelectionChange={(newSelection) =>
              setRowSelection(newSelection as RowSelectionState)
            }
            initialColumnPinning={{
              right: ["actions"],
            }}
            toolbarSlot={
              <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                <div className="flex items-center gap-2">
                  <Button
                    className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold"
                    onClick={() => {
                      setDialogMode("create");
                      resetForm();
                      setDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    新增角色
                  </Button>
                  <Button
                    variant="outline"
                    className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1e1e1e]"
                    onClick={() => fetchRoles(page, pageSize, true)}
                    disabled={loading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    刷新列表
                  </Button>
                </div>
                <div className="text-sm text-[#9ca3af]">
                  当前显示 {roles.length} 条角色信息
                </div>
              </div>
            }
          />
        </div>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "create" ? "新增角色" : "编辑角色"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">角色名称</Label>
              <Input
                id="groupName"
                value={form.groupName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, groupName: e.target.value }))
                }
                placeholder="输入角色名称"
                disabled={dialogMode === "edit"}
              />
              {formErrors.groupName && (
                <div className="text-sm text-red-400">
                  {formErrors.groupName}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">角色描述</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="输入角色描述"
                className="min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="precedence">优先级</Label>
                <Input
                  id="precedence"
                  value={form.precedence}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      precedence: e.target.value,
                    }))
                  }
                  placeholder="非负整数"
                />
                {formErrors.precedence && (
                  <div className="text-sm text-red-400">
                    {formErrors.precedence}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="roleArn">关联 ARN</Label>
                <Input
                  id="roleArn"
                  value={form.roleArn}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      roleArn: e.target.value,
                    }))
                  }
                  placeholder="ARN 资源标识"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={formSubmitting}
              >
                取消
              </Button>
              <Button type="submit" disabled={formSubmitting}>
                {formSubmitting
                  ? dialogMode === "create"
                    ? "创建中..."
                    : "更新中..."
                  : dialogMode === "create"
                    ? "确认创建"
                    : "保存更改"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {deleteTarget && (
        <Dialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>确认删除角色</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              确定要删除角色{" "}
              <span className="text-white font-semibold">
                {deleteTarget.groupName}
              </span>{" "}
              吗？该操作无法撤销。
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={formSubmitting}
              >
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={formSubmitting}
              >
                {formSubmitting ? "删除中..." : "确认删除"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </TradePageShell>
  );
}
