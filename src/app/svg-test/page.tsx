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
  formatFileSize,
  formatParseTime,
  getErrorSeverityColor,
  getErrorSeverityIcon,
  type SVGParseResponse,
  type ParseOptions,
  type ParseError
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

export default function SVGTestPage() {
  const [showAlert] = useAlert();
  const [activeTab, setActiveTab] = useState('string');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SVGParseResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 表单状态
  const [svgContent, setSvgContent] = useState('');
  const [svgUrl, setSvgUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
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
      
      setResult(response.data || null);
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
      
      setResult(response.data || null);
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
      
      setResult(response.data || null);
      showAlert('SVG文件解析成功', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'SVG文件解析失败';
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
      if (response.data?.valid) {
        showAlert('SVG格式验证通过', 'success');
      } else {
        showAlert(`SVG格式验证失败: ${response.data?.errors.length || 0}个错误`, 'error');
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
    setSelectedFile(null);
    setResult(null);
    setError(null);
  };

  // 复制结果
  const handleCopyResult = async () => {
    if (!result) return;
    
    try {
      const resultText = JSON.stringify(result, null, 2);
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
        <h1 className="text-4xl font-bold tracking-tight">SVG 解析测试</h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          测试SVG解析引擎的功能，支持字符串、URL和文件上传三种输入方式，将SVG转换为标准化的图数据结构
        </p>
      </div>

      {/* 快速示例 */}
      <Card>
        <CardHeader>
          <CardTitle>快速测试示例</CardTitle>
          <CardDescription>选择预设的SVG示例快速开始测试</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={() => applySample('simple')}
              disabled={loading}
            >
              简单示例
            </Button>
            <Button 
              variant="outline" 
              onClick={() => applySample('complex')}
              disabled={loading}
            >
              复杂示例
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 解析选项 */}
      <Card>
        <CardHeader>
          <CardTitle>解析选项</CardTitle>
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

      {/* 输入方式选择 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="string">字符串输入</TabsTrigger>
          <TabsTrigger value="url">URL输入</TabsTrigger>
          <TabsTrigger value="file">文件上传</TabsTrigger>
        </TabsList>

        {/* 字符串输入 */}
        <TabsContent value="string" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SVG字符串输入</CardTitle>
              <CardDescription>直接输入SVG代码进行解析</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="svgContent">SVG内容</Label>
                <Textarea
                  id="svgContent"
                  value={svgContent}
                  onChange={(e) => setSvgContent(e.target.value)}
                  placeholder="请输入SVG代码..."
                  className="min-h-[200px] font-mono text-sm"
                  disabled={loading}
                />
              </div>
              <div className="flex gap-3">
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
              <CardTitle>SVG文件上传</CardTitle>
              <CardDescription>上传本地SVG文件进行解析</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="svgFile">选择SVG文件</Label>
                <Input
                  id="svgFile"
                  type="file"
                  accept=".svg,image/svg+xml"
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
                onClick={handleFileParse}
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
      {result && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>解析结果</CardTitle>
              <CardDescription>
                解析状态: {result.success ? '成功' : '失败'} |
                解析时间: {formatParseTime(result.metrics.parseTime)}
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
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">{result.data?.nodes.length || 0}</div>
                <div className="text-sm text-muted-foreground">节点数量</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">{result.data?.edges.length || 0}</div>
                <div className="text-sm text-muted-foreground">边数量</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">{result.metrics.elementCount}</div>
                <div className="text-sm text-muted-foreground">元素总数</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">{formatFileSize(result.metrics.memoryUsage)}</div>
                <div className="text-sm text-muted-foreground">内存使用</div>
              </div>
            </div>

            {/* 错误信息 */}
            {result.errors.length > 0 && (
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

            {/* 节点信息 */}
            {result.data && result.data.nodes.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                  节点信息 (前5个)
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

            {/* 完整JSON响应 */}
            <details className="space-y-2">
              <summary className="text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground">
                📄 查看完整JSON响应
              </summary>
              <pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-60 border">
                {JSON.stringify(result, null, 2)}
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
              <h4 className="font-medium">🎯 支持的输入方式</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>字符串输入:</strong> 直接粘贴SVG代码</li>
                <li>• <strong>URL输入:</strong> 从网络地址获取SVG文件</li>
                <li>• <strong>文件上传:</strong> 上传本地SVG文件</li>
                <li>• <strong>格式验证:</strong> 检查SVG格式是否正确</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium">⚙️ 解析功能</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>节点提取:</strong> 识别SVG中的图形元素</li>
                <li>• <strong>边关系:</strong> 分析元素间的连接关系</li>
                <li>• <strong>文本提取:</strong> 提取文本内容和标签</li>
                <li>• <strong>样式解析:</strong> 解析颜色、大小等样式信息</li>
              </ul>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium">📊 性能特性</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>高性能:</strong> 支持最大1000个节点的复杂SVG解析</li>
              <li>• <strong>超时控制:</strong> 可配置解析超时时间，避免长时间等待</li>
              <li>• <strong>内存监控:</strong> 实时监控内存使用情况</li>
              <li>• <strong>错误处理:</strong> 详细的错误信息和位置定位</li>
              <li>• <strong>调试友好:</strong> 提供完整的解析过程信息</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
