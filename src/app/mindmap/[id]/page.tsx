/**
 * 脑图详情页面
 * 显示脑图的详细信息和只读预览
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Edit, 
  Share, 
  Download, 
  Trash2, 
  Calendar, 
  Tag, 
  Layout, 
  Palette,
  Eye,
  Brain
} from 'lucide-react';

// 模拟脑图数据
const mockMindMapData = {
  id: '1',
  title: '项目规划脑图',
  description: '2024年产品开发规划的详细思维导图',
  tags: ['工作', '规划', '产品'],
  layout: 'logicalStructure',
  theme: 'default',
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-20T15:45:00Z',
  userId: 'user-123',
  data: {
    // 这里将包含实际的脑图数据
    nodes: [],
    links: []
  },
  metadata: {
    nodeCount: 15,
    maxDepth: 4,
    lastEditDuration: 45 // 分钟
  }
};

const layoutNames: Record<string, string> = {
  'logicalStructure': '逻辑结构图',
  'mindMap': '思维导图',
  'catalogOrganization': '目录组织图',
  'organizationStructure': '组织结构图',
  'timeline': '时间轴',
  'fishbone': '鱼骨图'
};

const themeNames: Record<string, string> = {
  'default': '默认主题',
  'classic': '经典主题',
  'dark': '暗色主题',
  'blueSky': '蓝天主题',
  'freshGreen': '清新绿',
  'romanticPurple': '浪漫紫'
};

export default function MindMapDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [mindMapData, setMindMapData] = useState(mockMindMapData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: 从API获取脑图数据
    const fetchMindMapData = async () => {
      try {
        setIsLoading(true);
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000));
        setMindMapData(mockMindMapData);
      } catch (error) {
        console.error('获取脑图数据失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMindMapData();
  }, [params.id]);

  const handleEdit = () => {
    router.push(`/mindmap/${params.id}/edit`);
  };

  const handleShare = () => {
    // TODO: 实现分享功能
    console.log('分享脑图');
  };

  const handleDownload = () => {
    // TODO: 实现下载功能
    console.log('下载脑图');
  };

  const handleDelete = () => {
    // TODO: 实现删除功能
    if (confirm('确定要删除这个脑图吗？此操作不可恢复。')) {
      console.log('删除脑图');
      router.push('/mindmap/list');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">加载中...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
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
              {mindMapData.title}
            </h1>
            <p className="text-gray-600">
              {mindMapData.description || '暂无描述'}
            </p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleShare}>
            <Share className="w-4 h-4 mr-2" />
            分享
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            下载
          </Button>
          <Button onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-2" />
            编辑
          </Button>
          <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 脑图预览区域 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                脑图预览
              </CardTitle>
              <CardDescription>
                只读模式，点击编辑按钮进行修改
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* 这里将显示实际的脑图组件 */}
              <div className="h-96 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <Brain className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">脑图预览区域</p>
                  <p className="text-sm text-gray-500">
                    节点数量: {mindMapData.metadata.nodeCount} | 最大深度: {mindMapData.metadata.maxDepth}
                  </p>
                  <Button className="mt-4" onClick={handleEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    开始编辑
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 侧边栏信息 */}
        <div className="space-y-6">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 标签 */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">标签</Label>
                <div className="flex flex-wrap gap-2">
                  {mindMapData.tags.map(tag => (
                    <Badge key={tag} variant="secondary">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 布局类型 */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">布局类型</Label>
                <div className="flex items-center text-gray-600">
                  <Layout className="w-4 h-4 mr-2" />
                  {layoutNames[mindMapData.layout] || mindMapData.layout}
                </div>
              </div>

              {/* 主题 */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">主题样式</Label>
                <div className="flex items-center text-gray-600">
                  <Palette className="w-4 h-4 mr-2" />
                  {themeNames[mindMapData.theme] || mindMapData.theme}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 时间信息 */}
          <Card>
            <CardHeader>
              <CardTitle>时间信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                <div>
                  <div className="font-medium">创建时间</div>
                  <div>{formatDate(mindMapData.createdAt)}</div>
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                <div>
                  <div className="font-medium">更新时间</div>
                  <div>{formatDate(mindMapData.updatedAt)}</div>
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Edit className="w-4 h-4 mr-2" />
                <div>
                  <div className="font-medium">编辑时长</div>
                  <div>{mindMapData.metadata.lastEditDuration} 分钟</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 统计信息 */}
          <Card>
            <CardHeader>
              <CardTitle>统计信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">节点数量</span>
                <span className="font-medium">{mindMapData.metadata.nodeCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">最大深度</span>
                <span className="font-medium">{mindMapData.metadata.maxDepth}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">标签数量</span>
                <span className="font-medium">{mindMapData.tags.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
