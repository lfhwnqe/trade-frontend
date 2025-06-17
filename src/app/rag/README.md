# RAG 知识库模块 - 完整使用指南

## 概述

RAG (Retrieval-Augmented Generation) 知识库模块是一个智能检索增强生成系统，支持文档上传、向量化处理、语义搜索等功能。

## 功能特性

### 🏠 RAG 首页 (`/rag`)
- **系统概览**: 实时统计数据和健康状态监控
- **快速搜索**: 支持 Ctrl+K 快捷键的智能搜索
- **最近活动**: 显示系统处理活动时间线
- **快速开始**: 新用户引导和使用指南
- **系统架构**: 展示核心技术组件

### 📊 数据管理 (`/rag/manage`)
- **文档上传**: 支持多种格式文档上传
- **状态监控**: 实时查看文档处理状态和进度
- **批量操作**: 支持批量选择和操作
- **高级筛选**: 按类型、状态、时间等条件筛选
- **详情查看**: 文档元数据和处理详情

### 🔍 RAG 测试 (`/rag/test`)
- **智能搜索**: 语义搜索和相似度匹配
- **搜索历史**: 保存和管理搜索记录
- **统计分析**: 搜索性能和结果质量分析
- **上下文预览**: 搜索结果的上下文信息
- **快捷键支持**: 多种快捷键提升操作效率

## 快捷键支持

### 全局快捷键
- `Ctrl/Cmd + K`: 聚焦搜索框
- `Ctrl/Cmd + Enter`: 执行搜索
- `Ctrl/Cmd + R`: 刷新页面数据

### RAG 测试页面
- `Ctrl/Cmd + 1`: 切换到搜索测试
- `Ctrl/Cmd + H`: 切换到搜索历史
- `Ctrl/Cmd + S`: 切换到统计分析

## 组件架构

### 共用组件 (`/components/rag/`)

#### 状态组件
- `StatusBadge`: 文档状态徽章
- `DocumentTypeBadge`: 文档类型徽章
- `ProgressIndicator`: 处理进度指示器

#### 加载组件
- `LoadingSpinner`: 通用加载指示器
- `PageLoading`: 页面级加载状态
- `DataLoadingState`: 数据加载状态管理
- `ButtonLoading`: 按钮加载状态

#### 错误处理
- `ErrorBoundary`: React 错误边界
- `NetworkErrorRetry`: 网络错误重试
- `useErrorHandler`: 错误处理 Hook

### 页面组件

#### RAG 首页组件
- 系统状态监控卡片
- 实时统计数据展示
- 快速搜索栏
- 最近活动时间线
- 功能导航卡片

#### 数据管理组件
- 文档列表表格
- 添加/编辑文档对话框
- 文档详情查看
- 筛选表单
- 统计卡片

#### 测试页面组件
- 搜索测试表单
- 搜索结果展示
- 搜索历史管理
- 统计分析图表
- 上下文预览

## 响应式设计

### 移动端优化
- 表格水平滚动支持
- 统计卡片自适应布局
- 搜索表单垂直堆叠
- 对话框移动端适配
- 导航简化显示

### 大屏幕优化
- 多列网格布局
- 扩展信息显示
- 更大的操作区域
- 优化的视觉层次

### 打印样式
- 隐藏交互元素
- 优化文档布局
- 避免分页断行

## 性能优化

### 代码层面
- React.memo 优化渲染
- useMemo 缓存计算结果
- useCallback 避免重复创建函数
- 懒加载大型组件

### 网络层面
- 接口防抖处理
- 数据缓存策略
- 错误重试机制
- 分页加载

### 用户体验
- 骨架屏加载状态
- 即时反馈提示
- 渐进式增强
- 优雅降级

## 状态管理

### 全局状态 (Jotai + Immer)
```typescript
interface RAGGlobalState {
  manage: DocumentManageState;    // 文档管理状态
  test: RAGTestState;            // 搜索测试状态
  analytics: RAGAnalyticsState;  // 统计数据状态
  health: HealthState;           // 系统健康状态
}
```

