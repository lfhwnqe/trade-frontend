/**
 * 脑图编辑页面
 * 提供完整的脑图编辑功能
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Save,
  Eye,
  Settings,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Share,
  AlertCircle
} from 'lucide-react';
import MindMapEditor, { MindMapEditorRef, MindMapData } from '@/components/mindmap/MindMapEditor';
import { useMindMap } from '@/hooks/useMindMap';

export default function MindMapEditPage() {
  const params = useParams();
  const router = useRouter();
  const mindMapRef = useRef<MindMapEditorRef>(null);

  // 使用Hook管理脑图数据
  const {
    data: mindMapData,
    loading: isLoading,
    error: loadError,
    updateData,
    isUpdating,
    clearError
  } = useMindMap({
    id: params.id as string,
    autoLoad: true
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);

  // 清除错误状态
  useEffect(() => {
    if (loadError) {
      console.error('加载脑图数据失败:', loadError);
    }
  }, [loadError]);

  // 监听页面离开事件，提醒保存
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // 保存脑图数据
  const handleSave = async (data: MindMapData) => {
    try {
      setSaveError(null);

      // 使用Hook更新数据
      await updateData({
        data: data,
        title: mindMapData?.title,
        description: mindMapData?.description,
        tags: mindMapData?.tags,
        layout: mindMapData?.layout,
        theme: mindMapData?.theme
      });

      setHasUnsavedChanges(false);
      setLastSaveTime(new Date());
      console.log('保存成功');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '保存失败';
      setSaveError(errorMessage);
      console.error('保存失败:', error);
      throw error;
    }
  };

  // 手动保存
  const handleManualSave = async () => {
    try {
      await mindMapRef.current?.save();
    } catch (error) {
      console.error('手动保存失败:', error);
    }
  };

  const handlePreview = () => {
    router.push(`/mindmap/${params.id}`);
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      if (confirm('您有未保存的更改，确定要离开吗？')) {
        router.back();
      }
    } else {
      router.back();
    }
  };

  // 数据变化处理
  const handleDataChange = (data: MindMapData) => {
    setHasUnsavedChanges(true);
    console.log('脑图数据已修改');
  };

  // 保存成功处理
  const handleSaveSuccess = (data: MindMapData) => {
    console.log('保存成功:', data);
  };

  // 保存错误处理
  const handleSaveError = (error: Error) => {
    setSaveError(error.message);
    console.error('保存错误:', error);
  };

  // 脑图编辑器操作
  const handleUndo = () => {
    // 通过ref调用脑图实例的撤销方法
    const mindMapInstance = mindMapRef.current?.getMindMapInstance();
    if (mindMapInstance && mindMapInstance.command) {
      mindMapInstance.command.exec('BACK');
    }
  };

  const handleRedo = () => {
    // 通过ref调用脑图实例的重做方法
    const mindMapInstance = mindMapRef.current?.getMindMapInstance();
    if (mindMapInstance && mindMapInstance.command) {
      mindMapInstance.command.exec('FORWARD');
    }
  };

  const handleZoomIn = () => {
    const mindMapInstance = mindMapRef.current?.getMindMapInstance();
    if (mindMapInstance && mindMapInstance.view) {
      mindMapInstance.view.enlarge();
    }
  };

  const handleZoomOut = () => {
    const mindMapInstance = mindMapRef.current?.getMindMapInstance();
    if (mindMapInstance && mindMapInstance.view) {
      mindMapInstance.view.narrow();
    }
  };

  const handleResetView = () => {
    const mindMapInstance = mindMapRef.current?.getMindMapInstance();
    if (mindMapInstance && mindMapInstance.view) {
      mindMapInstance.view.reset();
    }
  };

  const handleExport = async () => {
    try {
      const exportData = await mindMapRef.current?.export('png');
      if (exportData) {
        // 创建下载链接
        const link = document.createElement('a');
        link.href = exportData;
        link.download = `${mindMapData?.title || '脑图'}.png`;
        link.click();
      }
    } catch (error) {
      console.error('导出失败:', error);
    }
  };

  const handleShare = () => {
    // 复制分享链接到剪贴板
    const shareUrl = `${window.location.origin}/mindmap/${params.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('分享链接已复制到剪贴板');
    }).catch(() => {
      alert('复制失败，请手动复制链接');
    });
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">加载脑图数据...</span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">加载失败</h2>
          <p className="text-gray-600 mb-4">{loadError}</p>
          <div className="space-x-2">
            <Button onClick={() => clearError()} variant="outline">
              重试
            </Button>
            <Button onClick={() => router.back()} variant="ghost">
              返回
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!mindMapData) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">脑图不存在</h2>
          <p className="text-gray-600 mb-4">找不到指定的脑图数据</p>
          <Button onClick={() => router.back()} variant="outline">
            返回
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部工具栏 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* 左侧操作 */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>
            
            <div className="h-6 w-px bg-gray-300"></div>
            
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-semibold text-gray-900">
                {mindMapData.title}
              </h1>
              {hasUnsavedChanges && (
                <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                  未保存
                </span>
              )}
            </div>
          </div>

          {/* 右侧操作 */}
          <div className="flex items-center space-x-2">
            {/* 编辑工具 */}
            <div className="flex items-center space-x-1 mr-4">
              <Button variant="ghost" size="sm" onClick={handleUndo}>
                <Undo className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleRedo}>
                <Redo className="w-4 h-4" />
              </Button>
              
              <div className="h-4 w-px bg-gray-300 mx-2"></div>
              
              <Button variant="ghost" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleResetView}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {/* 主要操作 */}
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              导出
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share className="w-4 h-4 mr-2" />
              分享
            </Button>
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="w-4 h-4 mr-2" />
              预览
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowSettings(!showSettings)}
              className={showSettings ? 'bg-gray-100' : ''}
            >
              <Settings className="w-4 h-4 mr-2" />
              设置
            </Button>
            <Button
              onClick={handleManualSave}
              disabled={isUpdating || !hasUnsavedChanges}
              className="flex items-center space-x-2"
            >
              {isUpdating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>保存中...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>保存</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {saveError && (
        <div className="px-4 py-2">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              保存失败: {saveError}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* 主编辑区域 */}
      <div className="flex-1 flex">
        {/* 脑图编辑器 */}
        <div className="flex-1 relative">
          <div className="absolute inset-0 bg-white">
            <MindMapEditor
              ref={mindMapRef}
              mindMapId={params.id as string}
              width="100%"
              height="100%"
              autoSave={true}
              autoSaveInterval={30000} // 30秒自动保存
              onSave={handleSave}
              onSaveSuccess={handleSaveSuccess}
              onSaveError={handleSaveError}
              onDataChange={handleDataChange}
              className="h-full"
            />
          </div>
        </div>

        {/* 右侧设置面板 */}
        {showSettings && (
          <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">编辑器设置</h3>
            
            {/* 这里将包含各种设置选项 */}
            <div className="space-y-6">
              {/* 布局设置 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">布局类型</h4>
                <div className="text-sm text-gray-600">
                  当前: {mindMapData.layout}
                </div>
              </div>

              {/* 主题设置 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">主题样式</h4>
                <div className="text-sm text-gray-600">
                  当前: {mindMapData.theme}
                </div>
              </div>

              {/* 其他设置 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">其他选项</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>• 自动保存: 开启</div>
                  <div>• 网格显示: 关闭</div>
                  <div>• 快捷键: 开启</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 底部状态栏 */}
      <div className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>节点: 0</span>
            <span>连接: 0</span>
            <span>缩放: 100%</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>
              最后保存: {lastSaveTime ? lastSaveTime.toLocaleTimeString() : '未保存'}
            </span>
            <span className="flex items-center space-x-1">
              <span>编辑模式</span>
              {hasUnsavedChanges && (
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
