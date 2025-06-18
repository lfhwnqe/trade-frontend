# 面包屑组件使用示例

## 🚀 快速开始

### 1. 基本使用

```tsx
import { Breadcrumb } from "@/components/common";
import { usePathname, useSearchParams } from "next/navigation";

export default function Layout({ children }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div>
      <Breadcrumb 
        currentPath={pathname}
        searchParams={searchParams}
        className="mb-4"
      />
      {children}
    </div>
  );
}
```

## 📝 添加新页面配置

### 简单页面

```typescript
// 在 breadcrumb-config.ts 中添加
'/trade/reports': {
  label: '报表中心',
  icon: BarChart3,
  parentPath: '/trade/home'
}
```

### 支持编辑的页面

```typescript
'/trade/profile': {
  label: '个人资料',
  icon: User,
  editLabel: '编辑资料',
  editIcon: UserEdit,
  parentPath: '/trade/home'
}
```

## 🔍 常见场景

### 场景 1: 新增/编辑页面

**URL 路径**:
- `/trade/add` → 显示 "新增交易"
- `/trade/add?id=123` → 显示 "编辑交易"

**配置**:
```typescript
'/trade/add': {
  label: '新增交易',
  icon: Plus,
  editLabel: '编辑交易',
  editIcon: Edit,
  parentPath: '/trade/list'
}
```

### 场景 2: 多层级导航

**路径**: `/trade/reports/monthly`

**配置**:
```typescript
'/trade/reports': {
  label: '报表中心',
  icon: BarChart3,
  parentPath: '/trade/home'
},
'/trade/reports/monthly': {
  label: '月度报表',
  icon: Calendar,
  parentPath: '/trade/reports'
}
```

**生成的面包屑**: 首页 > 交易主页 > 报表中心 > 月度报表

### 场景 3: 自定义样式

```tsx
<Breadcrumb 
  currentPath="/trade/settings"
  className="bg-gray-50 p-3 rounded-lg border"
/>
```

## ⚡ 维护提示

### ✅ 推荐做法

1. **图标选择**: 使用语义化的图标
```typescript
// ✅ 好的
icon: Settings,  // 设置页面用齿轮图标
icon: List,      // 列表页面用列表图标

// ❌ 不好的
icon: Star,      // 设置页面用星星图标
```

2. **标签命名**: 简洁明了
```typescript
// ✅ 好的
label: '交易列表',
label: '新增交易',

// ❌ 不好的
label: '查看所有的交易记录列表页面',
```

3. **层级设计**: 符合用户认知
```typescript
// ✅ 好的层级
'/trade/home' -> '/trade/list' -> '/trade/add'

// ❌ 混乱的层级
'/trade/add' -> '/user/profile' -> '/trade/list'
```

### 🚫 避免的问题

1. **路径拼写错误**
```typescript
// ❌ 错误
'/trade/lst': { ... }  // 拼写错误

// ✅ 正确
'/trade/list': { ... }
```

2. **循环引用**
```typescript
// ❌ 错误 - 循环引用
'/page-a': { parentPath: '/page-b' },
'/page-b': { parentPath: '/page-a' }
```

3. **无效的父路径**
```typescript
// ❌ 错误 - 父路径不存在
'/trade/detail': { 
  parentPath: '/trade/nonexistent'  // 这个路径没有配置
}
```

## 🔧 故障排除

### 问题：面包屑不显示

**检查清单**:
- [ ] 路径是否在 `BREADCRUMB_CONFIG` 中配置？
- [ ] 组件是否正确导入？
- [ ] `currentPath` 参数是否正确传递？

### 问题：编辑模式不工作

**检查清单**:
- [ ] 配置中是否设置了 `editLabel` 和 `editIcon`？
- [ ] URL 是否包含 `?id=` 或 `?edit=` 参数？
- [ ] `searchParams` 是否正确传递给组件？

### 问题：层级关系错误

**检查清单**:
- [ ] `parentPath` 是否指向存在的配置？
- [ ] 层级是否存在循环引用？
- [ ] 父路径的配置是否正确？

## 📚 完整示例

```typescript
// breadcrumb-config.ts 完整示例
export const BREADCRUMB_CONFIG = {
  '/': { label: '首页', icon: Home },
  
  // 交易模块
  '/trade/home': { label: '交易主页', icon: TrendingUp },
  '/trade/list': { label: '交易列表', icon: List },
  '/trade/add': {
    label: '新增交易',
    icon: Plus,
    editLabel: '编辑交易',
    editIcon: Edit,
    parentPath: '/trade/list'
  },
  '/trade/detail': {
    label: '交易详情',
    icon: Eye,
    parentPath: '/trade/list'
  },
  
  // 报表模块
  '/trade/reports': {
    label: '报表中心',
    icon: BarChart3,
    parentPath: '/trade/home'
  },
  '/trade/reports/daily': {
    label: '日报表',
    icon: Calendar,
    parentPath: '/trade/reports'
  },
  
  // 设置模块
  '/trade/settings': {
    label: '系统设置',
    icon: Settings,
    parentPath: '/trade/home'
  }
};
```

这样的配置可以支持复杂的导航层级，同时保持代码的清晰和可维护性。