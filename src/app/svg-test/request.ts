import { fetchWithAuth } from "@/utils/fetchWithAuth";

/**
 * SVG解析模块API调用函数
 * 基于后端 /svg-parser 接口实现
 */

// ==================== 类型定义 ====================

export enum InputType {
  URL = 'url',
  FILE = 'file',
  STRING = 'string',
}

export interface ParseOptions {
  extractText?: boolean;
  extractStyles?: boolean;
  extractTransforms?: boolean;
  ignoreHiddenElements?: boolean;
  maxNodes?: number;
  timeout?: number;
  validateStructure?: boolean;
}

export interface SVGParseRequest {
  input: string;
  inputType: InputType;
  options?: ParseOptions;
}

export interface SVGParseFromString {
  svgContent: string;
  options?: ParseOptions;
}

export interface SVGParseFromUrl {
  url: string;
  options?: ParseOptions;
}

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  properties: Record<string, any>;
  position: Point;
  size: Size;
  style: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type: string;
  properties: Record<string, any>;
  style: Record<string, any>;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    nodeCount: number;
    edgeCount: number;
    sourceFormat: string;
    createdAt: Date;
    version: string;
  };
}

export interface ParseError {
  code: string;
  message: string;
  element?: string;
  line?: number;
  column?: number;
  severity: 'error' | 'warning' | 'info';
}

export interface PerformanceMetrics {
  parseTime: number;
  memoryUsage: number;
  nodeCount: number;
  edgeCount: number;
  elementCount: number;
}

export interface SVGParseResponse {
  success: boolean;
  data?: GraphData;
  errors: ParseError[];
  metrics: PerformanceMetrics;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

// ==================== 思维导图相关类型 ====================

export interface MindMapNode {
  id: string;
  text: string;
  level: number;
  parentId?: string;
  children?: MindMapNode[];
  position?: { x: number; y: number };
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
  metadata?: {
    title?: string;
    author?: string;
    created?: string;
    modified?: string;
    format?: string;
  };
}

export interface ForceGraphData {
  nodes: Array<{
    id: string;
    name: string;
    val?: number;
    group?: string;
    level?: number;
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
  data: {
    mindMap: MindMapData;
    graph: ForceGraphData;
  };
  metadata?: {
    title?: string;
    author?: string;
    created?: string;
    modified?: string;
    format?: string;
    fileName?: string;
    fileSize?: number;
  };
}

export interface MindMapParseRequest {
  content: string;
  format: string;
}

// ==================== API调用函数 ====================

/**
 * 通用SVG解析接口
 */
export async function parseSVG(
  data: SVGParseRequest
): Promise<SVGParseResponse> {
  const proxyParams = {
    targetPath: "svg-parser/parse",
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
  if (!res.ok) throw new Error(resData.message || "SVG解析失败");
  return resData;
}

/**
 * 从字符串解析SVG
 */
export async function parseSVGFromString(
  data: SVGParseFromString
): Promise<SVGParseResponse> {
  const proxyParams = {
    targetPath: "svg-parser/parse-string",
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
  if (!res.ok) throw new Error(resData.message || "SVG字符串解析失败");
  return resData;
}

/**
 * 从URL解析SVG
 */
export async function parseSVGFromUrl(
  data: SVGParseFromUrl
): Promise<SVGParseResponse> {
  const proxyParams = {
    targetPath: "svg-parser/parse-url",
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
  if (!res.ok) throw new Error(resData.message || "SVG URL解析失败");
  return resData;
}

/**
 * 从文件解析SVG
 */
export async function parseSVGFromFile(
  file: File,
  options?: ParseOptions
): Promise<SVGParseResponse> {
  // 读取文件内容为字符串
  const fileContent = await file.text();

  // 使用字符串解析接口
  return parseSVGFromString({
    svgContent: fileContent,
    options,
  });
}

/**
 * 验证SVG格式
 */
export async function validateSVG(
  svgContent: string
): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
  const proxyParams = {
    targetPath: "svg-parser/validate",
    actualMethod: "POST",
  };
  const actualBody = { svgContent } as Record<string, unknown>;

  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    proxyParams,
    actualBody,
  });

  const resData = await res.json();
  if (!res.ok) throw new Error(resData.message || "SVG验证失败");
  return resData;
}

/**
 * 解析思维导图内容
 */
export async function parseMindMap(
  data: MindMapParseRequest
): Promise<MindMapParseResponse> {
  const proxyParams = {
    targetPath: "svg-parser/mindmap/parse",
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
 * 上传并解析思维导图文件
 */
export async function uploadAndParseMindMap(
  file: File,
  format?: string
): Promise<MindMapParseResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (format) {
    formData.append('format', format);
  }

  const proxyParams = {
    targetPath: "svg-parser/mindmap/upload",
    actualMethod: "POST",
  };

  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    proxyParams,
    actualBody: formData as any,
  });

  const resData = await res.json();
  if (!res.ok) throw new Error(resData.message || "思维导图文件解析失败");
  return resData;
}

// ==================== 辅助函数 ====================

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
 * 获取错误严重程度的颜色
 */
export function getErrorSeverityColor(severity: string): string {
  switch (severity) {
    case 'error': return 'text-red-600';
    case 'warning': return 'text-yellow-600';
    case 'info': return 'text-blue-600';
    default: return 'text-gray-600';
  }
}

/**
 * 获取错误严重程度的图标
 */
export function getErrorSeverityIcon(severity: string): string {
  switch (severity) {
    case 'error': return '❌';
    case 'warning': return '⚠️';
    case 'info': return 'ℹ️';
    default: return '📝';
  }
}
