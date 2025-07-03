/**
 * 创建新脑图页面
 * 提供脑图创建表单和基础配置选项
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Brain,
  ArrowLeft,
  Plus,
  X,
  Palette,
  Layout,
  Save,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useMindMap } from '@/hooks/useMindMap';

// 支持的布局类型
const layouts = [
  { key: 'logicalStructure', name: '逻辑结构图', description: '经典的思维导图布局' },
  { key: 'mindMap', name: '思维导图', description: '放射状的思维导图' },
  { key: 'catalogOrganization', name: '目录组织图', description: '层级目录结构' },
  { key: 'organizationStructure', name: '组织结构图', description: '组织架构图' },
  { key: 'timeline', name: '时间轴', description: '时间线布局' },
  { key: 'fishbone', name: '鱼骨图', description: '因果分析图' },
];

// 支持的主题
const themes = [
  { key: 'default', name: '默认主题', color: '#3b82f6' },
  { key: 'classic', name: '经典主题', color: '#6b7280' },
  { key: 'dark', name: '暗色主题', color: '#1f2937' },
  { key: 'blueSky', name: '蓝天主题', color: '#0ea5e9' },
  { key: 'freshGreen', name: '清新绿', color: '#10b981' },
  { key: 'romanticPurple', name: '浪漫紫', color: '#8b5cf6' },
];

export default function NewMindMapPage() {
  const router = useRouter();

  // 使用Hook管理脑图创建
  const { createNew, isCreating, error, clearError } = useMindMap({ autoLoad: false });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    layout: 'logicalStructure',
    theme: 'default',
    tags: [] as string[]
  });
  const [newTag, setNewTag] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('请输入脑图标题');
      return;
    }

    try {
      clearError();

      // 创建基础脑图数据结构
      const initialData = {
        data: {
          root: {
            data: {
              text: formData.title
            },
            children: []
          }
        }
      };

      // 调用API创建脑图
      const newMindMap = await createNew({
        title: formData.title,
        description: formData.description,
        layout: formData.layout,
        theme: formData.theme,
        tags: formData.tags,
        data: initialData
      });

      console.log('脑图创建成功:', newMindMap);

      // 创建成功后跳转到编辑页面
      router.push(`/mindmap/${newMindMap.id}/edit`);

    } catch (error) {
      console.error('创建脑图失败:', error);
      // 错误已经通过Hook处理，这里不需要额外处理
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 页面标题 */}
      <div className="flex items-center mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mr-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            <Brain className="inline-block w-8 h-8 mr-2" />
            创建新脑图
          </h1>
          <p className="text-gray-600">
            设置脑图的基本信息和样式
          </p>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              创建失败: {error}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="ml-2"
              >
                关闭
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
            <CardDescription>
              设置脑图的标题、描述和标签
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 标题 */}
            <div>
              <Label htmlFor="title">标题 *</Label>
              <Input
                id="title"
                placeholder="请输入脑图标题"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="mt-1"
              />
            </div>

            {/* 描述 */}
            <div>
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                placeholder="请输入脑图描述（可选）"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>

            {/* 标签 */}
            <div>
              <Label>标签</Label>
              <div className="mt-1 space-y-2">
                <div className="flex space-x-2">
                  <Input
                    placeholder="输入标签名称"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddTag}
                    disabled={!newTag.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 布局选择 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Layout className="w-5 h-5 mr-2" />
              布局类型
            </CardTitle>
            <CardDescription>
              选择脑图的布局样式
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {layouts.map(layout => (
                <div
                  key={layout.key}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    formData.layout === layout.key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleInputChange('layout', layout.key)}
                >
                  <h4 className="font-medium text-gray-900 mb-1">{layout.name}</h4>
                  <p className="text-sm text-gray-600">{layout.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 主题选择 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Palette className="w-5 h-5 mr-2" />
              主题样式
            </CardTitle>
            <CardDescription>
              选择脑图的颜色主题
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {themes.map(theme => (
                <div
                  key={theme.key}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors text-center ${
                    formData.theme === theme.key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleInputChange('theme', theme.key)}
                >
                  <div
                    className="w-8 h-8 rounded-full mx-auto mb-2"
                    style={{ backgroundColor: theme.color }}
                  ></div>
                  <p className="text-sm font-medium text-gray-900">{theme.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 提交按钮 */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            取消
          </Button>
          <Button
            type="submit"
            disabled={isCreating || !formData.title.trim()}
            className="flex items-center space-x-2"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>创建中...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>创建脑图</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
