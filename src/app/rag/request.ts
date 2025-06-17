import { fetchWithAuth } from "@/utils/fetchWithAuth";
import type {
  CreateDocumentDto,
  UpdateDocumentDto,
  SearchQueryDto,
  DocumentEntity,
  RetrievalResultDto,
  RAGAnalytics,
  HealthCheckResponse,
  ApiResponse,
  DocumentFilter,
} from "./types";

/**
 * RAG模块API调用函数
 * 基于后端 /rag 接口实现
 */

// ==================== 文档管理接口 ====================

/**
 * 创建文档
 */
export async function createDocument(
  data: CreateDocumentDto
): Promise<ApiResponse<DocumentEntity>> {
  const proxyParams = {
    targetPath: "rag/documents",
    actualMethod: "POST",
  };
  const actualBody = data as unknown as Record<string, unknown>;
  
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    proxyParams,
    actualBody,
  });
  
  const resData = await res.json();
  if (!res.ok) throw new Error(resData.message || "创建文档失败");
  return resData;
}

/**
 * 获取文档列表
 */
export async function getDocuments(
  filters?: DocumentFilter
): Promise<ApiResponse<DocumentEntity[]>> {
  const queryParams = new URLSearchParams();
  
  if (filters?.documentType) queryParams.append('documentType', filters.documentType);
  if (filters?.status) queryParams.append('status', filters.status);
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.pageSize) queryParams.append('pageSize', filters.pageSize.toString());
  
  const targetPath = `rag/documents${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  const proxyParams = {
    targetPath,
    actualMethod: "GET",
  };
  
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    proxyParams,
    actualBody: {},
  });
  
  const resData = await res.json();
  if (!res.ok) throw new Error(resData.message || "获取文档列表失败");
  return resData;
}

/**
 * 获取单个文档
 */
export async function getDocument(
  documentId: string
): Promise<ApiResponse<DocumentEntity>> {
  const proxyParams = {
    targetPath: `rag/documents/${documentId}`,
    actualMethod: "GET",
  };
  
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    proxyParams,
    actualBody: {},
  });
  
  const resData = await res.json();
  if (!res.ok) throw new Error(resData.message || "获取文档详情失败");
  return resData;
}

/**
 * 更新文档
 */
export async function updateDocument(
  documentId: string,
  data: UpdateDocumentDto
): Promise<ApiResponse<DocumentEntity>> {
  const proxyParams = {
    targetPath: `rag/documents/${documentId}`,
    actualMethod: "PUT",
  };
  const actualBody = data as Record<string, unknown>;
  
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    proxyParams,
    actualBody,
  });
  
  const resData = await res.json();
  if (!res.ok) throw new Error(resData.message || "更新文档失败");
  return resData;
}

/**
 * 删除文档
 */
export async function deleteDocument(
  documentId: string
): Promise<ApiResponse<void>> {
  const proxyParams = {
    targetPath: `rag/documents/${documentId}`,
    actualMethod: "DELETE",
  };
  
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    proxyParams,
    actualBody: {},
  });
  
  const resData = await res.json();
  if (!res.ok) throw new Error(resData.message || "删除文档失败");
  return resData;
}

// ==================== 搜索接口 ====================

/**
 * 搜索文档
 */
export async function searchDocuments(
  query: SearchQueryDto
): Promise<ApiResponse<RetrievalResultDto>> {
  const proxyParams = {
    targetPath: "rag/search",
    actualMethod: "POST",
  };
  const actualBody = query as unknown as Record<string, unknown>;
  
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    proxyParams,
    actualBody,
  });
  
  const resData = await res.json();
  if (!res.ok) throw new Error(resData.message || "搜索文档失败");
  return resData;
}

// ==================== 统计和健康检查接口 ====================

/**
 * 获取RAG统计数据
 */
export async function getRAGAnalytics(): Promise<ApiResponse<RAGAnalytics>> {
  const proxyParams = {
    targetPath: "rag/analytics",
    actualMethod: "GET",
  };
  
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    proxyParams,
    actualBody: {},
  });
  
  const resData = await res.json();
  if (!res.ok) throw new Error(resData.message || "获取统计数据失败");
  return resData;
}

/**
 * RAG健康检查
 */
export async function getRAGHealth(): Promise<ApiResponse<HealthCheckResponse>> {
  const proxyParams = {
    targetPath: "rag/health",
    actualMethod: "GET",
  };
  
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    proxyParams,
    actualBody: {},
  });
  
  const resData = await res.json();
  if (!res.ok) throw new Error(resData.message || "健康检查失败");
  return resData;
}

// ==================== 辅助函数 ====================

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 格式化处理进度
 */
export function formatProcessingProgress(progress?: number): string {
  if (progress === undefined) return '未知';
  return `${Math.round(progress)}%`;
}

/**
 * 获取文档状态显示文本
 */
export function getDocumentStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    processing: '处理中',
    completed: '已完成',
    failed: '失败',
    deleted: '已删除',
  };
  return statusMap[status] || status;
}

/**
 * 获取文档类型显示文本
 */
export function getDocumentTypeText(type: string): string {
  const typeMap: Record<string, string> = {
    trade: '交易文档',
    knowledge: '知识文档',
    manual: '手册文档',
    report: '报告文档',
  };
  return typeMap[type] || type;
}

/**
 * 获取优先级显示文本
 */
export function getPriorityText(priority: string): string {
  const priorityMap: Record<string, string> = {
    high: '高',
    medium: '中',
    low: '低',
  };
  return priorityMap[priority] || priority;
}