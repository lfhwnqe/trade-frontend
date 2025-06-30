# Trade Frontend 项目架构与开发进度文档

## 📋 项目概述

Trade Frontend 是一个基于 Next.js 15 的现代化交易管理系统前端应用，专为交易者提供直观、高效的交易记录和分析界面。系统采用最新的 React 19 和 App Router 架构，结合 shadcn/ui 组件库，提供专业的交易管理体验。

### 核心价值主张
- **现代化架构**：基于 Next.js 15 + React 19 的最新技术栈
- **专业交易界面**：专为交易者设计的直观操作体验
- **响应式设计**：完美适配桌面端和移动端
- **高性能体验**：优化的加载速度和交互响应

## 🏗️ 技术架构

### 系统架构图
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Browser       │────│   Next.js App   │────│   API Proxy     │
│   (用户界面)     │    │   (React 19)    │    │   (API Routes)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   State Mgmt    │              │
         └──────────────│   (Jotai+Immer) │──────────────┘
                        └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │   UI Components │
                        │   (shadcn/ui)   │
                        └─────────────────┘
```

### 技术栈
- **框架**: Next.js 15.3.2 (App Router)
- **UI 库**: React 19.0.0
- **类型系统**: TypeScript 5.x
- **状态管理**: Jotai 2.12.4 + jotai-immer 0.4.1
- **UI 组件**: shadcn/ui + Radix UI + Tailwind CSS 4.x
- **表格组件**: TanStack React Table 8.21.3
- **图标库**: Lucide React 0.511.0
- **开发工具**: ESLint 9 + Turbopack

## 📁 项目结构

```
trade-frontend/
├── src/
│   ├── app/                       # Next.js App Router 页面
│   │   ├── layout.tsx            # 根布局组件
│   │   ├── page.tsx              # 首页
│   │   ├── globals.css           # 全局样式
│   │   ├── auth/                 # 认证模块
│   │   │   ├── login/           # 登录页面
│   │   │   ├── register/        # 注册页面
│   │   │   └── verify/          # 邮箱验证
│   │   ├── trade/               # 真实交易模块
│   │   │   ├── layout.tsx       # 交易模块布局
│   │   │   ├── config.ts        # 交易配置和类型
│   │   │   ├── home/           # 交易首页
│   │   │   ├── add/            # 添加/编辑交易
│   │   │   └── list/           # 交易列表
│   │   ├── simulation/          # 模拟交易模块
│   │   │   └── [相同结构]      # 与 trade 模块相同
│   │   ├── rag/                # RAG 知识库模块
│   │   │   ├── page.tsx        # RAG 首页
│   │   │   ├── manage/         # 数据管理
│   │   │   ├── test/           # RAG 测试
│   │   │   └── layout.tsx      # RAG 布局
│   │   └── api/                # API 代理路由
│   │       ├── login/          # 登录代理
│   │       ├── logout/         # 登出代理
│   │       ├── proxy-get/      # GET 请求代理
│   │       └── proxy-post/     # POST 请求代理
│   ├── components/              # 组件库
│   │   ├── ui/                 # shadcn/ui 基础组件
│   │   └── common/             # 业务通用组件
│   │       ├── alert.tsx       # 全局提示组件
│   │       ├── app-sidebar.tsx # 应用侧边栏
│   │       └── DataTable.tsx   # 数据表格组件
│   ├── hooks/                  # 自定义 Hooks
│   │   ├── useAtomImmer.ts    # Jotai + Immer Hook
│   │   └── use-mobile.ts      # 移动端检测
│   ├── lib/                    # 工具库
│   │   └── utils.ts           # 通用工具函数
│   └── utils/                  # 业务工具
│       ├── fetchWithAuth.ts   # 认证请求封装
│       └── index.ts          # 工具函数入口
├── public/                     # 静态资源
├── components.json             # shadcn/ui 配置
├── next.config.ts             # Next.js 配置
├── tailwind.config.js         # Tailwind CSS 配置
└── tsconfig.json              # TypeScript 配置
```

## 🔧 核心模块详解

### 1. 认证模块 (Auth)
**状态**: ✅ 已完成

**功能特性**:
- ✅ 用户登录界面
- ✅ 用户注册流程
- ✅ 邮箱验证页面
- ✅ HTTP-only Cookie 认证
- ✅ 自动登录状态检查
- ✅ 登录后页面重定向

**核心文件**:
- `app/auth/login/page.tsx` - 登录页面
- `app/auth/register/page.tsx` - 注册页面
- `app/auth/verify/page.tsx` - 邮箱验证

**状态管理**:
```typescript
// 登录表单状态
interface LoginState {
  username: string;
  password: string;
  loading: boolean;
  error: string | null;
}
```

### 2. 交易管理模块 (Trade)
**状态**: ✅ 核心功能完成

**功能特性**:
- ✅ 交易列表展示 (分页、排序、筛选)
- ✅ 交易记录 CRUD 操作
- ✅ 交易状态管理
- ✅ 图片上传和预览
- ✅ 交易复制功能
- ✅ 高级筛选查询

**核心组件**:
- `TradeListPage` - 交易列表主页面
- `TradeAddPage` - 交易添加/编辑页面
- `TradeFormDialog` - 交易表单对话框
- `TradeQueryForm` - 查询筛选表单
- `DataTable` - 数据表格组件

**状态管理**:
```typescript
interface TradeListState {
  trades: Trade[];
  loading: boolean;
  pagination: PaginationState;
  queryForm: TradeQuery;
  sorting: SortingState;
  rowSelection: RowSelectionState;
  dialog: DialogState;
}
```

**API 集成**:
```typescript
// 交易相关 API 调用
const fetchTrades = (params: ApiQueryParameters) => Promise<TradeListResponse>;
const createTrade = (trade: CreateTradeDto) => Promise<Trade>;
const updateTrade = (id: string, trade: UpdateTradeDto) => Promise<Trade>;
const deleteTrade = (id: string) => Promise<void>;
const copyTrade = (id: string) => Promise<Trade>;
```

### 3. RAG 知识库模块
**状态**: ✅ 已完成

**功能特性**:
- ✅ RAG 系统状态监控
- ✅ 文档管理界面
- ✅ 智能搜索测试
- ✅ 数据统计分析
- ✅ 错误处理和重试

**核心页面**:
- `rag/page.tsx` - RAG 首页仪表板
- `rag/manage/page.tsx` - 文档数据管理
- `rag/test/page.tsx` - 搜索功能测试

**组件设计**:
- 状态监控卡片
- 文档列表表格
- 搜索测试表单
- 统计图表展示

### 4. API 代理层
**状态**: ✅ 已完成

**功能特性**:
- ✅ 统一 API 代理
- ✅ 认证 Cookie 处理
- ✅ 错误统一处理
- ✅ 请求/响应拦截

**代理路由**:
```typescript
// GET 请求代理
app/api/proxy-get/route.ts

