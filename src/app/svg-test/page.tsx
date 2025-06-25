"use client";

import { useState } from 'react';
import { useAlert } from '@/components/common/alert';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  parseSVGFromString,
  parseSVGFromUrl,
  parseSVGFromFile,
  validateSVG,
  parseMindMap,
  uploadAndParseMindMap,
  formatFileSize,
  formatParseTime,
  getErrorSeverityColor,
  getErrorSeverityIcon,
  type SVGParseResponse,
  type ParseOptions,
  type ParseError,
  type MindMapParseResponse,
  type MindMapParseRequest
} from './request';

// 预设的SVG测试样例
const SVG_SAMPLES = {
  simple: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
  <rect id="node1" x="50" y="50" width="100" height="60" fill="#ff6b6b" stroke="#333" stroke-width="2"/>
  <text x="100" y="85" text-anchor="middle" font-family="Arial" font-size="14">节点1</text>

  <rect id="node2" x="250" y="50" width="100" height="60" fill="#4ecdc4" stroke="#333" stroke-width="2"/>
  <text x="300" y="85" text-anchor="middle" font-family="Arial" font-size="14">节点2</text>

  <line x1="150" y1="80" x2="250" y2="80" stroke="#333" stroke-width="2" marker-end="url(#arrowhead)"/>

  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#333"/>
    </marker>
  </defs>
</svg>`,

  complex: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <g id="mindmap">
    <circle id="center" cx="300" cy="200" r="40" fill="#ff6b6b" stroke="#333" stroke-width="3"/>
    <text x="300" y="205" text-anchor="middle" font-size="12">中心</text>

    <circle id="branch1" cx="150" cy="100" r="30" fill="#4ecdc4" stroke="#333" stroke-width="2"/>
    <text x="150" y="105" text-anchor="middle" font-size="10">分支1</text>

    <circle id="branch2" cx="450" cy="100" r="30" fill="#45b7d1" stroke="#333" stroke-width="2"/>
    <text x="450" y="105" text-anchor="middle" font-size="10">分支2</text>

    <circle id="branch3" cx="150" cy="300" r="30" fill="#f7dc6f" stroke="#333" stroke-width="2"/>
    <text x="150" y="305" text-anchor="middle" font-size="10">分支3</text>

    <line x1="270" y1="170" x2="180" y2="130" stroke="#666" stroke-width="2"/>
    <line x1="330" y1="170" x2="420" y2="130" stroke="#666" stroke-width="2"/>
    <line x1="270" y1="230" x2="180" y2="270" stroke="#666" stroke-width="2"/>
  </g>
</svg>`
};

// 预设的思维导图测试样例
const MINDMAP_SAMPLES = {
  freemind: `<?xml version="1.0" encoding="UTF-8"?>
<map version="1.0.1">
  <node COLOR="#000000" CREATED="1234567890" ID="ID_1" MODIFIED="1234567890" TEXT="中心主题">
    <font NAME="SansSerif" SIZE="20"/>
    <node COLOR="#0033ff" CREATED="1234567891" ID="ID_2" MODIFIED="1234567891" POSITION="right" TEXT="分支1">
      <edge STYLE="sharp_bezier" WIDTH="8"/>
      <font NAME="SansSerif" SIZE="18"/>
      <node COLOR="#00b439" CREATED="1234567892" ID="ID_3" MODIFIED="1234567892" TEXT="子分支1.1">
        <edge STYLE="bezier" WIDTH="thin"/>
        <font NAME="SansSerif" SIZE="16"/>
      </node>
      <node COLOR="#00b439" CREATED="1234567893" ID="ID_4" MODIFIED="1234567893" TEXT="子分支1.2">
        <edge STYLE="bezier" WIDTH="thin"/>
        <font NAME="SansSerif" SIZE="16"/>
      </node>
    </node>
    <node COLOR="#0033ff" CREATED="1234567895" ID="ID_6" MODIFIED="1234567895" POSITION="right" TEXT="分支2">
      <edge STYLE="sharp_bezier" WIDTH="8"/>
      <font NAME="SansSerif" SIZE="18"/>
      <node COLOR="#00b439" CREATED="1234567896" ID="ID_7" MODIFIED="1234567896" TEXT="子分支2.1">
        <edge STYLE="bezier" WIDTH="thin"/>
        <font NAME="SansSerif" SIZE="16"/>
      </node>
    </node>
  </node>
</map>`,

  json: `{
  "data": {
    "text": "中心主题"
  },
  "children": [
    {
      "data": {
        "text": "分支1"
      },
      "children": [
        {
          "data": {
            "text": "子分支1.1"
          },
          "children": []
        },
        {
          "data": {
            "text": "子分支1.2"
          },
          "children": []
        }
      ]
    },
    {
      "data": {
        "text": "分支2"
      },
      "children": [
        {
          "data": {
            "text": "子分支2.1"
          },
          "children": []
        }
      ]
    }
  ]
}`,

  markdown: `# 中心主题

- 分支1
  - 子分支1.1
  - 子分支1.2
- 分支2
  - 子分支2.1
- 分支3
  - 子分支3.1
  - 子分支3.2`
};

