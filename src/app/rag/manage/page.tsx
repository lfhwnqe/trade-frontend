"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { 
  ColumnDef,
  SortingState,
  RowSelectionState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/common/DataTable";
import { 
  ArrowUpDown,
  Plus, 
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  Download,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useRagManage } from "./useRagManage";
import { 
  AddDocumentDialog,
  EditDocumentDialog,
  DocumentDetailDialog,
  DocumentFilterForm,
  StatisticsCards
} from "./components";
import { 
  DocumentEntity, 
  DocumentStatus,
  CreateDocumentDto,
  UpdateDocumentDto
} from "../types";
import { 
  getDocumentStatusText,
  getDocumentTypeText,
  formatFileSize,
  formatProcessingProgress
} from "../request";

export default function RAGManagePage() {
  const {
    // 状态
    documents,
    loading,
    pagination,
    queryForm,
    sorting,
    rowSelection,
    dialog,

    // 方法
    fetchDocuments,
    fetchAnalytics,
    updateQueryForm,
    updateSorting,
    updateRowSelection,
    updatePagination,
    openAddDialog,
    openEditDialog,
    closeDialog,
    setDeleteId,
    handleCreateDocument,
    handleUpdateDocument,
    handleDeleteDocument,
    fetchDocumentDetail,
  } = useRagManage();

  // 文档详情对话框状态
  const [detailDialog, setDetailDialog] = useState<{
    open: boolean;
    document: DocumentEntity | null;
    loading: boolean;
  }>({
    open: false,
    document: null,
    loading: false,
  });

  // 页面初始化
  useEffect(() => {
    fetchDocuments();
    fetchAnalytics();
  }, []);

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

  // 状态样式
  const getStatusStyle = (status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case DocumentStatus.PROCESSING:
        return 'bg-blue-100 text-blue-800';
      case DocumentStatus.FAILED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 处理查看详情
  const handleViewDetail = async (document: DocumentEntity) => {
    setDetailDialog({
      open: true,
      document: null,
      loading: true,
    });

    try {
      const detailData = await fetchDocumentDetail(document.documentId);
      setDetailDialog({
        open: true,
        document: detailData || document,
        loading: false,
      });
    } catch {
      setDetailDialog({
        open: true,
        document: document,
        loading: false,
      });
    }
  };

  // 表格列定义
  const columns = useMemo<ColumnDef<DocumentEntity>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="选择所有"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="选择行"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 50,
      },
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
            <div className="min-w-[150px] max-w-[300px]">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <div className="truncate">
                  <div className="font-medium truncate" title={document.title}>
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
            <div className="flex items-center gap-2 min-w-[100px]">
              <StatusIcon status={status} />
              <Badge className={getStatusStyle(status)}>
                {getDocumentStatusText(status)}
              </Badge>
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
          return (
            <div className="min-w-[80px]">
              {row.original.status === DocumentStatus.PROCESSING ? (
                <div className="space-y-1">
                  <div className="text-sm">{formatProcessingProgress(progress)}</div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${progress || 0}%` }}
                    ></div>
                  </div>
                </div>
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
            <div className="flex items-center justify-center gap-1 min-w-[200px]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewDetail(document)}
                title="查看详情"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openEditDialog(document)}
                title="编辑文档"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {/* TODO: 实现下载功能 */}}
                title="下载文档"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteId(document.documentId)}
                className="text-red-600 hover:text-red-700"
                title="删除文档"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
        size: 200,
        meta: {
          pinned: 'right',
        },
      },
    ],
    [openEditDialog, setDeleteId, fetchDocumentDetail]
  );

  // 处理创建文档
  const handleAddDocument = async (data: CreateDocumentDto) => {
    await handleCreateDocument(data);
  };

  // 处理更新文档
  const handleEditDocument = async (documentId: string, data: UpdateDocumentDto) => {
    await handleUpdateDocument(documentId, data);
  };

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">RAG 数据管理</h1>
          <p className="text-muted-foreground">
            管理您的知识库文档，查看处理状态和统计信息
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            fetchDocuments();
            fetchAnalytics();
          }} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            添加文档
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <StatisticsCards documents={documents} loading={loading} />

      {/* 筛选表单 */}
      <DocumentFilterForm
        queryForm={queryForm}
        onQueryFormChange={updateQueryForm}
        onSubmit={(e) => {
          e.preventDefault();
          updatePagination(1, pagination.pageSize);
        }}
        onReset={() => {
          updateQueryForm({});
          updatePagination(1, pagination.pageSize);
        }}
        loading={loading}
      />

      {/* 文档列表 */}
      <div className="flex-1 min-h-0">
        <DataTable<DocumentEntity, unknown>
          columns={columns as ColumnDef<DocumentEntity, unknown>[]}
          data={documents}
          sorting={sorting}
          rowSelection={rowSelection}
          loading={loading}
          page={pagination.page}
          pageSize={pagination.pageSize}
          totalItems={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={(page, pageSize) => updatePagination(page, pageSize)}
          onPageSizeChange={(page, pageSize) => updatePagination(page, pageSize)}
          onSortingChange={(newSorting) => updateSorting(newSorting as SortingState)}
          onRowSelectionChange={(newSelection) => updateRowSelection(newSelection as RowSelectionState)}
          initialColumnPinning={{
            right: ['actions'],
          }}
        />
      </div>

      {/* 添加文档对话框 */}
      {dialog.open && !dialog.editDocument && (
        <AddDocumentDialog
          open={dialog.open}
          onClose={closeDialog}
          onSubmit={handleAddDocument}
          loading={loading}
        />
      )}

      {/* 编辑文档对话框 */}
      {dialog.open && dialog.editDocument && (
        <EditDocumentDialog
          open={dialog.open}
          onClose={closeDialog}
          onSubmit={handleEditDocument}
          document={dialog.editDocument as DocumentEntity}
          loading={loading}
        />
      )}

      {/* 文档详情对话框 */}
      <DocumentDetailDialog
        open={detailDialog.open}
        onClose={() => setDetailDialog({ open: false, document: null, loading: false })}
        document={detailDialog.document}
        loading={detailDialog.loading}
      />

      {/* 删除确认对话框 */}
      {dialog.deleteId && (
        <Dialog
          open={!!dialog.deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>确认删除</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              确定要删除这个文档吗？此操作不可撤销，文档的所有数据和向量将被永久删除。
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)} disabled={loading}>
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteDocument(dialog.deleteId!)}
                disabled={loading}
              >
                {loading ? "删除中..." : "删除"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}