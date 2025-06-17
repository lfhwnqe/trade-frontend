"use client";

import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Database,
  Search,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity,
  RefreshCw,
  Plus,
  Zap,
  TrendingUp,
  Calendar,
  BarChart3,
  Command,
  BookOpen,
  Shield,
  Cpu
} from 'lucide-react';
import { ragAtom, getRelativeTime } from './atom';
import { getRAGAnalytics, getRAGHealth } from './request';
import { useRouter } from 'next/navigation';
import { useAlert } from '@/components/common/alert';
import { StatusBadge } from '@/components/rag';
import { DocumentStatus } from './types';

export default function RAGHomePage() {
  const [ragState, setRagState] = useAtom(ragAtom);
  const [successAlert, errorAlert] = useAlert();
  const [loading, setLoading] = useState(false);
  const [quickSearchQuery, setQuickSearchQuery] = useState('');
  const router = useRouter();

  // 获取统计数据和健康状态
  const fetchData = async (showSuccess = false) => {
    setLoading(true);
    try {
      // 获取统计数据
      const analyticsResponse = await getRAGAnalytics();
      setRagState((draft) => {
        draft.analytics.analytics = analyticsResponse.data || null;
        draft.analytics.lastUpdated = new Date().toISOString();
        draft.analytics.loading = false;
      });

      // 获取健康状态
      const healthResponse = await getRAGHealth();
      setRagState((draft) => {
        draft.health.status = healthResponse.data?.status || null;
        draft.health.lastCheck = new Date().toISOString();
        draft.health.loading = false;
      });

      if (showSuccess) {
        successAlert('数据已刷新');
      }
    } catch (error) {
      console.error('获取RAG数据失败:', error);
      errorAlert('获取RAG数据失败', error instanceof Error ? error.message : '未知错误');
      setRagState((draft) => {
        draft.analytics.loading = false;
        draft.health.loading = false;
      });
    } finally {
      setLoading(false);
    }
  };

  // 快速搜索
  const handleQuickSearch = () => {
    if (!quickSearchQuery.trim()) {
      errorAlert('请输入搜索内容');
      return;
    }
    // 跳转到测试页面并携带搜索参数
    router.push(`/rag/test?query=${encodeURIComponent(quickSearchQuery)}`);
  };

  // 快捷键处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('quick-search-input')?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    fetchData();
    
    // 定时刷新数据（每30秒）
    const interval = setInterval(() => fetchData(), 30000);
    return () => clearInterval(interval);
  }, []);

  const analytics = ragState.analytics.analytics;
  const healthStatus = ragState.health.status;
  const lastUpdated = ragState.analytics.lastUpdated;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 页面标题和快速操作 */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">RAG 知识库</h1>
          <p className="text-muted-foreground">
            智能检索增强生成系统，让您的知识更智能
            {lastUpdated && (
              <span className="ml-2 text-xs">
                · 最后更新: {getRelativeTime(lastUpdated)}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <Activity className="mr-1 h-4 w-4" />
            系统状态: 
            <span className={`ml-1 font-medium ${healthStatus === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
              {healthStatus === 'healthy' ? '正常' : '异常'}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={loading}
          >
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
                  id="quick-search-input"
                  placeholder="快速搜索知识库... (Ctrl+K)"
                  value={quickSearchQuery}
                  onChange={(e) => setQuickSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleQuickSearch();
                    }
                  }}
                  className="pl-10 bg-white"
                />
              </div>
            </div>
            <Button onClick={handleQuickSearch} disabled={!quickSearchQuery.trim()}>
              <Zap className="mr-2 h-4 w-4" />
              智能搜索
            </Button>
            <Button variant="outline" onClick={() => router.push('/rag/manage')}>
              <Plus className="mr-2 h-4 w-4" />
              添加文档
            </Button>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Command className="h-3 w-3" />
            <span>使用 Ctrl+K 快速聚焦搜索框</span>
          </div>
        </CardContent>
      </Card>

      {/* 统计概览卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {analytics ? (
          <>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">总文档数</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">{analytics.totalDocuments}</div>
                <p className="text-xs text-muted-foreground">
                  知识库中的文档总数
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">已完成</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {analytics.documentsCompleted}
                </div>
                <p className="text-xs text-muted-foreground">
                  已完成向量化处理
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">处理中</CardTitle>
                  <Clock className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {analytics.documentsProcessing}
                </div>
                <p className="text-xs text-muted-foreground">
                  正在处理的文档
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">处理失败</CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {analytics.documentsFailed}
                </div>
                <p className="text-xs text-muted-foreground">
                  处理失败的文档
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          // 加载骨架屏
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 最近活动时间线 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            最近活动
          </CardTitle>
          <CardDescription>
            系统近期的处理活动和状态变化
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <Clock className="h-4 w-4 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">系统状态检查</p>
                <p className="text-xs text-muted-foreground">
                  最后检查时间: {ragState.health.lastCheck ? getRelativeTime(ragState.health.lastCheck) : '未知'}
                </p>
              </div>
              <StatusBadge status={healthStatus === 'healthy' ? DocumentStatus.COMPLETED : DocumentStatus.FAILED} size="sm" />
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
              <BarChart3 className="h-4 w-4 text-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">数据统计更新</p>
                <p className="text-xs text-muted-foreground">
                  最后更新: {lastUpdated ? getRelativeTime(lastUpdated) : '未知'}
                </p>
              </div>
              <span className="text-xs text-green-600 font-medium">已同步</span>
            </div>

            {analytics && analytics.documentsProcessing > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <TrendingUp className="h-4 w-4 text-yellow-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">文档处理中</p>
                  <p className="text-xs text-muted-foreground">
                    有 {analytics.documentsProcessing} 个文档正在处理
                  </p>
                </div>
                <StatusBadge status={DocumentStatus.PROCESSING} size="sm" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 功能导航 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center mb-4">
              <Database className="mr-3 h-8 w-8 text-blue-500" />
              <div>
                <CardTitle className="text-lg">数据管理</CardTitle>
                <CardDescription>
                  管理知识库文档，查看处理状态
                </CardDescription>
              </div>
            </div>
            <ul className="space-y-2 mb-4 text-sm text-muted-foreground">
              <li>• 上传和管理文档</li>
              <li>• 查看处理状态和进度</li>
              <li>• 文档分类和标签管理</li>
              <li>• 批量操作和数据导入导出</li>
            </ul>
            <Button 
              className="w-full"
              onClick={() => router.push('/rag/manage')}
            >
              <Database className="mr-2 h-4 w-4" />
              进入数据管理
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center mb-4">
              <Search className="mr-3 h-8 w-8 text-green-500" />
              <div>
                <CardTitle className="text-lg">RAG 测试</CardTitle>
                <CardDescription>
                  测试智能搜索和内容生成功能
                </CardDescription>
              </div>
            </div>
            <ul className="space-y-2 mb-4 text-sm text-muted-foreground">
              <li>• 智能语义搜索测试</li>
              <li>• 检索结果质量评估</li>
              <li>• 相似度阈值调优</li>
              <li>• 搜索历史和分析</li>
            </ul>
            <Button 
              className="w-full"
              onClick={() => router.push('/rag/test')}
            >
              <Search className="mr-2 h-4 w-4" />
              开始测试
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 系统架构信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            系统架构
          </CardTitle>
          <CardDescription>
            RAG 系统的核心技术组件和服务架构
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center p-4 rounded-lg border bg-blue-50">
              <div className="flex justify-center mb-3">
                <Cpu className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-lg font-bold text-blue-600">Embedding</div>
              <p className="text-sm text-muted-foreground mb-2">向量化模型</p>
              <p className="text-xs text-muted-foreground">
                OpenAI text-embedding-3-small
              </p>
            </div>
            
            <div className="text-center p-4 rounded-lg border bg-green-50">
              <div className="flex justify-center mb-3">
                <Database className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-lg font-bold text-green-600">Vector DB</div>
              <p className="text-sm text-muted-foreground mb-2">向量数据库</p>
              <p className="text-xs text-muted-foreground">
                Upstash Vector
              </p>
            </div>
            
            <div className="text-center p-4 rounded-lg border bg-purple-50">
              <div className="flex justify-center mb-3">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <div className="text-lg font-bold text-purple-600">Metadata</div>
              <p className="text-sm text-muted-foreground mb-2">元数据存储</p>
              <p className="text-xs text-muted-foreground">
                DynamoDB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 使用指南 */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            快速开始指南
          </CardTitle>
          <CardDescription>
            如果您是第一次使用RAG知识库，请按照以下步骤开始
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <h4 className="font-medium mb-1">上传文档</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  在数据管理中上传您的知识文档
                </p>
                <Button variant="outline" size="sm" onClick={() => router.push('/rag/manage')}>
                  开始上传
                </Button>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <h4 className="font-medium mb-1">等待处理</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  系统会自动进行向量化处理
                </p>
                <StatusBadge status={DocumentStatus.PROCESSING} size="sm" />
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <h4 className="font-medium mb-1">开始测试</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  在RAG测试中体验智能搜索
                </p>
                <Button variant="outline" size="sm" onClick={() => router.push('/rag/test')}>
                  开始测试
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}