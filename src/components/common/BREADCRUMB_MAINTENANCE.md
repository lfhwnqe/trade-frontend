# 面包屑组件维护指南

## 📋 架构概述

面包屑系统采用配置驱动的设计模式，包含以下核心文件：

- `breadcrumb-config.ts` - 面包屑配置文件
- `Breadcrumb.tsx` - 通用面包屑组件
- `index.ts` - 组件导出文件

## 🔧 如何添加新页面

### 1. 简单页面配置

在 `breadcrumb-config.ts` 中添加新的路径配置：

```typescript
export const BREADCRUMB_CONFIG: BreadcrumbConfig = {
  // 现有配置...
  
  '/trade/settings': {
    label: '交易设置',
    icon: Settings,  // 记得导入图标
    parentPath: '/trade/home'  // 可选：指定父级路径
  }
}
```

### 2. 支持编辑模式的页面

```typescript
'/trade/profile': {
  label: '个人资料',
  icon: User,
  editLabel: '编辑资料',     // 编辑模式显示的文本
  editIcon: UserEdit,       // 编辑模式显示的图标
  parentPath: '/trade/home'
}
```

### 3. 多层级页面

```typescript
'/trade/reports': {
  label: '报表中心',
  icon: BarChart,
  parentPath: '/trade/home'
},
'/trade/reports/monthly': {
  label: '月度报表',
  icon: Calendar,
  parentPath: '/trade/reports'
}
```

## 🎯 编辑模式自动检测

组件会自动检测以下 URL 参数来判断是否为编辑模式：

- `?id=123` - 有 ID 参数时
- `?edit=true` - 有 edit 参数时

示例：
- `/trade/add` → 显示 "新增交易"
- `/trade/add?id=123` → 显示 "编辑交易"

## 📦 组件使用方法

### 在布局中使用

```typescript
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
        className="mb-4"  // 可选：自定义样式
      />
      {children}
    </div>
  );
}
```

### 在普通组件中使用

```typescript
"use client";
import { Breadcrumb } from "@/components/common";

export function MyComponent() {
  return (
    <Breadcrumb 
      currentPath="/trade/settings"
      className="my-custom-class"
    />
  );
}
```

## 🔍 配置验证

组件会自动处理以下情况：

✅ **路径不存在**: 如果路径没有配置，只显示首页面包屑  
✅ **父路径不存在**: 自动跳过无效的父路径配置  
✅ **图标缺失**: 图标是可选的，缺失时不显示  
✅ **编辑模式配置缺失**: 如果没有配置 editLabel，使用普通模式显示  

## 🎨 样式自定义

### 默认样式类

```css
.breadcrumb-nav {
  @apply flex items-center space-x-1 text-sm text-muted-foreground;
}

.breadcrumb-item {
  @apply flex items-center gap-1 hover:text-foreground transition-colors;
}

.breadcrumb-current {
  @apply font-medium text-foreground;
}
```

### 自定义样式

通过 `className` 属性传入自定义样式：

```typescript
<Breadcrumb 
  currentPath={pathname}
  searchParams={searchParams}
  className="bg-gray-100 p-2 rounded-md"
/>
```

## 🚀 性能优化

### 1. 图标按需导入

```typescript
// ❌ 不好的做法
import * from 'lucide-react';

// ✅ 好的做法
import { Home, Settings, User } from 'lucide-react';
```

### 2. 配置缓存

配置使用 `as const` 断言，确保类型推断和性能优化：

```typescript
export const BREADCRUMB_CONFIG = {
  // 配置...
} as const;
```

## 🐛 常见问题

### Q: 面包屑不显示怎么办？

A: 检查以下几点：
1. 路径是否在 `BREADCRUMB_CONFIG` 中配置
2. 组件是否正确传入 `currentPath`
3. 控制台是否有错误信息

### Q: 编辑模式不生效怎么办？

A: 确认：
1. 配置中是否设置了 `editLabel` 和 `editIcon`
2. URL 是否包含 `?id=` 或 `?edit=` 参数
3. `searchParams` 是否正确传入组件

### Q: 图标不显示怎么办？

A: 检查：
1. 图标是否正确从 `lucide-react` 导入
2. 图标名称是否正确
3. 图标组件是否正确赋值给 `icon` 属性

## 📝 最佳实践

### 1. 命名规范

- 路径键使用小写，用 `/` 分隔
- 标签使用中文，简洁明了
- 图标选择语义化的图标

### 2. 层级设计

- 保持层级简单，避免过深的嵌套
- 父子关系要符合用户的导航逻辑
- 确保每个层级都有实际的页面对应

### 3. 编辑模式

- 只在确实需要区分创建/编辑的页面使用
- 编辑模式的标签要明确表达当前状态
- 编辑模式的图标要与普通模式有明显区别

## 🔄 版本迁移

### 从旧版本迁移

如果需要从旧的硬编码面包屑迁移：

1. 找到所有硬编码的面包屑逻辑
2. 提取路径和标签信息
3. 在 `BREADCRUMB_CONFIG` 中添加对应配置
4. 替换原有组件为新的 `Breadcrumb` 组件
5. 测试所有页面的面包屑显示

### 配置文件扩展

如果配置变得很大，可以考虑拆分：

```typescript
// breadcrumb-config.ts
import { tradeConfig } from './configs/trade-breadcrumb';
import { userConfig } from './configs/user-breadcrumb';

export const BREADCRUMB_CONFIG = {
  ...tradeConfig,
  ...userConfig,
  // 其他配置...
};
```

---

## 📞 技术支持

如果遇到问题或需要添加新功能，请联系开发团队或创建相关的 Issue。

维护这个面包屑系统时，记住：**配置驱动，简单明了，用户友好**。