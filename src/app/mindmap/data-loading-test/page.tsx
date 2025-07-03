/**
 * 脑图数据加载测试页面
 * 验证从后端加载脑图数据的功能
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import MindMapEditor from '@/components/mindmap/MindMapEditor';
import { useMindMap } from '@/hooks/useMindMap';

// 模拟脑图数据
const mockMindMapData = {
  id: 'test-mindmap-1',
  title: '测试脑图',
  description: '这是一个用于测试数据加载的脑图',
  tags: ['测试', '开发'],
  layout: 'logicalStructure',
  theme: 'default',
  data: {
    data: {
      text: '项目管理'
    },
    children: [
      {
        data: {
          text: '计划阶段'
        },
        children: [
          {
            data: {
              text: '需求分析'
            }
          },
          {
            data: {
              text: '资源规划'
            }
          }
        ]
      },
      {
        data: {
          text: '执行阶段'
        },
        children: [
          {
            data: {
              text: '任务分配'
            }
          },
          {
            data: {
              text: '进度跟踪'
            }
          }
        ]
      },
      {
        data: {
          text: '收尾阶段'
        },
        children: [
          {
            data: {
              text: '成果交付'
            }
          },
          {
            data: {
              text: '项目总结'
            }
          }
        ]
      }
    ]
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  userId: 'test-user'
};

export default function DataLoadingTestPage() {
  const [mindMapId, setMindMapId] = useState('');
  const [testMode, setTestMode] = useState<'local' | 'api' | 'hook'>('local');
  const [logs, setLogs] = useState<string[]>([]);

  // 使用Hook测试
  const {
    data: hookData,
    loading: hookLoading,
    error: hookError,
    loadMindMap,
    clearError
  } = useMindMap({ autoLoad: false });

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

  const handleDataLoaded = (data: any) => {
    addLog(`数据加载成功: ${data.title || '未知标题'}`);
    console.log('Data loaded:', data);
  };

  const handleError = (error: Error) => {
    addLog(`加载错误: ${error.message}`);
    console.error('Loading error:', error);
  };

  const handleReady = (mindMap: any) => {
    addLog('脑图编辑器初始化完成');
    console.log('MindMap ready:', mindMap);
  };

  const handleLoadWithHook = async () => {
    if (!mindMapId.trim()) {
      addLog('请输入脑图ID');
      return;
    }

    try {
      clearError();
      addLog(`开始使用Hook加载脑图: ${mindMapId}`);
      await loadMindMap(mindMapId);
      addLog('Hook加载完成');
    } catch (error) {
      addLog(`Hook加载失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const handleTestApiConnection = async () => {
    try {
      addLog('测试API连接...');
      
      // 模拟API调用
      const { getMindMap } = await import('@/lib/api/mindmap');
      
      // 这里会失败，因为后端可能没有运行，但我们可以看到错误信息
      await getMindMap('test-id');
      
    } catch (error) {
      addLog(`API连接测试: ${error instanceof Error ? error.message : '连接失败'}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          脑图数据加载测试
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 脑图显示区域 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>脑图编辑器</CardTitle>
                <CardDescription>
                  当前测试模式: {
                    testMode === 'local' ? '本地数据' :
                    testMode === 'api' ? 'API加载' : 'Hook加载'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {testMode === 'local' && (
                  <MindMapEditor
                    data={mockMindMapData.data}
                    width="100%"
                    height="500px"
                    onReady={handleReady}
                    onError={handleError}
                    onDataLoaded={handleDataLoaded}
                    className="border-2 border-gray-300"
                  />
                )}

                {testMode === 'api' && (
                  <MindMapEditor
                    mindMapId={mindMapId || 'test-mindmap-1'}
                    width="100%"
                    height="500px"
                    onReady={handleReady}
                    onError={handleError}
                    onDataLoaded={handleDataLoaded}
                    className="border-2 border-gray-300"
                  />
                )}

                {testMode === 'hook' && (
                  <div className="space-y-4">
                    {hookLoading && (
                      <Alert>
                        <AlertDescription>
                          正在使用Hook加载数据...
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {hookError && (
                      <Alert variant="destructive">
                        <AlertDescription>
                          Hook加载错误: {hookError}
                        </AlertDescription>
                      </Alert>
                    )}

                    {hookData && (
                      <MindMapEditor
                        data={hookData.data}
                        width="100%"
                        height="500px"
                        onReady={handleReady}
                        onError={handleError}
                        className="border-2 border-gray-300"
                      />
                    )}

                    {!hookData && !hookLoading && !hookError && (
                      <div className="h-96 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <p>请使用Hook加载数据</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 控制面板 */}
          <div className="space-y-6">
            {/* 测试模式选择 */}
            <Card>
              <CardHeader>
                <CardTitle>测试模式</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={testMode === 'local' ? 'default' : 'outline'}
                  onClick={() => setTestMode('local')}
                  className="w-full"
                >
                  本地数据测试
                </Button>
                <Button
                  variant={testMode === 'api' ? 'default' : 'outline'}
                  onClick={() => setTestMode('api')}
                  className="w-full"
                >
                  API加载测试
                </Button>
                <Button
                  variant={testMode === 'hook' ? 'default' : 'outline'}
                  onClick={() => setTestMode('hook')}
                  className="w-full"
                >
                  Hook加载测试
                </Button>
              </CardContent>
            </Card>

            {/* 脑图ID输入 */}
            {(testMode === 'api' || testMode === 'hook') && (
              <Card>
                <CardHeader>
                  <CardTitle>脑图ID</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="mindmap-id">脑图ID</Label>
                    <Input
                      id="mindmap-id"
                      value={mindMapId}
                      onChange={(e) => setMindMapId(e.target.value)}
                      placeholder="输入脑图ID"
                    />
                  </div>
                  
                  {testMode === 'hook' && (
                    <Button onClick={handleLoadWithHook} className="w-full">
                      使用Hook加载
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 测试操作 */}
            <Card>
              <CardHeader>
                <CardTitle>测试操作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={handleTestApiConnection} variant="outline" className="w-full">
                  测试API连接
                </Button>
                <Button onClick={() => setLogs([])} variant="outline" className="w-full">
                  清空日志
                </Button>
              </CardContent>
            </Card>

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">本地数据测试</h4>
                <ul className="space-y-1">
                  <li>• 使用模拟数据</li>
                  <li>• 验证组件渲染</li>
                  <li>• 测试基本功能</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">API加载测试</h4>
                <ul className="space-y-1">
                  <li>• 直接调用API</li>
                  <li>• 测试数据转换</li>
                  <li>• 验证错误处理</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Hook加载测试</h4>
                <ul className="space-y-1">
                  <li>• 使用useMindMap Hook</li>
                  <li>• 测试状态管理</li>
                  <li>• 验证加载流程</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
