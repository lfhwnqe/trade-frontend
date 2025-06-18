"use client";

import { useState } from 'react';
import { useAlert } from '@/components/common/alert';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { simpleTest } from '../request';
import type { SimpleTestResponseDto, SimpleTestQueryDto, UsageScenario } from '../types';

// 使用场景示例
const usageScenarios: UsageScenario[] = [
  {
    id: 'search-only',
    title: '仅搜索测试',
    description: '测试向量搜索功能，基于已存储的向量数据进行相似度搜索',
    queryExample: '什么是机器学习？',
    category: 'search'
  },
  {
    id: 'vectorize-only',
    title: '仅向量化测试',
    description: '测试文本向量化功能，将文本转换为向量并存储到Upstash',
    queryExample: '向量化测试',
    contentExample: '这是一段关于深度学习的技术文档。深度学习是机器学习的一个分支，它基于人工神经网络，特别是深层神经网络来学习数据表示。',
    category: 'vectorize'
  },
  {
    id: 'both',
    title: '完整流程测试',
    description: '同时测试向量化存储和搜索功能',
    queryExample: '深度学习的基本概念',
    contentExample: '深度学习（Deep Learning）是机器学习的一个子集，它使用多层神经网络来学习数据的复杂模式和表示。通过模拟人脑神经元的工作方式，深度学习能够自动学习特征，无需人工特征工程。',
    category: 'both'
  }
];

