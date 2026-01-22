"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
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
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState<RoleFormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [initSubmitting, setInitSubmitting] = useState(false);

  const fetchRoles = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(
        "/api/proxy-post",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          proxyParams: {
            targetPath: "role/list",
            actualMethod: "GET",
          },
          actualBody: {},
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

      setRoles(normalized);
    } catch (err) {
      if (isErrorWithMessage(err)) {
        errorAlert(err.message);
      } else {
        errorAlert("获取角色列表失败");
      }
    } finally {
      setLoading(false);
    }
  }, [router, errorAlert]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const page = 1;
  const pageSize = Math.max(roles.length, 1);
  const totalPages = 1;
  const totalItems = roles.length;

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
    ],
    [setDialogMode, setForm, setFormErrors, setDialogOpen],
  );

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
      fetchRoles();
    } catch (err) {
      if (isErrorWithMessage(err)) {
        errorAlert(err.message);
      } else {
        errorAlert(dialogMode === "create" ? "创建角色失败" : "更新角色失败");
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
      fetchRoles();
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

  const handleInitRoles = async () => {
    setInitSubmitting(true);
    try {
      const res = await fetchWithAuth(
        "/api/proxy-post",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          proxyParams: {
            targetPath: "role/init",
            actualMethod: "POST",
          },
          actualBody: {},
        },
        router,
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(getErrorMessage(data, "初始化角色失败"));
      }
      success("初始化角色完成");
      fetchRoles();
    } catch (err) {
      if (isErrorWithMessage(err)) {
        errorAlert(err.message);
      } else {
        errorAlert("初始化角色失败");
      }
    } finally {
      setInitSubmitting(false);
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
            onPageChange={() => {}}
            onPageSizeChange={() => {}}
            onSortingChange={(newSorting) =>
              setSorting(newSorting as SortingState)
            }
            onRowSelectionChange={(newSelection) =>
              setRowSelection(newSelection as RowSelectionState)
            }
            initialColumnPinning={{
              right: ["actions"],
            }}
            showPagination={false}
            toolbarSlot={
              <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1e1e1e]"
                    onClick={handleInitRoles}
                    disabled={loading || initSubmitting}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    初始化角色
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
    </TradePageShell>
  );
}
