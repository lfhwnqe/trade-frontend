"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { X, Search, RotateCcw } from "lucide-react";
import { 
  DocumentType, 
  DocumentStatus, 
  RAGQuery
} from "../../types";

interface DocumentFilterFormProps {
  queryForm: RAGQuery;
  onQueryFormChange: (newQueryForm: RAGQuery) => void;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
  loading?: boolean;
}

export function DocumentFilterForm({
  queryForm,
  onQueryFormChange,
  onSubmit,
  onReset,
  loading = false,
}: DocumentFilterFormProps) {
  const [searchTitle, setSearchTitle] = useState("");
  const [tagInput, setTagInput] = useState("");

  // 处理标题搜索
  const handleTitleSearch = () => {
    onQueryFormChange({
      ...queryForm,
      searchTitle: searchTitle.trim() || undefined,
    });
  };

  // 处理回车键搜索
  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleTitleSearch();
    }
  };

  // 添加标签
  const addTag = () => {
    if (!tagInput.trim()) return;
    
    const newTag = tagInput.trim();
    const currentTags = queryForm.tags || [];
    
    if (currentTags.includes(newTag)) {
      return;
    }

    onQueryFormChange({
      ...queryForm,
      tags: [...currentTags, newTag],
    });
    setTagInput("");
  };

  // 删除标签
  const removeTag = (tagToRemove: string) => {
    const updatedTags = (queryForm.tags || []).filter((tag) => tag !== tagToRemove);
    onQueryFormChange({
      ...queryForm,
      tags: updatedTags.length > 0 ? updatedTags : undefined,
    });
  };

  // 处理标签输入回车
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  // 重置表单
  const handleReset = () => {
    setSearchTitle("");
    setTagInput("");
    onReset();
  };

  return (
    <div className="bg-white border rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">筛选文档</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={loading}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            重置
          </Button>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* 第一行：标题搜索 */}
        <div>
          <Label htmlFor="searchTitle">标题搜索</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="searchTitle"
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              onKeyPress={handleTitleKeyPress}
              placeholder="搜索文档标题..."
              className="flex-1"
              disabled={loading}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleTitleSearch}
              disabled={loading}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 第二行：筛选条件 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 文档类型 */}
          <div>
            <Label htmlFor="documentType">文档类型</Label>
            <Select
              value={queryForm.documentType || 'all'}
              onValueChange={(value) => {
                onQueryFormChange({
                  ...queryForm,
                  documentType: value === 'all' ? undefined : value as DocumentType,
                });
              }}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择文档类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value={DocumentType.TRADE}>交易文档</SelectItem>
                <SelectItem value={DocumentType.KNOWLEDGE}>知识文档</SelectItem>
                <SelectItem value={DocumentType.MANUAL}>手册文档</SelectItem>
                <SelectItem value={DocumentType.REPORT}>报告文档</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 文档状态 */}
          <div>
            <Label htmlFor="status">文档状态</Label>
            <Select
              value={queryForm.status || 'all'}
              onValueChange={(value) => {
                onQueryFormChange({
                  ...queryForm,
                  status: value === 'all' ? undefined : value as DocumentStatus,
                });
              }}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value={DocumentStatus.COMPLETED}>已完成</SelectItem>
                <SelectItem value={DocumentStatus.PROCESSING}>处理中</SelectItem>
                <SelectItem value={DocumentStatus.FAILED}>失败</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 提交按钮 */}
          <div className="flex items-end">
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              <Search className="h-4 w-4 mr-2" />
              {loading ? "搜索中..." : "搜索"}
            </Button>
          </div>
        </div>

        {/* 第三行：标签管理 */}
        <div>
          <Label htmlFor="tags">标签筛选</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleTagKeyPress}
              placeholder="输入标签后按回车添加"
              disabled={loading}
            />
            <Button
              type="button"
              variant="outline"
              onClick={addTag}
              disabled={loading}
            >
              添加
            </Button>
          </div>
          
          {/* 已选择的标签 */}
          {queryForm.tags && queryForm.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {queryForm.tags.map((tag, index) => (
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

        {/* 显示当前筛选条件摘要 */}
        {(queryForm.documentType || queryForm.status || (queryForm.tags && queryForm.tags.length > 0)) && (
          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            <span className="font-medium">当前筛选条件：</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {queryForm.documentType && queryForm.documentType !== 'all' && (
                <Badge variant="outline">
                  类型: {queryForm.documentType === DocumentType.TRADE && "交易文档"}
                  {queryForm.documentType === DocumentType.KNOWLEDGE && "知识文档"}
                  {queryForm.documentType === DocumentType.MANUAL && "手册文档"}
                  {queryForm.documentType === DocumentType.REPORT && "报告文档"}
                </Badge>
              )}
              {queryForm.status && queryForm.status !== 'all' && (
                <Badge variant="outline">
                  状态: {queryForm.status === DocumentStatus.COMPLETED && "已完成"}
                  {queryForm.status === DocumentStatus.PROCESSING && "处理中"}
                  {queryForm.status === DocumentStatus.FAILED && "失败"}
                </Badge>
              )}
              {queryForm.tags && queryForm.tags.length > 0 && (
                <Badge variant="outline">
                  标签: {queryForm.tags.length} 个
                </Badge>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}