// POST 请求代理  
app/api/proxy-post/route.ts

// 登录专用代理
app/api/login/route.ts

// 登出处理
app/api/logout/route.ts
```

**认证处理**:
```typescript
// 带认证的请求封装
export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: Init,
  router?: ReturnType<typeof useRouter>
): Promise<Response>
```

### 5. UI 组件系统
**状态**: ✅ 已完成

**设计系统**:
- **基础组件**: shadcn/ui (Button, Input, Dialog 等)
- **业务组件**: 自定义业务逻辑组件
- **布局组件**: 页面布局和导航组件

**组件特性**:
- 完全类型安全
- 可访问性支持 (WAI-ARIA)
- 暗色模式支持
- 响应式设计

**核心组件**:
```typescript
// 数据表格组件
<DataTable 
  columns={columns}
  data={data}
  pagination={pagination}
  sorting={sorting}
  onSortingChange={setSorting}
/>

// 侧边栏导航
<AppSidebar />

// 全局提示组件
<AlertProvider>
  {children}
</AlertProvider>
```

### 6. 状态管理架构
**状态**: ✅ 已完成

**技术选型**: Jotai + Immer
- **原子化状态**: 避免不必要的重渲染
- **不可变更新**: Immer 简化状态更新逻辑
- **类型安全**: 完整的 TypeScript 支持

**状态原子设计**:
```typescript
// 自定义 Hook 封装
export const useAtomImmer = <T>(atom: PrimitiveAtom<T>) => {
  const [state, setState] = useAtom(atom);
  const updateState = useCallback((updater: (draft: T) => void) => {
    setState(produce(updater));
  }, [setState]);
  return [state, updateState] as const;
};

