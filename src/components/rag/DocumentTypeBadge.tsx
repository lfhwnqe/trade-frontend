/**
 * RAG 文档类型徽章组件
 * 统一显示文档类型
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  TrendingUp, 
  BookOpen, 
  BarChart3,
  File
} from 'lucide-react';
import { DocumentType } from '@/app/rag/types';
import { getDocumentTypeText } from '@/app/rag/request';
import { cn } from '@/lib/utils';

interface DocumentTypeBadgeProps {
  type: DocumentType;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const typeConfig = {
  [DocumentType.TRADE]: {
    icon: TrendingUp,
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    iconClassName: 'text-blue-500',
  },
  [DocumentType.KNOWLEDGE]: {
    icon: BookOpen,
    className: 'bg-green-100 text-green-800 border-green-200',
    iconClassName: 'text-green-500',
  },
  [DocumentType.MANUAL]: {
    icon: FileText,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    iconClassName: 'text-yellow-600',
  },
  [DocumentType.REPORT]: {
    icon: BarChart3,
    className: 'bg-purple-100 text-purple-800 border-purple-200',
    iconClassName: 'text-purple-500',
  },
};

const sizeConfig = {
  sm: 'text-xs px-2 py-1 h-6',
  md: 'text-sm px-2.5 py-1 h-7',
  lg: 'text-sm px-3 py-1.5 h-8',
};

export function DocumentTypeBadge({ 
  type, 
  showIcon = true, 
  size = 'md',
  className 
}: DocumentTypeBadgeProps) {
  const config = typeConfig[type] || {
    icon: File,
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
      <span>{getDocumentTypeText(type)}</span>
    </Badge>
  );
}

export default DocumentTypeBadge;