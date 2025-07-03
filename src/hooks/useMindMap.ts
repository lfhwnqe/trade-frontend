/**
 * 脑图数据管理Hook
 * 提供脑图数据的加载、保存、更新等功能
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  MindMapData,
  CreateMindMapRequest,
  UpdateMindMapRequest,
  MindMapListParams
} from '@/types/mindmap';
import { MindMapService } from '@/services/mindMapService';

export interface UseMindMapOptions {
  id?: string;
  autoLoad?: boolean;
  enableRetry?: boolean;
  maxRetries?: number;
}

export interface UseMindMapReturn {
  // 数据状态
  data: MindMapData | null;
  isLoading: boolean;
  error: string | null;

  // 操作方法
  load: (id: string) => Promise<void>;
  create: (data: CreateMindMapRequest) => Promise<MindMapData>;
  update: (id: string, data: UpdateMindMapRequest) => Promise<MindMapData>;
  remove: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;

  // 状态标识
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export const useMindMap = (options: UseMindMapOptions = {}): UseMindMapReturn => {
  const {
    id,
    autoLoad = true
  } = options;

  // 状态管理
  const [data, setData] = useState<MindMapData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 执行API调用的通用方法
  const executeApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    loadingStateSetter?: (loading: boolean) => void
  ): Promise<T> => {
    try {
      clearError();
      loadingStateSetter?.(true);

      const result = await apiCall();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : '未知错误';

      setError(errorMessage);
      throw err;
    } finally {
      loadingStateSetter?.(false);
    }
  }, [clearError]);

  // 加载脑图数据
  const load = useCallback(async (mindMapId: string) => {
    await executeApiCall(
      async () => {
        const result = await MindMapService.getById(mindMapId);
        setData(result);
        return result;
      },
      setIsLoading
    );
  }, [executeApiCall]);

  // 创建新脑图
  const create = useCallback(async (createData: CreateMindMapRequest): Promise<MindMapData> => {
    return await executeApiCall(
      async () => {
        const result = await MindMapService.create(createData);
        setData(result);
        return result;
      },
      setIsCreating
    );
  }, [executeApiCall]);

  // 更新脑图数据
  const update = useCallback(async (mindMapId: string, updateData: UpdateMindMapRequest): Promise<MindMapData> => {
    return await executeApiCall(
      async () => {
        const result = await MindMapService.update(mindMapId, updateData);
        setData(result);
        return result;
      },
      setIsUpdating
    );
  }, [executeApiCall]);

  // 删除脑图
  const remove = useCallback(async (mindMapId: string) => {
    await executeApiCall(
      async () => {
        await MindMapService.delete(mindMapId);
        setData(null);
      },
      setIsDeleting
    );
  }, [executeApiCall]);

  // 刷新数据
  const refresh = useCallback(async () => {
    if (data?.id) {
      await load(data.id);
    } else if (id) {
      await load(id);
    }
  }, [data?.id, id, load]);

  // 自动加载数据
  useEffect(() => {
    if (autoLoad && id && !data) {
      load(id);
    }
  }, [autoLoad, id, data, load]);

  return {
    // 数据状态
    data,
    isLoading,
    error,

    // 操作方法
    load,
    create,
    update,
    remove,
    refresh,
    clearError,

    // 状态标识
    isCreating,
    isUpdating,
    isDeleting,
  };
};

// 脑图列表管理Hook
export interface UseMindMapListOptions {
  autoLoad?: boolean;
  initialPage?: number;
  initialLimit?: number;
}

export interface UseMindMapListReturn {
  // 数据状态
  items: MindMapData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;

  // 操作方法
  load: (params?: MindMapListParams) => Promise<void>;
  refresh: () => Promise<void>;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  clearError: () => void;
}

export const useMindMapList = (options: UseMindMapListOptions = {}): UseMindMapListReturn => {
  const { autoLoad = true, initialPage = 1, initialLimit = 10 } = options;

  // 状态管理
  const [items, setItems] = useState<MindMapData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 加载列表数据
  const load = useCallback(async (params: MindMapListParams = {}) => {
    try {
      setIsLoading(true);
      clearError();

      const result = await MindMapService.getList({
        page,
        limit,
        ...params
      });

      setItems(result.items);
      setTotal(result.total);
      setTotalPages(Math.ceil(result.total / result.limit));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载列表失败';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, clearError]);

  // 刷新列表
  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  // 设置页码
  const setPageNumber = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  // 设置每页数量
  const setLimitNumber = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // 重置到第一页
  }, []);

  // 自动加载
  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, page, limit, load]);

  return {
    // 数据状态
    items,
    total,
    page,
    limit,
    totalPages,
    isLoading,
    error,

    // 操作方法
    load,
    refresh,
    setPage: setPageNumber,
    setLimit: setLimitNumber,
    clearError,
  };
};
