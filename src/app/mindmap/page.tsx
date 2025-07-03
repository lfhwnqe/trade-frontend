/**
 * 脑图主页面
 * 显示脑图列表和管理功能
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Brain, List, Settings } from 'lucide-react';

export default function MindMapPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          <Brain className="inline-block w-8 h-8 mr-2" />
          脑图管理
        </h1>
        <p className="text-gray-600">
          创建、编辑和管理您的思维导图
        </p>
      </div>

      {/* 快速操作卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* 创建新脑图 */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/mindmap/new">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">创建新脑图</CardTitle>
              <CardDescription>
                开始创建一个新的思维导图
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        {/* 脑图列表 */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/mindmap/list">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <List className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">我的脑图</CardTitle>
              <CardDescription>
                查看和管理已创建的脑图
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        {/* 设置 */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/mindmap/settings">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Settings className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">设置</CardTitle>
              <CardDescription>
                配置脑图编辑器选项
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>

      {/* 最近使用的脑图 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">最近使用</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 这里将显示最近使用的脑图，暂时显示占位符 */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="text-center text-gray-500">
                <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无最近使用的脑图</p>
                <p className="text-xs text-gray-400 mt-1">
                  创建您的第一个脑图开始使用
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 功能介绍 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">功能特色</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div>
              <h4 className="font-medium text-gray-900">多种布局支持</h4>
              <p className="text-sm text-gray-600">支持思维导图、组织结构图、时间轴等多种布局</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div>
              <h4 className="font-medium text-gray-900">实时保存</h4>
              <p className="text-sm text-gray-600">编辑内容自动保存，无需担心数据丢失</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
            <div>
              <h4 className="font-medium text-gray-900">丰富主题</h4>
              <p className="text-sm text-gray-600">多种主题样式，让您的脑图更加美观</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
            <div>
              <h4 className="font-medium text-gray-900">标签管理</h4>
              <p className="text-sm text-gray-600">使用标签对脑图进行分类和管理</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
