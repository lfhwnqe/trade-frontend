/**
 * RAG 文档状态徽章组件
 * 统一显示文档处理状态
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Trash2,
  FileText
} from 'lucide-react';
import { DocumentStatus } from '@/app/rag/types';
import { getDocumentStatusText } from '@/app/rag/request';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: DocumentStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig = {
  [DocumentStatus.COMPLETED]: {
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800 border-green-200',
    iconClassName: 'text-green-500',
  },
  [DocumentStatus.PROCESSING]: {
    icon: Clock,
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    iconClassName: 'text-blue-500',
  },
  [DocumentStatus.FAILED]: {
    icon: AlertCircle,
    className: 'bg-red-100 text-red-800 border-red-200',
    iconClassName: 'text-red-500',
  },
  [DocumentStatus.DELETED]: {
    icon: Trash2,
    className: 'bg-gray-100 text-gray-800 border-gray-200',
    iconClassName: 'text-gray-500',
  },
};

const sizeConfig = {
  sm: 'text-xs px-2 py-1 h-6',
  md: 'text-sm px-2.5 py-1 h-7',
  lg: 'text-sm px-3 py-1.5 h-8',
};

export function StatusBadge({ 
  status, 
  showIcon = true, 
  size = 'md',
  className 
}: StatusBadgeProps) {
  const config = statusConfig[status] || {
    icon: FileText,
    className: 'bg-gray-100 text-gray-800 border-gray-200',
    iconClassName: 'text-gray-500',
  };

  const Icon = config.icon;

  return (
    <Badge 
      variant="outline"
      className={cn(
        config.className,
        sizeConfig[size],
        'font-medium border inline-flex items-center gap-1.5',
        className
      )}
    >
      {showIcon && (
        <Icon className={cn(
          config.iconClassName,
          size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5'
        )} />
      )}
      <span>{getDocumentStatusText(status)}</span>
    </Badge>
  );
}

export default StatusBadge;