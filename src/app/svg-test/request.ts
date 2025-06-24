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

// ==================== API调用函数 ====================

/**
 * 通用SVG解析接口
 */
export async function parseSVG(
  data: SVGParseRequest
): Promise<ApiResponse<SVGParseResponse>> {
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
): Promise<ApiResponse<SVGParseResponse>> {
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
): Promise<ApiResponse<SVGParseResponse>> {
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
): Promise<ApiResponse<SVGParseResponse>> {
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
): Promise<ApiResponse<{ valid: boolean; errors: ParseError[] }>> {
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
