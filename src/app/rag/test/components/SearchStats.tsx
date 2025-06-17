"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3,
  Clock,
  Search,
  TrendingUp,
  Target,
  Timer
} from 'lucide-react';
import { SearchStats as SearchStatsType } from '../useRagTest';
import { getRelativeTime } from '../../atom';

interface SearchStatsProps {
  stats: SearchStatsType;
}

export function SearchStats({ stats }: SearchStatsProps) {
  // 格式化处理时间
  const formatProcessingTime = (time: number): string => {
    return time < 1000 ? `${time}ms` : `${(time / 1000).toFixed(2)}s`;
  };

  // 格式化相似度分数
  const formatScore = (score: number): string => {
    return (score * 100).toFixed(1) + '%';
  };

  // 获取性能等级
  const getPerformanceLevel = (avgTime: number): { level: string; color: string; description: string } => {
    if (avgTime < 500) {
      return { level: '优秀', color: 'bg-green-500', description: '响应非常快' };
    } else if (avgTime < 1000) {
      return { level: '良好', color: 'bg-blue-500', description: '响应较快' };
    } else if (avgTime < 2000) {
      return { level: '一般', color: 'bg-yellow-500', description: '响应正常' };
    } else {
      return { level: '较慢', color: 'bg-red-500', description: '需要优化' };
    }
  };

  // 获取质量等级
  const getQualityLevel = (maxScore: number): { level: string; color: string; description: string } => {
    if (maxScore >= 0.9) {
      return { level: '优秀', color: 'bg-green-500', description: '匹配度极高' };
    } else if (maxScore >= 0.8) {
      return { level: '良好', color: 'bg-blue-500', description: '匹配度较高' };
    } else if (maxScore >= 0.6) {
      return { level: '一般', color: 'bg-yellow-500', description: '匹配度中等' };
    } else {
      return { level: '较低', color: 'bg-red-500', description: '匹配度偏低' };
    }
  };

  const performanceLevel = getPerformanceLevel(stats.avgResponseTime);
  const qualityLevel = getQualityLevel(stats.maxSimilarityScore);

  if (stats.searchCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            搜索统计
          </CardTitle>
          <CardDescription>
            本次会话的搜索统计信息
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 mx-auto opacity-50 mb-2" />
            <div className="text-lg font-medium mb-2">暂无统计数据</div>
            <div className="text-sm text-muted-foreground">
              执行搜索后，统计信息将显示在这里
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          搜索统计
        </CardTitle>
        <CardDescription>
          本次会话的搜索统计信息
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 核心指标 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <Search className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{stats.searchCount}</div>
            <div className="text-sm text-muted-foreground">搜索次数</div>
          </div>
          
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <Clock className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">
              {formatProcessingTime(stats.avgResponseTime)}
            </div>
            <div className="text-sm text-muted-foreground">平均响应</div>
          </div>
          
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">
              {formatScore(stats.maxSimilarityScore)}
            </div>
            <div className="text-sm text-muted-foreground">最高相似度</div>
          </div>
          
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <Target className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">
              {formatScore(stats.minSimilarityScore)}
            </div>
            <div className="text-sm text-muted-foreground">最低相似度</div>
          </div>
        </div>

        {/* 性能分析 */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Timer className="h-4 w-4" />
            性能分析
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 响应性能 */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">响应性能</span>
                <Badge className={`${performanceLevel.color} text-white`}>
                  {performanceLevel.level}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {performanceLevel.description}
              </div>
              <div className="mt-2 text-sm">
                平均响应时间: {formatProcessingTime(stats.avgResponseTime)}
              </div>
            </div>
            
            {/* 匹配质量 */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">匹配质量</span>
                <Badge className={`${qualityLevel.color} text-white`}>
                  {qualityLevel.level}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {qualityLevel.description}
              </div>
              <div className="mt-2 text-sm">
                分数范围: {formatScore(stats.minSimilarityScore)} - {formatScore(stats.maxSimilarityScore)}
              </div>
            </div>
          </div>
        </div>

        {/* 详细统计 */}
        <div className="space-y-3">
          <h4 className="font-medium">详细统计</h4>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded">
              <span>总搜索次数</span>
              <span className="font-mono">{stats.searchCount} 次</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded">
              <span>平均响应时间</span>
              <span className="font-mono">{formatProcessingTime(stats.avgResponseTime)}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded">
              <span>相似度得分范围</span>
              <span className="font-mono">
                {formatScore(stats.minSimilarityScore)} ~ {formatScore(stats.maxSimilarityScore)}
              </span>
            </div>
            
            {stats.lastSearchTime && (
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded">
                <span>最后搜索时间</span>
                <span className="font-mono">
                  {getRelativeTime(stats.lastSearchTime)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 性能建议 */}
        {stats.searchCount >= 3 && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              优化建议
            </h4>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              {stats.avgResponseTime > 2000 && (
                <div>• 响应时间较长，建议减少搜索结果数量或提高相似度阈值</div>
              )}
              {stats.maxSimilarityScore < 0.6 && (
                <div>• 匹配度偏低，建议调整查询关键词或降低相似度阈值</div>
              )}
              {stats.maxSimilarityScore >= 0.9 && (
                <div>• 匹配度很高，可以适当提高相似度阈值以获得更精确的结果</div>
              )}
              {stats.avgResponseTime < 500 && stats.maxSimilarityScore >= 0.8 && (
                <div>• 当前配置表现优秀，可以考虑保存为预设配置</div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}