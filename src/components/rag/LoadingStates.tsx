"use client";

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Database, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

// 通用加载组件
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const sizeConfig = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Loader2 className={cn('animate-spin', sizeConfig[size])} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

// 页面级加载组件
export function PageLoading({ title = '加载中...', description }: { title?: string; description?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <div>
          <h3 className="text-lg font-medium">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// 卡片加载骨架
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
      </CardHeader>
    </Card>
  );
}

// 表格加载骨架
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* 表头 */}
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-8 flex-1" />
        ))}
      </div>
      
      {/* 表格行 */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-12 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// 文档列表加载骨架
export function DocumentListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// 搜索结果加载骨架
export function SearchResultsSkeleton() {
  return (
    <div className="space-y-6">
      {/* 搜索统计 */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-6 w-32" />
      </div>
      
      {/* 搜索结果 */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-16 w-full" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// 统计卡片加载骨架
export function StatisticsCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

// 数据加载状态组件
interface DataLoadingStateProps {
  isLoading: boolean;
  error?: Error | null;
  isEmpty?: boolean;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  retryHandler?: () => void;
}

export function DataLoadingState({
  isLoading,
  error,
  isEmpty,
  children,
  loadingComponent,
  errorComponent,
  emptyComponent,
  retryHandler
}: DataLoadingStateProps) {
  if (isLoading) {
    return loadingComponent || <PageLoading />;
  }

  if (error) {
    return errorComponent || (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">
          <FileText className="h-12 w-12 mx-auto mb-2" />
          <p className="font-medium">加载失败</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
        {retryHandler && (
          <button
            onClick={retryHandler}
            className="text-blue-600 hover:text-blue-700 text-sm underline"
          >
            重试
          </button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return emptyComponent || (
      <div className="text-center py-8">
        <Database className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
        <p className="font-medium text-muted-foreground">暂无数据</p>
        <p className="text-sm text-muted-foreground">还没有任何内容</p>
      </div>
    );
  }

  return <>{children}</>;
}

// 内联加载指示器
interface InlineLoadingProps {
  isLoading: boolean;
  text?: string;
  size?: 'sm' | 'md';
}

export function InlineLoading({ isLoading, text = '加载中...', size = 'sm' }: InlineLoadingProps) {
  if (!isLoading) return null;

  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Loader2 className={cn('animate-spin', size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />
      <span className={cn('text-xs', size === 'md' && 'text-sm')}>{text}</span>
    </div>
  );
}

// 按钮加载状态
interface ButtonLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
}

export function ButtonLoading({ isLoading, children, loadingText }: ButtonLoadingProps) {
  if (isLoading) {
    return (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {loadingText || '处理中...'}
      </>
    );
  }

  return <>{children}</>;
}

export default {
  LoadingSpinner,
  PageLoading,
  CardSkeleton,
  TableSkeleton,
  DocumentListSkeleton,
  SearchResultsSkeleton,
  StatisticsCardsSkeleton,
  DataLoadingState,
  InlineLoading,
  ButtonLoading,
};