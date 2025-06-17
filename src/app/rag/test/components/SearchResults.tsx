"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock,
  FileText,
  Star,
  TrendingUp,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { RetrievalResultDto } from '../../types';
import { useState } from 'react';

interface SearchResultsProps {
  searchResult: RetrievalResultDto;
  onCopyContent?: (content: string) => void;
}

export function SearchResults({ searchResult, onCopyContent }: SearchResultsProps) {
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
  const [showAllMetadata, setShowAllMetadata] = useState(false);

  // 格式化相似度分数
  const formatScore = (score: number): string => {
    return (score * 100).toFixed(1) + '%';
  };

  // 格式化处理时间
  const formatProcessingTime = (time: number): string => {
    return time < 1000 ? `${time}ms` : `${(time / 1000).toFixed(2)}s`;
  };

  // 切换结果展开状态
  const toggleResultExpansion = (resultId: string) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(resultId)) {
      newExpanded.delete(resultId);
    } else {
      newExpanded.add(resultId);
    }
    setExpandedResults(newExpanded);
  };

  // 复制内容到剪贴板
  const handleCopyContent = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      onCopyContent?.(content);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  // 高亮查询关键词
  const highlightKeywords = (text: string, query: string): string => {
    if (!query.trim()) return text;
    
    const keywords = query.trim().split(/\s+/);
    let highlightedText = text;
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`(${keyword})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
    });
    
    return highlightedText;
  };

  // 获取分数颜色
  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  // 获取分数进度条颜色
  const getProgressColor = (score: number): string => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            搜索结果
          </CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              {searchResult.totalResults} 个结果
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatProcessingTime(searchResult.processingTime)}
            </span>
          </div>
        </div>
        <CardDescription>
          查询: "<span className="font-medium">{searchResult.query}</span>"
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 整体统计 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold">{searchResult.totalResults}</div>
            <div className="text-sm text-muted-foreground">匹配结果</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {searchResult.results.length > 0 
                ? formatScore(Math.max(...searchResult.results.map(r => r.score)))
                : '0%'
              }
            </div>
            <div className="text-sm text-muted-foreground">最高相似度</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {formatProcessingTime(searchResult.processingTime)}
            </div>
            <div className="text-sm text-muted-foreground">处理时间</div>
          </div>
        </div>

        {/* 搜索结果列表 */}
        <div className="space-y-3">
          {searchResult.results.map((result, index) => {
            const isExpanded = expandedResults.has(result.id);
            const scorePercentage = result.score * 100;
            
            return (
              <Card key={result.id} className="border-l-4 border-l-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {/* 排名 */}
                      <div className="flex items-center gap-1">
                        {index < 3 && (
                          <Star className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className="font-mono text-sm">#{index + 1}</span>
                      </div>
                      
                      {/* 文档信息 */}
                      <div>
                        <div className="font-medium">{result.metadata.title}</div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline">
                            {result.metadata.documentType}
                          </Badge>
                          <span>块 {result.metadata.chunkIndex}</span>
                          <span>{result.metadata.tokenCount} tokens</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 相似度分数 */}
                    <div className="text-right">
                      <div className={`text-lg font-mono font-bold ${getScoreColor(result.score)}`}>
                        {formatScore(result.score)}
                      </div>
                      <div className="w-20">
                        <Progress 
                          value={scorePercentage} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {/* 内容预览 */}
                  <div className="space-y-3">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="text-sm leading-relaxed">
                        {isExpanded ? (
                          <div 
                            dangerouslySetInnerHTML={{
                              __html: highlightKeywords(result.content, searchResult.query)
                            }}
                          />
                        ) : (
                          <div 
                            dangerouslySetInnerHTML={{
                              __html: highlightKeywords(
                                result.content.length > 200 
                                  ? result.content.substring(0, 200) + '...'
                                  : result.content,
                                searchResult.query
                              )
                            }}
                          />
                        )}
                      </div>
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleResultExpansion(result.id)}
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="mr-1 h-3 w-3" />
                              收起
                            </>
                          ) : (
                            <>
                              <ChevronDown className="mr-1 h-3 w-3" />
                              展开
                            </>
                          )}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyContent(result.content)}
                        >
                          <Copy className="mr-1 h-3 w-3" />
                          复制
                        </Button>
                      </div>
                      
                      {/* 元数据信息 */}
                      {isExpanded && (
                        <div className="text-xs text-muted-foreground">
                          <div>文档ID: {result.metadata.documentId}</div>
                          <div>更新时间: {new Date(result.metadata.timestamp).toLocaleString('zh-CN')}</div>
                          {result.metadata.tags && result.metadata.tags.length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <span>标签:</span>
                              {result.metadata.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 上下文预览 */}
        {searchResult.context && (
          <Card className="border-2 border-dashed border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">构建的上下文</CardTitle>
              <CardDescription>
                基于搜索结果组合的上下文信息
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 rounded-lg p-4">
                <pre className="text-sm leading-relaxed whitespace-pre-wrap font-mono">
                  {searchResult.context}
                </pre>
              </div>
              <div className="mt-3 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyContent(searchResult.context)}
                >
                  <Copy className="mr-1 h-3 w-3" />
                  复制上下文
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 空结果状态 */}
        {searchResult.results.length === 0 && (
          <div className="text-center py-8">
            <div className="text-muted-foreground mb-2">
              <FileText className="h-12 w-12 mx-auto opacity-50" />
            </div>
            <div className="text-lg font-medium">未找到匹配结果</div>
            <div className="text-sm text-muted-foreground">
              尝试调整搜索关键词或降低相似度阈值
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}