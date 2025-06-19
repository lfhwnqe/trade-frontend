import { useState, useCallback, useRef } from 'react';
import { getDocuments, getDocument } from '../request';
import { isErrorWithMessage } from '@/utils';
import { 
  DocumentEntity, 
  DocumentFilter,
  DocumentStatus,
  DocumentType,
  DateRange
} from '../types';
import { useAlert } from '@/components/common/alert';

// 简化的筛选状态
interface SimpleFilters {
  status?: DocumentStatus | 'all';
  documentType?: DocumentType | 'all';
  dateRange?: DateRange;
}

// 分页状态
interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// 文档列表状态
interface DocumentsState {
  documents: DocumentEntity[];
  loading: boolean;
  pagination: PaginationState;
  filters: SimpleFilters;
  searchQuery: string;
}

/**
 * RAG文档列表页面的状态管理 Hook
 * 简化版的状态管理，专注于数据展示
 */
export function useRagDocuments() {
  const [showAlert] = useAlert();
  
  // 主要状态
  const [state, setState] = useState<DocumentsState>({
    documents: [],
    loading: false,
    pagination: {
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 1,
    },
    filters: {},
    searchQuery: '',
  });

  // 节流控制
  const throttleRef = useRef<NodeJS.Timeout | null>(null);

  // 获取文档列表
  const fetchDocuments = useCallback(
    async (
      page = state.pagination.page,
      pageSize = state.pagination.pageSize,
      filters = state.filters,
      searchQuery = state.searchQuery
    ) => {
      // 清除之前的定时器
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }

      // 立即设置loading状态
      setState(prev => ({
        ...prev,
        loading: true,
      }));

      // 节流执行请求
      throttleRef.current = setTimeout(async () => {
        try {
          const requestFilters: DocumentFilter = {
            page,
            pageSize,
            documentType: filters.documentType === 'all' ? undefined : filters.documentType,
            status: filters.status === 'all' ? undefined : filters.status,
            dateRange: filters.dateRange,
          };

          // 如果有搜索查询，可以在这里添加到filters中
          // 注意：当前API可能不支持title搜索，这里预留接口
          
          const response = await getDocuments(requestFilters);
          
          let filteredDocuments = response.data || [];
          
          // 客户端搜索过滤（如果API不支持服务端搜索）
          if (searchQuery.trim()) {
            filteredDocuments = filteredDocuments.filter(doc => 
              doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (doc.originalFileName && doc.originalFileName.toLowerCase().includes(searchQuery.toLowerCase()))
            );
          }

          setState(prev => ({
            ...prev,
            documents: filteredDocuments,
            loading: false,
            pagination: {
              ...prev.pagination,
              page,
              pageSize,
              total: filteredDocuments.length,
              totalPages: Math.ceil(filteredDocuments.length / pageSize),
            },
          }));
        } catch (error) {
          console.error('获取文档列表失败:', error);
          setState(prev => ({
            ...prev,
            loading: false,
            documents: [],
            pagination: {
              ...prev.pagination,
              total: 0,
              totalPages: 1,
            },
          }));
          
          if (isErrorWithMessage(error)) {
            showAlert("获取文档列表失败: " + error.message, 'error');
          } else {
            showAlert("获取文档列表失败: 系统错误", 'error');
          }
        }
      }, 300); // 300ms 节流
    },
    [state.pagination.page, state.pagination.pageSize, state.filters, state.searchQuery, showAlert]
  );

  // 更新筛选条件
  const updateFilters = useCallback((newFilters: SimpleFilters) => {
    setState(prev => ({
      ...prev,
      filters: newFilters,
    }));
  }, []);

  // 更新搜索查询
  const updateSearch = useCallback((query: string) => {
    setState(prev => ({
      ...prev,
      searchQuery: query,
    }));
  }, []);

  // 更新分页并触发数据获取
  const updatePagination = useCallback((page?: number, pageSize?: number) => {
    const newPage = page !== undefined ? page : state.pagination.page;
    const newPageSize = pageSize !== undefined ? pageSize : state.pagination.pageSize;
    
    setState(prev => ({
      ...prev,
      pagination: {
        ...prev.pagination,
        page: newPage,
        pageSize: newPageSize,
      },
    }));
    
    // 立即触发数据获取
    fetchDocuments(newPage, newPageSize, state.filters, state.searchQuery);
  }, [state.pagination.page, state.pagination.pageSize, state.filters, state.searchQuery, fetchDocuments]);

  // 刷新数据
  const refreshData = useCallback(() => {
    fetchDocuments(state.pagination.page, state.pagination.pageSize, state.filters, state.searchQuery);
  }, [fetchDocuments, state.pagination.page, state.pagination.pageSize, state.filters, state.searchQuery]);

  // 获取文档详情
  const fetchDocumentDetail = useCallback(
    async (documentId: string) => {
      try {
        const response = await getDocument(documentId);
        return response.data;
      } catch (error) {
        console.error('获取文档详情失败:', error);
        if (isErrorWithMessage(error)) {
          showAlert("获取文档详情失败: " + error.message, 'error');
        } else {
          showAlert("获取文档详情失败: 未知错误", 'error');
        }
        return null;
      }
    },
    [showAlert]
  );

  return {
    // 状态
    documents: state.documents,
    loading: state.loading,
    pagination: state.pagination,
    filters: state.filters,
    searchQuery: state.searchQuery,

    // 方法
    fetchDocuments,
    updateFilters,
    updateSearch,
    updatePagination,
    refreshData,
    fetchDocumentDetail,
  };
}