/**
 * 脑图设置页面
 * 提供全局脑图编辑器配置选项
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  ArrowLeft, 
  Settings, 
  Save, 
  RotateCcw,
  Palette,
  Grid,
  Keyboard,
  Mouse,
  Eye,
  Clock
} from 'lucide-react';

interface SettingsData {
  // 编辑器设置
  autoSave: boolean;
  autoSaveInterval: number; // 秒
  showGrid: boolean;
  snapToGrid: boolean;
  
  // 视觉设置
  defaultTheme: string;
  defaultLayout: string;
  showMinimap: boolean;
  animationEnabled: boolean;
  
  // 交互设置
  keyboardShortcuts: boolean;
  mouseWheelZoom: boolean;
  dragToSelect: boolean;
  doubleClickToEdit: boolean;
  
  // 性能设置
  renderOptimization: boolean;
  maxHistorySteps: number;
}

const defaultSettings: SettingsData = {
  autoSave: true,
  autoSaveInterval: 30,
  showGrid: false,
  snapToGrid: false,
  defaultTheme: 'default',
  defaultLayout: 'logicalStructure',
  showMinimap: true,
  animationEnabled: true,
  keyboardShortcuts: true,
  mouseWheelZoom: true,
  dragToSelect: true,
  doubleClickToEdit: true,
  renderOptimization: true,
  maxHistorySteps: 50
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

export default function MindMapSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSettingChange = (key: keyof SettingsData, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: 保存设置到后端或本地存储
      console.log('保存设置:', settings);
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setHasChanges(false);
      // 显示保存成功提示
    } catch (error) {
      console.error('保存设置失败:', error);
      alert('保存设置失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('确定要重置所有设置为默认值吗？')) {
      setSettings(defaultSettings);
      setHasChanges(true);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      if (confirm('您有未保存的更改，确定要离开吗？')) {
        router.back();
      }
    } else {
      router.back();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Button variant="ghost" onClick={handleBack} className="mr-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              <Settings className="inline-block w-8 h-8 mr-2" />
              脑图设置
            </h1>
            <p className="text-gray-600">
              配置脑图编辑器的全局选项
            </p>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            重置
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || isSaving}
            className="flex items-center space-x-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>保存中...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>保存设置</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        {/* 编辑器设置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              编辑器设置
            </CardTitle>
            <CardDescription>
              配置编辑器的基本行为
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 自动保存 */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">自动保存</Label>
                <div className="text-sm text-gray-500">
                  编辑时自动保存更改
                </div>
              </div>
              <Switch
                checked={settings.autoSave}
                onCheckedChange={(checked) => handleSettingChange('autoSave', checked)}
              />
            </div>

            {/* 自动保存间隔 */}
            {settings.autoSave && (
              <div className="space-y-2">
                <Label className="text-base">自动保存间隔</Label>
                <div className="flex items-center space-x-4">
                  <Slider
                    value={[settings.autoSaveInterval]}
                    onValueChange={(value) => handleSettingChange('autoSaveInterval', value[0])}
                    max={300}
                    min={10}
                    step={10}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600 w-16">
                    {settings.autoSaveInterval}秒
                  </span>
                </div>
              </div>
            )}

            {/* 网格显示 */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base flex items-center">
                  <Grid className="w-4 h-4 mr-2" />
                  显示网格
                </Label>
                <div className="text-sm text-gray-500">
                  在编辑器中显示背景网格
                </div>
              </div>
              <Switch
                checked={settings.showGrid}
                onCheckedChange={(checked) => handleSettingChange('showGrid', checked)}
              />
            </div>

            {/* 网格吸附 */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">网格吸附</Label>
                <div className="text-sm text-gray-500">
                  移动节点时自动对齐到网格
                </div>
              </div>
              <Switch
                checked={settings.snapToGrid}
                onCheckedChange={(checked) => handleSettingChange('snapToGrid', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* 视觉设置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Palette className="w-5 h-5 mr-2" />
              视觉设置
            </CardTitle>
            <CardDescription>
              配置默认的视觉样式和效果
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 默认主题 */}
            <div className="space-y-2">
              <Label className="text-base">默认主题</Label>
              <Select
                value={settings.defaultTheme}
                onValueChange={(value) => handleSettingChange('defaultTheme', value)}
              >
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

            {/* 默认布局 */}
            <div className="space-y-2">
              <Label className="text-base">默认布局</Label>
              <Select
                value={settings.defaultLayout}
                onValueChange={(value) => handleSettingChange('defaultLayout', value)}
              >
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

            {/* 显示小地图 */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base flex items-center">
                  <Eye className="w-4 h-4 mr-2" />
                  显示小地图
                </Label>
                <div className="text-sm text-gray-500">
                  在编辑器中显示导航小地图
                </div>
              </div>
              <Switch
                checked={settings.showMinimap}
                onCheckedChange={(checked) => handleSettingChange('showMinimap', checked)}
              />
            </div>

            {/* 动画效果 */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">动画效果</Label>
                <div className="text-sm text-gray-500">
                  启用节点移动和缩放动画
                </div>
              </div>
              <Switch
                checked={settings.animationEnabled}
                onCheckedChange={(checked) => handleSettingChange('animationEnabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* 交互设置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mouse className="w-5 h-5 mr-2" />
              交互设置
            </CardTitle>
            <CardDescription>
              配置鼠标和键盘交互行为
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 键盘快捷键 */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base flex items-center">
                  <Keyboard className="w-4 h-4 mr-2" />
                  键盘快捷键
                </Label>
                <div className="text-sm text-gray-500">
                  启用键盘快捷键操作
                </div>
              </div>
              <Switch
                checked={settings.keyboardShortcuts}
                onCheckedChange={(checked) => handleSettingChange('keyboardShortcuts', checked)}
              />
            </div>

            {/* 鼠标滚轮缩放 */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">鼠标滚轮缩放</Label>
                <div className="text-sm text-gray-500">
                  使用鼠标滚轮进行缩放
                </div>
              </div>
              <Switch
                checked={settings.mouseWheelZoom}
                onCheckedChange={(checked) => handleSettingChange('mouseWheelZoom', checked)}
              />
            </div>

            {/* 拖拽选择 */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">拖拽选择</Label>
                <div className="text-sm text-gray-500">
                  拖拽鼠标选择多个节点
                </div>
              </div>
              <Switch
                checked={settings.dragToSelect}
                onCheckedChange={(checked) => handleSettingChange('dragToSelect', checked)}
              />
            </div>

            {/* 双击编辑 */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">双击编辑</Label>
                <div className="text-sm text-gray-500">
                  双击节点进入编辑模式
                </div>
              </div>
              <Switch
                checked={settings.doubleClickToEdit}
                onCheckedChange={(checked) => handleSettingChange('doubleClickToEdit', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* 性能设置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              性能设置
            </CardTitle>
            <CardDescription>
              配置性能优化选项
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 渲染优化 */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">渲染优化</Label>
                <div className="text-sm text-gray-500">
                  启用渲染性能优化
                </div>
              </div>
              <Switch
                checked={settings.renderOptimization}
                onCheckedChange={(checked) => handleSettingChange('renderOptimization', checked)}
              />
            </div>

            {/* 历史记录步数 */}
            <div className="space-y-2">
              <Label className="text-base">最大历史记录步数</Label>
              <div className="flex items-center space-x-4">
                <Slider
                  value={[settings.maxHistorySteps]}
                  onValueChange={(value) => handleSettingChange('maxHistorySteps', value[0])}
                  max={100}
                  min={10}
                  step={10}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 w-16">
                  {settings.maxHistorySteps}步
                </span>
              </div>
              <div className="text-sm text-gray-500">
                控制撤销/重做的最大步数，较大的值会占用更多内存
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
