import { LucideIcon, Home, TrendingUp, List, Plus, Edit, Database, Search, TestTube } from 'lucide-react';

/**
 * 面包屑配置项接口
 */
export interface BreadcrumbItem {
  /** 显示的标签文本 */
  label: string;
  /** 图标组件 (可选) */
  icon?: LucideIcon;
  /** 编辑模式下的标签文本 (可选) */
  editLabel?: string;
  /** 编辑模式下的图标组件 (可选) */
  editIcon?: LucideIcon;
  /** 父级路径，用于构建面包屑层级 (可选) */
  parentPath?: string;
}

/**
 * 面包屑配置映射接口
 */
export interface BreadcrumbConfig {
  [path: string]: BreadcrumbItem;
}

/**
 * 面包屑配置映射
 * 
 * ## 配置说明
 * - 键: 完整的路径字符串 (如 '/trade/add')
 * - 值: BreadcrumbItem 配置对象
 * 
 * ## 特殊功能
 * - 编辑模式: 当 URL 包含 ?id= 或 ?edit= 参数时，自动使用 editLabel 和 editIcon
 * - 层级关系: 通过 parentPath 属性定义父子关系，自动构建完整的面包屑路径
 * 
 * ## 添加新页面步骤
 * 1. 在此配置中添加新的路径映射
 * 2. 设置 label 和 icon
 * 3. 如果支持编辑模式，设置 editLabel 和 editIcon
 * 4. 如果有父级页面，设置 parentPath
 * 
 * ## 示例
 * ```typescript
 * '/trade/detail': {
 *   label: '交易详情',
 *   icon: Eye,
 *   parentPath: '/trade/list'
 * }
 * ```
 */
export const BREADCRUMB_CONFIG: BreadcrumbConfig = {
  '/': { 
    label: '首页', 
    icon: Home 
  },
  '/trade/home': { 
    label: '交易主页', 
    icon: TrendingUp 
  },
  '/trade/list': { 
    label: '交易列表', 
    icon: List 
  },
  '/trade/add': {
    label: '新增交易',
    icon: Plus,
    editLabel: '编辑交易',
    editIcon: Edit,
    parentPath: '/trade/list'
  },
  '/rag': {
    label: 'RAG 知识库',
    icon: Database
  },
  '/rag/manage': {
    label: '数据管理',
    icon: Database,
    parentPath: '/rag'
  },
  '/rag/test': {
    label: 'RAG 测试',
    icon: Search,
    parentPath: '/rag'
  },
  '/rag/simple-test': {
    label: 'RAG 简单测试',
    icon: TestTube,
    parentPath: '/rag'
  }
} as const;

export type BreadcrumbPath = keyof typeof BREADCRUMB_CONFIG;