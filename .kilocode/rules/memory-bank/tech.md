# 技术栈 - MMC Trading 前端

## 核心技术框架

### 前端框架
- **Next.js 15.3.2**：现代化的 React 全栈框架
  - App Router 架构，支持服务端渲染和客户端导航
  - 内置优化：自动代码分割、图片优化、字体优化
  - API Routes 作为后端代理层

### UI 和样式
- **React 19.0.0**：最新版本的 React 框架
- **shadcn/ui**：基于 Radix UI 的高质量组件库
  - 使用 "new-york" 风格
  - 支持暗色模式和主题定制
- **Tailwind CSS 4.x**：实用优先的 CSS 框架
  - 使用 CSS 变量实现主题系统
  - 响应式设计支持
- **Radix UI**：无样式的可访问性组件基础
  - Dialog、Dropdown、Select、Tooltip 等组件
- **Lucide React**：现代化的图标库

### 状态管理
- **Jotai 2.12.4**：原子化状态管理库
  - 自下而上的状态管理方法
  - 避免不必要的重渲染
- **jotai-immer 0.4.1**：结合 Immer 的不可变状态更新
- **Immer 10.1.1**：不可变状态更新库
  - 简化复杂状态的更新逻辑
  - 结构化共享优化性能

### 数据处理和 UI 组件
- **@tanstack/react-table 8.21.3**：强大的表格组件库
  - 支持排序、筛选、分页
  - 服务端数据处理支持
- **date-fns 4.1.0**：现代化的日期处理库
- **react-day-picker 8.10.1**：日期选择器组件
- **react-dropzone 14.3.8**：文件拖拽上传组件

### 开发工具和配置

#### TypeScript 配置
- **TypeScript 5.x**：类型安全的 JavaScript 超集
- **严格模式**：启用所有严格类型检查
- **路径映射**：`@/*` 指向 `./src/*`
- **目标版本**：ES2017，支持现代浏览器

#### 代码质量工具
- **ESLint 9.x**：JavaScript/TypeScript 代码检查
  - Next.js 推荐配置
  - TypeScript 集成
- **next/core-web-vitals**：Web 性能指标检查

#### 构建和开发
- **Turbopack**：Next.js 开发服务器加速
- **PostCSS**：CSS 后处理器
  - Tailwind CSS 插件集成
- **tw-animate-css**：Tailwind 动画扩展

## 项目配置详情

### 包管理
- **Yarn**：依赖管理工具
- **私有包**：项目不发布到 npm

### 开发脚本
```json
{
  "dev": "next dev --turbopack",     // 开发服务器（使用 Turbopack）
  "build": "next build",             // 生产构建
  "start": "next start",             // 生产服务器
  "lint": "next lint"                // 代码检查
}
```

### 环境配置
- **开发环境**：`http://localhost:3000`
- **环境变量**：`NEXT_PUBLIC_API_BASE_URL` - 后端 API 基础地址
- **字体**：Geist Sans 和 Geist Mono（Vercel 字体）

## 架构特性

### API 代理架构
- **代理模式**：前端通过 Next.js API Routes 访问后端
- **认证处理**：HTTP-only Cookie 存储认证信息
- **错误统一处理**：401 自动跳转登录页面

### 组件设计模式
- **复合组件**：使用 Radix UI 的复合组件模式
- **可控/非可控**：支持受控和非受控模式
- **可访问性**：遵循 WAI-ARIA 规范

### 状态管理模式
- **原子化设计**：每个功能模块独立的状态原子
- **Immer 集成**：简化嵌套状态更新
- **自定义 Hook**：封装状态逻辑复用

## 性能优化

### 构建优化
- **代码分割**：自动按路由分割
- **Tree Shaking**：移除未使用的代码
- **图片优化**：Next.js 内置图片优化

### 运行时优化
- **懒加载**：组件和页面的懒加载
- **缓存策略**：适当的浏览器缓存配置
- **状态最小化**：Jotai 的原子化避免过度渲染

## 兼容性和支持

### 浏览器支持
- **现代浏览器**：Chrome、Firefox、Safari、Edge 最新版本
- **ES2017**：支持 async/await、Object.entries 等特性

### 设备支持
- **响应式设计**：支持桌面端和移动端
- **触摸设备**：优化的触摸交互体验
- **无障碍访问**：符合可访问性标准

## 开发工作流

### 本地开发
1. **依赖安装**：`yarn install`
2. **开发服务器**：`yarn dev`
3. **代码检查**：`yarn lint`
4. **类型检查**：TypeScript 编译时检查

### 构建部署
1. **生产构建**：`yarn build`
2. **构建验证**：`yarn start` 本地验证
3. **部署**：推荐使用 Vercel 平台