// 页面状态原子
export const tradeListAtom = createImmerAtom<TradeListState>(initialState);
export const formAtom = createImmerAtom<FormState>(formInitialState);
```

## 🎨 设计系统

### 主题配置
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  /* ... 更多主题变量 */
}
```

### 响应式断点
```typescript
const screens = {
  sm: '640px',
  md: '768px', 
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};
```

### 组件变体系统
```typescript
// 按钮变体
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent",
        // ... 更多变体
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        // ... 更多尺寸
      }
    }
  }
);
```

## 🔄 数据流架构

### 请求流程
```
用户操作 → 组件事件 → 状态更新 → API 调用 → 代理转发 → 后端处理 → 响应返回 → 状态更新 → UI 重渲染
```

### 状态更新流程
```typescript
// 1. 用户操作触发
const handleSubmit = async (formData: FormData) => {
  // 2. 更新加载状态
  updateState(draft => {
    draft.loading = true;
  });
  
  try {
    // 3. API 调用
    const result = await createTrade(formData);
    
    // 4. 更新成功状态
    updateState(draft => {
      draft.trades.push(result);
      draft.loading = false;
    });
  } catch (error) {
    // 5. 更新错误状态
    updateState(draft => {
      draft.error = error.message;
      draft.loading = false;
    });
  }
};
```

### 错误处理流程
```typescript
// 全局错误处理
export async function fetchWithAuth(input, init, router) {
  const resp = await fetch(input, init);
  
  if (resp.status === 401) {
    // 自动跳转登录页
    window.location.href = '/auth/login';
    throw new Error('未认证或登录已过期');
  }
  
  return resp;
}
```

## 📱 响应式设计

### 移动端适配
- **导航**: 侧边栏折叠为抽屉式菜单
- **表格**: 水平滚动 + 关键信息优先显示
- **表单**: 垂直堆叠布局
- **按钮**: 增大触摸区域

### 桌面端优化
- **多列布局**: 充分利用屏幕空间
- **快捷键**: 支持键盘导航
- **悬停效果**: 丰富的交互反馈
- **拖拽操作**: 高级交互功能

### 性能优化
- **代码分割**: 按路由自动分割
- **懒加载**: 大型组件按需加载
- **图片优化**: Next.js 自动图片优化
- **缓存策略**: 合理的浏览器缓存

## 📊 开发进度

### ✅ 已完成功能 (95%)

#### 核心业务功能
- [x] 用户认证系统 (登录/注册/验证)
- [x] 交易记录 CRUD 操作
- [x] 交易列表 (分页/排序/筛选)
- [x] 图片上传和管理
- [x] RAG 知识库界面
- [x] 模拟交易模块

#### 技术基础设施
- [x] Next.js 15 + React 19 架构
- [x] shadcn/ui 组件库集成
- [x] Jotai + Immer 状态管理
- [x] API 代理层实现
- [x] 响应式布局设计
- [x] TypeScript 类型系统

#### 用户体验
- [x] 加载状态管理
- [x] 错误处理机制
- [x] 表单验证
- [x] 操作反馈提示
- [x] 移动端适配

### 🔄 进行中功能 (5%)

#### 性能优化
- [ ] 组件渲染优化
- [ ] 图片懒加载
- [ ] 缓存策略优化
- [ ] 包体积优化

#### 用户体验增强
- [ ] 骨架屏加载
- [ ] 更丰富的动画效果
- [ ] 键盘快捷键支持
- [ ] 拖拽排序功能

### 📋 待开发功能

#### 高级功能
- [ ] 数据可视化图表
- [ ] 实时数据更新
- [ ] 离线模式支持
- [ ] PWA 功能

#### 开发体验
- [ ] 单元测试覆盖
- [ ] E2E 测试
- [ ] Storybook 组件文档
- [ ] 性能监控

## 🎯 下一步计划

### 短期目标 (1-2周)
1. **性能优化完成**
   - 组件渲染优化
   - 图片懒加载实现
   - 缓存策略优化

