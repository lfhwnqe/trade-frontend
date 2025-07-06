/**
 * 脑图相关类型定义
 */

// 脑图布局类型
export type MindMapLayout = 
  | 'logicalStructure'
  | 'mindMap'
  | 'catalogOrganization'
  | 'organizationStructure'
  | 'timeline'
  | 'fishbone'

// 脑图主题类型
export type MindMapTheme = 
  | 'default'
  | 'classic'
  | 'dark'
  | 'blueSky'
  | 'freshGreen'
  | 'romanticPurple'

// 脑图节点数据结构
export interface MindMapNodeData {
  text: string
  richText?: boolean
  expand?: boolean
  isActive?: boolean
  uid?: string
  icon?: any[]
  image?: string
  imageTitle?: string
  imageSize?: {
    width: number
    height: number
    custom?: boolean
  }
  hyperlink?: string
  hyperlinkTitle?: string
  note?: string
  tag?: any[]
  generalization?: any[]
  associativeLineTargets?: string[]
  associativeLineText?: any
  associativeLinePoint?: any[]
  associativeLineTargetControlOffsets?: any[]
  associativeLineStyle?: any
  customLeft?: number
  customTop?: number
  customTextWidth?: number
  dir?: string
  [key: string]: any
}

// 脑图节点结构（兼容simple-mind-map格式）
export interface MindMapNode {
  data: MindMapNodeData
  children?: MindMapNode[]
  [key: string]: any
}

// 脑图完整数据
export interface MindMapData {
  id: string
  title: string
  description?: string
  layout: MindMapLayout
  theme: MindMapTheme
  tags: string[]
  data: MindMapNode  // 直接是根节点数据，与后端保持一致
  createdAt: string
  updatedAt: string
}

// 创建脑图请求
export interface CreateMindMapRequest {
  title: string
  description?: string
  layout: MindMapLayout
  theme: MindMapTheme
  tags: string[]
  data: MindMapNode  // 直接是根节点数据
}

// 更新脑图请求
export interface UpdateMindMapRequest {
  title?: string
  description?: string
  layout?: MindMapLayout
  theme?: MindMapTheme
  tags?: string[]
  data?: MindMapNode  // 直接是根节点数据
}

// 脑图列表查询参数
export interface MindMapListParams {
  page?: number
  limit?: number
  search?: string
  tags?: string[]
  sortBy?: 'title' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}

// 脑图列表响应
export interface MindMapListResponse {
  items: MindMapData[]
  total: number
  page: number
  limit: number
}

// API响应基础结构
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 脑图统计信息
export interface MindMapStats {
  totalCount: number
  recentCount: number
  tagCounts: Record<string, number>
  layoutCounts: Record<MindMapLayout, number>
  themeCounts: Record<MindMapTheme, number>
}
