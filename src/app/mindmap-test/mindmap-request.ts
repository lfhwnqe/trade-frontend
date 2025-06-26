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
  attributes?: Record<string, any>;
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
    [key: string]: any;
  }>;
  links: Array<{
    source: string;
    target: string;
    value?: number;
    type?: string;
    [key: string]: any;
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
    actualBody: formData as any,
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
