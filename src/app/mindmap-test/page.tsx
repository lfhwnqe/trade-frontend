"use client";

import { useState } from 'react';
import { useAlert } from '@/components/common/alert';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  parseMindMap,
  uploadAndStoreMindMap,
  searchNodes,
  getSubgraph,
  testGraphRAG,
  batchTestGraphRAG,
  performanceTestGraphRAG,
  formatFileSize,
  detectMindMapFormat,
  type MindMapParseResponse,
  type GraphCreateResponse,
  type NodeSearchResult,
  type SubgraphNode,
  type GRAGTestResult,
  type GRAGBatchTestResult,
  type GRAGPerformanceTestResult
} from './mindmap-request';

export default function MindMapTestPage() {
  const [showSuccess, showError] = useAlert();

  // 辅助函数：统一的 alert 显示
  const showAlert = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      showSuccess(message);
    } else {
      showError(message);
    }
  };

  // 状态管理
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('content');
  
  // 思维导图内容解析
  const [mindMapContent, setMindMapContent] = useState('');
  const [mindMapFormat, setMindMapFormat] = useState('freemind');
  const [parseResult, setParseResult] = useState<MindMapParseResponse | null>(null);
  
  // 文件上传
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<GraphCreateResponse | null>(null);
  
  // 搜索功能
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<NodeSearchResult[]>([]);
  
  // 子图查询
  const [graphId, setGraphId] = useState('');
  const [nodeId, setNodeId] = useState('');
  const [subgraphData, setSubgraphData] = useState<SubgraphNode[]>([]);

  // G-RAG测试
  const [gragQuery, setGragQuery] = useState('');
  const [gragBatchQueries, setGragBatchQueries] = useState('');
  const [gragPerformanceIterations, setGragPerformanceIterations] = useState(10);
  const [gragTestResult, setGragTestResult] = useState<GRAGTestResult | null>(null);
  const [gragBatchResult, setGragBatchResult] = useState<GRAGBatchTestResult | null>(null);
  const [gragPerformanceResult, setGragPerformanceResult] = useState<GRAGPerformanceTestResult | null>(null);

  // 处理内容解析
  const handleContentParse = async () => {
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

      setParseResult(response);
      showAlert('思维导图解析成功', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '思维导图解析失败';
      setError(errorMessage);
      showAlert(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 处理文件上传
  const handleFileUpload = async () => {
    if (!selectedFile) {
      showAlert('请选择思维导图文件', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const detectedFormat = detectMindMapFormat(selectedFile.name);
      const response = await uploadAndStoreMindMap(selectedFile, detectedFormat);

      setUploadResult(response);
      showAlert('思维导图文件上传成功', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '思维导图文件上传失败';
      setError(errorMessage);
      showAlert(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 处理节点搜索
  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      showAlert('请输入搜索关键词', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await searchNodes(searchKeyword.trim());
      setSearchResults(results);
      showAlert(`找到 ${results.length} 个匹配的节点`, 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '节点搜索失败';
      setError(errorMessage);
      showAlert(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 处理子图查询
  const handleSubgraphQuery = async () => {
    if (!graphId.trim() || !nodeId.trim()) {
      showAlert('请输入图ID和节点ID', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getSubgraph(graphId.trim(), nodeId.trim());
      setSubgraphData(data);
      showAlert(`获取到 ${data.length} 个相关节点`, 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '子图查询失败';
      setError(errorMessage);
      showAlert(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 处理G-RAG单次测试
  const handleGRAGTest = async () => {
    if (!gragQuery.trim()) {
      showAlert('请输入G-RAG测试查询', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await testGraphRAG({ query: gragQuery.trim() });
      setGragTestResult(result);
      showAlert('G-RAG测试完成', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'G-RAG测试失败';
      setError(errorMessage);
      showAlert(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 处理G-RAG批量测试
  const handleGRAGBatchTest = async () => {
    const queries = gragBatchQueries.split('\n').filter(q => q.trim());
    if (queries.length === 0) {
      showAlert('请输入批量测试查询（每行一个）', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await batchTestGraphRAG({ queries });
      setGragBatchResult(result);
      showAlert(`G-RAG批量测试完成，测试了 ${queries.length} 个查询`, 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'G-RAG批量测试失败';
      setError(errorMessage);
      showAlert(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 处理G-RAG性能测试
  const handleGRAGPerformanceTest = async () => {
    if (gragPerformanceIterations < 1 || gragPerformanceIterations > 100) {
      showAlert('迭代次数应在1-100之间', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await performanceTestGraphRAG(gragPerformanceIterations);
      setGragPerformanceResult(result);
      showAlert(`G-RAG性能测试完成，执行了 ${gragPerformanceIterations} 次迭代`, 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'G-RAG性能测试失败';
      setError(errorMessage);
      showAlert(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 清空结果
  const handleClear = () => {
    setMindMapContent('');
    setSelectedFile(null);
    setSearchKeyword('');
    setGraphId('');
    setNodeId('');
    setGragQuery('');
    setGragBatchQueries('');
    setGragPerformanceIterations(10);
    setParseResult(null);
    setUploadResult(null);
    setSearchResults([]);
    setSubgraphData([]);
    setGragTestResult(null);
    setGragBatchResult(null);
    setGragPerformanceResult(null);
    setError(null);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">思维导图解析测试</h1>
        <p className="text-muted-foreground">
          测试思维导图解析功能，支持FreeMind、OPML、JSON、Markdown等格式
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">错误信息</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="content">内容解析</TabsTrigger>
          <TabsTrigger value="upload">文件上传</TabsTrigger>
          <TabsTrigger value="search">节点搜索</TabsTrigger>
          <TabsTrigger value="subgraph">子图查询</TabsTrigger>
          <TabsTrigger value="g-rag">G-RAG测试</TabsTrigger>
        </TabsList>

        {/* 内容解析 */}
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>思维导图内容解析</CardTitle>
              <CardDescription>
                直接输入思维导图内容进行解析
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="format">格式选择</Label>
                <Select value={mindMapFormat} onValueChange={setMindMapFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="freemind">FreeMind (.mm)</SelectItem>
                    <SelectItem value="opml">OPML (.opml)</SelectItem>
                    <SelectItem value="json">JSON (.json)</SelectItem>
                    <SelectItem value="markdown">Markdown (.md)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">思维导图内容</Label>
                <Textarea
                  id="content"
                  value={mindMapContent}
                  onChange={(e) => setMindMapContent(e.target.value)}
                  placeholder={`请输入${mindMapFormat === 'freemind' ? 'FreeMind XML' : mindMapFormat === 'json' ? 'JSON格式' : 'Markdown格式'}的思维导图内容...`}
                  className="min-h-[200px] font-mono text-sm"
                  disabled={loading}
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={handleContentParse}
                  disabled={loading || !mindMapContent.trim()}
                  className="flex-1"
                >
                  {loading ? '解析中...' : '解析思维导图'}
                </Button>
                <Button variant="outline" onClick={handleClear}>
                  清空
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 文件上传 */}
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>思维导图文件上传</CardTitle>
              <CardDescription>
                上传思维导图文件并直接存储到数据库
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">选择文件</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".mm,.opml,.json,.md,.markdown"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  disabled={loading}
                />
                {selectedFile && (
                  <div className="text-sm text-muted-foreground">
                    文件: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleFileUpload}
                  disabled={loading || !selectedFile}
                  className="flex-1"
                >
                  {loading ? '上传中...' : '上传并存储'}
                </Button>
                <Button variant="outline" onClick={handleClear}>
                  清空
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 节点搜索 */}
        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle>节点搜索</CardTitle>
              <CardDescription>
                根据关键词搜索思维导图中的节点
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="keyword">搜索关键词</Label>
                <Input
                  id="keyword"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="输入要搜索的关键词..."
                  disabled={loading}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSearch}
                  disabled={loading || !searchKeyword.trim()}
                  className="flex-1"
                >
                  {loading ? '搜索中...' : '搜索节点'}
                </Button>
                <Button variant="outline" onClick={handleClear}>
                  清空
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 子图查询 */}
        <TabsContent value="subgraph">
          <Card>
            <CardHeader>
              <CardTitle>子图查询</CardTitle>
              <CardDescription>
                获取指定节点的上下文子图
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="graphId">图ID</Label>
                  <Input
                    id="graphId"
                    value={graphId}
                    onChange={(e) => setGraphId(e.target.value)}
                    placeholder="输入图ID..."
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nodeId">节点ID</Label>
                  <Input
                    id="nodeId"
                    value={nodeId}
                    onChange={(e) => setNodeId(e.target.value)}
                    placeholder="输入节点ID..."
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSubgraphQuery}
                  disabled={loading || !graphId.trim() || !nodeId.trim()}
                  className="flex-1"
                >
                  {loading ? '查询中...' : '查询子图'}
                </Button>
                <Button variant="outline" onClick={handleClear}>
                  清空
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* G-RAG测试 */}
        <TabsContent value="g-rag">
          <div className="space-y-6">
            {/* 单次测试 */}
            <Card>
              <CardHeader>
                <CardTitle>G-RAG单次测试</CardTitle>
                <CardDescription>
                  测试单个查询的图数据RAG搜索效果
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gragQuery">测试查询</Label>
                  <Input
                    id="gragQuery"
                    value={gragQuery}
                    onChange={(e) => setGragQuery(e.target.value)}
                    placeholder="输入要测试的查询..."
                    disabled={loading}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleGRAGTest}
                    disabled={loading || !gragQuery.trim()}
                    className="flex-1"
                  >
                    {loading ? '测试中...' : '开始测试'}
                  </Button>
                  <Button variant="outline" onClick={handleClear}>
                    清空
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 批量测试 */}
            <Card>
              <CardHeader>
                <CardTitle>G-RAG批量测试</CardTitle>
                <CardDescription>
                  批量测试多个查询的搜索效果
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gragBatchQueries">批量查询（每行一个）</Label>
                  <Textarea
                    id="gragBatchQueries"
                    value={gragBatchQueries}
                    onChange={(e) => setGragBatchQueries(e.target.value)}
                    placeholder={`中心主题\n分支\n子分支\n节点\n测试`}
                    className="min-h-[120px]"
                    disabled={loading}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleGRAGBatchTest}
                    disabled={loading || !gragBatchQueries.trim()}
                    className="flex-1"
                  >
                    {loading ? '批量测试中...' : '开始批量测试'}
                  </Button>
                  <Button variant="outline" onClick={handleClear}>
                    清空
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 性能测试 */}
            <Card>
              <CardHeader>
                <CardTitle>G-RAG性能测试</CardTitle>
                <CardDescription>
                  测试图数据RAG搜索的性能指标
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gragIterations">迭代次数</Label>
                  <Input
                    id="gragIterations"
                    type="number"
                    min="1"
                    max="100"
                    value={gragPerformanceIterations}
                    onChange={(e) => setGragPerformanceIterations(parseInt(e.target.value) || 10)}
                    disabled={loading}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleGRAGPerformanceTest}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? '性能测试中...' : '开始性能测试'}
                  </Button>
                  <Button variant="outline" onClick={handleClear}>
                    清空
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* 结果显示区域 */}
      {(parseResult || uploadResult || searchResults.length > 0 || subgraphData.length > 0 || gragTestResult || gragBatchResult || gragPerformanceResult) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>结果</CardTitle>
          </CardHeader>
          <CardContent>
            {parseResult && (
              <div className="space-y-4">
                <h3 className="font-semibold">解析结果</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Badge variant="outline">节点数: {parseResult.data?.nodes.length || 0}</Badge>
                  </div>
                  <div>
                    <Badge variant="outline">连接数: {parseResult.data?.links.length || 0}</Badge>
                  </div>
                </div>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-96">
                  {JSON.stringify(parseResult, null, 2)}
                </pre>
              </div>
            )}

            {uploadResult && (
              <div className="space-y-4">
                <h3 className="font-semibold">上传结果</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Badge variant="outline">图ID: {uploadResult.graphId}</Badge>
                  </div>
                  <div>
                    <Badge variant="outline">节点数: {uploadResult.nodeCount}</Badge>
                  </div>
                  <div>
                    <Badge variant="outline">边数: {uploadResult.edgeCount}</Badge>
                  </div>
                </div>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold">搜索结果 ({searchResults.length})</h3>
                <div className="space-y-2">
                  {searchResults.map((result, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="font-medium">{result.text}</div>
                      <div className="text-sm text-muted-foreground">
                        图ID: {result.graphId} | 节点ID: {result.nodeId}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {subgraphData.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold">子图数据 ({subgraphData.length})</h3>
                <div className="space-y-2">
                  {subgraphData.map((node, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="font-medium">{node.text}</div>
                      <div className="text-sm text-muted-foreground">
                        ID: {node.id} | 层级: {node.level}
                        {node.parentId && ` | 父节点: ${node.parentId}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {gragTestResult && (
              <div className="space-y-4">
                <h3 className="font-semibold">G-RAG单次测试结果</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <Badge variant={gragTestResult.success ? "default" : "destructive"}>
                      {gragTestResult.success ? "成功" : "失败"}
                    </Badge>
                  </div>
                  <div>
                    <Badge variant="outline">处理时间: {gragTestResult.processingTime}ms</Badge>
                  </div>
                  <div>
                    <Badge variant="outline">
                      匹配数: {gragTestResult.results?.keywordMatches || 0}
                    </Badge>
                  </div>
                </div>
                {gragTestResult.success && gragTestResult.results && (
                  <div className="space-y-2">
                    <h4 className="font-medium">上下文结果 ({gragTestResult.results.contextResults.length})</h4>
                    {gragTestResult.results.contextResults.map((result, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="font-medium">{result.text}</div>
                        <div className="text-sm text-muted-foreground mb-2">
                          图ID: {result.graphId} | 节点ID: {result.nodeId} | 上下文节点: {result.contextSize}
                        </div>
                        {result.error && (
                          <div className="text-sm text-red-600">错误: {result.error}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {gragTestResult.error && (
                  <div className="text-sm text-red-600">错误: {gragTestResult.error}</div>
                )}
              </div>
            )}

            {gragBatchResult && (
              <div className="space-y-4">
                <h3 className="font-semibold">G-RAG批量测试结果</h3>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <Badge variant="outline">总查询: {gragBatchResult.totalQueries}</Badge>
                  </div>
                  <div>
                    <Badge variant="outline">成功: {gragBatchResult.summary.successfulQueries}</Badge>
                  </div>
                  <div>
                    <Badge variant="outline">失败: {gragBatchResult.summary.failedQueries}</Badge>
                  </div>
                  <div>
                    <Badge variant="outline">平均时间: {Math.round(gragBatchResult.averageProcessingTime)}ms</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">详细结果</h4>
                  {gragBatchResult.results.map((result, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium">{result.query}</div>
                        <Badge variant={result.success ? "default" : "destructive"}>
                          {result.success ? "成功" : "失败"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        处理时间: {result.processingTime}ms | 匹配数: {result.keywordMatches} | 上下文节点: {result.totalContextNodes}
                      </div>
                      {result.error && (
                        <div className="text-sm text-red-600 mt-1">错误: {result.error}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {gragPerformanceResult && (
              <div className="space-y-4">
                <h3 className="font-semibold">G-RAG性能测试结果</h3>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <Badge variant="outline">成功率: {gragPerformanceResult.statistics.successRate.toFixed(1)}%</Badge>
                  </div>
                  <div>
                    <Badge variant="outline">平均时间: {Math.round(gragPerformanceResult.statistics.averageProcessingTime)}ms</Badge>
                  </div>
                  <div>
                    <Badge variant="outline">最小时间: {gragPerformanceResult.statistics.minProcessingTime}ms</Badge>
                  </div>
                  <div>
                    <Badge variant="outline">最大时间: {gragPerformanceResult.statistics.maxProcessingTime}ms</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Badge variant="outline">总匹配数: {gragPerformanceResult.statistics.totalMatches}</Badge>
                  </div>
                  <div>
                    <Badge variant="outline">总上下文节点: {gragPerformanceResult.statistics.totalContextNodes}</Badge>
                  </div>
                </div>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-96">
                  {JSON.stringify(gragPerformanceResult.results, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
