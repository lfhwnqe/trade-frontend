/**
 * simple-mind-map 包导入和使用测试
 * 验证包是否可以正常导入和基本功能是否可用
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// 测试simple-mind-map的导入
let MindMap: any = null;
let themes: any = null;

export default function TestSimpleMindMapPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mindMapInstance, setMindMapInstance] = useState<any>(null);
  const [importStatus, setImportStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 动态导入simple-mind-map
  useEffect(() => {
    const loadMindMap = async () => {
      try {
        // 动态导入simple-mind-map
        const mindMapModule = await import('simple-mind-map');
        MindMap = mindMapModule.default;

        setImportStatus('success');
        console.log('simple-mind-map 导入成功:', MindMap);

        // 检查MindMap构造函数是否可用
        if (typeof MindMap === 'function') {
          console.log('MindMap 构造函数可用');
        } else {
          throw new Error('MindMap 不是一个有效的构造函数');
        }

      } catch (error) {
        console.error('simple-mind-map 导入失败:', error);
        setImportStatus('error');
        setErrorMessage(error instanceof Error ? error.message : '未知错误');
      }
    };

    loadMindMap();
  }, []);

  // 创建脑图实例
  const createMindMap = () => {
    if (!containerRef.current || !MindMap) {
      console.error('容器或MindMap类不可用');
      return;
    }

    try {
      // 清空容器
      containerRef.current.innerHTML = '';

      // 创建脑图实例
      const mindMap = new MindMap({
        el: containerRef.current,
        data: {
          "data": {
            "text": "根节点"
          },
          "children": [
            {
              "data": {
                "text": "子节点1"
              },
              "children": [
                {
                  "data": {
                    "text": "子子节点1"
                  }
                },
                {
                  "data": {
                    "text": "子子节点2"
                  }
                }
              ]
            },
            {
              "data": {
                "text": "子节点2"
              }
            }
          ]
        },
        layout: 'logicalStructure',
        theme: 'default',
        viewData: {
          scale: 1,
          x: 0,
          y: 0
        }
      });

      setMindMapInstance(mindMap);
      console.log('脑图实例创建成功:', mindMap);

    } catch (error) {
      console.error('创建脑图实例失败:', error);
      setErrorMessage(error instanceof Error ? error.message : '创建实例失败');
    }
  };

  // 销毁脑图实例
  const destroyMindMap = () => {
    if (mindMapInstance) {
      try {
        mindMapInstance.destroy();
        setMindMapInstance(null);
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
        console.log('脑图实例已销毁');
      } catch (error) {
        console.error('销毁脑图实例失败:', error);
      }
    }
  };

  // 测试基本API
  const testBasicAPI = () => {
    if (!mindMapInstance) {
      alert('请先创建脑图实例');
      return;
    }

    try {
      // 测试获取数据
      const data = mindMapInstance.getData();
      console.log('获取脑图数据:', data);

      // 测试设置主题
      mindMapInstance.setTheme('blueSky');
      console.log('主题设置成功');

      // 测试缩放
      mindMapInstance.view.scale(1.2);
      console.log('缩放测试成功');

      alert('基本API测试通过！请查看控制台输出');
    } catch (error) {
      console.error('API测试失败:', error);
      alert('API测试失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          simple-mind-map 包测试
        </h1>

        {/* 导入状态 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>导入状态</CardTitle>
            <CardDescription>
              检查simple-mind-map包是否可以正常导入
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className={`w-3 h-3 rounded-full ${
                importStatus === 'loading' ? 'bg-yellow-500' :
                importStatus === 'success' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="font-medium">
                {importStatus === 'loading' && '正在导入...'}
                {importStatus === 'success' && '导入成功'}
                {importStatus === 'error' && '导入失败'}
              </span>
              {errorMessage && (
                <span className="text-red-600 text-sm">
                  错误: {errorMessage}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 控制按钮 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>功能测试</CardTitle>
            <CardDescription>
              测试simple-mind-map的基本功能
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Button 
                onClick={createMindMap}
                disabled={importStatus !== 'success' || mindMapInstance !== null}
              >
                创建脑图实例
              </Button>
              <Button 
                onClick={testBasicAPI}
                disabled={!mindMapInstance}
                variant="outline"
              >
                测试基本API
              </Button>
              <Button 
                onClick={destroyMindMap}
                disabled={!mindMapInstance}
                variant="outline"
              >
                销毁实例
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 脑图容器 */}
        <Card>
          <CardHeader>
            <CardTitle>脑图显示区域</CardTitle>
            <CardDescription>
              simple-mind-map实例将在这里渲染
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              ref={containerRef}
              className="w-full h-96 border border-gray-300 rounded-lg bg-white"
              style={{ minHeight: '400px' }}
            >
              {!mindMapInstance && (
                <div className="h-full flex items-center justify-center text-gray-500">
                  点击"创建脑图实例"按钮开始测试
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 测试结果 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>测试说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• <strong>导入测试</strong>: 验证simple-mind-map包是否可以正常导入</p>
              <p>• <strong>实例创建</strong>: 验证是否可以创建MindMap实例</p>
              <p>• <strong>基本渲染</strong>: 验证脑图是否可以正常显示</p>
              <p>• <strong>API调用</strong>: 验证基本API方法是否可用</p>
              <p>• <strong>主题切换</strong>: 验证主题设置功能</p>
              <p>• <strong>视图操作</strong>: 验证缩放等视图操作</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
