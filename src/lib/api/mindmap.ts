/**
 * 脑图API客户端
 * 提供与后端脑图API的交互功能
 */

// 脑图数据接口
export interface MindMapNode {
  data: {
    text: string;
    [key: string]: any;
  };
  children?: MindMapNode[];
}

export interface MindMapMetadata {
  nodeCount?: number;
  maxDepth?: number;
  editDuration?: number;
  lastEditTime?: string;
  version?: string;
}

export interface MindMapData {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  layout: string;
  theme: string;
  data: MindMapNode;
  metadata?: MindMapMetadata;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface CreateMindMapRequest {
  title: string;
  description?: string;
  tags?: string[];
  layout?: string;
  theme?: string;
  data: MindMapNode;
}

export interface UpdateMindMapRequest {
  title?: string;
  description?: string;
  tags?: string[];
  layout?: string;
  theme?: string;
  data?: MindMapNode;
}

export interface MindMapListParams {
  page?: number;
  limit?: number;
  tags?: string[];
  sortBy?: 'title' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface MindMapListResponse {
  items: MindMapData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

// API基础配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_PREFIX = '/api/mindmap';

// 获取认证token
const getAuthToken = (): string | null => {
  // TODO: 从认证系统获取token
  // 这里暂时返回模拟token
  return 'mock-jwt-token';
};

// 创建请求头
const createHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// 处理API响应
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  const data: ApiResponse<T> = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || 'API请求失败');
  }

  return data.data;
};

// 脑图API客户端类
export class MindMapApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * 创建脑图
   */
  async createMindMap(data: CreateMindMapRequest): Promise<MindMapData> {
    const response = await fetch(`${this.baseUrl}${API_PREFIX}`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });

    return handleResponse<MindMapData>(response);
  }

  /**
   * 获取脑图详情
   */
  async getMindMap(id: string): Promise<MindMapData> {
    const response = await fetch(`${this.baseUrl}${API_PREFIX}/${id}`, {
      method: 'GET',
      headers: createHeaders(),
    });

    return handleResponse<MindMapData>(response);
  }

  /**
   * 更新脑图
   */
  async updateMindMap(id: string, data: UpdateMindMapRequest): Promise<MindMapData> {
    const response = await fetch(`${this.baseUrl}${API_PREFIX}/${id}`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });

    return handleResponse<MindMapData>(response);
  }

  /**
   * 删除脑图
   */
  async deleteMindMap(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}${API_PREFIX}/${id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });

    await handleResponse<void>(response);
  }

  /**
   * 获取脑图列表
   */
  async getMindMapList(params: MindMapListParams = {}): Promise<MindMapListResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('pageSize', params.limit.toString());
    if (params.tags && params.tags.length > 0) {
      params.tags.forEach(tag => searchParams.append('tags', tag));
    }
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
    if (params.search) searchParams.append('search', params.search);

    const url = `${this.baseUrl}${API_PREFIX}?${searchParams.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: createHeaders(),
    });

    return handleResponse<MindMapListResponse>(response);
  }
}

// 默认API客户端实例
export const mindMapApi = new MindMapApiClient();

// 便捷方法
export const createMindMap = (data: CreateMindMapRequest) => mindMapApi.createMindMap(data);
export const getMindMap = (id: string) => mindMapApi.getMindMap(id);
export const updateMindMap = (id: string, data: UpdateMindMapRequest) => mindMapApi.updateMindMap(id, data);
export const deleteMindMap = (id: string) => mindMapApi.deleteMindMap(id);
export const getMindMapList = (params?: MindMapListParams) => mindMapApi.getMindMapList(params);

// 错误处理工具
export class MindMapApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'MindMapApiError';
  }
}

// 重试机制
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (i === maxRetries) {
        throw new MindMapApiError(
          `请求失败，已重试${maxRetries}次: ${lastError.message}`,
          undefined,
          lastError
        );
      }

      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }

  throw lastError!;
};
