import { fetchWithAuth } from "@/utils/fetchWithAuth";
import type {
  CreateExecutionFlowRunDto,
  ExecutionFlowListResponse,
  ExecutionFlowQuery,
  UpdateExecutionFlowRunDto,
} from "./config";

export async function fetchExecutionFlowList(params: {
  page: number;
  pageSize: number;
  query?: ExecutionFlowQuery;
}): Promise<ExecutionFlowListResponse> {
  const { page, pageSize, query } = params;
  const proxyParams = {
    targetPath: "execution-flow/list",
    actualMethod: "POST",
  };
  const actualBody = {
    page,
    limit: pageSize,
    ...query,
  };
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    proxyParams,
    actualBody,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => undefined);
    throw new Error((data && data.message) || "获取流程列表失败");
  }
  const data = await res.json();
  return {
    items: data.data?.items || [],
    total: data.data?.total || 0,
    page: data.data?.page || page,
    pageSize: data.data?.pageSize || pageSize,
    totalPages: data.data?.totalPages || 1,
  };
}

export async function createExecutionFlowRun(dto: CreateExecutionFlowRunDto) {
  const proxyParams = {
    targetPath: "execution-flow/run",
    actualMethod: "POST",
  };
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    proxyParams,
    actualBody: dto,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => undefined);
    throw new Error((data && data.message) || "创建流程失败");
  }
  return res.json();
}

export async function updateExecutionFlowRun(
  runId: string,
  dto: UpdateExecutionFlowRunDto,
) {
  const proxyParams = {
    targetPath: `execution-flow/run/${runId}`,
    actualMethod: "PATCH",
  };
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    proxyParams,
    actualBody: dto,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => undefined);
    throw new Error((data && data.message) || "更新流程失败");
  }
  return res.json();
}
