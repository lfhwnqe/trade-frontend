"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  RefreshCw,
  Save,
  RotateCcw,
  Zap,
  X
} from 'lucide-react';
import { DocumentType } from '../../types';
import { useRagTest } from '../useRagTest';
import { useState } from 'react';

interface SearchTestFormProps {
  onSearch: () => void;
  loading: boolean;
}

export function SearchTestForm({ onSearch, loading }: SearchTestFormProps) {
  const {
    searchForm,
    updateSearchForm,
    resetSearchForm,
    presets,
    applyPreset,
    saveUserConfig,
    loadUserConfig,
    getUserConfigs,
    deleteUserConfig,
  } = useRagTest();

  const [showPresets, setShowPresets] = useState(false);
  const [showSaveConfig, setShowSaveConfig] = useState(false);
  const [configName, setConfigName] = useState('');
  const userConfigs = getUserConfigs();

  // 处理文档类型添加
  const handleDocumentTypeAdd = (value: string) => {
    const currentTypes = searchForm.documentTypes;
    if (value && !currentTypes.includes(value as DocumentType)) {
      updateSearchForm('documentTypes', [...currentTypes, value as DocumentType]);
    }
  };

  // 处理文档类型移除
  const handleDocumentTypeRemove = (type: DocumentType) => {
    const currentTypes = searchForm.documentTypes;
    updateSearchForm('documentTypes', currentTypes.filter(t => t !== type));
  };

  // 处理标签添加
  const handleTagAdd = (tag: string) => {
    if (tag && !searchForm.tags.includes(tag)) {
      updateSearchForm('tags', [...searchForm.tags, tag]);
    }
  };

  // 处理标签移除
  const handleTagRemove = (tag: string) => {
    updateSearchForm('tags', searchForm.tags.filter(t => t !== tag));
  };

  // 保存配置
  const handleSaveConfig = () => {
    if (configName.trim()) {
      saveUserConfig(configName.trim());
      setConfigName('');
      setShowSaveConfig(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>搜索配置</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPresets(!showPresets)}
            >
              <Zap className="mr-1 h-4 w-4" />
              预设
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveConfig(!showSaveConfig)}
            >
              <Save className="mr-1 h-4 w-4" />
              保存
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetSearchForm}
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              重置
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          配置搜索参数并执行RAG查询
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 预设配置面板 */}
        {showPresets && (
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <h4 className="font-medium">预设配置</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {presets.map((preset) => (
                <div key={preset.name} className="border rounded-lg p-3">
                  <div className="font-medium text-sm">{preset.name}</div>
                  <div className="text-xs text-muted-foreground mb-2">
                    {preset.description}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyPreset(preset)}
                    className="w-full"
                  >
                    应用
                  </Button>
                </div>
              ))}
            </div>
            
            {/* 用户自定义配置 */}
            {userConfigs.length > 0 && (
              <div>
                <h5 className="font-medium text-sm mb-2">自定义配置</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {userConfigs.map((config) => (
                    <div key={config.name} className="flex items-center gap-2 p-2 border rounded">
                      <span className="flex-1 text-sm">{config.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => loadUserConfig(config)}
                      >
                        加载
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteUserConfig(config.name)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 保存配置面板 */}
        {showSaveConfig && (
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <h4 className="font-medium">保存当前配置</h4>
            <div className="flex gap-2">
              <Input
                placeholder="配置名称"
                value={configName}
                onChange={(e) => setConfigName(e.target.value)}
              />
              <Button onClick={handleSaveConfig} disabled={!configName.trim()}>
                保存
              </Button>
            </div>
          </div>
        )}

        {/* 查询文本 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            查询文本 *
          </label>
          <Textarea
            placeholder="输入您的问题或查询..."
            value={searchForm.query}
            onChange={(e) => updateSearchForm('query', e.target.value)}
            rows={3}
          />
        </div>

        {/* 搜索参数 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 最大结果数 */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              最大结果数: {searchForm.maxResults}
            </label>
            <Slider
              value={[searchForm.maxResults]}
              onValueChange={(value: number[]) => updateSearchForm('maxResults', value[0])}
              max={50}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1</span>
              <span>50</span>
            </div>
          </div>
          
          {/* 相似度阈值 */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              相似度阈值: {searchForm.similarityThreshold.toFixed(2)}
            </label>
            <Slider
              value={[searchForm.similarityThreshold]}
              onValueChange={(value: number[]) => updateSearchForm('similarityThreshold', value[0])}
              max={1}
              min={0}
              step={0.01}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0.00</span>
              <span>1.00</span>
            </div>
          </div>
        </div>

        {/* 文档类型筛选 */}
        <div className="space-y-3">
          <label className="text-sm font-medium">文档类型筛选</label>
          <Select onValueChange={handleDocumentTypeAdd}>
            <SelectTrigger>
              <SelectValue placeholder="选择文档类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DocumentType.TRADE}>交易文档</SelectItem>
              <SelectItem value={DocumentType.KNOWLEDGE}>知识文档</SelectItem>
              <SelectItem value={DocumentType.MANUAL}>手册文档</SelectItem>
              <SelectItem value={DocumentType.REPORT}>报告文档</SelectItem>
            </SelectContent>
          </Select>
          
          {/* 已选择的文档类型 */}
          {searchForm.documentTypes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {searchForm.documentTypes.map((type) => (
                <Badge key={type} variant="secondary" className="flex items-center gap-1">
                  {type === DocumentType.TRADE && '交易文档'}
                  {type === DocumentType.KNOWLEDGE && '知识文档'}
                  {type === DocumentType.MANUAL && '手册文档'}
                  {type === DocumentType.REPORT && '报告文档'}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleDocumentTypeRemove(type)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* 标签筛选 */}
        <div className="space-y-3">
          <label className="text-sm font-medium">标签筛选</label>
          <div className="flex gap-2">
            <Input
              placeholder="输入标签后按Enter添加"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleTagAdd(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>
          
          {/* 已选择的标签 */}
          {searchForm.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {searchForm.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleTagRemove(tag)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* 高级选项 */}
        <div className="space-y-3">
          <label className="text-sm font-medium">高级选项</label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={searchForm.rerankResults}
                onChange={(e) => updateSearchForm('rerankResults', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">重新排序结果</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={searchForm.includeMetadata}
                onChange={(e) => updateSearchForm('includeMetadata', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">包含元数据</span>
            </label>
          </div>
        </div>

        {/* 搜索按钮 */}
        <Button 
          onClick={onSearch}
          disabled={loading || !searchForm.query.trim()}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              搜索中...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              执行搜索
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}