export default function SVGTestPage() {
  const [showAlert] = useAlert();
  const [activeTab, setActiveTab] = useState('string');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SVGParseResponse | null>(null);
  const [mindMapResult, setMindMapResult] = useState<MindMapParseResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parseMode, setParseMode] = useState<'svg' | 'mindmap'>('svg');

  // 表单状态
  const [svgContent, setSvgContent] = useState('');
  const [svgUrl, setSvgUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // 思维导图相关状态
  const [mindMapContent, setMindMapContent] = useState('');
  const [mindMapFormat, setMindMapFormat] = useState('freemind');
  
  // 解析选项
  const [options, setOptions] = useState<ParseOptions>({
    extractText: true,
    extractStyles: true,
    extractTransforms: true,
    ignoreHiddenElements: true,
    maxNodes: 1000,
    timeout: 30000,
    validateStructure: true,
  });

  // 处理字符串解析
  const handleStringParse = async () => {
    if (!svgContent.trim()) {
      showAlert('请输入SVG内容', 'error');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await parseSVGFromString({
        svgContent: svgContent.trim(),
        options,
      });

      setResult(response);
      showAlert('SVG解析成功', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'SVG解析失败';
      setError(errorMessage);
      showAlert(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 处理URL解析
  const handleUrlParse = async () => {
    if (!svgUrl.trim()) {
      showAlert('请输入SVG URL', 'error');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await parseSVGFromUrl({
        url: svgUrl.trim(),
        options,
      });

      setResult(response);
      showAlert('SVG URL解析成功', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'SVG URL解析失败';
      setError(errorMessage);
      showAlert(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 处理文件解析
  const handleFileParse = async () => {
    if (!selectedFile) {
      showAlert('请选择SVG文件', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await parseSVGFromFile(selectedFile, options);

      setResult(response);
      showAlert('SVG文件解析成功', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'SVG文件解析失败';
      setError(errorMessage);
      showAlert(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 处理思维导图内容解析
  const handleMindMapParse = async () => {
    if (!mindMapContent.trim()) {
      showAlert('请输入思维导图内容', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await parseMindMap({
        content: mindMapContent.trim(),
        format: mindMapFormat,
      });

      setMindMapResult(response);
      showAlert('思维导图解析成功', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '思维导图解析失败';
      setError(errorMessage);
      showAlert(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 处理思维导图文件解析
  const handleMindMapFileParse = async () => {
    if (!selectedFile) {
      showAlert('请选择思维导图文件', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await uploadAndParseMindMap(selectedFile, mindMapFormat);

      setMindMapResult(response);
      showAlert('思维导图文件解析成功', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '思维导图文件解析失败';
      setError(errorMessage);
      showAlert(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 应用示例SVG
  const applySample = (sampleKey: keyof typeof SVG_SAMPLES) => {
    setSvgContent(SVG_SAMPLES[sampleKey]);
    setActiveTab('string');
    setParseMode('svg');
  };

  // 应用思维导图示例
  const applyMindMapSample = (sampleKey: keyof typeof MINDMAP_SAMPLES) => {
    setMindMapContent(MINDMAP_SAMPLES[sampleKey]);
    setMindMapFormat(sampleKey === 'freemind' ? 'freemind' : sampleKey === 'json' ? 'json' : 'markdown');
    setActiveTab('string');
    setParseMode('mindmap');
  };

  // 验证SVG
  const handleValidate = async () => {
    if (!svgContent.trim()) {
      showAlert('请输入SVG内容进行验证', 'error');
      return;
    }

    setLoading(true);
    
    try {
      const response = await validateSVG(svgContent.trim());
      if (response.valid) {
        showAlert('SVG格式验证通过', 'success');
      } else {
        showAlert(`SVG格式验证失败: ${response.errors.length || 0}个错误`, 'error');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'SVG验证失败';
      showAlert(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 清空结果
  const handleClear = () => {
    setSvgContent('');
    setSvgUrl('');
    setMindMapContent('');
    setSelectedFile(null);
    setResult(null);
    setMindMapResult(null);
    setError(null);
  };

  // 复制结果
  const handleCopyResult = async () => {
    const currentResult = parseMode === 'svg' ? result : mindMapResult;
    if (!currentResult) return;

    try {
      const resultText = JSON.stringify(currentResult, null, 2);
      await navigator.clipboard.writeText(resultText);
      showAlert('结果已复制到剪贴板', 'success');
    } catch {
      showAlert('复制失败', 'error');
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl space-y-8">
      {/* 页面标题 */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">图数据解析测试</h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          测试图数据解析引擎的功能，支持SVG和思维导图解析，将各种格式转换为标准化的图数据结构，用于RAG检索和知识图谱构建
        </p>
      </div>

      {/* 解析模式选择 */}
      <Card>
        <CardHeader>
          <CardTitle>解析模式</CardTitle>
          <CardDescription>选择要解析的数据类型</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              variant={parseMode === 'svg' ? 'default' : 'outline'}
              onClick={() => setParseMode('svg')}
              disabled={loading}
            >
              SVG解析
            </Button>
            <Button
              variant={parseMode === 'mindmap' ? 'default' : 'outline'}
              onClick={() => setParseMode('mindmap')}
              disabled={loading}
            >
              思维导图解析
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 快速示例 */}
      <Card>
        <CardHeader>
          <CardTitle>快速测试示例</CardTitle>
          <CardDescription>
            {parseMode === 'svg' ? '选择预设的SVG示例快速开始测试' : '选择预设的思维导图示例快速开始测试'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {parseMode === 'svg' ? (
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => applySample('simple')}
                disabled={loading}
              >
                简单SVG示例
              </Button>
              <Button
                variant="outline"
                onClick={() => applySample('complex')}
                disabled={loading}
              >
                复杂SVG示例
              </Button>
            </div>
          ) : (
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => applyMindMapSample('freemind')}
                disabled={loading}
              >
                FreeMind示例
              </Button>
              <Button
                variant="outline"
                onClick={() => applyMindMapSample('json')}
                disabled={loading}
              >
                JSON示例
              </Button>
              <Button
                variant="outline"
                onClick={() => applyMindMapSample('markdown')}
                disabled={loading}
              >
                Markdown示例
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 解析选项 */}
      {parseMode === 'svg' && (
        <Card>
          <CardHeader>
            <CardTitle>SVG解析选项</CardTitle>
            <CardDescription>配置SVG解析的详细参数</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="extractText"
                  checked={options.extractText}
                  onCheckedChange={(checked) => setOptions(prev => ({ ...prev, extractText: checked }))}
                />
                <Label htmlFor="extractText">提取文本</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="extractStyles"
                  checked={options.extractStyles}
                  onCheckedChange={(checked) => setOptions(prev => ({ ...prev, extractStyles: checked }))}
                />
                <Label htmlFor="extractStyles">提取样式</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="extractTransforms"
                  checked={options.extractTransforms}
                  onCheckedChange={(checked) => setOptions(prev => ({ ...prev, extractTransforms: checked }))}
                />
                <Label htmlFor="extractTransforms">提取变换</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="validateStructure"
                  checked={options.validateStructure}
                  onCheckedChange={(checked) => setOptions(prev => ({ ...prev, validateStructure: checked }))}
                />
                <Label htmlFor="validateStructure">验证结构</Label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxNodes">最大节点数</Label>
                <Input
                  id="maxNodes"
                  type="number"
                  value={options.maxNodes}
                  onChange={(e) => setOptions(prev => ({ ...prev, maxNodes: parseInt(e.target.value) || 1000 }))}
                  min={1}
                  max={10000}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeout">超时时间(毫秒)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={options.timeout}
                  onChange={(e) => setOptions(prev => ({ ...prev, timeout: parseInt(e.target.value) || 30000 }))}
                  min={1000}
                  max={300000}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 思维导图格式选择 */}
      {parseMode === 'mindmap' && (
        <Card>
          <CardHeader>
            <CardTitle>思维导图格式</CardTitle>
            <CardDescription>选择要解析的思维导图格式</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="freemind"
                  name="mindMapFormat"
                  value="freemind"
                  checked={mindMapFormat === 'freemind'}
                  onChange={(e) => setMindMapFormat(e.target.value)}
                />
                <Label htmlFor="freemind">FreeMind (.mm)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="opml"
                  name="mindMapFormat"
                  value="opml"
                  checked={mindMapFormat === 'opml'}
                  onChange={(e) => setMindMapFormat(e.target.value)}
                />
                <Label htmlFor="opml">OPML</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="json"
                  name="mindMapFormat"
                  value="json"
                  checked={mindMapFormat === 'json'}
                  onChange={(e) => setMindMapFormat(e.target.value)}
                />
                <Label htmlFor="json">JSON</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="markdown"
                  name="mindMapFormat"
                  value="markdown"
                  checked={mindMapFormat === 'markdown'}
                  onChange={(e) => setMindMapFormat(e.target.value)}
                />
                <Label htmlFor="markdown">Markdown</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 输入方式选择 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="string">
            {parseMode === 'svg' ? 'SVG字符串' : '思维导图内容'}
          </TabsTrigger>
          <TabsTrigger value="url" disabled={parseMode === 'mindmap'}>
            URL输入
          </TabsTrigger>
          <TabsTrigger value="file">文件上传</TabsTrigger>
        </TabsList>

        {/* 字符串输入 */}
        <TabsContent value="string" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {parseMode === 'svg' ? 'SVG字符串输入' : '思维导图内容输入'}
              </CardTitle>
              <CardDescription>
                {parseMode === 'svg' ? '直接输入SVG代码进行解析' : '直接输入思维导图内容进行解析'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={parseMode === 'svg' ? 'svgContent' : 'mindMapContent'}>
                  {parseMode === 'svg' ? 'SVG内容' : '思维导图内容'}
                </Label>
                {parseMode === 'svg' ? (
                  <Textarea
                    id="svgContent"
                    value={svgContent}
                    onChange={(e) => setSvgContent(e.target.value)}
                    placeholder="请输入SVG代码..."
                    className="min-h-[200px] font-mono text-sm"
                    disabled={loading}
                  />
                ) : (
                  <Textarea
                    id="mindMapContent"
                    value={mindMapContent}
                    onChange={(e) => setMindMapContent(e.target.value)}
                    placeholder={`请输入${mindMapFormat === 'freemind' ? 'FreeMind XML' : mindMapFormat === 'json' ? 'JSON格式' : 'Markdown格式'}的思维导图内容...`}
                    className="min-h-[200px] font-mono text-sm"
                    disabled={loading}
                  />
                )}
              </div>
              <div className="flex gap-3">
                {parseMode === 'svg' ? (
                  <>
                    <Button
                      onClick={handleStringParse}
                      disabled={loading || !svgContent.trim()}
                      className="flex-1"
                    >
                      {loading ? '解析中...' : '解析SVG'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleValidate}
                      disabled={loading || !svgContent.trim()}
                    >
                      验证格式
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleMindMapParse}
                    disabled={loading || !mindMapContent.trim()}
                    className="flex-1"
                  >
                    {loading ? '解析中...' : '解析思维导图'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* URL输入 */}
        <TabsContent value="url" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SVG URL输入</CardTitle>
              <CardDescription>从URL地址获取SVG文件进行解析</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="svgUrl">SVG文件URL</Label>
                <Input
                  id="svgUrl"
                  type="url"
                  value={svgUrl}
                  onChange={(e) => setSvgUrl(e.target.value)}
                  placeholder="https://example.com/mindmap.svg"
                  disabled={loading}
                />
              </div>
              <Button
                onClick={handleUrlParse}
                disabled={loading || !svgUrl.trim()}
                className="w-full"
              >
                {loading ? '解析中...' : '从URL解析'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 文件上传 */}
        <TabsContent value="file" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {parseMode === 'svg' ? 'SVG文件上传' : '思维导图文件上传'}
              </CardTitle>
              <CardDescription>
                {parseMode === 'svg' ? '上传本地SVG文件进行解析' : '上传本地思维导图文件进行解析'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">
                  {parseMode === 'svg' ? '选择SVG文件' : '选择思维导图文件'}
                </Label>
                <Input
                  id="file"
                  type="file"
                  accept={parseMode === 'svg' ? '.svg,image/svg+xml' : '.mm,.opml,.json,.md,.markdown'}
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  disabled={loading}
                />
                {selectedFile && (
                  <div className="text-sm text-muted-foreground">
                    已选择: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </div>
                )}
              </div>
              <Button
                onClick={parseMode === 'svg' ? handleFileParse : handleMindMapFileParse}
                disabled={loading || !selectedFile}
                className="w-full"
              >
                {loading ? '解析中...' : '解析文件'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 错误显示 */}
      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">解析失败</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* 解析结果 */}
      {(result || mindMapResult) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>解析结果</CardTitle>
              <CardDescription>
                {parseMode === 'svg' && result ? (
                  <>
                    解析状态: {result.success ? '成功' : '失败'} |
                    解析时间: {result.metrics ? formatParseTime(result.metrics.parseTime) : '未知'}
                  </>
                ) : mindMapResult ? (
                  <>
                    解析状态: {mindMapResult.success ? '成功' : '失败'} |
                    格式: {mindMapResult.metadata?.format || '未知'}
                  </>
                ) : null}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyResult}
              >
                复制结果
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
              >
                清空
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 基本统计 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {parseMode === 'svg' && result ? (
                <>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">{result.data?.nodes.length || 0}</div>
                    <div className="text-sm text-muted-foreground">节点数量</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">{result.data?.edges.length || 0}</div>
                    <div className="text-sm text-muted-foreground">边数量</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">{result.metrics?.elementCount || 0}</div>
                    <div className="text-sm text-muted-foreground">元素总数</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">{result.metrics ? formatFileSize(result.metrics.memoryUsage) : '0 Bytes'}</div>
                    <div className="text-sm text-muted-foreground">内存使用</div>
                  </div>
                </>
              ) : mindMapResult ? (
                <>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">{mindMapResult.data?.mindMap.nodes.length || 0}</div>
                    <div className="text-sm text-muted-foreground">思维导图节点</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">{mindMapResult.data?.mindMap.links.length || 0}</div>
                    <div className="text-sm text-muted-foreground">连接关系</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">{mindMapResult.data?.graph.nodes.length || 0}</div>
                    <div className="text-sm text-muted-foreground">图节点</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">{mindMapResult.metadata?.fileSize ? formatFileSize(mindMapResult.metadata.fileSize) : '未知'}</div>
                    <div className="text-sm text-muted-foreground">文件大小</div>
                  </div>
                </>
              ) : null}
            </div>

            {/* 错误信息 */}
            {parseMode === 'svg' && result?.errors && result.errors.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                  解析错误 ({result.errors.length} 条)
                </h4>
                <div className="space-y-2">
                  {result.errors.map((error: ParseError, index: number) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-muted rounded-md"
                    >
                      <span className="text-lg">{getErrorSeverityIcon(error.severity)}</span>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={error.severity === 'error' ? 'destructive' : 'secondary'}>
                            {error.severity}
                          </Badge>
                          <span className="text-sm font-medium">{error.code}</span>
                        </div>
                        <p className="text-sm">{error.message}</p>
                        {(error.line || error.column) && (
                          <p className="text-xs text-muted-foreground">
                            位置: 行 {error.line}, 列 {error.column}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SVG节点信息 */}
            {parseMode === 'svg' && result?.data && result.data.nodes.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                  SVG节点信息 (前5个)
                </h4>
                <div className="space-y-2">
                  {result.data.nodes.slice(0, 5).map((node) => (
                    <div key={node.id} className="p-3 bg-muted rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{node.label || node.id}</span>
                          <Badge variant="outline" className="ml-2">{node.type}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {node.position.x}, {node.position.y}
                        </div>
                      </div>
                    </div>
                  ))}
                  {result.data.nodes.length > 5 && (
                    <div className="text-center text-sm text-muted-foreground">
                      还有 {result.data.nodes.length - 5} 个节点...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 思维导图节点信息 */}
            {parseMode === 'mindmap' && mindMapResult?.data && mindMapResult.data.mindMap.nodes.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                  思维导图节点信息 (前5个)
                </h4>
                <div className="space-y-2">
                  {mindMapResult.data.mindMap.nodes.slice(0, 5).map((node) => (
                    <div key={node.id} className="p-3 bg-muted rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{node.text}</span>
                        <Badge variant="outline">Level {node.level}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>ID: {node.id}</div>
                        <div>父节点: {node.parentId || '无'}</div>
                      </div>
                      {node.position && (
                        <div className="mt-2 pt-2 border-t border-border">
                          <div className="text-xs text-muted-foreground">
                            位置: ({node.position.x}, {node.position.y})
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {mindMapResult.data.mindMap.nodes.length > 5 && (
                    <div className="text-center text-sm text-muted-foreground">
                      还有 {mindMapResult.data.mindMap.nodes.length - 5} 个节点...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 完整JSON响应 */}
            <details className="space-y-2">
              <summary className="text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground">
                📄 查看完整JSON响应
              </summary>
              <pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-60 border">
                {JSON.stringify(parseMode === 'svg' ? result : mindMapResult, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}

      {/* 功能说明 */}
      <Card>
        <CardHeader>
          <CardTitle>功能说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium">🎯 支持的解析模式</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>SVG解析:</strong> 解析SVG图形为图数据</li>
                <li>• <strong>思维导图解析:</strong> 支持多种思维导图格式</li>
                <li>• <strong>统一输出:</strong> 标准化的图数据结构</li>
                <li>• <strong>RAG集成:</strong> 适用于知识检索增强</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium">📄 思维导图格式</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>FreeMind:</strong> .mm格式文件</li>
                <li>• <strong>OPML:</strong> 大纲处理器标记语言</li>
                <li>• <strong>JSON:</strong> 结构化数据格式</li>
                <li>• <strong>Markdown:</strong> 层次化文本格式</li>
              </ul>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium">📊 应用场景</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>知识图谱:</strong> 构建结构化知识网络</li>
              <li>• <strong>RAG检索:</strong> 增强语言模型的知识检索</li>
              <li>• <strong>数据分析:</strong> 图结构数据挖掘和分析</li>
              <li>• <strong>可视化:</strong> 支持多种图可视化库</li>
              <li>• <strong>AI训练:</strong> 为机器学习提供图数据</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
