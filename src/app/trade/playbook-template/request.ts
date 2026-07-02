import { fetchWithAuth } from "@/utils/fetchWithAuth";
import type {
  PlaybookTemplate,
  PlaybookTemplateCountItem,
  PlaybookTemplateImageScope,
  PlaybookTemplateSortBy,
  PlaybookTemplateSortOrder,
  PlaybookTemplateStatus,
  PlaybookTemplateStatusFilter,
} from "./types";

type CreatePlaybookTemplatePayload = {
  playbookType: string;
  title: string;
  analysisImageUrl: string;
  analysisImageKey?: string;
  inProgressImageUrl: string;
  inProgressImageKey?: string;
  completedTrendImageUrl: string;
  completedTrendImageKey?: string;
  notes?: string;
  sortOrder?: number;
  status?: PlaybookTemplateStatus;
};

type UpdatePlaybookTemplatePayload = Partial<CreatePlaybookTemplatePayload>;

function sanitizeCreatePayload(payload: CreatePlaybookTemplatePayload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => {
      if (value === undefined) return false;
      if (typeof value === "string") return value.trim() !== "";
      return true;
    }),
  ) as CreatePlaybookTemplatePayload;
}

function sanitizeUpdatePayload(payload: UpdatePlaybookTemplatePayload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  ) as UpdatePlaybookTemplatePayload;
}

export async function getPlaybookTemplateUploadUrl(params: {
  fileName: string;
  contentType: string;
  scope: PlaybookTemplateImageScope;
}): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: "playbook-template/image/upload-url",
      actualMethod: "POST",
    },
    actualBody: params,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "获取剧本模板上传 URL 失败");
  return {
    uploadUrl: data.data.uploadUrl,
    fileUrl: data.data.fileUrl,
    key: data.data.key,
  };
}

export async function createPlaybookTemplate(
  payload: CreatePlaybookTemplatePayload,
): Promise<PlaybookTemplate> {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: "playbook-template/templates",
      actualMethod: "POST",
    },
    actualBody: sanitizeCreatePayload(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "创建剧本模板失败");
  return data.data as PlaybookTemplate;
}

export async function listPlaybookTemplates(params?: {
  pageSize?: number;
  cursor?: string;
  playbookType?: string;
  status?: PlaybookTemplateStatusFilter;
  keyword?: string;
  sortBy?: PlaybookTemplateSortBy;
  sortOrder?: PlaybookTemplateSortOrder;
}): Promise<{
  items: PlaybookTemplate[];
  totalCount: number;
  nextCursor: string | null;
  playbookTemplateCounts: PlaybookTemplateCountItem[];
}> {
  const searchParams = new URLSearchParams();
  if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
  if (params?.cursor) searchParams.set("cursor", params.cursor);
  if (params?.playbookType) searchParams.set("playbookType", params.playbookType);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.keyword) searchParams.set("keyword", params.keyword);
  if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);

  const targetPath = `playbook-template/templates${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath,
      actualMethod: "GET",
    },
    actualBody: {},
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "查询剧本模板失败");
  return {
    items: (data.data?.items || []) as PlaybookTemplate[],
    totalCount: typeof data.data?.totalCount === "number" ? data.data.totalCount : 0,
    nextCursor: typeof data.data?.nextCursor === "string" ? data.data.nextCursor : null,
    playbookTemplateCounts: Array.isArray(data.data?.playbookTemplateCounts)
      ? (data.data.playbookTemplateCounts as PlaybookTemplateCountItem[])
      : [],
  };
}

export async function listPlaybookTemplatesByPlaybook(playbookType: string): Promise<{
  playbookType: string;
  playbookItem?: PlaybookTemplate["playbookItem"];
  items: PlaybookTemplate[];
  count: number;
  limit: number;
}> {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: `playbook-template/templates/by-playbook/${encodeURIComponent(playbookType)}`,
      actualMethod: "GET",
    },
    actualBody: {},
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "查询剧本模板失败");
  return {
    playbookType: data.data?.playbookType || playbookType,
    playbookItem: data.data?.playbookItem,
    items: (data.data?.items || []) as PlaybookTemplate[],
    count: typeof data.data?.count === "number" ? data.data.count : 0,
    limit: typeof data.data?.limit === "number" ? data.data.limit : 5,
  };
}

export async function updatePlaybookTemplate(
  templateId: string,
  payload: UpdatePlaybookTemplatePayload,
): Promise<PlaybookTemplate> {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: `playbook-template/templates/${templateId}`,
      actualMethod: "PATCH",
    },
    actualBody: sanitizeUpdatePayload(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "更新剧本模板失败");
  return data.data as PlaybookTemplate;
}

export async function deletePlaybookTemplate(templateId: string): Promise<void> {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: `playbook-template/templates/${templateId}`,
      actualMethod: "DELETE",
    },
    actualBody: {},
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "删除剧本模板失败");
}
