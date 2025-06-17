"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Clock, 
  User, 
  Tag, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Download,
  Eye
} from "lucide-react";
import {
  DocumentEntity,
  DocumentStatus,
  Priority
} from "../../types";
import { 
  getDocumentStatusText,
  getDocumentTypeText,
  formatFileSize,
  formatProcessingProgress
} from "../../request";

interface DocumentDetailDialogProps {
  open: boolean;
  onClose: () => void;
  document: DocumentEntity | null;
  loading?: boolean;
}

export function DocumentDetailDialog({
  open,
  onClose,
  document,
  loading = false,
}: DocumentDetailDialogProps) {
  if (!document) return null;

  // 状态图标组件
  const StatusIcon = ({ status }: { status: DocumentStatus }) => {
    switch (status) {
      case DocumentStatus.COMPLETED:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case DocumentStatus.PROCESSING:
        return <Clock className="h-5 w-5 text-blue-500" />;
      case DocumentStatus.FAILED:
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  // 优先级显示
  const getPriorityDisplay = (priority?: Priority) => {
    const priorityMap = {
      [Priority.HIGH]: { text: "高", color: "bg-red-100 text-red-800" },
      [Priority.MEDIUM]: { text: "中", color: "bg-yellow-100 text-yellow-800" },
      [Priority.LOW]: { text: "低", color: "bg-green-100 text-green-800" },
    };
    
    const config = priority ? priorityMap[priority] : priorityMap[Priority.MEDIUM];
    return (
      <Badge className={config.color}>
        {config.text}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            文档详情
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">加载中...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 基本信息 */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                基本信息
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">标题</label>
                  <p className="text-base font-medium mt-1">{document.title}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">文档类型</label>
                  <p className="text-base mt-1">
                    <Badge variant="outline">
                      {getDocumentTypeText(document.documentType)}
                    </Badge>
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">状态</label>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusIcon status={document.status} />
                    <span className="text-base">
                      {getDocumentStatusText(document.status)}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">处理进度</label>
                  <p className="text-base mt-1">
                    {formatProcessingProgress(document.processingProgress)}
                  </p>
                </div>
                
                {document.originalFileName && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">原始文件名</label>
                    <p className="text-base mt-1">{document.originalFileName}</p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-gray-500">文件大小</label>
                  <p className="text-base mt-1">{formatFileSize(document.fileSize)}</p>
                </div>
              </div>
            </div>

            {/* 处理信息 */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                处理信息
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">分块数量</label>
                  <p className="text-base mt-1">{document.chunkCount || 0} 个</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">总令牌数</label>
                  <p className="text-base mt-1">{document.totalTokens || 0}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">嵌入模型</label>
                  <p className="text-base mt-1">{document.embeddingModel || "未知"}</p>
                </div>
              </div>
              
              {document.errorMessage && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <label className="text-sm font-medium text-red-700">错误信息</label>
                  <p className="text-sm text-red-600 mt-1">{document.errorMessage}</p>
                </div>
              )}
            </div>

            {/* 元数据 */}
            {document.metadata && (
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  元数据
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {document.metadata.priority && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">优先级</label>
                      <div className="mt-1">
                        {getPriorityDisplay(document.metadata.priority)}
                      </div>
                    </div>
                  )}
                  
                  {document.metadata.author && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">作者</label>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="h-4 w-4" />
                        <span className="text-base">{document.metadata.author}</span>
                      </div>
                    </div>
                  )}
                  
                  {document.metadata.source && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">来源</label>
                      <p className="text-base mt-1">{document.metadata.source}</p>
                    </div>
                  )}
                  
                  {document.metadata.category && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">分类</label>
                      <p className="text-base mt-1">{document.metadata.category}</p>
                    </div>
                  )}
                  
                  {document.metadata.tradeSymbol && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">交易标的</label>
                      <p className="text-base mt-1">{document.metadata.tradeSymbol}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">公开性</label>
                    <p className="text-base mt-1">
                      <Badge variant={document.metadata.isPublic ? "default" : "secondary"}>
                        {document.metadata.isPublic ? "公开" : "私有"}
                      </Badge>
                    </p>
                  </div>
                </div>
                
                {document.metadata.tags && document.metadata.tags.length > 0 && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-500">标签</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {document.metadata.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 时间信息 */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                时间信息
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">创建时间</label>
                  <p className="text-base mt-1">
                    {new Date(document.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">更新时间</label>
                  <p className="text-base mt-1">
                    {new Date(document.updatedAt).toLocaleString('zh-CN')}
                  </p>
                </div>
                
                {document.lastAccessedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">最后访问</label>
                    <p className="text-base mt-1">
                      {new Date(document.lastAccessedAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 向量信息 */}
            {document.embeddingIds && document.embeddingIds.length > 0 && (
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  向量信息
                </h3>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">嵌入向量ID</label>
                  <div className="mt-2 max-h-32 overflow-y-auto">
                    <div className="flex flex-wrap gap-1">
                      {document.embeddingIds.map((id, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {id}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}