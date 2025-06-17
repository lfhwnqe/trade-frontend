import { createImmerAtom } from '@/hooks/useAtomImmer';
import { SortingState, RowSelectionState } from '@tanstack/react-table';
import {
  DocumentEntity,
  DocumentType,
  DocumentStatus,
  RAGQuery,
  RAGSearchForm,
  RetrievalResultDto,
  RAGAnalytics,
  CreateDocumentDto,
} from './types';

// 分页相关状态
interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// 文档管理状态
interface DocumentManageState {
  documents: DocumentEntity[];
  loading: boolean;
  pagination: PaginationState;
  queryForm: RAGQuery;
  sorting: SortingState;
  rowSelection: RowSelectionState;
  dialog: {
    open: boolean;
    editDocument: Partial<DocumentEntity> | null;
    deleteId: string | null;
    form: Partial<CreateDocumentDto>;
  };
}

// RAG测试状态
interface RAGTestState {
  searchForm: RAGSearchForm;
  searchResult: RetrievalResultDto | null;
  loading: boolean;
  history: Array<{
    query: string;
    result: RetrievalResultDto;
    timestamp: string;
  }>;
}

// RAG统计状态
interface RAGAnalyticsState {
  analytics: RAGAnalytics | null;
  loading: boolean;
  lastUpdated: string | null;
}

// RAG全局状态
interface RAGGlobalState {
  manage: DocumentManageState;
  test: RAGTestState;
  analytics: RAGAnalyticsState;
  health: {
    status: string | null;
    lastCheck: string | null;
    loading: boolean;
  };
}

// 初始状态
const initialState: RAGGlobalState = {
  manage: {
    documents: [],
    loading: false,
    pagination: {
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 1,
    },
    queryForm: {},
    sorting: [],
    rowSelection: {},
    dialog: {
      open: false,
      editDocument: null,
      deleteId: null,
      form: {},
    },
  },
  test: {
    searchForm: {
      query: '',
      maxResults: 10,
      similarityThreshold: 0.7,
      documentTypes: [],
      tags: [],
      rerankResults: true,
      includeMetadata: true,
    },
    searchResult: null,
    loading: false,
    history: [],
  },
  analytics: {
    analytics: null,
    loading: false,
    lastUpdated: null,
  },
  health: {
    status: null,
    lastCheck: null,
    loading: false,
  },
};

// 创建主要的RAG atom
export const ragAtom = createImmerAtom<RAGGlobalState>(initialState);

// 辅助函数：处理文档查询参数
export function processDocumentQuery(query: RAGQuery) {
  const processedQuery: Record<string, unknown> = {};

  // 文档类型过滤
  if (query?.documentType && query.documentType !== 'all') {
    processedQuery.documentType = query.documentType;
  }

  // 状态过滤
  if (query?.status && query.status !== 'all') {
    processedQuery.status = query.status;
  }

  // 标签过滤
  if (query?.tags && query.tags.length > 0) {
    processedQuery.tags = query.tags;
  }

  // 日期范围过滤
  if (query?.dateRange) {
    processedQuery.dateRange = query.dateRange;
  }

  return processedQuery;
}

// 辅助函数：处理搜索查询参数
export function processSearchQuery(searchForm: RAGSearchForm) {
  const processedQuery: Record<string, unknown> = {
    query: searchForm.query,
    maxResults: searchForm.maxResults,
    similarityThreshold: searchForm.similarityThreshold,
    rerankResults: searchForm.rerankResults,
    includeMetadata: searchForm.includeMetadata,
  };

  // 文档类型过滤
  if (searchForm.documentTypes && searchForm.documentTypes.length > 0) {
    processedQuery.documentTypes = searchForm.documentTypes;
  }

  // 标签过滤
  if (searchForm.tags && searchForm.tags.length > 0) {
    processedQuery.tags = searchForm.tags;
  }

  return processedQuery;
}

// 辅助函数：添加搜索历史
export function addSearchHistory(
  query: string,
  result: RetrievalResultDto,
  currentHistory: Array<{
    query: string;
    result: RetrievalResultDto;
    timestamp: string;
  }>
) {
  const newHistoryItem = {
    query,
    result,
    timestamp: new Date().toISOString(),
  };

  // 保持最多20条历史记录
  const updatedHistory = [newHistoryItem, ...currentHistory.slice(0, 19)];
  return updatedHistory;
}

// 辅助函数：获取文档状态统计
export function getDocumentStatusStats(documents: DocumentEntity[]) {
  const stats = {
    total: documents.length,
    processing: 0,
    completed: 0,
    failed: 0,
    deleted: 0,
  };

  documents.forEach((doc) => {
    switch (doc.status) {
      case DocumentStatus.PROCESSING:
        stats.processing++;
        break;
      case DocumentStatus.COMPLETED:
        stats.completed++;
        break;
      case DocumentStatus.FAILED:
        stats.failed++;
        break;
      case DocumentStatus.DELETED:
        stats.deleted++;
        break;
    }
  });

  return stats;
}

// 辅助函数：获取文档类型统计
export function getDocumentTypeStats(documents: DocumentEntity[]) {
  const stats = {
    [DocumentType.TRADE]: 0,
    [DocumentType.KNOWLEDGE]: 0,
    [DocumentType.MANUAL]: 0,
    [DocumentType.REPORT]: 0,
  };

  documents.forEach((doc) => {
    if (stats.hasOwnProperty(doc.documentType)) {
      stats[doc.documentType]++;
    }
  });

  return stats;
}

// 辅助函数：格式化时间戳
export function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// 辅助函数：获取相对时间
export function getRelativeTime(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  
  return formatTimestamp(timestamp);
}