export default function RAGSimpleTestPage() {
  const [showAlert] = useAlert();
  const [query, setQuery] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimpleTestResponseDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('manual');

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim() && !content.trim()) {
      showAlert('请至少输入查询文本或文本内容', 'error');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const requestData: Partial<SimpleTestQueryDto> = {};
      if (query.trim()) {
        requestData.query = query.trim();
      } else {
        requestData.query = '向量化测试'; // 如果只有content，提供默认query
      }
      if (content.trim()) {
        requestData.content = content.trim();
      }

      const response = await simpleTest(requestData);
      setResult(response.data || null);
      
      // 根据操作类型显示不同的成功消息
      let successMessage = 'RAG测试成功';
      if (requestData.content && requestData.query !== '向量化测试') {
        successMessage = '向量化存储和搜索测试完成';
      } else if (requestData.content) {
        successMessage = '文本向量化存储成功';
      } else {
        successMessage = '向量搜索测试完成';
      }
      
      showAlert(successMessage, 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '测试失败';
      setError(errorMessage);
      showAlert(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 应用使用场景
  const applyScenario = (scenario: UsageScenario) => {
    setQuery(scenario.queryExample);
    setContent(scenario.contentExample || '');
    setActiveTab('manual');
  };

  // 复制结果到剪贴板
  const handleCopyResult = async () => {
    if (!result) return;
    
    try {
      const resultText = JSON.stringify(result, null, 2);
      await navigator.clipboard.writeText(resultText);
      showAlert('结果已复制到剪贴板', 'success');
    } catch {
      showAlert('复制失败', 'error');
    }
  };

  // 清空结果
  const handleClear = () => {
    setQuery('');
    setContent('');
    setResult(null);
    setError(null);
  };

  // 获取测试类型标识
  const getTestType = () => {
    const hasQuery = query.trim().length > 0 && query.trim() !== '向量化测试';
    const hasContent = content.trim().length > 0;
    
    if (hasQuery && hasContent) return 'both';
    if (hasContent) return 'vectorize';
    return 'search';
  };

  return (
    <div className="container mx-auto py-8 max-w-5xl space-y-8">
      {/* 页面标题 */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">RAG 简单测试</h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          测试RAG系统的向量化存储和搜索功能。支持单独的搜索测试、向量化测试，或完整流程测试
        </p>
      </div>

      {/* 测试表单 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scenarios">使用场景</TabsTrigger>
          <TabsTrigger value="manual">手动输入</TabsTrigger>
        </TabsList>

        <TabsContent value="scenarios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>快速测试场景</CardTitle>
              <CardDescription>
                选择预设的测试场景，快速体验不同的RAG功能
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {usageScenarios.map((scenario) => (
                  <Card key={scenario.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => applyScenario(scenario)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{scenario.title}</CardTitle>
                        <Badge variant={scenario.category === 'search' ? 'secondary' : scenario.category === 'vectorize' ? 'destructive' : 'default'}>
                          {scenario.category === 'search' ? '搜索' : scenario.category === 'vectorize' ? '向量化' : '完整'}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm">
                        {scenario.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="font-medium">查询示例：</span>
                          <p className="text-muted-foreground">{scenario.queryExample}</p>
                        </div>
                        {scenario.contentExample && (
                          <div>
                            <span className="font-medium">内容示例：</span>
                            <p className="text-muted-foreground line-clamp-2">{scenario.contentExample}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>手动测试输入</CardTitle>
                  <CardDescription>
                    自定义输入内容进行RAG功能测试
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {getTestType() === 'search' ? '搜索测试' : getTestType() === 'vectorize' ? '向量化测试' : '完整测试'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 查询输入区域 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <label htmlFor="query" className="text-sm font-medium">
                      搜索查询
                    </label>
                    <Badge variant="secondary" className="text-xs">可选</Badge>
                  </div>
                  <Textarea
                    id="query"
                    name="query"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="输入您想要搜索的查询内容，例如：什么是机器学习？或 深度学习的基本概念"
                    className="min-h-[100px]"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    🔍 用于在已存储的向量数据中进行相似度搜索，找到相关的文档内容
                  </p>
                </div>

                <Separator />

                {/* 内容输入区域 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <label htmlFor="content" className="text-sm font-medium">
                      文本内容
                    </label>
                    <Badge variant="secondary" className="text-xs">可选</Badge>
                  </div>
                  <Textarea
                    id="content"
                    name="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="输入要向量化并存储到Upstash的文本内容，例如：这是一段关于机器学习的知识文档..."
                    className="min-h-[120px]"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    📤 此内容将被向量化处理并存储到Upstash向量数据库，用于后续搜索
                  </p>
                </div>

                {/* 使用说明 */}
                <div className="bg-muted/50 p-4 rounded-md space-y-2">
                  <h4 className="text-sm font-medium">使用说明</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• <strong>仅查询：</strong>在已存储的向量中搜索相关内容</li>
                    <li>• <strong>仅内容：</strong>将文本向量化并存储到数据库</li>
                    <li>• <strong>两者都有：</strong>先存储新内容，再进行搜索测试</li>
                    <li>• 两个输入框都是可选的，但至少需要填写一个</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="submit" 
                    disabled={loading || (!query.trim() && !content.trim())}
                    className="flex-1"
                  >
                    {loading ? '测试中...' : '开始测试'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleClear}
                    disabled={loading}
                  >
                    清空
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 错误显示 */}
      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">测试失败</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* 测试结果 */}
      {result && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>测试结果</CardTitle>
              <CardDescription>
                测试时间: {new Date(result.timestamp).toLocaleString('zh-CN')}
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleCopyResult}
            >
              复制结果
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 基本信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">查询内容</h4>
                <p className="text-sm bg-muted p-3 rounded-md">{result.query}</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">系统状态</h4>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex h-2 w-2 rounded-full ${
                    result.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm capitalize">{result.status === 'healthy' ? '正常' : '异常'}</span>
                </div>
              </div>
            </div>

            {/* 响应消息 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">系统响应</h4>
              <p className="text-sm bg-muted p-3 rounded-md">{result.message}</p>
            </div>

            {/* 向量化结果 */}
            {result.vectorization && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                  📤 向量化处理结果
                  <Badge className="ml-2" variant={result.vectorization.storageStatus === 'success' ? 'default' : 'destructive'}>
                    {result.vectorization.storageStatus === 'success' ? '成功' : '失败'}
                  </Badge>
                </h4>
                <div className="bg-muted p-4 rounded-md space-y-4">
                  {/* 模型和向量信息 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-1">
                      <span className="font-medium text-muted-foreground">向量化模型</span>
                      <p>{result.vectorization.model}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="font-medium text-muted-foreground">向量ID</span>
                      <p className="font-mono text-xs break-all">{result.vectorization.vectorId || '无'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="font-medium text-muted-foreground">处理时间</span>
                      <p>{result.vectorization.processingTimeMs}ms</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Token使用情况 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <span className="font-medium text-muted-foreground">输入Token数</span>
                      <p>{result.vectorization.tokenUsage.inputTokens}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="font-medium text-muted-foreground">向量维度</span>
                      <p>{result.vectorization.tokenUsage.embeddingDimensions}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* 文本分块信息 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-1">
                      <span className="font-medium text-muted-foreground">文本块数量</span>
                      <p>{result.vectorization.chunkInfo.chunkCount}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="font-medium text-muted-foreground">总字符数</span>
                      <p>{result.vectorization.chunkInfo.totalCharacters}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="font-medium text-muted-foreground">平均块大小</span>
                      <p>{result.vectorization.chunkInfo.averageChunkSize}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 搜索结果 */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                🔍 模拟搜索结果 ({result.mockResults.length} 条)
              </h4>
              <div className="space-y-3">
                {result.mockResults.map((mockResult, index) => (
                  <div
                    key={index}
                    className="bg-muted p-4 rounded-md border-l-4 border-primary"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm flex-1 leading-relaxed">{mockResult}</p>
                      <Badge variant="outline" className="text-xs shrink-0">
                        #{index + 1}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 完整JSON响应 */}
            <details className="space-y-2">
              <summary className="text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground">
                📄 查看完整JSON响应
              </summary>
              <pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-60 border">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}

      {/* 功能说明 */}
      <Card>
        <CardHeader>
          <CardTitle>功能说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                🔍 向量搜索功能
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 在已存储的向量数据中进行相似度搜索</li>
                <li>• 基于语义理解，而非关键词匹配</li>
                <li>• 返回最相关的文档片段</li>
                <li>• 支持多语言查询</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                📤 文本向量化功能
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 将文本转换为高维向量表示</li>
                <li>• 使用 OpenAI text-embedding-3-small 模型</li>
                <li>• 自动文本分块和预处理</li>
                <li>• 存储到 Upstash 向量数据库</li>
              </ul>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h4 className="font-medium">系统特性</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>无需登录：</strong>这是一个测试接口，不需要用户认证</li>
              <li>• <strong>实时处理：</strong>支持即时的向量化和搜索操作</li>
              <li>• <strong>智能分块：</strong>自动将长文本分割为适合的块大小</li>
              <li>• <strong>性能监控：</strong>显示处理时间、Token使用量等指标</li>
              <li>• <strong>调试友好：</strong>提供完整的处理过程信息</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}