2. **用户体验增强**
   - 骨架屏加载状态
   - 更流畅的动画效果
   - 键盘快捷键支持

### 中期目标 (1个月)
1. **数据可视化**
   - 交易统计图表
   - 趋势分析展示
   - 交互式数据探索

2. **测试覆盖**
   - 组件单元测试
   - 页面集成测试
   - E2E 自动化测试

### 长期目标 (3个月)
1. **PWA 功能**
   - 离线模式支持
   - 推送通知
   - 应用安装

2. **高级交互**
   - 实时协作功能
   - 数据导入导出
   - 自定义仪表板

## 🔧 开发环境配置

### 本地开发环境
```bash
# 1. 安装依赖
npm install
# 或使用 yarn
yarn install

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 文件

# 3. 启动开发服务器
npm run dev
# 使用 Turbopack (更快的构建)
npm run dev --turbo

# 4. 构建项目
npm run build

# 5. 启动生产服务器
npm run start

# 6. 代码检查
npm run lint
```

### 环境变量配置
```env
# API 配置
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001

# 开发模式配置
NODE_ENV=development

# 其他配置
NEXT_PUBLIC_APP_NAME=MMC Trading
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### 开发工具配置

#### VSCode 推荐扩展
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

#### ESLint 配置
```javascript
// eslint.config.mjs
export default [
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/exhaustive-deps": "warn"
    }
  }
];
```

## 🧪 测试策略

### 测试金字塔
```
    /\     E2E Tests (Playwright)
   /  \    Integration Tests (React Testing Library)
  /____\   Unit Tests (Jest + React Testing Library)
```

### 测试工具栈
- **单元测试**: Jest + React Testing Library
- **组件测试**: Storybook + Chromatic
- **E2E 测试**: Playwright
- **视觉回归**: Chromatic

### 测试示例
```typescript
// 组件单元测试
import { render, screen } from '@testing-library/react';
import { TradeListPage } from './page';

describe('TradeListPage', () => {
  it('renders trade list correctly', () => {
    render(<TradeListPage />);
    expect(screen.getByText('交易列表')).toBeInTheDocument();
  });
});

// API 集成测试
import { fetchTrades } from './request';

describe('Trade API', () => {
  it('fetches trades successfully', async () => {
    const trades = await fetchTrades({});
    expect(trades).toBeDefined();
    expect(Array.isArray(trades.data)).toBe(true);
  });
});
```

## 🔍 故障排查指南

### 常见问题

#### 1. 状态更新不生效
**现象**: 组件状态更新后 UI 不重新渲染
**解决方案**:
```typescript
// ❌ 错误：直接修改状态
state.trades.push(newTrade);

// ✅ 正确：使用 Immer 更新
updateState(draft => {
  draft.trades.push(newTrade);
});
```

#### 2. API 请求 401 错误
**现象**: 请求返回未认证错误
**解决方案**:
- 检查 Cookie 是否正确设置
- 确认 Token 是否过期
- 验证 API 代理配置

#### 3. 样式不生效
**现象**: Tailwind CSS 类名不起作用
**解决方案**:
```typescript
// ❌ 错误：动态类名
const className = `text-${color}-500`;

// ✅ 正确：完整类名或使用 clsx
const className = clsx({
  'text-red-500': color === 'red',
  'text-blue-500': color === 'blue'
});
```

#### 4. 组件重复渲染
**现象**: 组件不必要的重新渲染
**解决方案**:
```typescript
// 使用 React.memo 优化
const TradeItem = React.memo(({ trade }) => {
  return <div>{trade.name}</div>;
});

// 使用 useCallback 缓存函数
const handleClick = useCallback(() => {
  // 处理点击
}, [dependency]);
```

### 调试工具
- **React DevTools**: 组件状态调试
- **Jotai DevTools**: 状态原子调试
- **Network Tab**: API 请求调试
- **Console**: 日志输出调试

## 📊 性能监控

### 关键指标
- **首屏加载时间**: < 2s
- **交互响应时间**: < 100ms
- **页面切换时间**: < 500ms
- **包体积**: < 1MB (gzipped)

### 性能优化技巧

#### 1. 代码分割
```typescript
// 路由级别分割 (自动)
const TradePage = lazy(() => import('./trade/page'));

