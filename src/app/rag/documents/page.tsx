"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useRagDocuments } from './useRagDocuments';
import { DocumentTable, SimpleFilter, DocumentStats } from './components';
import { DocumentDetailDialog } from '../manage/components';
import { DocumentEntity } from '../types';

export default function RAGDocumentsPage() {
  const {
    // 状态
    documents,
    loading,
    pagination,
    filters,
    searchQuery,

    // 方法
    fetchDocuments,
    updateFilters,
    updateSearch,
    updatePagination,
    refreshData,
    fetchDocumentDetail,
  } = useRagDocuments();

  // 文档详情对话框状态
  const [detailDialog, setDetailDialog] = useState<{
    open: boolean;
    document: DocumentEntity | null;
    loading: boolean;
  }>({
    open: false,
    document: null,
    loading: false,
  });

  // 页面初始化
  useEffect(() => {
    fetchDocuments();
  }, []);

  // 处理查看详情
  const handleViewDetail = async (document: DocumentEntity) => {
    setDetailDialog({
      open: true,
      document: null,
      loading: true,
    });

    try {
      const detailData = await fetchDocumentDetail(document.documentId);
      setDetailDialog({
        open: true,
        document: detailData || document,
        loading: false,
      });
    } catch {
      setDetailDialog({
        open: true,
        document: document,
        loading: false,
      });
    }
  };

  // 处理搜索
  const handleSearch = (query: string) => {
    updateSearch(query);
    // 重置到第一页并触发搜索
    updatePagination(1, pagination.pageSize);
  };

  // 处理筛选
  const handleFilterChange = (newFilters: typeof filters) => {
    updateFilters(newFilters);
    // 重置到第一页并触发筛选
    updatePagination(1, pagination.pageSize);
  };

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">文档列表</h1>
          <p className="text-muted-foreground">
            查看和浏览知识库中的所有文档
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>

      {/* 快速搜索栏 */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索文档标题..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 bg-white"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 统计信息 */}
      <DocumentStats documents={documents} loading={loading} />

      {/* 筛选组件 */}
      <SimpleFilter
        filters={filters}
        onFiltersChange={handleFilterChange}
        loading={loading}
      />

      {/* 文档表格 */}
      <div className="flex-1 min-h-0">
        <DocumentTable
          documents={documents}
          loading={loading}
          pagination={pagination}
          onPageChange={updatePagination}
          onViewDetail={handleViewDetail}
        />
      </div>

      {/* 文档详情对话框 */}
      <DocumentDetailDialog
        open={detailDialog.open}
        onClose={() => setDetailDialog({ open: false, document: null, loading: false })}
        document={detailDialog.document}
        loading={detailDialog.loading}
      />
    </div>
  );
}