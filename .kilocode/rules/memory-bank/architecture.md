# 系统架构 - MMC Trading 前端

## 整体架构设计

### 应用架构
- **框架**：Next.js 15 App Router - 现代化的全栈 React 框架
- **部署**：Vercel 平台 (推荐) 或其他支持 Node.js 的平台
- **开发模式**：SPA + SSR 混合渲染，客户端导航为主

### 关键技术决策
1. **App Router**：使用 Next.js 15 的 App Router 架构，支持服务端组件和客户端组件的灵活组合
2. **状态管理**：采用 Jotai + Immer 组合，提供原子化状态管理和不可变状态更新
3. **UI 设计系统**：基于 shadcn/ui + Tailwind CSS，确保设计一致性和开发效率
4. **API 通信**：代理模式 - 前端通过 Next.js API Routes 代理后端接口

## 目录结构和组织模式

```
src/
├── app/                        # Next.js App Router 页面目录
│   ├── layout.tsx             # 根布局组件
│   ├── page.tsx               # 首页
│   ├── globals.css            # 全局样式
│   ├── auth/                  # 认证相关页面
│   │   ├── login/            # 登录页面
│   │   ├── register/         # 注册页面
│   │   └── verify/           # 邮箱验证页面
│   ├── trade/                 # 真实交易模块
│   │   ├── layout.tsx        # 交易模块布局
│   │   ├── config.ts         # 交易相关配置和类型
│   │   ├── home/            # 交易首页
│   │   ├── add/             # 添加/编辑交易
│   │   └── list/            # 交易列表
│   ├── simulation/           # 模拟交易模块
│   │   └── [相同结构]       # 与 trade 模块相同的结构
│   └── api/                  # API 路由
│       ├── login/           # 登录接口代理
│       ├── logout/          # 登出接口
│       ├── proxy-get/       # GET 请求代理
│       └── proxy-post/      # POST 请求代理
├── components/               # 组件库
│   ├── ui/                  # shadcn/ui 基础组件
│   └── common/              # 业务通用组件
│       ├── alert.tsx        # 全局提示组件
│       ├── app-sidebar.tsx  # 应用侧边栏
│       └── DataTable.tsx    # 数据表格组件
├── hooks/                   # 自定义 Hooks
│   ├── useAtomImmer.ts     # Jotai + Immer 状态管理 Hook
│   └── use-mobile.ts       # 移动端检测 Hook
├── lib/                     # 工具库
│   └── utils.ts            # 通用工具函数
└── utils/                   # 业务工具函数
    ├── fetchWithAuth.ts    # 带认证的请求封装
    └── index.ts           # 工具函数入口
```

## 核心组件和功能模块

### 1. 状态管理架构
- **技术栈**：Jotai + jotai-immer
- **核心文件**：
  - [`src/hooks/useAtomImmer.ts`](src/hooks/useAtomImmer.ts) - 状态管理 Hook 封装
  - [`src/app/trade/list/atom.ts`](src/app/trade/list/atom.ts) - 交易列表状态原子
  - [`src/app/auth/login/atom.ts`](src/app/auth/login/atom.ts) - 登录表单状态原子

### 2. API 通信架构
- **代理模式**：前端不直接调用后端 API，通过 Next.js API Routes 代理
- **核心文件**：
  - [`src/app/api/proxy-get/route.ts`](src/app/api/proxy-get/route.ts) - GET 请求代理
  - [`src/app/api/proxy-post/route.ts`](src/app/api/proxy-post/route.ts) - POST 请求代理
  - [`src/utils/fetchWithAuth.ts`](src/utils/fetchWithAuth.ts) - 认证请求封装

### 3. UI 组件架构
- **设计系统**：shadcn/ui + Tailwind CSS
- **组件层次**：
  - 基础组件：[`src/components/ui/`](src/components/ui/) - 来自 shadcn/ui
  - 业务组件：[`src/components/common/`](src/components/common/) - 项目特定组件
  - 页面组件：各模块内的组件文件

### 4. 布局和导航系统
- **根布局**：[`src/app/layout.tsx`](src/app/layout.tsx) - 全局布局和提供器
- **模块布局**：
  - [`src/app/trade/layout.tsx`](src/app/trade/layout.tsx) - 交易模块布局
  - [`src/app/simulation/layout.tsx`](src/app/simulation/layout.tsx) - 模拟交易模块布局
- **侧边栏**：[`src/components/common/app-sidebar.tsx`](src/components/common/app-sidebar.tsx) - 统一侧边导航

## 数据流和交互模式

### 1. 用户认证流程
```
用户登录 -> /api/login -> 后端验证 -> 设置 HTTP-only Cookie -> 跳转首页
会话管理 -> Cookie 自动携带 -> 401 响应 -> 自动跳转登录页
```

### 2. 交易数据管理流程
```
页面加载 -> useTradeList Hook -> fetchTrades -> API 代理 -> 后端接口
用户操作 -> 状态更新 (Jotai/Immer) -> 重新获取数据 -> UI 更新
```

### 3. 表单处理模式
```
表单输入 -> Immer 状态更新 -> 提交处理 -> API 请求 -> 成功/错误处理
```

## 关键设计模式

### 1. 模块化设计
- **分离关注点**：每个功能模块（trade, simulation, auth）独立管理
- **配置驱动**：使用 config.ts 文件定义枚举、选项和类型
- **代码复用**：相似功能模块共享组件和逻辑

### 2. 响应式设计
- **移动端优先**：使用 Tailwind CSS 的响应式类
- **设备检测**：[`src/hooks/use-mobile.ts`](src/hooks/use-mobile.ts) 提供移动端状态
- **自适应布局**：侧边栏、表格、表单的响应式适配

### 3. 类型安全
- **TypeScript 全覆盖**：所有代码使用 TypeScript 编写
- **类型定义集中**：在 config.ts 文件中定义业务类型
- **接口对齐**：前后端类型定义保持同步

## 性能优化策略

### 1. 代码分割
- **页面级分割**：App Router 自动按页面分割代码
- **组件懒加载**：使用 Suspense 和动态导入

### 2. 状态管理优化
- **原子化状态**：Jotai 的原子化设计避免不必要的重渲染
- **Immer 优化**：结构化共享减少内存开销

### 3. 网络优化
- **API 代理**：减少跨域请求，统一错误处理
- **请求缓存**：合理使用 SWR 或类似缓存策略

## 开发和部署配置

### 开发环境
- **Next.js 开发服务器**：支持热重载和快速刷新
- **TypeScript**：严格模式，确保类型安全
- **ESLint**：Next.js 推荐配置 + TypeScript 规则

### 构建配置
- **Next.js 构建**：自动优化和代码分割
- **Tailwind CSS**：PostCSS 处理和 PurgeCSS 优化
- **环境变量**：`NEXT_PUBLIC_API_BASE_URL` 配置后端接口地址

### 部署架构
- **Vercel 部署**：推荐的 Next.js 原生平台
- **静态资源**：自动 CDN 加速
- **API 路由**：Serverless Functions 处理