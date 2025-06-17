"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAlert } from '@/components/common/alert';
import { useRagTest } from './useRagTest';
import {
  SearchTestForm,
  SearchResults,
  SearchHistory,
  SearchStats,
  ContextPreview
} from './components';

export default function RAGTestPage() {
  const [showAlert] = useAlert();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    searchResult,
    loading,
    history,
    executeSearch,
    searchFromHistory,
    clearHistory,
    getSearchStats,
    searchForm,
    updateSearchForm,
  } = useRagTest();

  const [activeView, setActiveView] = useState<'search' | 'history' | 'stats'>('search');

  // 处理URL参数中的查询
  useEffect(() => {
    const queryParam = searchParams.get('query');
    if (queryParam && queryParam.trim()) {
      updateSearchForm({ query: queryParam });
      // 自动执行搜索
      setTimeout(() => {
        executeSearch();
      }, 100);
    }
  }, [searchParams, updateSearchForm, executeSearch]);

  // 快捷键处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K 聚焦搜索框
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('textarea[name="query"]') as HTMLTextAreaElement;
        searchInput?.focus();
      }
      
      // Ctrl/Cmd + Enter 执行搜索
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (searchForm.query.trim()) {
          executeSearch();
        }
      }
      
      // Ctrl/Cmd + H 切换到历史
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        setActiveView('history');
      }
      
      // Ctrl/Cmd + S 切换到统计
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        setActiveView('stats');
      }
      
      // Ctrl/Cmd + 1 切换到搜索
      if ((e.ctrlKey || e.metaKey) && e.key === '1') {
        e.preventDefault();
        setActiveView('search');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchForm.query, executeSearch]);

  // 处理搜索
  const handleSearch = async () => {
    await executeSearch();
  };

  // 处理从历史记录搜索
  const handleSearchFromHistory = (item: { query: string; result: unknown }) => {
    searchFromHistory(item);
    setActiveView('search'); // 切换到搜索视图查看结果
  };

  // 处理复制内容
  const handleCopyContent = () => {
    showAlert('内容已复制到剪贴板', 'success');
  };

  // 获取统计数据
  const stats = getSearchStats();

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* 页面标题 */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">RAG 搜索测试</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          测试和评估RAG检索增强生成系统的搜索性能、相关性和响应时间
        </p>
      </div>

      {/* 导航标签和快捷键提示 */}
      <div className="flex flex-col items-center gap-4">
        <div className="inline-flex rounded-lg border bg-muted p-1">
          <button
            onClick={() => setActiveView('search')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeView === 'search'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Ctrl+1"
          >
            搜索测试
          </button>
          <button
            onClick={() => setActiveView('history')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeView === 'history'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Ctrl+H"
          >
            搜索历史
          </button>
          <button
            onClick={() => setActiveView('stats')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeView === 'stats'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Ctrl+S"
          >
            统计分析
          </button>
        </div>
        
        {/* 快捷键提示 */}
        <div className="text-xs text-muted-foreground flex items-center gap-4">
          <span>Ctrl+K 聚焦搜索</span>
          <span>Ctrl+Enter 执行搜索</span>
          <span>Ctrl+1/H/S 切换标签</span>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="grid grid-cols-1 gap-8">
        {/* 搜索视图 */}
        {activeView === 'search' && (
          <>
            {/* 搜索表单 */}
            <SearchTestForm onSearch={handleSearch} loading={loading} />

            {/* 搜索结果 */}
            {searchResult && (
              <SearchResults 
                searchResult={searchResult} 
                onCopyContent={handleCopyContent}
              />
            )}

            {/* 上下文预览 */}
            <ContextPreview searchResult={searchResult} />
          </>
        )}

        {/* 历史视图 */}
        {activeView === 'history' && (
          <SearchHistory
            history={history}
            onSearchFromHistory={handleSearchFromHistory}
            onClearHistory={clearHistory}
          />
        )}

        {/* 统计视图 */}
        {activeView === 'stats' && (
          <SearchStats stats={stats} />
        )}
      </div>

      {/* 侧边栏信息 - 始终显示的快速统计 */}
      {(searchResult || history.length > 0) && (
        <div className="fixed bottom-6 right-6 w-80 max-w-sm">
          <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border rounded-lg shadow-lg p-4 space-y-3">
            <h3 className="font-medium text-sm">快速统计</h3>
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="text-center">
                <div className="text-lg font-bold">{stats.searchCount}</div>
                <div className="text-muted-foreground">搜索次数</div>
              </div>
              
              {stats.avgResponseTime > 0 && (
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {stats.avgResponseTime < 1000 
                      ? `${stats.avgResponseTime}ms` 
                      : `${(stats.avgResponseTime / 1000).toFixed(1)}s`
                    }
                  </div>
                  <div className="text-muted-foreground">平均响应</div>
                </div>
              )}
            </div>

            {searchResult && (
              <div className="pt-2 border-t border-muted">
                <div className="text-xs text-muted-foreground">
                  最近搜索: {searchResult.totalResults} 个结果
                </div>
                {searchResult.results.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    最高相似度: {(searchResult.results[0].score * 100).toFixed(1)}%
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setActiveView('search')}
                className="flex-1 text-xs py-1 px-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                测试
              </button>
              <button
                onClick={() => setActiveView('history')}
                className="flex-1 text-xs py-1 px-2 rounded bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                历史
              </button>
              <button
                onClick={() => setActiveView('stats')}
                className="flex-1 text-xs py-1 px-2 rounded bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                统计
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}