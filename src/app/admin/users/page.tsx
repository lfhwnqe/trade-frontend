"use client";

import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Pencil, RefreshCw } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/common/DataTable";
import { useAlert } from "@/components/common/alert";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { isErrorWithMessage } from "@/utils";
import TradePageShell from "@/app/trade/components/trade-page-shell";
import { format } from "date-fns";

type UserRecord = {
  userId: string;
  email?: string;
  role?: string;
  enabled?: boolean;
  userStatus?: string;
  createdAt?: string;
  lastModifiedAt?: string;
};

type UserDetail = {
  userId: string;
  email?: string;
  enabled?: boolean;
  userStatus?: string;
  createdAt?: string;
  lastModifiedAt?: string;
  groups: string[];
};

const normalizeDate = (value: unknown) => {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return undefined;
};

const getAttributeValue = (attributes: unknown, name: string) => {
  if (!Array.isArray(attributes)) return undefined;
  const match = attributes.find((attr) => {
    if (!attr || typeof attr !== "object") return false;
    const record = attr as Record<string, unknown>;
    return record.Name === name || record.name === name;
  }) as Record<string, unknown> | undefined;
  const value = match?.Value ?? match?.value;
  return typeof value === "string" ? value : undefined;
};

const normalizeUser = (raw: Record<string, unknown>): UserRecord => {
  const attributes = raw.attributes ?? raw.Attributes ?? [];
  return {
    userId: String(raw.userId ?? raw.Username ?? raw.username ?? ""),
    email: getAttributeValue(attributes, "email"),
    role: typeof raw.role === "string" ? raw.role : undefined,
    enabled:
      typeof raw.enabled === "boolean"
        ? raw.enabled
        : typeof raw.Enabled === "boolean"
          ? raw.Enabled
          : undefined,
    userStatus:
      typeof raw.userStatus === "string"
        ? raw.userStatus
        : typeof raw.UserStatus === "string"
          ? raw.UserStatus
          : undefined,
    createdAt: normalizeDate(
      raw.createdAt ?? raw.userCreateDate ?? raw.UserCreateDate,
    ),
    lastModifiedAt: normalizeDate(
      raw.lastModifiedAt ?? raw.userLastModifiedDate ?? raw.UserLastModifiedDate,
    ),
  };
};

const normalizeUserDetail = (raw: Record<string, unknown>): UserDetail => {
  const attributes = raw.attributes ?? raw.Attributes ?? [];
  const groups = getArrayValue(raw, "groups")
    .map((group) => String(group ?? "").trim())
    .filter(Boolean);
  return {
    userId: String(raw.userId ?? raw.Username ?? raw.username ?? ""),
    email: getAttributeValue(attributes, "email"),
    enabled:
      typeof raw.enabled === "boolean"
        ? raw.enabled
        : typeof raw.Enabled === "boolean"
          ? raw.Enabled
          : undefined,
    userStatus:
      typeof raw.userStatus === "string"
        ? raw.userStatus
        : typeof raw.UserStatus === "string"
          ? raw.UserStatus
          : undefined,
    createdAt: normalizeDate(
      raw.createdAt ?? raw.userCreateDate ?? raw.UserCreateDate,
    ),
    lastModifiedAt: normalizeDate(
      raw.lastModifiedAt ?? raw.userLastModifiedDate ?? raw.UserLastModifiedDate,
    ),
    groups,
  };
};

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

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const getArrayValue = (record: Record<string, unknown>, key: string) => {
  const value = record[key];
  return Array.isArray(value) ? value : [];
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return format(parsed, "yyyy-MM-dd HH:mm");
  }
  return value;
};

