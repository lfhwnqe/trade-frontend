/**
 * RAG模块相关类型定义
 * 基于后端 trade-backend/src/modules/rag/ 的接口定义
 */

// 文档类型枚举
export enum DocumentType {
  TRADE = 'trade',
  KNOWLEDGE = 'knowledge',
  MANUAL = 'manual',
  REPORT = 'report',
}

// 文档状态枚举
export enum DocumentStatus {
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELETED = 'deleted',
}

// 优先级枚举
export enum Priority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

// 日期范围接口
export interface DateRange {
  from: string;
  to: string;
}

// 文档元数据接口
export interface DocumentMetadata {
  source?: string;
  author?: string;
  tags?: string[];
  category?: string;
  priority?: Priority;
  isPublic?: boolean;
  tradeSymbol?: string;
  dateRange?: DateRange;
}

// 文档实体接口
export interface DocumentEntity {
  userId: string;
  documentId: string;
  title: string;
  documentType: DocumentType;
  contentType: string;
  originalFileName: string;
  fileSize: number;
  embeddingIds: string[];
  chunkCount: number;
  totalTokens: number;
  embeddingModel: string;
  metadata: DocumentMetadata;
  status: DocumentStatus;
  processingProgress?: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt?: string;
}

// 创建文档DTO
export interface CreateDocumentDto {
  title: string;
  documentType: DocumentType;
  content: string;
  contentType: string;
  originalFileName?: string;
  fileSize?: number;
  metadata?: DocumentMetadata;
}

// 更新文档DTO
export interface UpdateDocumentDto {
  title?: string;
  content?: string;
  metadata?: Partial<DocumentMetadata>;
}

// 搜索查询DTO
export interface SearchQueryDto {
  query: string;
  maxResults?: number;
  similarityThreshold?: number;
  documentTypes?: DocumentType[];
  tags?: string[];
  dateRange?: DateRange;
  rerankResults?: boolean;
  includeMetadata?: boolean;
  documentIds?: string[];
}

// 搜索结果DTO
export interface SearchResultDto {
  id: string;
  score: number;
  content: string;
  metadata: {
    userId: string;
    documentId: string;
    chunkIndex: number;
    documentType: string;
    title: string;
    tags?: string[];
    timestamp: string;
    tokenCount: number;
  };
}

// 检索结果DTO
export interface RetrievalResultDto {
  query: string;
  results: SearchResultDto[];
  totalResults: number;
  processingTime: number;
  context: string;
}

// 文档过滤器
export interface DocumentFilter {
  documentType?: DocumentType;
  status?: DocumentStatus;
  tags?: string[];
  dateRange?: DateRange;
  page?: number;
  pageSize?: number;
}

// 文档列表响应
export interface DocumentListResponse {
  items: DocumentEntity[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// RAG统计数据
export interface RAGAnalytics {
  totalDocuments: number;
  documentsCompleted: number;
  documentsProcessing: number;
  documentsFailed: number;
}

// RAG健康检查响应
export interface HealthCheckResponse {
  status: string;
  timestamp: string;
}

// API响应基础结构
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: string;
}

// RAG查询表单
export interface RAGQuery {
  documentType?: DocumentType | 'all';
  status?: DocumentStatus | 'all';
  tags?: string[];
  dateRange?: DateRange;
  searchTitle?: string;
}

// RAG搜索表单
export interface RAGSearchForm {
  query: string;
  maxResults: number;
  similarityThreshold: number;
  documentTypes: DocumentType[];
  tags: string[];
  rerankResults: boolean;
  includeMetadata: boolean;
}

// 简单测试相关类型
export interface SimpleTestQueryDto {
  query: string;
  content?: string; // 可选的文本内容，用于向量化测试
}

export interface VectorizationResult {
  // 向量化模型信息
  model: string;
  // 生成的向量ID
  vectorId: string;
  // 存储状态
  storageStatus: 'success' | 'failed';
  // token使用量
  tokenUsage: {
    inputTokens: number;
    embeddingDimensions: number;
  };
  // 处理时间（毫秒）
  processingTimeMs: number;
  // 文本块信息
  chunkInfo: {
    chunkCount: number;
    totalCharacters: number;
    averageChunkSize: number;
  };
}

export interface SimpleTestResponseDto {
  query: string;
  message: string;
  timestamp: string;
  mockResults: string[];
  status: string;
  vectorization?: VectorizationResult; // 向量化处理结果（如果提供了content）
}

// 使用场景类型
export interface UsageScenario {
  id: string;
  title: string;
  description: string;
  queryExample: string;
  contentExample?: string;
  category: 'search' | 'vectorize' | 'both';
}