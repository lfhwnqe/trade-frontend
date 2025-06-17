"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Copy,
  Download,
  FileText,
  MessageSquare,
  Code
} from 'lucide-react';
import { RetrievalResultDto } from '../../types';
import { useState } from 'react';
import { useAlert } from '@/components/common/alert';

interface ContextPreviewProps {
  searchResult: RetrievalResultDto | null;
}

export function ContextPreview({ searchResult }: ContextPreviewProps) {
  const [showAlert] = useAlert();
  const [activeTab, setActiveTab] = useState('formatted');

  // 复制到剪贴板
  const copyToClipboard = async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content);
      showAlert(`${type}已复制到剪贴板`, 'success');
    } catch (error) {
      console.error('复制失败:', error);
      showAlert('复制失败', 'error');
    }
  };

  // 下载文件
  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showAlert(`${type}已下载`, 'success');
  };

  // 生成格式化的上下文
  const generateFormattedContext = (): string => {
    if (!searchResult?.results?.length) return '';

    const sections = searchResult.results.map((result, index) => {
      return `## 片段 ${index + 1} (相似度: ${(result.score * 100).toFixed(1)}%)

**文档**: ${result.metadata.title}
**类型**: ${result.metadata.documentType}
**块索引**: ${result.metadata.chunkIndex}
**Token数**: ${result.metadata.tokenCount}

${result.content}

---`;
    });

    return `# RAG 搜索上下文

**查询**: "${searchResult.query}"
**总结果数**: ${searchResult.totalResults}
**处理时间**: ${searchResult.processingTime}ms
**生成时间**: ${new Date().toLocaleString('zh-CN')}

${sections.join('\n\n')}

## 构建的上下文

${searchResult.context || '暂无构建的上下文'}`;
  };

  // 生成JSON格式的上下文
  const generateJSONContext = (): string => {
    if (!searchResult) return '';

    const contextData = {
      query: searchResult.query,
      totalResults: searchResult.totalResults,
      processingTime: searchResult.processingTime,
      generatedAt: new Date().toISOString(),
      results: searchResult.results.map((result, index) => ({
        rank: index + 1,
        id: result.id,
        score: result.score,
        content: result.content,
        metadata: result.metadata
      })),
      context: searchResult.context
    };

    return JSON.stringify(contextData, null, 2);
  };

  // 生成对话格式的上下文
  const generateChatContext = (): string => {
    if (!searchResult?.results?.length) return '';

    const contextParts = searchResult.results
      .slice(0, 5) // 取前5个最相关的结果
      .map(result => result.content)
      .join('\n\n');

    return `请基于以下上下文信息回答用户的问题：

用户问题：${searchResult.query}

相关上下文：
${contextParts}

请根据上述上下文提供准确、有用的回答。如果上下文中没有足够信息回答问题，请说明需要更多信息。`;
  };

  if (!searchResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            上下文预览
          </CardTitle>
          <CardDescription>
            基于搜索结果构建的上下文信息
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto opacity-50 mb-2" />
            <div className="text-lg font-medium mb-2">暂无上下文</div>
            <div className="text-sm text-muted-foreground">
              执行搜索后，上下文预览将显示在这里
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formattedContext = generateFormattedContext();
  const jsonContext = generateJSONContext();
  const chatContext = generateChatContext();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              上下文预览
            </CardTitle>
            <CardDescription>
              基于 {searchResult.totalResults} 个搜索结果构建的上下文
            </CardDescription>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (activeTab === 'formatted') copyToClipboard(formattedContext, '格式化上下文');
                else if (activeTab === 'json') copyToClipboard(jsonContext, 'JSON上下文');
                else if (activeTab === 'chat') copyToClipboard(chatContext, '对话上下文');
              }}
            >
              <Copy className="mr-1 h-4 w-4" />
              复制
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
                if (activeTab === 'formatted') {
                  downloadFile(formattedContext, `rag-context-${timestamp}.md`, '格式化上下文');
                } else if (activeTab === 'json') {
                  downloadFile(jsonContext, `rag-context-${timestamp}.json`, 'JSON上下文');
                } else if (activeTab === 'chat') {
                  downloadFile(chatContext, `rag-chat-context-${timestamp}.txt`, '对话上下文');
                }
              }}
            >
              <Download className="mr-1 h-4 w-4" />
              下载
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="formatted" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              格式化
            </TabsTrigger>
            <TabsTrigger value="json" className="flex items-center gap-1">
              <Code className="h-4 w-4" />
              JSON
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              对话模版
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="formatted" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Markdown 格式</Badge>
                <span className="text-sm text-muted-foreground">
                  {formattedContext.length} 字符
                </span>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm leading-relaxed whitespace-pre-wrap">
                  {formattedContext}
                </pre>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="json" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">JSON 格式</Badge>
                <span className="text-sm text-muted-foreground">
                  {jsonContext.length} 字符
                </span>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm leading-relaxed font-mono">
                  {jsonContext}
                </pre>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="chat" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">对话模版</Badge>
                <span className="text-sm text-muted-foreground">
                  {chatContext.length} 字符
                </span>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm leading-relaxed whitespace-pre-wrap">
                  {chatContext}
                </pre>
              </div>
              <div className="text-xs text-muted-foreground p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                <strong>使用说明：</strong>此模版可直接复制到AI助手中，包含了用户问题和相关上下文，便于获得基于检索内容的准确回答。
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* 统计信息 */}
        <div className="mt-6 pt-4 border-t border-muted">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold">{searchResult.results.length}</div>
              <div className="text-xs text-muted-foreground">检索片段</div>
            </div>
            <div>
              <div className="text-lg font-semibold">
                {searchResult.results.reduce((sum, r) => sum + r.metadata.tokenCount, 0)}
              </div>
              <div className="text-xs text-muted-foreground">总Token数</div>
            </div>
            <div>
              <div className="text-lg font-semibold">
                {(searchResult.results.reduce((sum, r) => sum + r.score, 0) / searchResult.results.length * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">平均相似度</div>
            </div>
            <div>
              <div className="text-lg font-semibold">
                {Array.from(new Set(searchResult.results.map(r => r.metadata.documentType))).length}
              </div>
              <div className="text-xs text-muted-foreground">文档类型数</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}