"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock,
  FileText,
  RotateCcw,
  Trash2,
  Search
} from 'lucide-react';
import { RetrievalResultDto } from '../../types';
import { getRelativeTime } from '../../atom';

interface SearchHistoryProps {
  history: Array<{
    query: string;
    result: RetrievalResultDto;
    timestamp: string;
  }>;
  onSearchFromHistory: (item: { query: string; result: RetrievalResultDto }) => void;
  onClearHistory: () => void;
}

export function SearchHistory({ 
  history, 
  onSearchFromHistory, 
  onClearHistory 
}: SearchHistoryProps) {
  // 格式化处理时间
  const formatProcessingTime = (time: number): string => {
    return time < 1000 ? `${time}ms` : `${(time / 1000).toFixed(2)}s`;
  };

  // 格式化相似度分数
  const formatScore = (score: number): string => {
    return (score * 100).toFixed(1) + '%';
  };

  // 获取分数颜色
  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            搜索历史
          </CardTitle>
          <CardDescription>
            暂无搜索历史记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto opacity-50 mb-2" />
            <div className="text-lg font-medium mb-2">暂无历史记录</div>
            <div className="text-sm text-muted-foreground">
              执行搜索后，历史记录将显示在这里
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              搜索历史
            </CardTitle>
            <CardDescription>
              最近的 {history.length} 次搜索记录
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearHistory}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-1 h-4 w-4" />
            清空历史
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {history.map((item, index) => {
            const maxScore = item.result.results.length > 0 
              ? Math.max(...item.result.results.map(r => r.score))
              : 0;
            
            return (
              <Card key={index} className="border border-muted hover:border-primary/20 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* 查询文本 */}
                      <div className="mb-2">
                        <div className="font-medium truncate" title={item.query}>
                          &ldquo;{item.query}&rdquo;
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getRelativeTime(item.timestamp)}
                        </div>
                      </div>
                      
                      {/* 搜索结果统计 */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          <span>{item.result.totalResults} 个结果</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatProcessingTime(item.result.processingTime)}</span>
                        </div>
                        
                        {maxScore > 0 && (
                          <Badge 
                            variant="secondary" 
                            className={getScoreColor(maxScore)}
                          >
                            最高 {formatScore(maxScore)}
                          </Badge>
                        )}
                      </div>
                      
                      {/* 文档类型统计 */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {Array.from(new Set(item.result.results.map(r => r.metadata.documentType)))
                          .slice(0, 3)
                          .map(type => (
                            <Badge key={type} variant="outline" className="text-xs">
                              {type}
                            </Badge>
                          ))
                        }
                        {Array.from(new Set(item.result.results.map(r => r.metadata.documentType))).length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{Array.from(new Set(item.result.results.map(r => r.metadata.documentType))).length - 3} 更多
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSearchFromHistory(item)}
                        className="whitespace-nowrap"
                      >
                        <Search className="mr-1 h-3 w-3" />
                        重新搜索
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSearchFromHistory(item)}
                        className="whitespace-nowrap text-xs"
                      >
                        <RotateCcw className="mr-1 h-3 w-3" />
                        查看结果
                      </Button>
                    </div>
                  </div>
                  
                  {/* 预览最佳结果 */}
                  {item.result.results.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-muted">
                      <div className="text-xs text-muted-foreground mb-1">
                        最佳匹配 ({formatScore(item.result.results[0].score)}):
                      </div>
                      <div className="text-sm bg-muted/50 rounded p-2 truncate">
                        {item.result.results[0].content.substring(0, 100)}
                        {item.result.results[0].content.length > 100 && '...'}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* 历史记录统计 */}
        <div className="mt-4 pt-4 border-t border-muted">
          <div className="text-xs text-muted-foreground text-center">
            共 {history.length} 条历史记录
            {history.length >= 20 && ' (最多保留20条)'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}