### 辅助函数
- `processDocumentQuery`: 处理文档查询参数
- `processSearchQuery`: 处理搜索查询参数
- `addSearchHistory`: 添加搜索历史
- `getDocumentStatusStats`: 获取状态统计
- `formatTimestamp`: 格式化时间戳

## API 接口

### 文档管理接口
- `POST /rag/documents`: 创建文档
- `GET /rag/documents`: 获取文档列表
- `GET /rag/documents/:id`: 获取单个文档
- `PUT /rag/documents/:id`: 更新文档
- `DELETE /rag/documents/:id`: 删除文档

### 搜索接口
- `POST /rag/search`: 搜索文档

### 系统接口
- `GET /rag/analytics`: 获取统计数据
- `GET /rag/health`: 健康检查

## 错误处理

### 错误边界
- 页面级错误捕获
- 组件级错误隔离
- 用户友好错误提示
- 错误上报机制

### 网络错误
- 自动重试机制
- 超时处理
- 连接状态检测
- 离线模式支持

### 用户错误
- 表单验证
- 输入格式检查
- 权限验证
- 操作确认

## 可访问性 (a11y)

### 键盘导航
- Tab 顺序优化
- 快捷键支持
- 焦点管理
- 屏幕阅读器支持

### 视觉辅助
- 高对比度模式
- 减少动画偏好
- 字体大小适配
- 色彩无障碍

### 语义化 HTML
- 正确的标签使用
- ARIA 属性支持
- 表单标签关联
- 导航结构清晰

## 开发指南

### 添加新功能
1. 在 `types.ts` 中定义类型
2. 在 `request.ts` 中添加 API 调用
3. 在 `atom.ts` 中更新状态结构
4. 创建相应的组件和页面
5. 添加路由和导航

### 组件开发规范
- 使用 TypeScript 严格模式
- 遵循命名约定
- 添加 JSDoc 注释
- 支持响应式设计
- 包含错误处理

### 样式规范
- 使用 Tailwind CSS
- 响应式断点统一
- 深色模式支持
- 自定义 CSS 类前缀 `rag-`

## 部署和配置

### 环境变量
```bash
# API 端点配置
NEXT_PUBLIC_API_BASE_URL=https://api.example.com

# RAG 系统配置
NEXT_PUBLIC_RAG_MAX_FILE_SIZE=10485760
NEXT_PUBLIC_RAG_SUPPORTED_TYPES=.pdf,.txt,.docx
```

### 构建优化
- 代码分割
- Tree shaking
- 图片优化
- 静态资源压缩

## 监控和分析

### 性能监控
- Core Web Vitals
- 首屏加载时间
- 交互响应时间
- 错误率统计

### 用户行为
- 搜索查询分析
- 功能使用统计
- 用户路径跟踪
- 转化率监控

## 故障排除

### 常见问题
1. **搜索无结果**: 检查向量化状态
2. **上传失败**: 验证文件格式和大小
3. **加载缓慢**: 检查网络连接
4. **样式异常**: 清除浏览器缓存

### 调试工具
- React DevTools
- Network 面板
- Console 日志
- Performance 分析

## 更新日志

### v1.2.0 (当前版本)
- ✅ 完善的响应式设计
- ✅ 错误边界和处理机制
- ✅ 性能优化和懒加载
- ✅ 完整的快捷键支持
- ✅ 移动端用户体验优化

### v1.1.0
- ✅ 基础 RAG 功能实现
- ✅ 文档管理界面
- ✅ 搜索测试功能
- ✅ 统计数据展示

### v1.0.0
- ✅ 项目初始化
- ✅ 基础架构搭建
- ✅ API 接口定义

## 贡献指南

1. Fork 项目仓库
2. 创建功能分支
3. 提交变更
4. 创建 Pull Request
5. 代码审查和合并

## 许可证

MIT License - 详见 LICENSE 文件

---

## 联系方式

如有问题或建议，请联系开发团队。