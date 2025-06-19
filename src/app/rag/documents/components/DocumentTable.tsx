import { useMemo, useState } from 'react';
import { ColumnDef, SortingState, RowSelectionState } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/rag';
import { 
  ArrowUpDown, 
  Eye, 
  FileText,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { DocumentEntity, DocumentStatus } from '../../types';
import {
  getDocumentTypeText,
  formatFileSize,
  formatProcessingProgress
} from '../../request';

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface DocumentTableProps {
  documents: DocumentEntity[];
  loading: boolean;
  pagination: PaginationState;
  onPageChange: (page: number, pageSize: number) => void;
  onViewDetail: (document: DocumentEntity) => void;
}

export function DocumentTable({ 
  documents, 
  loading, 
  pagination, 
  onPageChange, 
  onViewDetail 
}: DocumentTableProps) {
  
  // 状态图标组件
  const StatusIcon = ({ status }: { status: DocumentStatus }) => {
    switch (status) {
      case DocumentStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case DocumentStatus.PROCESSING:
        return <Clock className="h-4 w-4 text-blue-500" />;
      case DocumentStatus.FAILED:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  // 表格列定义
  const columns = useMemo<ColumnDef<DocumentEntity>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2"
          >
            标题
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const document = row.original;
          return (
            <div className="min-w-[200px] max-w-[300px]">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <div className="truncate">
                  <div 
                    className="font-medium truncate cursor-pointer hover:text-blue-600" 
                    title={document.title}
                    onClick={() => onViewDetail(document)}
                  >
                    {document.title}
                  </div>
                  {document.originalFileName && (
                    <div className="text-xs text-gray-500 truncate" title={document.originalFileName}>
                      {document.originalFileName}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        },
        enableHiding: true,
      },
      {
        accessorKey: "documentType",
        header: "类型",
        cell: ({ row }) => (
          <Badge variant="outline" className="min-w-[80px] justify-center">
            {getDocumentTypeText(row.original.documentType)}
          </Badge>
        ),
        enableHiding: true,
        size: 100,
      },
      {
        accessorKey: "status",
        header: "状态",
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <div className="flex items-center gap-2 min-w-[120px]">
              <StatusIcon status={status} />
              <StatusBadge status={status} size="sm" />
            </div>
          );
        },
        enableHiding: true,
        size: 120,
      },
      {
        accessorKey: "fileSize",
        header: "大小",
        cell: ({ row }) => (
          <div className="text-right min-w-[80px]">
            {formatFileSize(row.original.fileSize)}
          </div>
        ),
        enableHiding: true,
        size: 80,
      },
      {
        accessorKey: "processingProgress",
        header: "进度",
        cell: ({ row }) => {
          const progress = row.original.processingProgress;
          const status = row.original.status;
          return (
            <div className="min-w-[100px]">
              {status === DocumentStatus.PROCESSING ? (
                <div className="space-y-1">
                  <div className="text-sm">{formatProcessingProgress(progress)}</div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${progress || 0}%` }}
                    ></div>
                  </div>
                </div>
              ) : status === DocumentStatus.COMPLETED ? (
                <span className="text-green-600 text-sm">完成</span>
              ) : status === DocumentStatus.FAILED ? (
                <span className="text-red-600 text-sm">失败</span>
              ) : (
                <span className="text-gray-500">-</span>
              )}
            </div>
          );
        },
        enableHiding: true,
        size: 100,
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2"
          >
            创建时间
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="min-w-[120px] text-sm">
            {new Date(row.original.createdAt).toLocaleDateString('zh-CN')}
          </div>
        ),
        enableHiding: true,
        size: 120,
      },
      {
        id: "actions",
        header: () => <div className="text-center">操作</div>,
        cell: ({ row }) => {
          const document = row.original;
          return (
            <div className="flex items-center justify-center min-w-[80px]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewDetail(document)}
                title="查看详情"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
        size: 80,
      },
    ],
    [onViewDetail]
  );

  // 本地状态管理（简化版，不需要持久化）
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  return (
    <DataTable<DocumentEntity, unknown>
      columns={columns as ColumnDef<DocumentEntity, unknown>[]}
      data={documents}
      loading={loading}
      page={pagination.page}
      pageSize={pagination.pageSize}
      totalItems={pagination.total}
      totalPages={pagination.totalPages}
      onPageChange={(page, pageSize) => onPageChange(page, pageSize || pagination.pageSize)}
      onPageSizeChange={(page, pageSize) => onPageChange(page, pageSize || pagination.pageSize)}
      sorting={sorting}
      onSortingChange={setSorting}
      rowSelection={rowSelection}
      onRowSelectionChange={setRowSelection}
    />
  );
}