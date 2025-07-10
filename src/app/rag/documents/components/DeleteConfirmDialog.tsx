import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, FileText, Loader2 } from 'lucide-react';
import { DocumentEntity } from '../../types';
import { 
  getDocumentTypeText, 
  formatFileSize,
  getDocumentStatusText 
} from '../../request';

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  document: DocumentEntity | null;
  onConfirm: (document: DocumentEntity) => Promise<void>;
  loading?: boolean;
}

export function DeleteConfirmDialog({
  open,
  onClose,
  document,
  onConfirm,
  loading = false
}: DeleteConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!document || isDeleting) return;

    try {
      setIsDeleting(true);
      await onConfirm(document);
      onClose();
    } catch (error) {
      // 错误处理由父组件负责
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (isDeleting) return; // 删除过程中不允许关闭
    onClose();
  };

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            确认删除文档
          </DialogTitle>
          <DialogDescription>
            此操作将永久删除文档及其相关数据，包括向量数据和元数据。此操作不可撤销。
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate" title={document.title}>
                  {document.title}
                </h4>
                {document.originalFileName && (
                  <p className="text-sm text-gray-500 truncate" title={document.originalFileName}>
                    {document.originalFileName}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">文档类型：</span>
                <Badge variant="outline" className="ml-1">
                  {getDocumentTypeText(document.documentType)}
                </Badge>
              </div>
              <div>
                <span className="text-gray-500">状态：</span>
                <Badge variant="outline" className="ml-1">
                  {getDocumentStatusText(document.status)}
                </Badge>
              </div>
              <div>
                <span className="text-gray-500">文件大小：</span>
                <span className="ml-1">{formatFileSize(document.fileSize)}</span>
              </div>
              <div>
                <span className="text-gray-500">分块数量：</span>
                <span className="ml-1">{document.chunkCount}</span>
              </div>
            </div>

            <div className="text-sm">
              <span className="text-gray-500">创建时间：</span>
              <span className="ml-1">
                {new Date(document.createdAt).toLocaleString('zh-CN')}
              </span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700">
                <p className="font-medium">删除影响：</p>
                <ul className="mt-1 space-y-1 list-disc list-inside">
                  <li>文档元数据将从数据库中删除</li>
                  <li>向量数据将从向量数据库中删除</li>
                  <li>相关的搜索索引将被清理</li>
                  <li>此操作无法撤销</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
          >
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="min-w-[80px]"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                删除中...
              </>
            ) : (
              '确认删除'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
