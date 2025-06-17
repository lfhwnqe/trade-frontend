"use client";

import * as React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { X, Upload, File } from "lucide-react";
import {
  DocumentType,
  Priority,
  CreateDocumentDto
} from "../../types";
import { useAlert } from "@/components/common/alert";

interface AddDocumentDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDocumentDto) => Promise<void>;
  loading?: boolean;
}

export function AddDocumentDialog({
  open,
  onClose,
  onSubmit,
  loading = false,
}: AddDocumentDialogProps) {
  const [showAlert] = useAlert();
  const [activeTab, setActiveTab] = useState("text");
  const [formData, setFormData] = useState<CreateDocumentDto>({
    title: "",
    documentType: DocumentType.KNOWLEDGE,
    content: "",
    contentType: "text/plain",
    metadata: {
      tags: [],
      priority: Priority.MEDIUM,
      isPublic: true,
    },
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState("");

  // 重置表单
  const resetForm = () => {
    setFormData({
      title: "",
      documentType: DocumentType.KNOWLEDGE,
      content: "",
      contentType: "text/plain",
      metadata: {
        tags: [],
        priority: Priority.MEDIUM,
        isPublic: true,
      },
    });
    setErrors({});
    setTagInput("");
    setActiveTab("text");
  };

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "标题为必填项";
    }

    if (!formData.content.trim()) {
      newErrors.content = "内容为必填项";
    }

    if (!formData.documentType) {
      newErrors.documentType = "文档类型为必填项";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理表单提交
  const handleSubmit = async () => {
    if (!validateForm()) {
      showAlert("请填写必填项", "error");
      return;
    }

    try {
      // 根据内容类型设置相应的字段
      const submitData: CreateDocumentDto = {
        ...formData,
        originalFileName: activeTab === "file" ? formData.originalFileName : undefined,
        fileSize: activeTab === "file" ? formData.fileSize : formData.content.length,
      };

      await onSubmit(submitData);
      resetForm();
      onClose();
    } catch (error) {
      console.error("提交失败:", error);
    }
  };

  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 检查文件大小（限制10MB）
    if (file.size > 10 * 1024 * 1024) {
      showAlert("文件大小不能超过10MB", "error");
      return;
    }

    // 检查文件类型
    const allowedTypes = [
      "text/plain",
      "text/markdown",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      showAlert("不支持的文件类型", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFormData((prev) => ({
        ...prev,
        content,
        contentType: file.type,
        originalFileName: file.name,
        fileSize: file.size,
      }));
    };
    reader.readAsText(file);
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>添加文档</DialogTitle>
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
                value={formData.title}
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
              <Label htmlFor="documentType">
                文档类型 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.documentType}
                onValueChange={(value) => {
                  setFormData((prev) => ({ 
                    ...prev, 
                    documentType: value as DocumentType 
                  }));
                  if (errors.documentType) {
                    setErrors((prev) => ({ ...prev, documentType: "" }));
                  }
                }}
              >
                <SelectTrigger className={errors.documentType ? "border-red-500" : ""}>
                  <SelectValue placeholder="选择文档类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DocumentType.TRADE}>交易文档</SelectItem>
                  <SelectItem value={DocumentType.KNOWLEDGE}>知识文档</SelectItem>
                  <SelectItem value={DocumentType.MANUAL}>手册文档</SelectItem>
                  <SelectItem value={DocumentType.REPORT}>报告文档</SelectItem>
                </SelectContent>
              </Select>
              {errors.documentType && (
                <p className="text-sm text-red-500 mt-1">{errors.documentType}</p>
              )}
            </div>
          </div>

          {/* 内容输入 */}
          <div>
            <Label>
              文档内容 <span className="text-red-500">*</span>
            </Label>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
              <TabsList>
                <TabsTrigger value="text">文本输入</TabsTrigger>
                <TabsTrigger value="file">文件上传</TabsTrigger>
              </TabsList>
              
              <TabsContent value="text" className="mt-4">
                <Textarea
                  value={formData.content}
                  onChange={(e) => {
                    setFormData((prev) => ({ 
                      ...prev, 
                      content: e.target.value,
                      contentType: "text/plain"
                    }));
                    if (errors.content) {
                      setErrors((prev) => ({ ...prev, content: "" }));
                    }
                  }}
                  placeholder="请输入文档内容..."
                  className={`min-h-[200px] ${errors.content ? "border-red-500" : ""}`}
                />
                {errors.content && (
                  <p className="text-sm text-red-500 mt-1">{errors.content}</p>
                )}
              </TabsContent>
              
              <TabsContent value="file" className="mt-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    id="file-upload"
                    accept=".txt,.md,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <Upload className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      点击上传文件或拖拽文件到此处
                    </span>
                    <span className="text-xs text-gray-500">
                      支持 .txt, .md, .pdf, .doc, .docx 格式，最大10MB
                    </span>
                  </label>
                  
                  {formData.originalFileName && (
                    <div className="mt-4 flex items-center justify-center space-x-2">
                      <File className="h-4 w-4" />
                      <span className="text-sm">{formData.originalFileName}</span>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "创建中..." : "创建文档"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}