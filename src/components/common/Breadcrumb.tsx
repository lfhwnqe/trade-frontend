"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { BREADCRUMB_CONFIG, BreadcrumbItem } from './breadcrumb-config';

/**
 * 带有链接的面包屑项接口
 */
export interface BreadcrumbItemWithHref extends BreadcrumbItem {
  /** 面包屑项的链接地址 */
  href: string;
}

/**
 * 面包屑组件属性接口
 */
export interface BreadcrumbProps {
  /** 当前页面路径 */
  currentPath: string;
  /** URL 查询参数，用于检测编辑模式 */
  searchParams?: URLSearchParams;
  /** 自定义样式类名 */
  className?: string;
}

/**
 * 根据路径和查询参数生成面包屑配置
 *
 * @param pathname - 当前页面路径
 * @param searchParams - URL 查询参数
 * @returns 生成的面包屑项数组
 *
 * ## 功能说明
 * 1. 总是包含首页面包屑
 * 2. 根据配置自动构建父子层级关系
 * 3. 自动检测编辑模式（?id= 或 ?edit= 参数）
 * 4. 处理无效配置的容错机制
 */
const generateBreadcrumbs = (pathname: string, searchParams?: URLSearchParams): BreadcrumbItemWithHref[] => {
  const breadcrumbs: BreadcrumbItemWithHref[] = [];
  
  // 总是添加首页
  const homeConfig = BREADCRUMB_CONFIG['/'];
  if (homeConfig) {
    breadcrumbs.push({
      ...homeConfig,
      href: '/'
    });
  }

  // 获取当前路径的配置
  const currentConfig = BREADCRUMB_CONFIG[pathname];
  if (!currentConfig) {
    return breadcrumbs;
  }

  // 如果有父路径，先添加父路径
  if (currentConfig.parentPath) {
    const parentConfig = BREADCRUMB_CONFIG[currentConfig.parentPath];
    if (parentConfig) {
      breadcrumbs.push({
        ...parentConfig,
        href: currentConfig.parentPath
      });
    }
  }

  // 检查是否是编辑模式
  const isEditMode = searchParams?.get('id') || searchParams?.get('edit');
  
  // 添加当前页面
  if (isEditMode && currentConfig.editLabel && currentConfig.editIcon) {
    // 编辑模式
    const editHref = searchParams?.get('id') 
      ? `${pathname}?id=${searchParams.get('id')}`
      : pathname;
    
    breadcrumbs.push({
      label: currentConfig.editLabel,
      icon: currentConfig.editIcon,
      href: editHref
    });
  } else {
    // 普通模式
    breadcrumbs.push({
      ...currentConfig,
      href: pathname
    });
  }

  return breadcrumbs;
};

/**
 * 通用面包屑组件
 *
 * ## 使用方式
 * ```tsx
 * // 在布局组件中使用
 * <Breadcrumb
 *   currentPath={pathname}
 *   searchParams={searchParams}
 *   className="mb-4 px-1"
 * />
 * ```
 *
 * ## 特性
 * - 📁 配置驱动：通过 BREADCRUMB_CONFIG 管理所有路径
 * - 🔄 自动层级：根据 parentPath 自动构建面包屑层级
 * - ✏️ 编辑模式：自动检测 URL 参数切换编辑/新增模式
 * - 🎨 可定制：支持自定义样式和图标
 * - 🔒 类型安全：完整的 TypeScript 支持
 *
 * @param currentPath - 当前页面的完整路径
 * @param searchParams - URL 查询参数对象
 * @param className - 可选的自定义 CSS 类名
 */
export function Breadcrumb({ currentPath, searchParams, className = "" }: BreadcrumbProps) {
  const breadcrumbs = generateBreadcrumbs(currentPath, searchParams);

  return (
    <nav className={`flex items-center space-x-1 text-sm text-muted-foreground ${className}`}>
      {breadcrumbs.map((breadcrumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const Icon = breadcrumb.icon;
        
        return (
          <div key={breadcrumb.href} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 mx-2" />
            )}
            
            {isLast ? (
              <span className="flex items-center gap-1 font-medium text-foreground">
                {Icon && <Icon className="h-4 w-4" />}
                {breadcrumb.label}
              </span>
            ) : (
              <Link
                href={breadcrumb.href}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                {Icon && <Icon className="h-4 w-4" />}
                {breadcrumb.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}