// 组件级别分割
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

#### 2. 图片优化
```typescript
// 使用 Next.js Image 组件
import Image from 'next/image';

<Image
  src="/trade-chart.png"
  alt="交易图表"
  width={800}
  height={600}
  priority // 关键图片优先加载
  placeholder="blur" // 模糊占位符
/>
```

#### 3. 状态优化
```typescript
// 避免不必要的状态订阅
const trades = useAtomValue(tradesAtom);
const updateTrades = useSetAtom(tradesAtom);

// 使用选择器优化
const tradeCount = useAtomValue(
  useMemo(() => atom(get => get(tradesAtom).length), [])
);
```

### 监控工具
- **Vercel Analytics**: 页面性能监控
- **Web Vitals**: 核心性能指标
- **Lighthouse**: 性能审计
- **Bundle Analyzer**: 包体积分析

## 🔒 安全最佳实践

### 前端安全
- **XSS 防护**: React 自动转义 + CSP 头
- **CSRF 防护**: SameSite Cookie + CSRF Token
- **敏感数据**: 避免在前端存储敏感信息
- **依赖安全**: 定期更新依赖包

### 数据验证
```typescript
// 输入验证
import { z } from 'zod';

const tradeSchema = z.object({
  tradeSubject: z.string().min(1, '交易标的不能为空'),
  entryPrice: z.number().positive('入场价格必须大于0'),
  status: z.enum(['已分析', '已入场', '已离场'])
});

// 使用验证
const result = tradeSchema.safeParse(formData);
if (!result.success) {
  // 处理验证错误
}
```

### 网络安全
- **HTTPS 强制**: 生产环境强制 HTTPS
- **API 代理**: 隐藏后端 API 地址
- **请求限制**: 防止 API 滥用
- **错误处理**: 避免泄露敏感信息

## 📚 相关文档

### 技术文档
- [Next.js 官方文档](https://nextjs.org/docs)
- [React 19 文档](https://react.dev)
- [shadcn/ui 组件库](https://ui.shadcn.com)
- [Jotai 状态管理](https://jotai.org)
- [Tailwind CSS](https://tailwindcss.com)

### 项目文档
- [组件设计规范](./docs/component-guidelines.md)
- [状态管理指南](./docs/state-management.md)
- [API 调用规范](./docs/api-guidelines.md)
- [样式编写规范](./docs/styling-guidelines.md)

### 部署文档
- [Vercel 部署指南](./docs/vercel-deployment.md)
- [环境配置说明](./docs/environment-setup.md)
- [CI/CD 流水线](./docs/cicd-pipeline.md)

## 🤝 开发团队与协作

### 开发流程
1. **需求分析** → UI/UX 设计稿
2. **组件设计** → 组件库开发
3. **页面开发** → 功能实现
4. **测试验证** → 质量保证
5. **部署发布** → 生产环境

### 代码规范
- **组件命名**: PascalCase (如 `TradeListPage`)
- **文件命名**: kebab-case (如 `trade-list.tsx`)
- **变量命名**: camelCase (如 `tradeData`)
- **常量命名**: UPPER_SNAKE_CASE (如 `API_BASE_URL`)

### Git 工作流
```bash
# 功能开发
git checkout -b feature/trade-list-enhancement
git add .
git commit -m "feat: add trade list filtering"
git push origin feature/trade-list-enhancement

# 创建 Pull Request
# 代码审查
# 合并到主分支
```

### 组件开发规范
```typescript
// 组件文件结构
interface Props {
  // 属性定义
}

export const ComponentName: React.FC<Props> = ({
  prop1,
  prop2
}) => {
  // Hooks
  const [state, setState] = useState();

  // 事件处理
  const handleEvent = useCallback(() => {
    // 处理逻辑
  }, []);

  // 渲染
  return (
    <div className="component-wrapper">
      {/* JSX 内容 */}
    </div>
  );
};

// 默认导出
export default ComponentName;
```

---

**最后更新**: 2025-06-30
**文档版本**: v1.0
**维护者**: Trade Frontend Team
**联系方式**: frontend-team@trade-system.com
