/**
 * MindMapEditor组件测试页面
 * 验证MindMapEditor组件是否可以正常渲染和使用
 */

'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MindMapEditor, { MindMapEditorRef, MindMapData, MindMapConfig } from '@/components/mindmap/MindMapEditor';

// 测试数据
const testData: MindMapData = {
  data: {
    text: '项目规划'
  },
  children: [
    {
      data: {
        text: '需求分析'
      },
      children: [
        {
          data: {
            text: '用户调研'
          }
        },
        {
          data: {
            text: '竞品分析'
          }
        }
      ]
    },
    {
      data: {
        text: '技术选型'
      },
      children: [
        {
          data: {
            text: '前端框架'
          }
        },
        {
          data: {
            text: '后端架构'
          }
        },
        {
          data: {
            text: '数据库设计'
          }
        }
      ]
    },
    {
      data: {
        text: '开发计划'
      },
      children: [
        {
          data: {
            text: '第一阶段'
          }
        },
        {
          data: {
            text: '第二阶段'
          }
        }
      ]
    }
  ]
};

const themes = [
  { value: 'default', label: '默认主题' },
  { value: 'classic', label: '经典主题' },
  { value: 'dark', label: '暗色主题' },
  { value: 'blueSky', label: '蓝天主题' },
  { value: 'freshGreen', label: '清新绿' },
  { value: 'romanticPurple', label: '浪漫紫' }
];

const layouts = [
  { value: 'logicalStructure', label: '逻辑结构图' },
  { value: 'mindMap', label: '思维导图' },
  { value: 'catalogOrganization', label: '目录组织图' },
  { value: 'organizationStructure', label: '组织结构图' },
  { value: 'timeline', label: '时间轴' },
  { value: 'fishbone', label: '鱼骨图' }
];

export default function MindMapComponentTestPage() {
  const mindMapRef = useRef<MindMapEditorRef>(null);
  const [config, setConfig] = useState<MindMapConfig>({
    layout: 'logicalStructure',
    theme: 'default',
    readonly: false
  });
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

  const handleReady = (mindMap: any) => {
    addLog('脑图编辑器初始化完成');
    console.log('MindMap ready:', mindMap);
  };

  const handleError = (error: Error) => {
    addLog(`错误: ${error.message}`);
    console.error('MindMap error:', error);
  };

  const handleDataChange = (data: MindMapData) => {
    addLog('脑图数据已更改');
    console.log('Data changed:', data);
  };

  const handleNodeClick = (node: any, e: Event) => {
    addLog(`节点点击: ${node.nodeData?.data?.text || '未知节点'}`);
    console.log('Node clicked:', node, e);
  };

  const handleNodeDoubleClick = (node: any, e: Event) => {
    addLog(`节点双击: ${node.nodeData?.data?.text || '未知节点'}`);
    console.log('Node double clicked:', node, e);
  };

  const handleGetData = () => {
    const data = mindMapRef.current?.getData();
    if (data) {
      addLog('获取数据成功');
      console.log('Current data:', data);
    } else {
      addLog('获取数据失败');
    }
  };

  const handleSetTheme = (theme: string) => {
    mindMapRef.current?.setTheme(theme);
    setConfig(prev => ({ ...prev, theme }));
    addLog(`主题已切换为: ${theme}`);
  };

  const handleSetLayout = (layout: string) => {
    mindMapRef.current?.setLayout(layout);
    setConfig(prev => ({ ...prev, layout }));
    addLog(`布局已切换为: ${layout}`);
  };

  const handleExport = async () => {
    try {
      const result = await mindMapRef.current?.export('png');
      addLog('导出PNG成功');
      console.log('Export result:', result);
    } catch (error) {
      addLog('导出失败');
      console.error('Export failed:', error);
    }
  };

  const handleToggleReadonly = () => {
    const newReadonly = !config.readonly;
    setConfig(prev => ({ ...prev, readonly: newReadonly }));
    addLog(`只读模式: ${newReadonly ? '开启' : '关闭'}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          MindMapEditor 组件测试
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 脑图编辑器 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>脑图编辑器</CardTitle>
                <CardDescription>
                  测试MindMapEditor组件的渲染和基本功能
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MindMapEditor
                  ref={mindMapRef}
                  data={testData}
                  config={config}
                  width="100%"
                  height="500px"
                  onReady={handleReady}
                  onError={handleError}
                  onDataChange={handleDataChange}
                  onNodeClick={handleNodeClick}
                  onNodeDoubleClick={handleNodeDoubleClick}
                  className="border-2 border-gray-300"
                />
              </CardContent>
            </Card>
          </div>

          {/* 控制面板 */}
          <div className="space-y-6">
            {/* 配置控制 */}
            <Card>
              <CardHeader>
                <CardTitle>配置控制</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 主题选择 */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    主题
                  </label>
                  <Select value={config.theme} onValueChange={handleSetTheme}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {themes.map(theme => (
                        <SelectItem key={theme.value} value={theme.value}>
                          {theme.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 布局选择 */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    布局
                  </label>
                  <Select value={config.layout} onValueChange={handleSetLayout}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {layouts.map(layout => (
                        <SelectItem key={layout.value} value={layout.value}>
                          {layout.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 只读模式 */}
                <div>
                  <Button
                    variant="outline"
                    onClick={handleToggleReadonly}
                    className="w-full"
                  >
                    {config.readonly ? '关闭只读模式' : '开启只读模式'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 操作按钮 */}
            <Card>
              <CardHeader>
                <CardTitle>操作测试</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={handleGetData} variant="outline" className="w-full">
                  获取数据
                </Button>
                <Button onClick={handleExport} variant="outline" className="w-full">
                  导出PNG
                </Button>
              </CardContent>
            </Card>

            {/* 事件日志 */}
            <Card>
              <CardHeader>
                <CardTitle>事件日志</CardTitle>
                <CardDescription>
                  显示组件事件和操作记录
                </CardDescription>
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
                <h4 className="font-medium text-gray-900 mb-2">基本功能测试</h4>
                <ul className="space-y-1">
                  <li>• 组件正常渲染</li>
                  <li>• 脑图数据显示</li>
                  <li>• 节点交互响应</li>
                  <li>• 事件回调触发</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">配置功能测试</h4>
                <ul className="space-y-1">
                  <li>• 主题切换</li>
                  <li>• 布局切换</li>
                  <li>• 只读模式切换</li>
                  <li>• 数据导出</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
