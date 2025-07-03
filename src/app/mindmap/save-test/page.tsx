/**
 * 脑图数据保存测试页面
 * 验证脑图数据保存功能
 */

'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import MindMapEditor, { MindMapEditorRef, MindMapData } from '@/components/mindmap/MindMapEditor';
import { useMindMap } from '@/hooks/useMindMap';

// 测试数据
const testData: MindMapData = {
  data: {
    text: '数据保存测试'
  },
  children: [
    {
      data: {
        text: '手动保存测试'
      },
      children: [
        {
          data: {
            text: '点击保存按钮'
          }
        },
        {
          data: {
            text: '验证保存状态'
          }
        }
      ]
    },
    {
      data: {
        text: '自动保存测试'
      },
      children: [
        {
          data: {
            text: '编辑节点内容'
          }
        },
        {
          data: {
            text: '等待自动保存'
          }
        }
      ]
    }
  ]
};

export default function SaveTestPage() {
  const mindMapRef = useRef<MindMapEditorRef>(null);
  const [autoSave, setAutoSave] = useState(false);
  const [autoSaveInterval, setAutoSaveInterval] = useState(10000); // 10秒
  const [logs, setLogs] = useState<string[]>([]);
  const [saveCount, setSaveCount] = useState(0);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 使用Hook进行数据管理
  const {
    data: hookData,
    loading: hookLoading,
    error: hookError,
    updateData,
    isUpdating
  } = useMindMap({ autoLoad: false });

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

  // 模拟保存到后端
  const handleSave = async (data: MindMapData) => {
    setIsSaving(true);
    addLog('开始保存数据...');
    
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 这里应该调用实际的API
      console.log('Saving data:', data);
      
      // 模拟保存成功
      setSaveCount(prev => prev + 1);
      setLastSaveTime(new Date());
      addLog('数据保存成功');
      
    } catch (error) {
      addLog(`保存失败: ${error instanceof Error ? error.message : '未知错误'}`);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // 使用Hook保存
  const handleSaveWithHook = async (data: MindMapData) => {
    try {
      addLog('使用Hook保存数据...');
      
      // 转换数据格式
      const updateRequest = {
        data: data,
        // 可以添加其他更新字段
      };
      
      await updateData(updateRequest);
      addLog('Hook保存成功');
      
    } catch (error) {
      addLog(`Hook保存失败: ${error instanceof Error ? error.message : '未知错误'}`);
      throw error;
    }
  };

  const handleSaveSuccess = (data: MindMapData) => {
    addLog('保存成功回调触发');
    console.log('Save success:', data);
  };

  const handleSaveError = (error: Error) => {
    addLog(`保存错误回调: ${error.message}`);
    console.error('Save error:', error);
  };

  const handleDataChange = (data: MindMapData) => {
    addLog('数据已修改');
    console.log('Data changed:', data);
  };

  const handleManualSave = async () => {
    try {
      await mindMapRef.current?.save();
      addLog('手动保存完成');
    } catch (error) {
      addLog(`手动保存失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const handleGetData = () => {
    const data = mindMapRef.current?.getData();
    if (data) {
      addLog('获取当前数据成功');
      console.log('Current data:', data);
    } else {
      addLog('获取数据失败');
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  const handleResetStats = () => {
    setSaveCount(0);
    setLastSaveTime(null);
    addLog('统计数据已重置');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          脑图数据保存测试
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 脑图编辑器 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  脑图编辑器
                  <div className="flex items-center space-x-2">
                    {isSaving && (
                      <Badge variant="secondary">保存中...</Badge>
                    )}
                    {autoSave && (
                      <Badge variant="outline">自动保存</Badge>
                    )}
                  </div>
                </CardTitle>
                <CardDescription>
                  编辑脑图内容以测试保存功能
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MindMapEditor
                  ref={mindMapRef}
                  data={testData}
                  width="100%"
                  height="500px"
                  autoSave={autoSave}
                  autoSaveInterval={autoSaveInterval}
                  onSave={handleSave}
                  onSaveSuccess={handleSaveSuccess}
                  onSaveError={handleSaveError}
                  onDataChange={handleDataChange}
                  className="border-2 border-gray-300"
                />
              </CardContent>
            </Card>
          </div>

          {/* 控制面板 */}
          <div className="space-y-6">
            {/* 保存设置 */}
            <Card>
              <CardHeader>
                <CardTitle>保存设置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 自动保存开关 */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-save">自动保存</Label>
                  <Switch
                    id="auto-save"
                    checked={autoSave}
                    onCheckedChange={setAutoSave}
                  />
                </div>

                {/* 自动保存间隔 */}
                {autoSave && (
                  <div>
                    <Label className="text-sm">保存间隔</Label>
                    <div className="flex space-x-2 mt-2">
                      <Button
                        variant={autoSaveInterval === 5000 ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setAutoSaveInterval(5000)}
                      >
                        5秒
                      </Button>
                      <Button
                        variant={autoSaveInterval === 10000 ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setAutoSaveInterval(10000)}
                      >
                        10秒
                      </Button>
                      <Button
                        variant={autoSaveInterval === 30000 ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setAutoSaveInterval(30000)}
                      >
                        30秒
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 操作按钮 */}
            <Card>
              <CardHeader>
                <CardTitle>操作测试</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={handleManualSave} className="w-full">
                  手动保存
                </Button>
                <Button onClick={handleGetData} variant="outline" className="w-full">
                  获取数据
                </Button>
                <Button onClick={handleClearLogs} variant="outline" className="w-full">
                  清空日志
                </Button>
                <Button onClick={handleResetStats} variant="outline" className="w-full">
                  重置统计
                </Button>
              </CardContent>
            </Card>

            {/* 保存统计 */}
            <Card>
              <CardHeader>
                <CardTitle>保存统计</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">保存次数:</span>
                  <span className="font-medium">{saveCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">最后保存:</span>
                  <span className="font-medium text-sm">
                    {lastSaveTime ? lastSaveTime.toLocaleTimeString() : '未保存'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">保存状态:</span>
                  <span className={`font-medium text-sm ${isSaving ? 'text-blue-600' : 'text-green-600'}`}>
                    {isSaving ? '保存中' : '已保存'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Hook状态 */}
            {hookError && (
              <Alert variant="destructive">
                <AlertDescription>
                  Hook错误: {hookError}
                </AlertDescription>
              </Alert>
            )}

            {isUpdating && (
              <Alert>
                <AlertDescription>
                  Hook正在更新数据...
                </AlertDescription>
              </Alert>
            )}

            {/* 事件日志 */}
            <Card>
              <CardHeader>
                <CardTitle>事件日志</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {logs.length === 0 ? (
                    <div className="text-gray-500 text-sm">暂无日志</div>
                  ) : (
                    logs.map((log, index) => (
                      <div key={index} className="text-xs text-gray-600 font-mono">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 测试说明 */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>测试说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">手动保存测试</h4>
                <ul className="space-y-1">
                  <li>• 编辑脑图内容</li>
                  <li>• 点击"手动保存"按钮</li>
                  <li>• 观察保存状态和日志</li>
                  <li>• 验证保存成功回调</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">自动保存测试</h4>
                <ul className="space-y-1">
                  <li>• 开启自动保存开关</li>
                  <li>• 设置保存间隔</li>
                  <li>• 编辑脑图内容</li>
                  <li>• 等待自动保存触发</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
