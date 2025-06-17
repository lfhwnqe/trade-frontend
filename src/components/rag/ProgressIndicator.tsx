/**
 * RAG 处理进度指示器组件
 * 统一显示文档处理进度
 */

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { DocumentStatus } from '@/app/rag/types';
import { cn } from '@/lib/utils';

interface ProgressIndicatorProps {
  status: DocumentStatus;
  progress?: number;
  showLabel?: boolean;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animated?: boolean;
}

export function ProgressIndicator({ 
  status,
  progress = 0,
  showLabel = true,
  showIcon = true,
  size = 'md',
  className,
  animated = true
}: ProgressIndicatorProps) {
  // 根据状态确定进度值和样式
  const getProgressInfo = () => {
    switch (status) {
      case DocumentStatus.COMPLETED:
        return {
          value: 100,
          color: 'bg-green-500',
          icon: CheckCircle,
          iconColor: 'text-green-500',
          label: '已完成',
          showProgress: false,
        };
      case DocumentStatus.PROCESSING:
        return {
          value: Math.max(0, Math.min(100, progress)),
          color: 'bg-blue-500',
          icon: animated ? Loader2 : Clock,
          iconColor: 'text-blue-500',
          label: `处理中 ${Math.round(progress)}%`,
          showProgress: true,
        };
      case DocumentStatus.FAILED:
        return {
          value: 0,
          color: 'bg-red-500',
          icon: AlertCircle,
          iconColor: 'text-red-500',
          label: '处理失败',
          showProgress: false,
        };
      default:
        return {
          value: 0,
          color: 'bg-gray-500',
          icon: Clock,
          iconColor: 'text-gray-500',
          label: '等待处理',
          showProgress: false,
        };
    }
  };

  const progressInfo = getProgressInfo();
  const Icon = progressInfo.icon;

  const sizeConfig = {
    sm: {
      height: 'h-1',
      iconSize: 'h-3 w-3',
      textSize: 'text-xs',
    },
    md: {
      height: 'h-2',
      iconSize: 'h-4 w-4',
      textSize: 'text-sm',
    },
    lg: {
      height: 'h-3',
      iconSize: 'h-5 w-5',
      textSize: 'text-base',
    },
  };

  const config = sizeConfig[size];

  // 如果不显示进度条，只显示状态图标和文字
  if (!progressInfo.showProgress) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {showIcon && (
          <Icon className={cn(config.iconSize, progressInfo.iconColor)} />
        )}
        {showLabel && (
          <span className={cn(config.textSize, 'font-medium')}>
            {progressInfo.label}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {(showIcon || showLabel) && (
        <div className="flex items-center gap-2">
          {showIcon && (
            <Icon 
              className={cn(
                config.iconSize, 
                progressInfo.iconColor,
                animated && status === DocumentStatus.PROCESSING && 'animate-spin'
              )} 
            />
          )}
          {showLabel && (
            <span className={cn(config.textSize, 'font-medium')}>
              {progressInfo.label}
            </span>
          )}
        </div>
      )}
      
      <div className="w-full">
        <Progress 
          value={progressInfo.value}
          className={cn(config.height, 'w-full')}
          style={{
            '--progress-background': progressInfo.color,
          } as React.CSSProperties}
        />
      </div>
    </div>
  );
}

// 骨架屏组件，用于加载状态
export function ProgressIndicatorSkeleton({ 
  size = 'md',
  showLabel = true,
  showIcon = true,
  className 
}: {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showIcon?: boolean;
  className?: string;
}) {
  const sizeConfig = {
    sm: { height: 'h-1', iconSize: 'h-3 w-3' },
    md: { height: 'h-2', iconSize: 'h-4 w-4' },
    lg: { height: 'h-3', iconSize: 'h-5 w-5' },
  };

  const config = sizeConfig[size];

  return (
    <div className={cn('space-y-2', className)}>
      {(showIcon || showLabel) && (
        <div className="flex items-center gap-2">
          {showIcon && <Skeleton className={config.iconSize} />}
          {showLabel && <Skeleton className="h-4 w-20" />}
        </div>
      )}
      <Skeleton className={cn(config.height, 'w-full')} />
    </div>
  );
}

export default ProgressIndicator;