export default function AdminUserManagementPage() {
  const router = useRouter();
  const [success, errorAlert] = useAlert();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [roleOptions, setRoleOptions] = useState<string[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserRecord | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState<UserRecord | null>(null);
  const [detailInfo, setDetailInfo] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [registrationEnabled, setRegistrationEnabled] = useState<
    boolean | null
  >(null);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationSaving, setRegistrationSaving] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(
    null,
  );
  const [cleanupUserId, setCleanupUserId] = useState("");
  const [cleanupDryRun, setCleanupDryRun] = useState(true);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<unknown>(null);

  const pageCacheRef = useRef<Record<number, UserRecord[]>>({});
  const nextTokenRef = useRef<Record<number, string | undefined>>({});
  const initialPageSizeRef = useRef(pageSize);

  const fetchUsers = React.useCallback(
    async (targetPage: number, targetPageSize: number, force = false) => {
      if (!force && pageCacheRef.current[targetPage]) {
        setUsers(pageCacheRef.current[targetPage]);
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
              targetPath: "user/list",
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
          throw new Error(getErrorMessage(data, "获取用户列表失败"));
        }

        const payload =
          (data && typeof data === "object" && "data" in data
            ? (data as Record<string, unknown>).data
            : data) ?? {};
        const payloadRecord = toRecord(payload);
        const list = getArrayValue(payloadRecord, "users");
        const normalized = list.map((user) =>
          normalizeUser(toRecord(user)),
        );
        const nextTokenRaw =
          payloadRecord.nextToken ?? payloadRecord.paginationToken;
        const nextToken =
          typeof nextTokenRaw === "string" ? nextTokenRaw : undefined;

        pageCacheRef.current[targetPage] = normalized;
        nextTokenRef.current[targetPage] = nextToken;

        setUsers(normalized);
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
          errorAlert("获取用户列表失败");
        }
      } finally {
        setLoading(false);
      }
    },
    [router, errorAlert],
  );

  const fetchRoleOptions = React.useCallback(async () => {
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
      const payloadRecord = toRecord(payload);
      const groups = getArrayValue(payloadRecord, "groups");
      const names = groups
        .map((group) => {
          const record = toRecord(group);
          return String(record.GroupName ?? record.groupName ?? "");
        })
        .filter(Boolean);
      setRoleOptions(names);
    } catch (err) {
      if (isErrorWithMessage(err)) {
        errorAlert(err.message);
      } else {
        errorAlert("获取角色列表失败");
      }
    }
  }, [router, errorAlert]);

  const fetchRegistrationStatus = React.useCallback(async () => {
    setRegistrationLoading(true);
    setRegistrationError(null);
    try {
      const res = await fetchWithAuth(
        "/api/proxy-post",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          proxyParams: {
            targetPath: "user/registration/status",
            actualMethod: "GET",
          },
          actualBody: {},
        },
        router,
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(getErrorMessage(data, "获取注册状态失败"));
      }
      const payload =
        (data && typeof data === "object" && "data" in data
          ? (data as Record<string, unknown>).data
          : data) ?? {};
      const payloadRecord = toRecord(payload);
      const enabledValue =
        payloadRecord.enable ?? payloadRecord.enabled ?? payloadRecord.status;
      if (typeof enabledValue === "boolean") {
        setRegistrationEnabled(enabledValue);
      } else {
        setRegistrationEnabled(null);
      }
    } catch (err) {
      const message = isErrorWithMessage(err)
        ? err.message
        : "获取注册状态失败";
      setRegistrationError(message);
      setRegistrationEnabled(null);
      errorAlert(message);
    } finally {
      setRegistrationLoading(false);
    }
  }, [router, errorAlert]);

  const handleToggleRegistration = async () => {
    if (registrationEnabled === null) return;
    const nextEnabled = !registrationEnabled;
    setRegistrationSaving(true);
    setRegistrationError(null);
    try {
      const res = await fetchWithAuth(
        "/api/proxy-post",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          proxyParams: {
            targetPath: "user/registration/status",
            actualMethod: "PATCH",
          },
          actualBody: {
            enable: nextEnabled,
          },
        },
        router,
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(getErrorMessage(data, "更新注册状态失败"));
      }
      const payload =
        (data && typeof data === "object" && "data" in data
          ? (data as Record<string, unknown>).data
          : data) ?? {};
      const payloadRecord = toRecord(payload);
      const enabledValue =
        payloadRecord.enable ?? payloadRecord.enabled ?? payloadRecord.status;
      setRegistrationEnabled(
        typeof enabledValue === "boolean" ? enabledValue : nextEnabled,
      );
      success(nextEnabled ? "注册已开启" : "注册已关闭");
    } catch (err) {
      const message = isErrorWithMessage(err)
        ? err.message
        : "更新注册状态失败";
      setRegistrationError(message);
      errorAlert(message);
    } finally {
      setRegistrationSaving(false);
    }
  };

  const fetchUserDetail = React.useCallback(
    async (userId: string) => {
      if (!userId) return;
      setDetailLoading(true);
      setDetailError(null);
      try {
        const res = await fetchWithAuth(
          "/api/proxy-post",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            proxyParams: {
              targetPath: `user/${encodeURIComponent(userId)}`,
              actualMethod: "GET",
            },
            actualBody: {},
          },
          router,
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(getErrorMessage(data, "获取用户详情失败"));
        }

        const payload =
          (data && typeof data === "object" && "data" in data
            ? (data as Record<string, unknown>).data
            : data) ?? {};
        const payloadRecord = toRecord(payload);

        setDetailInfo(normalizeUserDetail(payloadRecord));
      } catch (err) {
        const message = isErrorWithMessage(err)
          ? err.message
          : "获取用户详情失败";
        setDetailError(message);
        setDetailInfo(null);
        errorAlert(message);
      } finally {
        setDetailLoading(false);
      }
    },
    [router, errorAlert],
  );

  const fetchUserDetailForEdit = React.useCallback(
    async (userId: string) => {
      if (!userId) return;
      setEditLoading(true);
      try {
        const res = await fetchWithAuth(
          "/api/proxy-post",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            proxyParams: {
              targetPath: `user/${encodeURIComponent(userId)}`,
              actualMethod: "GET",
            },
            actualBody: {},
          },
          router,
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(getErrorMessage(data, "获取用户详情失败"));
        }

        const payload =
          (data && typeof data === "object" && "data" in data
            ? (data as Record<string, unknown>).data
            : data) ?? {};
        const payloadRecord = toRecord(payload);
        const detail = normalizeUserDetail(payloadRecord);
        const nextRole = detail.groups?.[0] ?? "";
        setSelectedRole(nextRole);
      } catch (err) {
        const message = isErrorWithMessage(err)
          ? err.message
          : "获取用户详情失败";
        errorAlert(message);
        setSelectedRole("");
      } finally {
        setEditLoading(false);
      }
    },
    [router, errorAlert],
  );

  useEffect(() => {
    fetchUsers(1, initialPageSizeRef.current, true);
  }, [fetchUsers]);

  useEffect(() => {
    fetchRoleOptions();
  }, [fetchRoleOptions]);

  useEffect(() => {
    fetchRegistrationStatus();
  }, [fetchRegistrationStatus]);

  const totalItems = Math.max((totalPages - 1) * pageSize + users.length, 0);

  const sortedUsers = useMemo(() => {
    if (!sorting.length) return users;
    const [{ id, desc }] = sorting;
    const compare = (a: UserRecord, b: UserRecord) => {
      const getValue = (user: UserRecord) => {
        switch (id) {
          case "userId":
            return user.userId || "";
          case "email":
            return user.email || "";
          case "userStatus":
            return user.userStatus || "";
          case "enabled":
            return user.enabled ? 1 : 0;
          case "createdAt":
            return user.createdAt ? new Date(user.createdAt).getTime() : 0;
          case "lastModifiedAt":
            return user.lastModifiedAt
              ? new Date(user.lastModifiedAt).getTime()
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

    const sorted = [...users].sort(compare);
    return desc ? sorted.reverse() : sorted;
  }, [users, sorting]);

  const handleCleanupOrphans = React.useCallback(async () => {
    setCleanupLoading(true);
    setCleanupResult(null);
    try {
      const res = await fetchWithAuth(
        "/api/proxy-post",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          proxyParams: {
            targetPath: "trade/admin/image-orphans/cleanup",
            actualMethod: "POST",
          },
          actualBody: {
            ...(cleanupUserId ? { userId: cleanupUserId } : {}),
            dryRun: cleanupDryRun,
            objectScanLimit: 3000,
            tradeScanLimit: 3000,
            deleteLimit: 500,
          },
        },
        router,
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(getErrorMessage(data, "孤儿图片清理失败"));
      }
      setCleanupResult(data);
      success(cleanupDryRun ? "dryRun 扫描完成" : "清理执行完成");
    } catch (err) {
      errorAlert(isErrorWithMessage(err) ? err.message : "孤儿图片清理失败");
    } finally {
      setCleanupLoading(false);
    }
  }, [cleanupDryRun, cleanupUserId, errorAlert, router, success]);

  const columns = useMemo<ColumnDef<UserRecord>[]>(
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
        accessorKey: "userId",
        header: "用户ID",
        cell: ({ row }) => (
          <div className="text-sm font-semibold text-white min-w-[160px]">
            {row.original.userId || "-"}
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: "邮箱",
        cell: ({ row }) => (
          <div className="text-sm text-[#9ca3af] min-w-[200px]">
            {row.original.email || "-"}
          </div>
        ),
      },
      {
        accessorKey: "userStatus",
        header: "状态",
        cell: ({ row }) => (
          <div className="text-sm text-[#9ca3af] min-w-[120px]">
            {row.original.userStatus || "-"}
          </div>
        ),
      },
      {
        accessorKey: "enabled",
        header: "启用",
        cell: ({ row }) => (
          <div className="text-sm text-[#9ca3af] min-w-[80px]">
            {row.original.enabled === undefined
              ? "-"
              : row.original.enabled
                ? "是"
                : "否"}
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "创建时间",
        cell: ({ row }) => (
          <div className="text-sm text-[#9ca3af] min-w-[140px]">
            {formatDateTime(row.original.createdAt)}
          </div>
        ),
      },
      {
        accessorKey: "lastModifiedAt",
        header: "更新时间",
        cell: ({ row }) => (
          <div className="text-sm text-[#9ca3af] min-w-[140px]">
            {formatDateTime(row.original.lastModifiedAt)}
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
                setDetailTarget(row.original);
                setDetailOpen(true);
                fetchUserDetail(row.original.userId);
              }}
            >
              <Eye className="h-4 w-4" />
              详情
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1e1e1e]"
              onClick={() => {
                setEditTarget(row.original);
                setEditOpen(true);
                setSelectedRole("");
                fetchUserDetailForEdit(row.original.userId);
              }}
            >
              <Pencil className="h-4 w-4" />
              编辑
            </Button>
          </div>
        ),
        enableSorting: false,
      },
    ],
    [
      setEditTarget,
      setEditOpen,
      setSelectedRole,
      fetchUserDetail,
      fetchUserDetailForEdit,
    ],
  );

  const handlePageChange = (nextPage: number, nextPageSize?: number) => {
    fetchUsers(nextPage, nextPageSize ?? pageSize, true);
  };

  const handlePageSizeChange = (nextPage: number, nextPageSize: number) => {
    pageCacheRef.current = {};
    nextTokenRef.current = {};
    setTotalPages(1);
    fetchUsers(nextPage, nextPageSize, true);
  };

  const handleUpdateRole = async () => {
    if (!editTarget?.userId || !selectedRole) return;
    setSaving(true);
    try {
      const targetPath = `role/user/${encodeURIComponent(
        editTarget.userId,
      )}/role?role=${encodeURIComponent(selectedRole)}`;
      const res = await fetchWithAuth(
        "/api/proxy-post",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          proxyParams: {
            targetPath,
            actualMethod: "PUT",
          },
          actualBody: {},
        },
        router,
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(getErrorMessage(data, "更新用户角色失败"));
      }
      success("用户角色更新成功");
      setEditOpen(false);
      fetchUsers(page, pageSize, true);
    } catch (err) {
      if (isErrorWithMessage(err)) {
        errorAlert(err.message);
      } else {
        errorAlert("更新用户角色失败");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <TradePageShell title="用户管理" showAddButton={false}>
      <div className="flex flex-col h-full space-y-6">
        <div className="flex-1 min-h-0">
          <DataTable<UserRecord, unknown>
            columns={columns as ColumnDef<UserRecord, unknown>[]}
            data={sortedUsers}
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
                    variant="outline"
                    className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1e1e1e]"
                    onClick={() => fetchUsers(page, pageSize, true)}
                    disabled={loading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    刷新列表
                  </Button>
                  <div className="flex flex-wrap items-center gap-3 rounded-md border border-[#27272a] bg-[#111111] px-3 py-2">
                    <div className="text-xs text-[#9ca3af]">注册功能</div>
                    <div className="text-sm text-[#e5e7eb]">
                      {registrationLoading
                        ? "查询中..."
                        : registrationEnabled === null
                          ? "未知"
                          : registrationEnabled
                            ? "已开启"
                            : "已关闭"}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1e1e1e]"
                      onClick={handleToggleRegistration}
                      disabled={
                        registrationLoading ||
                        registrationSaving ||
                        registrationEnabled === null
                      }
                    >
                      {registrationSaving
                        ? "更新中..."
                        : registrationEnabled
                          ? "关闭注册"
                          : "开启注册"}
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-[#9ca3af]">
                  当前显示 {users.length} 条用户信息
                </div>
                <div className="w-full rounded-md border border-[#27272a] bg-[#111111] p-3 space-y-3">
                  <div className="text-sm font-medium text-[#e5e7eb]">图片孤儿清理（管理员）</div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      value={cleanupUserId}
                      onChange={(e) => setCleanupUserId(e.target.value)}
                      placeholder="目标 userId（不填=当前管理员）"
                      className="min-w-[280px] rounded-md border border-[#27272a] bg-black px-3 py-2 text-sm text-white outline-none"
                    />
                    <label className="flex items-center gap-2 text-sm text-[#9ca3af]">
                      <input
                        type="checkbox"
                        checked={cleanupDryRun}
                        onChange={(e) => setCleanupDryRun(e.target.checked)}
                      />
                      dryRun
                    </label>
                    <Button
                      variant="outline"
                      className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1e1e1e]"
                      onClick={handleCleanupOrphans}
                      disabled={cleanupLoading}
                    >
                      {cleanupLoading
                        ? "执行中..."
                        : cleanupDryRun
                          ? "扫描孤儿图片"
                          : "执行删除"}
                    </Button>
                  </div>
                  {cleanupResult ? (
                    <pre className="max-h-56 overflow-auto rounded-md bg-black p-3 text-xs text-[#e5e7eb]">
                      {JSON.stringify(cleanupResult, null, 2)}
                    </pre>
                  ) : null}
                </div>
              </div>
            }
          />
          {registrationError ? (
            <div className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {registrationError}
            </div>
          ) : null}
        </div>
      </div>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) {
            setEditTarget(null);
            setSelectedRole("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>编辑用户角色</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>用户ID</Label>
              <div className="text-sm text-[#e5e7eb]">
                {editTarget?.userId || "-"}
              </div>
            </div>
            <div className="space-y-2">
              <Label>用户组</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="选择角色" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.length ? (
                    roleOptions.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__empty" disabled>
                      暂无可选角色
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={saving}
            >
              取消
            </Button>
            <Button
              type="button"
              onClick={handleUpdateRole}
              disabled={
                saving || editLoading || !selectedRole || !editTarget?.userId
              }
            >
              {saving || editLoading ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) {
            setDetailTarget(null);
            setDetailInfo(null);
            setDetailError(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>用户详情</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>用户ID</Label>
              <div className="text-sm text-[#e5e7eb]">
                {detailTarget?.userId || "-"}
              </div>
            </div>
            <div className="space-y-2">
              <Label>邮箱</Label>
              <div className="text-sm text-[#9ca3af]">
                {detailInfo?.email || "-"}
              </div>
            </div>
            <div className="space-y-2">
              <Label>角色</Label>
              <div className="flex flex-wrap gap-2 text-sm text-[#9ca3af]">
                {detailLoading ? (
                  <span>加载中...</span>
                ) : detailInfo?.groups?.length ? (
                  detailInfo.groups.map((group) => (
                    <span
                      key={group}
                      className="rounded-md border border-[#27272a] bg-[#111111] px-2 py-1"
                    >
                      {group}
                    </span>
                  ))
                ) : (
                  <span>-</span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>状态</Label>
              <div className="text-sm text-[#9ca3af]">
                {detailInfo?.userStatus || "-"}
              </div>
            </div>
            <div className="space-y-2">
              <Label>启用</Label>
              <div className="text-sm text-[#9ca3af]">
                {detailInfo?.enabled === undefined
                  ? "-"
                  : detailInfo.enabled
                    ? "是"
                    : "否"}
              </div>
            </div>
            <div className="space-y-2">
              <Label>创建时间</Label>
              <div className="text-sm text-[#9ca3af]">
                {formatDateTime(detailInfo?.createdAt)}
              </div>
            </div>
            <div className="space-y-2">
              <Label>更新时间</Label>
              <div className="text-sm text-[#9ca3af]">
                {formatDateTime(detailInfo?.lastModifiedAt)}
              </div>
            </div>
            {detailError ? (
              <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {detailError}
              </div>
            ) : null}
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDetailOpen(false)}
            >
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TradePageShell>
  );
}
