"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { 
  DocumentType, 
  Priority, 
  UpdateDocumentDto,
  DocumentEntity
} from "../../types";
import { useAlert } from "@/components/common/alert";

interface EditDocumentDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (documentId: string, data: UpdateDocumentDto) => Promise<void>;
  document: DocumentEntity | null;
  loading?: boolean;
}

export function EditDocumentDialog({
  open,
  onClose,
  onSubmit,
  document,
  loading = false,
}: EditDocumentDialogProps) {
  const [showAlert] = useAlert();
  const [formData, setFormData] = useState<UpdateDocumentDto>({
    title: "",
    metadata: {
      tags: [],
      priority: Priority.MEDIUM,
      isPublic: true,
    },
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState("");

  // 当文档数据变化时更新表单
  useEffect(() => {
    if (document) {
      setFormData({
        title: document.title,
        metadata: {
          ...document.metadata,
          tags: document.metadata?.tags || [],
          priority: document.metadata?.priority || Priority.MEDIUM,
          isPublic: document.metadata?.isPublic ?? true,
        },
      });
    }
  }, [document]);

  // 重置表单
  const resetForm = () => {
    setFormData({
      title: "",
      metadata: {
        tags: [],
        priority: Priority.MEDIUM,
        isPublic: true,
      },
    });
    setErrors({});
    setTagInput("");
  };

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = "标题为必填项";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理表单提交
  const handleSubmit = async () => {
    if (!document) return;
    
    if (!validateForm()) {
      showAlert("请填写必填项", "error");
      return;
    }

    try {
      await onSubmit(document.documentId, formData);
      onClose();
    } catch (error) {
      console.error("提交失败:", error);
    }
  };

  // 添加标签
  const addTag = () => {
    if (!tagInput.trim()) return;
    
    const newTag = tagInput.trim();
    if (formData.metadata?.tags?.includes(newTag)) {
      showAlert("标签已存在", "error");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        tags: [...(prev.metadata?.tags || []), newTag],
      },
    }));
    setTagInput("");
  };

  // 删除标签
  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        tags: prev.metadata?.tags?.filter((tag) => tag !== tagToRemove) || [],
      },
    }));
  };

  // 处理关闭
  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑文档</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">
                标题 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title || ""}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, title: e.target.value }));
                  if (errors.title) {
                    setErrors((prev) => ({ ...prev, title: "" }));
                  }
                }}
                placeholder="请输入文档标题"
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-sm text-red-500 mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <Label>文档类型</Label>
              <div className="flex items-center h-10 px-3 bg-gray-100 rounded-md">
                <span className="text-sm text-gray-600">
                  {document.documentType === DocumentType.TRADE && "交易文档"}
                  {document.documentType === DocumentType.KNOWLEDGE && "知识文档"}
                  {document.documentType === DocumentType.MANUAL && "手册文档"}
                  {document.documentType === DocumentType.REPORT && "报告文档"}
                </span>
              </div>
            </div>
          </div>

          {/* 元数据 */}
          <div className="space-y-4">
            <Label>元数据</Label>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">优先级</Label>
                <Select
                  value={formData.metadata?.priority || Priority.MEDIUM}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      metadata: {
                        ...prev.metadata,
                        priority: value as Priority,
                      },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Priority.HIGH}>高</SelectItem>
                    <SelectItem value={Priority.MEDIUM}>中</SelectItem>
                    <SelectItem value={Priority.LOW}>低</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="author">作者</Label>
                <Input
                  id="author"
                  value={formData.metadata?.author || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      metadata: {
                        ...prev.metadata,
                        author: e.target.value,
                      },
                    }))
                  }
                  placeholder="请输入作者"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="source">来源</Label>
              <Input
                id="source"
                value={formData.metadata?.source || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    metadata: {
                      ...prev.metadata,
                      source: e.target.value,
                    },
                  }))
                }
                placeholder="请输入文档来源"
              />
            </div>

            <div>
              <Label htmlFor="category">分类</Label>
              <Input
                id="category"
                value={formData.metadata?.category || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    metadata: {
                      ...prev.metadata,
                      category: e.target.value,
                    },
                  }))
                }
                placeholder="请输入文档分类"
              />
            </div>

            {/* 标签管理 */}
            <div>
              <Label htmlFor="tags">标签</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="输入标签后按回车添加"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" onClick={addTag} variant="outline">
                  添加
                </Button>
              </div>
              
              {formData.metadata?.tags && formData.metadata.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.metadata.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* 公开性设置 */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={formData.metadata?.isPublic || false}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    metadata: {
                      ...prev.metadata,
                      isPublic: e.target.checked,
                    },
                  }))
                }
              />
              <Label htmlFor="isPublic">公开文档</Label>
            </div>
          </div>

          {/* 文档信息展示 */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium">文档信息</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">文件大小：</span>
                <span>{document.fileSize ? `${Math.round(document.fileSize / 1024)} KB` : "未知"}</span>
              </div>
              <div>
                <span className="text-gray-600">分块数量：</span>
                <span>{document.chunkCount || 0}</span>
              </div>
              <div>
                <span className="text-gray-600">总令牌数：</span>
                <span>{document.totalTokens || 0}</span>
              </div>
              <div>
                <span className="text-gray-600">创建时间：</span>
                <span>{new Date(document.createdAt).toLocaleString('zh-CN')}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "更新中..." : "更新文档"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}