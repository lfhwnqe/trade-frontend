/**
 * 脑图列表页面
 * 显示用户的所有脑图，支持搜索、过滤和排序
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Search,
  Plus,
  Brain,
  Calendar,
  Tag,
  Edit,
  Trash2,
  Eye,
  Filter,
  SortAsc,
  SortDesc,
  AlertCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useMindMapList } from '@/hooks/useMindMap';
import { MindMapData } from '@/lib/api/mindmap';

export default function MindMapListPage() {
  const router = useRouter();

  // 使用Hook管理列表数据
  const {
    items: mindMaps,
    total,
    page,
    limit,
    totalPages,
    isLoading: loading,
    error,
    load: loadList,
    refresh,
    setPage,
    setLimit,
    clearError
  } = useMindMapList({
    autoLoad: true,
    initialLimit: 12
  });

  // 本地状态
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'title'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 获取所有标签
  const allTags = Array.from(new Set(mindMaps.flatMap(map => map.tags || [])));

  // 过滤和排序脑图
  const filteredAndSortedMaps = mindMaps
    .filter(map => {
      const matchesSearch = map.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (map.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTag = !selectedTag || (map.tags && map.tags.includes(selectedTag));
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      let aValue, bValue;
      if (sortBy === 'title') {
        aValue = a.title;
        bValue = b.title;
      } else {
        aValue = new Date(a[sortBy]).getTime();
        bValue = new Date(b[sortBy]).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // 搜索处理
  const handleSearch = async () => {
    try {
      await loadList({
        search: searchTerm,
        tags: selectedTag ? [selectedTag] : [],
        sortBy,
        sortOrder
      });
    } catch (error) {
      console.error('搜索失败:', error);
    }
  };

  // 删除脑图
  const handleDeleteMindMap = async (id: string) => {
    if (!confirm('确定要删除这个脑图吗？此操作不可恢复。')) {
      return;
    }

    try {
      setDeletingId(id);
      setDeleteError(null);

      // 动态导入删除API
      const { deleteMindMap } = await import('@/lib/api/mindmap');
      await deleteMindMap(id);

      // 刷新列表
      await refresh();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除失败';
      setDeleteError(errorMessage);
      console.error('删除脑图失败:', error);
    } finally {
      setDeletingId(null);
    }
  };

  // 处理分页
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // 处理每页数量变化
  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题和操作 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            <Brain className="inline-block w-8 h-8 mr-2" />
            我的脑图
          </h1>
          <p className="text-gray-600">
            管理您的所有思维导图 ({total} 个)
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={refresh}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>刷新</span>
          </Button>
          <Link href="/mindmap/new">
            <Button className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>创建新脑图</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 错误提示 */}
      {(error || deleteError) && (
        <div className="mb-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || deleteError}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  clearError();
                  setDeleteError(null);
                }}
                className="ml-2"
              >
                关闭
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* 搜索和过滤 */}
      <div className="mb-6 space-y-4">
        {/* 搜索框 */}
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="搜索脑图标题或描述..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>搜索</span>
          </Button>
        </div>

        {/* 标签过滤和排序 */}
        <div className="flex flex-wrap items-center gap-4">
          {/* 标签过滤 */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">标签:</span>
            <Button
              variant={selectedTag === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTag(null)}
            >
              全部
            </Button>
            {allTags.map(tag => (
              <Button
                key={tag}
                variant={selectedTag === tag ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTag(tag)}
              >
                {tag}
              </Button>
            ))}
          </div>

          {/* 排序 */}
          <div className="flex items-center space-x-2 ml-auto">
            <span className="text-sm text-gray-600">排序:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortBy('title')}
              className={sortBy === 'title' ? 'bg-gray-100' : ''}
            >
              标题
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortBy('updatedAt')}
              className={sortBy === 'updatedAt' ? 'bg-gray-100' : ''}
            >
              更新时间
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortBy('createdAt')}
              className={sortBy === 'createdAt' ? 'bg-gray-100' : ''}
            >
              创建时间
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-gray-600">加载脑图列表...</span>
          </div>
        </div>
      )}

      {/* 脑图列表 */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedMaps.map(mindMap => (
            <Card key={mindMap.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{mindMap.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {mindMap.description || '暂无描述'}
                    </CardDescription>
                  </div>
                </div>

                {/* 标签 */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {(mindMap.tags || []).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardHeader>

              <CardContent>
                {/* 时间信息 */}
                <div className="text-xs text-gray-500 mb-4 space-y-1">
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    创建: {new Date(mindMap.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    更新: {new Date(mindMap.updatedAt).toLocaleDateString()}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex space-x-2">
                  <Link href={`/mindmap/${mindMap.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="w-4 h-4 mr-1" />
                      查看
                    </Button>
                  </Link>
                  <Link href={`/mindmap/${mindMap.id}/edit`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Edit className="w-4 h-4 mr-1" />
                      编辑
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteMindMap(mindMap.id)}
                    disabled={deletingId === mindMap.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {deletingId === mindMap.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 空状态 */}
      {!loading && filteredAndSortedMaps.length === 0 && (
        <div className="text-center py-12">
          <Brain className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || selectedTag ? '未找到匹配的脑图' : '还没有脑图'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || selectedTag
              ? '尝试调整搜索条件或过滤器'
              : '创建您的第一个思维导图开始使用'
            }
          </p>
          {!searchTerm && !selectedTag && (
            <Link href="/mindmap/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                创建新脑图
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* 分页 */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 mt-8">
          <Button
            variant="outline"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
          >
            上一页
          </Button>
          <span className="text-sm text-gray-600">
            第 {page} 页，共 {totalPages} 页
          </span>
          <Button
            variant="outline"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
}
