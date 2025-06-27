import { fetchWithAuth } from "@/utils/fetchWithAuth";

/**
 * 思维导图解析模块API调用函数
 * 基于后端 /parser 接口实现
 */

// ==================== 思维导图相关类型 ====================

export interface MindMapNode {
  id: string;
  text: string;
  level: number;
  parentId?: string;
  children?: MindMapNode[];
  attributes?: Record<string, unknown>;
  style?: {
    color?: string;
    backgroundColor?: string;
    fontSize?: number;
    fontWeight?: string;
  };
}

export interface MindMapData {
  nodes: MindMapNode[];
  links: Array<{
    source: string;
    target: string;
    type?: string;
  }>;
  metadata: {
    format: string;
    title: string;
    author?: string;
    created?: string;
    modified?: string;
    nodeCount?: number;
    edgeCount?: number;
  };
}

export interface ForceGraphData {
  nodes: Array<{
    id: string;
    name: string;
    group: number;
    level: number;
    size?: number;
    color?: string;
    [key: string]: unknown;
  }>;
  links: Array<{
    source: string;
    target: string;
    value?: number;
    type?: string;
    [key: string]: unknown;
  }>;
}

export interface MindMapParseResponse {
  success: boolean;
  data?: {
    nodes: Array<{
      id: string;
      text: string;
      level: number;
      parentId?: string;
      position?: { x: number | null; y: number };
      style?: {
        color?: string;
        backgroundColor?: string;
      };
    }>;
    links: Array<{
      source: string;
      target: string;
      type?: string;
    }>;
    metadata: {
      format: string;
      title: string;
      author?: string;
      created?: string;
      modified?: string;
    };
  };
  error?: string;
}

export interface MindMapParseRequest {
  content: string;
  format: string;
}

export interface GraphCreateResponse {
  message: string;
  graphId: string;
  nodeCount: number;
  edgeCount: number;
}

export interface NodeSearchResult {
  graphId: string;
  nodeId: string;
  text: string;
}

export interface SubgraphNode {
  id: string;
  text: string;
  level: number;
  parentId?: string;
}

// G-RAG测试相关类型
export interface GRAGTestRequest {
  query: string;
}

export interface GRAGBatchTestRequest {
  queries: string[];
}

export interface GRAGTestResult {
  success: boolean;
  query: string;
  processingTime: number;
  results?: {
    keywordMatches: number;
    contextResults: Array<{
      graphId: string;
      nodeId: string;
      text: string;
      context: SubgraphNode[];
      contextSize: number;
      error?: string;
    }>;
    totalContextNodes: number;
  };
  error?: string;
  metadata?: {
    searchType: string;
    timestamp: string;
  };
}

export interface GRAGBatchTestResult {
  success: boolean;
  totalQueries: number;
  totalProcessingTime: number;
  averageProcessingTime: number;
  results: Array<{
    query: string;
    success: boolean;
    processingTime: number;
    keywordMatches: number;
    contextResults: number;
    totalContextNodes: number;
    error?: string;
  }>;
  summary: {
    successfulQueries: number;
    failedQueries: number;
    totalMatches: number;
    totalContextNodes: number;
  };
  metadata: {
    testType: string;
    timestamp: string;
  };
}

export interface GRAGPerformanceTestResult {
  success: boolean;
  totalIterations: number;
  totalTime: number;
  results: Array<{
    iteration: number;
    query: string;
    processingTime: number;
    keywordMatches: number;
    contextSize: number;
    success: boolean;
    error?: string;
  }>;
  statistics: {
    successRate: number;
    averageProcessingTime: number;
    minProcessingTime: number;
    maxProcessingTime: number;
    totalMatches: number;
    totalContextNodes: number;
  };
  metadata: {
    testType: string;
    timestamp: string;
  };
}

// ==================== API调用函数 ====================

/**
 * 解析思维导图内容
 */
export async function parseMindMap(
  data: MindMapParseRequest
): Promise<MindMapParseResponse> {
  const proxyParams = {
    targetPath: "parser/mindmap/parse",
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
  if (!res.ok) throw new Error(resData.message || "思维导图解析失败");
  return resData;
}

/**
 * 上传并解析思维导图文件，直接存储到DynamoDB
 */
export async function uploadAndStoreMindMap(
  file: File,
  format?: string
): Promise<GraphCreateResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (format) {
    formData.append('format', format);
  }

  const proxyParams = {
    targetPath: "parser/mindmap/upload-and-store",
    actualMethod: "POST",
  };

  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    proxyParams,
    actualBody: formData as unknown as Record<string, unknown>,
  });

  const resData = await res.json();
  if (!res.ok) throw new Error(resData.message || "思维导图文件上传失败");
  return resData;
}

/**
 * 根据关键词搜索节点
 */
export async function searchNodes(keyword: string): Promise<NodeSearchResult[]> {
  const proxyParams = {
    targetPath: `parser/graphs/search?keyword=${encodeURIComponent(keyword)}`,
    actualMethod: "GET",
  };

  const res = await fetchWithAuth("/api/proxy-get", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    proxyParams,
  });

  const resData = await res.json();
  if (!res.ok) throw new Error(resData.message || "节点搜索失败");
  return resData;
}

/**
 * 获取节点的上下文子图
 */
export async function getSubgraph(
  graphId: string,
  nodeId: string
): Promise<SubgraphNode[]> {
  const proxyParams = {
    targetPath: `parser/graphs/${graphId}/nodes/${nodeId}/subgraph`,
    actualMethod: "GET",
  };

  const res = await fetchWithAuth("/api/proxy-get", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    proxyParams,
  });

  const resData = await res.json();
  if (!res.ok) throw new Error(resData.message || "获取子图失败");
  return resData;
}

// ==================== 工具函数 ====================

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 格式化解析时间
 */
export function formatParseTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * 检测文件格式
 */
export function detectMindMapFormat(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  switch (ext) {
    case 'mm':
      return 'freemind';
    case 'opml':
      return 'opml';
    case 'json':
      return 'json';
    case 'md':
    case 'markdown':
      return 'markdown';
    default:
      return 'unknown';
  }
}

// ==================== G-RAG测试API函数 ====================

/**
 * G-RAG单次测试
 */
export async function testGraphRAG(request: GRAGTestRequest): Promise<GRAGTestResult> {
  const proxyParams = {
    targetPath: "parser/graphs/g-rag/test",
    actualMethod: "POST",
  };

  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    proxyParams,
    actualBody: request as unknown as Record<string, unknown>,
  });

  const resData = await res.json();
  if (!res.ok) throw new Error(resData.message || "G-RAG测试失败");
  return resData;
}

/**
 * G-RAG批量测试
 */
export async function batchTestGraphRAG(request: GRAGBatchTestRequest): Promise<GRAGBatchTestResult> {
  const proxyParams = {
    targetPath: "parser/graphs/g-rag/batch-test",
    actualMethod: "POST",
  };

  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    proxyParams,
    actualBody: request as unknown as Record<string, unknown>,
  });

  const resData = await res.json();
  if (!res.ok) throw new Error(resData.message || "G-RAG批量测试失败");
  return resData;
}

/**
 * G-RAG性能测试
 */
export async function performanceTestGraphRAG(iterations?: number): Promise<GRAGPerformanceTestResult> {
  const queryParams = iterations ? `?iterations=${iterations}` : '';
  const proxyParams = {
    targetPath: `parser/graphs/g-rag/performance-test${queryParams}`,
    actualMethod: "GET",
  };

  const res = await fetchWithAuth("/api/proxy-get", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    proxyParams,
  });

  const resData = await res.json();
  if (!res.ok) throw new Error(resData.message || "G-RAG性能测试失败");
  return resData;
}
